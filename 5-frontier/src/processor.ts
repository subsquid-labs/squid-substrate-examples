import {lookupArchive} from '@subsquid/archive-registry'
import {Store, TypeormDatabase} from '@subsquid/typeorm-store'
import {BatchContext, BatchProcessorItem, SubstrateBatchProcessor, SubstrateBlock} from '@subsquid/substrate-processor'
import {In} from 'typeorm'
import {ethers} from 'ethers'
import {Contract, Owner, Token, Transfer} from './model'
import * as erc721 from './abi/erc721'
import {EventItem} from '@subsquid/substrate-processor/lib/interfaces/dataSelection'
import {getEvmLog} from '@subsquid/substrate-frontier-evm'
import {getTransaction} from '@subsquid/substrate-frontier-evm/lib/transaction'

export const contractAddress = '0xb654611f84a8dc429ba3cb4fda9fad236c505a1a'

const database = new TypeormDatabase()
const processor = new SubstrateBatchProcessor()
    .setDataSource({
        archive: lookupArchive('moonriver', {release: 'FireSquid'}),
        chain: 'wss://wss.api.moonriver.moonbeam.network',
    })
    .setTypesBundle('moonbeam')
    .addEvmLog(contractAddress, {
        filter: [[erc721.events['Transfer(address,address,uint256)'].topic]],
        data: {
            event: {
                args: true,
                call: true,
            },
        },
    })

type Item = BatchProcessorItem<typeof processor>
type Context = BatchContext<Store, Item>

processor.run(database, async (ctx) => {
    const transfersData: TransferData[] = []

    for (const block of ctx.blocks) {
        for (const item of block.items) {
            if (item.name === 'EVM.Log') {
                const transfer = handleTransfer(ctx, block.header, item)
                transfersData.push(transfer)
            }
        }
    }

    await saveTransfers(ctx, transfersData)
})

type TransferData = {
    id: string
    from: string
    to: string
    token: ethers.BigNumber
    timestamp: bigint
    block: number
    transactionHash: string
}

function handleTransfer(
    ctx: Context,
    block: SubstrateBlock,
    item: EventItem<'EVM.Log', {event: {args: true; call: {args: true}}}>
): TransferData {
    let evmLog = getEvmLog(ctx, item.event)
    let transaction = getTransaction(ctx, item.event.call)
    const {from, to, tokenId} = erc721.events['Transfer(address,address,uint256)'].decode(evmLog)

    const transfer: TransferData = {
        id: item.event.id,
        token: tokenId,
        from,
        to,
        timestamp: BigInt(block.timestamp),
        block: block.height,
        transactionHash: transaction.hash,
    }

    return transfer
}

async function saveTransfers(ctx: Context, transfersData: TransferData[]) {
    const tokensIds: Set<string> = new Set()
    const ownersIds: Set<string> = new Set()

    for (const transferData of transfersData) {
        tokensIds.add(transferData.token.toString())
        ownersIds.add(transferData.from)
        ownersIds.add(transferData.to)
    }

    const transfers: Transfer[] = []

    const tokens: Map<string, Token> = new Map(
        (await ctx.store.findBy(Token, {id: In([...tokensIds])})).map((token) => [token.id, token])
    )

    const owners: Map<string, Owner> = new Map(
        (await ctx.store.findBy(Owner, {id: In([...ownersIds])})).map((owner) => [owner.id, owner])
    )

    for (const transferData of transfersData) {
        const contract = new erc721.Contract(ctx, {height: transferData.block}, contractAddress)

        let from = owners.get(transferData.from)
        if (from == null) {
            from = new Owner({id: transferData.from, balance: 0n})
            owners.set(from.id, from)
        }

        let to = owners.get(transferData.to)
        if (to == null) {
            to = new Owner({id: transferData.to, balance: 0n})
            owners.set(to.id, to)
        }

        const tokenId = transferData.token.toString()

        let token = tokens.get(tokenId)
        if (token == null) {
            token = new Token({
                id: tokenId,
                uri: await contract.tokenURI(transferData.token),
                contract: await getContractEntity(ctx.store),
            })
            tokens.set(token.id, token)
        }
        token.owner = to

        const {id, block, transactionHash, timestamp} = transferData

        const transfer = new Transfer({
            id,
            block,
            timestamp,
            transactionHash,
            from,
            to,
            token,
        })

        transfers.push(transfer)
    }

    await ctx.store.save([...owners.values()])
    await ctx.store.save([...tokens.values()])
    await ctx.store.save(transfers)
}

let contractEntity: Contract | undefined

export async function getContractEntity(store: Store): Promise<Contract> {
    if (contractEntity == null) {
        contractEntity = await store.get(Contract, contractAddress)
        if (contractEntity == null) {
            contractEntity = new Contract({
                id: contractAddress,
                name: 'Moonsama',
                symbol: 'MSAMA',
                totalSupply: 1000n,
            })
            await store.insert(contractEntity)
        }
    }
    return contractEntity
}
