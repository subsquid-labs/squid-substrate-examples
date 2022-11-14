import * as ss58 from '@subsquid/ss58'
import {BatchContext, BatchProcessorItem, SubstrateBatchProcessor} from '@subsquid/substrate-processor'
import {Store, TypeormDatabase} from '@subsquid/typeorm-store'
import {In} from 'typeorm'
import * as erc20 from './erc20'
import {Account, Transfer} from './model'

const CONTRACT_ADDRESS = '0x5207202c27b646ceeb294ce516d4334edafbd771f869215cb070ba51dd7e2c72'

const processor = new SubstrateBatchProcessor()
    .setDataSource({
        archive: 'https://shibuya.archive.subsquid.io/graphql',
    })
    .addContractsContractEmitted(CONTRACT_ADDRESS, {
        data: {
            event: {args: true},
        },
    } as const)

type Item = BatchProcessorItem<typeof processor>
type Ctx = BatchContext<Store, Item>

processor.run(new TypeormDatabase(), async (ctx) => {
    let transfersData: TransferData[] = []

    for (let block of ctx.blocks) {
        for (let item of block.items) {
            if (item.name == 'Contracts.ContractEmitted') {
                let event = erc20.decodeEvent(item.event.args.data)
                if (event.__kind == 'Transfer') {
                    transfersData.push({
                        id: item.event.id,
                        from: event.from && encodeId(event.from),
                        to: event.to && encodeId(event.to),
                        amount: event.value,
                        block: block.header.height,
                        timestamp: new Date(block.header.timestamp),
                    })
                }
            }
        }
    }

    await saveTransfers(ctx, transfersData)
})

interface TransferData {
    id: string
    from?: string
    to?: string
    amount: bigint
    block: number
    timestamp: Date
}

async function saveTransfers(ctx: Ctx, transfersData: TransferData[]) {
    let ownerIds = new Set<string>()
    for (let t of transfersData) {
        if (t.from) ownerIds.add(t.from)
        if (t.to) ownerIds.add(t.to)
    }

    let accounts = await ctx.store
        .findBy(Account, {id: In([...ownerIds])})
        .then((q) => new Map(q.map((i) => [i.id, i])))

    let transfers: Transfer[] = []

    for (let t of transfersData) {
        let transfer = new Transfer({
            id: t.id,
            amount: t.amount,
            block: t.block,
            timestamp: t.timestamp,
        })

        if (t.from) transfer.from = getAccount(accounts, t.from)
        if (t.to) transfer.to = getAccount(accounts, t.to)
    }

    await ctx.store.save([...accounts.values()])
    await ctx.store.insert(transfers)
}

function getAccount(m: Map<string, Account>, id: string): Account {
    let acc = m.get(id)
    if (acc == null) {
        acc = new Account()
        acc.id = id
        m.set(id, acc)
    }
    return acc
}

function encodeId(id: Uint8Array): string {
    return ss58.codec('astar').encode(id)
}
