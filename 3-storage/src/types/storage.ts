import assert from 'assert'
import {Block, Chain, ChainContext, BlockContext, Result, Option} from './support'
import * as v0 from './v0'

export class SessionValidatorsStorage {
  private readonly _chain: Chain
  private readonly blockHash: string

  constructor(ctx: BlockContext)
  constructor(ctx: ChainContext, block: Block)
  constructor(ctx: BlockContext, block?: Block) {
    block = block || ctx.block
    this.blockHash = block.hash
    this._chain = ctx._chain
  }

  /**
   *  The current set of validators.
   */
  get isV0() {
    return this._chain.getStorageItemTypeHash('Session', 'Validators') === 'f5df25eadcdffaa0d2a68b199d671d3921ca36a7b70d22d57506dca52b4b5895'
  }

  /**
   *  The current set of validators.
   */
  async getAsV0(): Promise<Uint8Array[]> {
    assert(this.isV0)
    return this._chain.getStorage(this.blockHash, 'Session', 'Validators')
  }

  /**
   * Checks whether the storage item is defined for the current chain version.
   */
  get isExists(): boolean {
    return this._chain.getStorageItemTypeHash('Session', 'Validators') != null
  }
}

export class StakingActiveEraStorage {
  private readonly _chain: Chain
  private readonly blockHash: string

  constructor(ctx: BlockContext)
  constructor(ctx: ChainContext, block: Block)
  constructor(ctx: BlockContext, block?: Block) {
    block = block || ctx.block
    this.blockHash = block.hash
    this._chain = ctx._chain
  }

  /**
   *  The active era information, it holds index and start.
   * 
   *  The active era is the era currently rewarded.
   *  Validator set of this era must be equal to `SessionInterface::validators`.
   */
  get isV0() {
    return this._chain.getStorageItemTypeHash('Staking', 'ActiveEra') === '2bb946dd9c19de9f4332897005d1255528c610172f7418fae165b5dafd3cfbfe'
  }

  /**
   *  The active era information, it holds index and start.
   * 
   *  The active era is the era currently rewarded.
   *  Validator set of this era must be equal to `SessionInterface::validators`.
   */
  async getAsV0(): Promise<v0.ActiveEraInfo | undefined> {
    assert(this.isV0)
    return this._chain.getStorage(this.blockHash, 'Staking', 'ActiveEra')
  }

  /**
   * Checks whether the storage item is defined for the current chain version.
   */
  get isExists(): boolean {
    return this._chain.getStorageItemTypeHash('Staking', 'ActiveEra') != null
  }
}

export class StakingErasStakersStorage {
  private readonly _chain: Chain
  private readonly blockHash: string

  constructor(ctx: BlockContext)
  constructor(ctx: ChainContext, block: Block)
  constructor(ctx: BlockContext, block?: Block) {
    block = block || ctx.block
    this.blockHash = block.hash
    this._chain = ctx._chain
  }

  /**
   *  Exposure of validator at era.
   * 
   *  This is keyed first by the era index to allow bulk deletion and then the stash account.
   * 
   *  Is it removed after `HISTORY_DEPTH` eras.
   *  If stakers hasn't been set or has been removed then empty exposure is returned.
   */
  get isV0() {
    return this._chain.getStorageItemTypeHash('Staking', 'ErasStakers') === 'f3f726cc814cef290657008054cd10667b250a01d2842ff3bbbcca24c98abf5b'
  }

  /**
   *  Exposure of validator at era.
   * 
   *  This is keyed first by the era index to allow bulk deletion and then the stash account.
   * 
   *  Is it removed after `HISTORY_DEPTH` eras.
   *  If stakers hasn't been set or has been removed then empty exposure is returned.
   */
  async getAsV0(key1: number, key2: Uint8Array): Promise<v0.Exposure> {
    assert(this.isV0)
    return this._chain.getStorage(this.blockHash, 'Staking', 'ErasStakers', key1, key2)
  }

  async getManyAsV0(keys: [number, Uint8Array][]): Promise<(v0.Exposure)[]> {
    assert(this.isV0)
    return this._chain.queryStorage(this.blockHash, 'Staking', 'ErasStakers', keys)
  }

  async getAllAsV0(): Promise<(v0.Exposure)[]> {
    assert(this.isV0)
    return this._chain.queryStorage(this.blockHash, 'Staking', 'ErasStakers')
  }

  /**
   * Checks whether the storage item is defined for the current chain version.
   */
  get isExists(): boolean {
    return this._chain.getStorageItemTypeHash('Staking', 'ErasStakers') != null
  }
}
