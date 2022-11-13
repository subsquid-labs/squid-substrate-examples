import {lookupArchive} from '@subsquid/archive-registry'
import * as ss58 from '@subsquid/ss58'
import {BatchContext, BatchProcessorItem, decodeHex, SubstrateBatchProcessor} from '@subsquid/substrate-processor'
import {CallItem, EventItem} from '@subsquid/substrate-processor/lib/interfaces/dataSelection'
import {Store, TypeormDatabase} from '@subsquid/typeorm-store'
import {In} from 'typeorm'
import {Account} from './model/models'
import {IdentitySetIdentityCall} from './types/calls'

const processor = new SubstrateBatchProcessor()
    .setDataSource({
        archive: lookupArchive('kusama', {release: 'FireSquid'}),
    })
    .addCall('Identity.set_identity', {
        data: {
            call: {
                args: true,
                origin: true
            },
        },
    } as const)
    .addCall('Identity.clear_indentity', {
        data: {
            call: {
                args: true,
                origin: true
            },
        },
    } as const)

type Item = BatchProcessorItem<typeof processor>
type Ctx = BatchContext<Store, Item>

processor.run(new TypeormDatabase(), async (ctx) => {
    let indentityData = getIdentityData(ctx)

    let accountIds = new Set<string>()
    for (let i of indentityData) {
        accountIds.add(i.id)
    }

    let accounts = await ctx.store.findBy(Account, {id: In([...accountIds])}).then((accounts) => {
        return new Map(accounts.map((a) => [a.id, a]))
    })

    for (let i of indentityData) {

        let account = getAccount(accounts, i.id)
        account.display = i.display
        account.email = i.email
        account.legal = i.legal
        account.riot = i.riot
        account.twitter = i.twitter
        account.web = i.web
    }

    await ctx.store.save(Array.from(accounts.values()))
})

interface IdentityData {
    id: string
    display: string | null
    legal: string | null
    web: string | null
    riot: string | null
    email: string | null
    twitter: string | null
}

function getIdentityData(ctx: Ctx): IdentityData[] {
    let identities: IdentityData[] = []
    for (let block of ctx.blocks) {
        for (let item of block.items) {
            if (item.kind !== 'call' || !item.call.success) continue
            switch (item.name) {
                case 'Identity.set_identity':
                    if (!item.call.origin) continue
                    let data = normalizeCall(ctx, item)
                    identities.push({
                        id: getOriginAccountId(item.call.origin),
                        ...data
                    })
                    break
                case 'Identity.clear_indentity':
                    if (!item.call.origin) continue
                    identities.push({
                        id: getOriginAccountId(item.call),
                        display: null,
                        legal: null,
                        web: null,
                        riot: null,
                        email: null,
                        twitter: null,
                    })
            }
        }
    }
    return identities
}

function normalizeCall(ctx: Ctx, item: CallItem<'Identity.set_identity', {call: {args: true}}>) {
    let c = new IdentitySetIdentityCall(ctx, item.call)

    if (c.isV1030) {
        let {info} = c.asV1030
        return {
            display: unwrapData(info.display),
            legal: unwrapData(info.legal),
            web: unwrapData(info.web),
            riot: unwrapData(info.riot),
            email: unwrapData(info.email),
            twitter: null,
        }
    } else if (c.isV1032) {
        let {info} = c.asV1032
        return {
            display: unwrapData(info.display),
            legal: unwrapData(info.legal),
            web: unwrapData(info.web),
            riot: unwrapData(info.riot),
            email: unwrapData(info.email),
            twitter: unwrapData(info.twitter),
        }
    } else {
        throw new UknownVersionError()
    }
}

function unwrapData(data: {__kind: string; value?: Uint8Array}) {
    switch (data.__kind) {
        case 'None':
        case 'BlakeTwo256':
        case 'Sha256':
        case 'Keccak256':
        case 'ShaThree256':
            return null
        default:
            return Buffer.from(data.value!).toString('utf-8')
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
