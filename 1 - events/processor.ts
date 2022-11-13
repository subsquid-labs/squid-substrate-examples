import {lookupArchive} from '@subsquid/archive-registry'
import * as ss58 from '@subsquid/ss58'
import {BatchContext, BatchProcessorItem, SubstrateBatchProcessor} from '@subsquid/substrate-processor'
import {Account, Transfer} from './model/models'
import {MikroormDatabase, Store} from './store'
import {BalancesTransferEvent} from './types/events'

const processor = new SubstrateBatchProcessor()
    .setBatchSize(500)
    .setDataSource({
        // Lookup archive by the network name in the Subsquid registry
        archive: lookupArchive('kusama', {release: 'FireSquid'}),

        // Use archive created by archive/docker-compose.yml
        // archive: 'http://localhost:8888/graphql'
    })
    .addEvent('Balances.Transfer', {
        data: {
            event: {
                args: true,
                extrinsic: {
                    hash: true,
                    fee: true,
                },
            },
        },
    } as const)

type Item = BatchProcessorItem<typeof processor>
type Ctx = BatchContext<Store, Item>

processor.run(new MikroormDatabase(), async (ctx) => {
    let transfersData = getTransfers(ctx)

    for (let t of transfersData) {
        const transfer = new Transfer(t)
        ctx.store.persist(transfer)
        ctx.store.defer(Account, t.from, t.to)
    }
    
    await ctx.store.loadOrCreate(Account, createAccount)
})

interface TransferEvent {
    id: string
    blockNumber: number
    timestamp: Date
    extrinsicHash?: string
    from: string
    to: string
    amount: bigint
    fee?: bigint
}

function getTransfers(ctx: Ctx): TransferEvent[] {
    let transfers: TransferEvent[] = []
    for (let block of ctx.blocks) {
        for (let item of block.items) {
            if (item.name == 'Balances.Transfer') {
                let e = new BalancesTransferEvent(ctx, item.event)
                let rec: {from: Uint8Array; to: Uint8Array; amount: bigint}
                if (e.isV1020) {
                    let [from, to, amount] = e.asV1020
                    rec = {from, to, amount}
                } else if (e.isV1050) {
                    let [from, to, amount] = e.asV1050
                    rec = {from, to, amount}
                } else {
                    rec = e.asV9130
                }
                transfers.push({
                    id: item.event.id,
                    blockNumber: block.header.height,
                    timestamp: new Date(block.header.timestamp),
                    extrinsicHash: item.event.extrinsic?.hash,
                    from: ss58.codec('kusama').encode(rec.from),
                    to: ss58.codec('kusama').encode(rec.to),
                    amount: rec.amount,
                    fee: item.event.extrinsic?.fee || 0n,
                })
            }
        }
    }
    return transfers
}

function createAccount(id: string): Account {
    let acc = new Account()
    acc.id = id
    return acc
}
