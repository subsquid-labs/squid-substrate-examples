import {lookupArchive} from '@subsquid/archive-registry'
import * as ss58 from '@subsquid/ss58'
import {BatchContext, BatchProcessorItem, SubstrateBatchProcessor, SubstrateBlock} from '@subsquid/substrate-processor'
import {Store, TypeormDatabase} from '@subsquid/typeorm-store'
import {Era, EraValidator, Nomination} from './model'
import {SessionValidatorsStorage, StakingActiveEraStorage, StakingErasStakersStorage} from './types/storage'

const processor = new SubstrateBatchProcessor()
    .setDataSource({
        archive: lookupArchive('polkadot', {release: 'FireSquid'}),
        chain: 'wss://rpc.polkadot.io',
    })
    .addEvent('Grandpa.NewAuthorities', {
        data: {
            event: {
                args: true,
            },
        },
    } as const)

type Item = BatchProcessorItem<typeof processor>
type Ctx = BatchContext<Store, Item>

processor.run(new TypeormDatabase(), async (ctx) => {
    let eras: Era[] = []
    let eraValidators: EraValidator[] = []

    for (let {header: block, items} of ctx.blocks) {
        for (let item of items) {
            if (item.name == 'Grandpa.NewAuthorities') {
                let eraInfo = await getActiveEraInfo(ctx, block)

                if (!eraInfo || (eraInfo.start ?? -1) != block.timestamp) continue
                
                ctx.log.info(`processing era ${eraInfo?.index}...`)
                
                let era = new Era({
                    id: eraInfo?.index.toString(),
                    index: eraInfo.index,
                    startedAt: block.height,
                })
                eras.push(era)

                let validatorIds = await getEraValidators(ctx, block)
                if (!validatorIds) validatorIds = []

                let validatorsInfo = await getEraValidatorsInfo(ctx, block, era.index, validatorIds)
                if (!validatorsInfo) validatorsInfo = []

                for (let i = 0; i < validatorIds.length; i++) {
                    let validatorId = encodeId(validatorIds[i])
                    let validatorInfo = validatorsInfo[i]
                    eraValidators.push(
                        new EraValidator({
                            id: `${era.index}-${validatorId}`,
                            era,
                            validatorId,
                            selfBonded: validatorInfo.own,
                            totalBonded: validatorInfo.total,
                            nominators: validatorInfo.others.map(
                                (n) =>
                                    new Nomination({
                                        nominatorId: encodeId(n.who),
                                        amount: n.value,
                                    })
                            ),
                        })
                    )
                }
            }
        }
    }

    await ctx.store.insert(eras)
    await ctx.store.insert(eraValidators)
})

async function getActiveEraInfo(ctx: Ctx, block: SubstrateBlock) {
    const s = new StakingActiveEraStorage(ctx, block)

    if (!s.isExists) {
        return undefined
    } else if (s.isV0) {
        return s.getAsV0()
    } else {
        throw new UknownVersionError()
    }
}

async function getEraValidators(ctx: Ctx, block: SubstrateBlock) {
    const s = new SessionValidatorsStorage(ctx, block)

    if (!s.isExists) {
        return undefined
    } else if (s.isV0) {
        return s.getAsV0()
    } else {
        throw new UknownVersionError()
    }
}

async function getEraValidatorsInfo(ctx: Ctx, block: SubstrateBlock, eraIndex: number, validatorIds: Uint8Array[]) {
    const s = new StakingErasStakersStorage(ctx, block)

    if (!s.isExists) {
        return undefined
    } else if (s.isV0) {
        return s.getManyAsV0(validatorIds.map((v) => [eraIndex, v]))
    } else {
        throw new UknownVersionError()
    }
}

function encodeId(id: Uint8Array): string {
    return ss58.codec('polkadot').encode(id)
}

class UknownVersionError extends Error {
    constructor() {
        super('Uknown verson')
    }
}
