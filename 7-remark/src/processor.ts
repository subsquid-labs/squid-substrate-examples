import {lookupArchive} from '@subsquid/archive-registry'
import * as ss58 from '@subsquid/ss58'
import {BatchContext, BatchProcessorItem, decodeHex, SubstrateBatchProcessor} from '@subsquid/substrate-processor'
import {CallItem, EventItem} from '@subsquid/substrate-processor/lib/interfaces/dataSelection'
import {Store, TypeormDatabase} from '@subsquid/typeorm-store'
import {In} from 'typeorm'
import {Account, RmrkNFT} from './model/models'
import {handleBurn, handleBuy, handleMint, handleSend, RmrkEvent} from './rmrkEvents'
import {SystemRemarkCall} from './types/calls'

const processor = new SubstrateBatchProcessor()
    .setDataSource({
        archive: lookupArchive('kusama', {release: 'FireSquid'}),
        chain: 'wss://kusama-rpc.polkadot.io',
    })
    .setBlockRange({
        from: 13_000_000,
    })
    .addCall('System.remark', {
        data: {
            call: {
                args: true,
                origin: true,
            },
        },
    } as const)

type Item = BatchProcessorItem<typeof processor>
type Ctx = BatchContext<Store, Item>

processor.run(new TypeormDatabase(), async (ctx) => {
    let rmrkEvents: RmrkEvent[] = []

    for (let {header: block, items} of ctx.blocks) {
        for (let item of items) {
            if (item.name === 'System.remark') {
                if (!item.call.success || !item.call.origin) continue

                let signer = getOriginAccountId(item.call.origin)
                let call = normalizeCall(ctx, item)

                let [prefix, eventType, version, ...args] = call.message.split('::')
                if (prefix !== 'RMRK' || version !== '2.0.0') continue

                switch (eventType) {
                    case 'MINT':
                        rmrkEvents.push(handleMint(ctx, args, signer, block.height))
                        break
                    case 'BURN':
                        rmrkEvents.push(handleBurn(ctx, args))
                        break
                    case 'SEND':
                        rmrkEvents.push(handleSend(ctx, args))
                        break
                    case 'BUY':
                        rmrkEvents.push(handleBuy(ctx, args, signer))
                        break
                }
            }
        }
    }

    await processRmrkEvents(ctx, rmrkEvents)
})

async function processRmrkEvents(ctx: Ctx, rmrkEvents: RmrkEvent[]) {
    let accountIds = new Set<string>()
    let nftIds = new Set<string>()
    for (let e of rmrkEvents) {
        switch (e.type) {
            case 'TRANSFER':
                if (e.data.newOwner) accountIds.add(e.data.newOwner)
                if (e.data.newParent) nftIds.add(e.data.newParent)
                nftIds.add(e.data.id)
                break
            case 'MINT':
                accountIds.add(e.data.owner)
                if (e.data.parent) accountIds.add(e.data.parent)
                break
        }
    }

    let accounts = await ctx.store
        .findBy(Account, {id: In([...accountIds])})
        .then((q) => new Map(q.map((i) => [i.id, i])))
    let nfts = await ctx.store.findBy(RmrkNFT, {id: In([...nftIds])}).then((q) => new Map(q.map((i) => [i.id, i])))

    let burnedNfts: string[] = []

    for (let e of rmrkEvents) {
        switch (e.type) {
            case 'TRANSFER': {
                let nft = getNft(nfts, e.data.id)
                if (!nft) continue

                if (e.data.newOwner) {
                    let owner = getAccount(accounts, e.data.newOwner)
                    nft.owner = owner
                }

                if (e.data.newParent) {
                    let parent = getNft(nfts, e.data.newParent)
                    nft.parent = parent
                }
                break
            }
            case 'MINT': {
                let {owner: ownerId, parent: parentId, ...nftData} = e.data
                let nft = new RmrkNFT({
                    ...nftData,
                })
                nfts.set(nft.id, nft)

                let owner = getAccount(accounts, ownerId)
                nft.owner = owner

                if (parentId) {
                    let parent = getNft(nfts, parentId)
                    nft.owner = owner
                }
                break
            }
            case 'BURN': {
                burnedNfts.push(e.data.id)
                break
            }
        }
    }

    await ctx.store.save([...accounts.values()])
    await ctx.store.save([...nfts.values()])
    
    if (burnedNfts.length > 0) {
        const childNfts = await ctx.store.find(RmrkNFT, {
            where: {parent: {id: In(burnedNfts)}},
            relations: {parent: true},
        })
        childNfts.forEach((n) => (n.parent = null))
        await ctx.store.save(childNfts)
        await ctx.store.remove(RmrkNFT, burnedNfts)
    }
}

function normalizeCall(ctx: Ctx, item: CallItem<'System.remark', {call: {args: true}}>) {
    let c = new SystemRemarkCall(ctx, item.call)

    if (c.isV1020) {
        let data = c.asV1020
        return {
            message: Buffer.from(data.remark).toString('utf-8'),
        }
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

function getNft(m: Map<string, RmrkNFT>, id: string): RmrkNFT | undefined {
    let nft = m.get(id)
    return nft
}

export function getOriginAccountId(origin: any): string {
    if (origin && origin.__kind === 'system' && origin.value.__kind === 'Signed') {
        const id = origin.value.value
        if (id.__kind === 'Id') {
            return encodeId(decodeHex(id.value))
        } else {
            return encodeId(decodeHex(id))
        }
    } else {
        throw new Error('Unexpected origin')
    }
}

function encodeId(id: Uint8Array): string {
    return ss58.codec('kusama').encode(id)
}

class UknownVersionError extends Error {
    constructor() {
        super('Uknown verson')
    }
}
