import {lookupArchive} from '@subsquid/archive-registry'
import * as ss58 from '@subsquid/ss58'
import {BatchContext, BatchProcessorItem, SubstrateBatchProcessor} from '@subsquid/substrate-processor'
import {EventItem} from '@subsquid/substrate-processor/lib/interfaces/dataSelection'
import {Store, TypeormDatabase} from '@subsquid/typeorm-store'
import {In} from 'typeorm'
import {Account, Transfer} from './model/models'
import {BalancesTransferEvent} from './types/events'

const processor = new SubstrateBatchProcessor()
    .setDataSource({
        archive: lookupArchive('kusama', {release: 'FireSquid'}),
    })
    .addEvent('Balances.Transfer', {
        data: {
            event: {
                args: true,
                extrinsic: {
                    hash: true,
                },
                call: {},
            },
        },
    } as const)

type Item = BatchProcessorItem<typeof processor>
type Ctx = BatchContext<Store, Item>

processor.run(new TypeormDatabase(), async (ctx) => {
    let transfersData = getTransfers(ctx)

    let accountIds = new Set<string>()
    for (let t of transfersData) {
        accountIds.add(t.from)
        accountIds.add(t.to)
    }

    let accounts = await ctx.store.findBy(Account, {id: In([...accountIds])}).then((accounts) => {
        return new Map(accounts.map((a) => [a.id, a]))
    })

    let transfers: Transfer[] = []

    for (let t of transfersData) {
        let {id, blockNumber, timestamp, extrinsicHash, amount} = t

        let from = getAccount(accounts, t.from)
        let to = getAccount(accounts, t.to)

        transfers.push(
            new Transfer({
                id,
                blockNumber,
                timestamp,
                extrinsicHash,
                from,
                to,
                amount,
            })
        )
    }

    await ctx.store.save(Array.from(accounts.values()))
    await ctx.store.insert(transfers)
})

interface TransferEventData {
    id: string
    blockNumber: number
    timestamp: Date
    extrinsicHash?: string
    call?: string
    from: string
    to: string
    amount: bigint
}

function getTransfers(ctx: Ctx): TransferEventData[] {
    let transfers: TransferEventData[] = []
    for (let block of ctx.blocks) {
        for (let item of block.items) {
            if (item.name == 'Balances.Transfer') {
                let event = normalizeTransferEvent(ctx, item)
                transfers.push({
                    id: item.event.id,
                    blockNumber: block.header.height,
                    timestamp: new Date(block.header.timestamp),
                    extrinsicHash: item.event.extrinsic?.hash,
                    call: item.event.call?.name,
                    from: ss58.codec('kusama').encode(event.from),
                    to: ss58.codec('kusama').encode(event.to),
                    amount: event.amount,
                })
            }
        }
    }
    return transfers
}

function normalizeTransferEvent(
    ctx: Ctx,
    item: EventItem<'Balances.Transfer', {event: {args: true}}>
): {from: Uint8Array; to: Uint8Array; amount: bigint} {
    let e = new BalancesTransferEvent(ctx, item.event)
    if (e.isV1020) {
        let [from, to, amount] = e.asV1020
        return {from, to, amount}
    } else if (e.isV1050) {
        let [from, to, amount] = e.asV1050
        return {from, to, amount}
    } else if (e.isV9130) {
        return e.asV9130
    } else {
        throw new UknownVersionError()
    }
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

class UknownVersionError extends Error {
    constructor() {
        super('Uknown verson')
    }
}
