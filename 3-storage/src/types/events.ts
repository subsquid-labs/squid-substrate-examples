import assert from 'assert'
import {Chain, ChainContext, EventContext, Event, Result, Option} from './support'

export class GrandpaNewAuthoritiesEvent {
  private readonly _chain: Chain
  private readonly event: Event

  constructor(ctx: EventContext)
  constructor(ctx: ChainContext, event: Event)
  constructor(ctx: EventContext, event?: Event) {
    event = event || ctx.event
    assert(event.name === 'Grandpa.NewAuthorities')
    this._chain = ctx._chain
    this.event = event
  }

  /**
   *  New authority set has been applied.
   */
  get isV0(): boolean {
    return this._chain.getEventHash('Grandpa.NewAuthorities') === 'a1a8c88e19b8fedde4aab1bef41aa9e1bdfc3748b1e39f7ad5bb09d0347d9505'
  }

  /**
   *  New authority set has been applied.
   */
  get asV0(): [Uint8Array, bigint][] {
    assert(this.isV0)
    return this._chain.decodeEvent(this.event)
  }

  /**
   * New authority set has been applied.
   */
  get isV9140(): boolean {
    return this._chain.getEventHash('Grandpa.NewAuthorities') === 'e25505d283e6b21359efad4ea3b01da035cbbe2b268fd3cbfb12ca0b5577a9de'
  }

  /**
   * New authority set has been applied.
   */
  get asV9140(): {authoritySet: [Uint8Array, bigint][]} {
    assert(this.isV9140)
    return this._chain.decodeEvent(this.event)
  }
}
