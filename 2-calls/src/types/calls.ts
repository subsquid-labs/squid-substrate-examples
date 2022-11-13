import assert from 'assert'
import {Chain, ChainContext, CallContext, Call, Result, Option} from './support'
import * as v1030 from './v1030'
import * as v1032 from './v1032'

export class IdentitySetIdentityCall {
  private readonly _chain: Chain
  private readonly call: Call

  constructor(ctx: CallContext)
  constructor(ctx: ChainContext, call: Call)
  constructor(ctx: CallContext, call?: Call) {
    call = call || ctx.call
    assert(call.name === 'Identity.set_identity')
    this._chain = ctx._chain
    this.call = call
  }

  /**
   *  Set an account's identity information and reserve the appropriate deposit.
   * 
   *  If the account already has identity information, the deposit is taken as part payment
   *  for the new deposit.
   * 
   *  The dispatch origin for this call must be _Signed_ and the sender must have a registered
   *  identity.
   * 
   *  - `info`: The identity information.
   * 
   *  Emits `IdentitySet` if successful.
   * 
   *  # <weight>
   *  - `O(X + R)` where `X` additional-field-count (deposit-bounded).
   *  - At most two balance operations.
   *  - One storage mutation (codec `O(X + R)`).
   *  - One event.
   *  # </weight>
   */
  get isV1030(): boolean {
    return this._chain.getCallHash('Identity.set_identity') === '0a4b1e421517b2dbf295654a2c6c617cd7631b9de55c4fe17ff5e236ccdc7bdc'
  }

  /**
   *  Set an account's identity information and reserve the appropriate deposit.
   * 
   *  If the account already has identity information, the deposit is taken as part payment
   *  for the new deposit.
   * 
   *  The dispatch origin for this call must be _Signed_ and the sender must have a registered
   *  identity.
   * 
   *  - `info`: The identity information.
   * 
   *  Emits `IdentitySet` if successful.
   * 
   *  # <weight>
   *  - `O(X + R)` where `X` additional-field-count (deposit-bounded).
   *  - At most two balance operations.
   *  - One storage mutation (codec `O(X + R)`).
   *  - One event.
   *  # </weight>
   */
  get asV1030(): {info: v1030.IdentityInfo} {
    assert(this.isV1030)
    return this._chain.decodeCall(this.call)
  }

  /**
   *  Set an account's identity information and reserve the appropriate deposit.
   * 
   *  If the account already has identity information, the deposit is taken as part payment
   *  for the new deposit.
   * 
   *  The dispatch origin for this call must be _Signed_ and the sender must have a registered
   *  identity.
   * 
   *  - `info`: The identity information.
   * 
   *  Emits `IdentitySet` if successful.
   * 
   *  # <weight>
   *  - `O(X + R)` where `X` additional-field-count (deposit-bounded).
   *  - At most two balance operations.
   *  - One storage mutation (codec `O(X + R)`).
   *  - One event.
   *  # </weight>
   */
  get isV1032(): boolean {
    return this._chain.getCallHash('Identity.set_identity') === 'ab457704fd8cda5fee32e84ab7782778f4117cd54400c364cf7597eee5bc60ca'
  }

  /**
   *  Set an account's identity information and reserve the appropriate deposit.
   * 
   *  If the account already has identity information, the deposit is taken as part payment
   *  for the new deposit.
   * 
   *  The dispatch origin for this call must be _Signed_ and the sender must have a registered
   *  identity.
   * 
   *  - `info`: The identity information.
   * 
   *  Emits `IdentitySet` if successful.
   * 
   *  # <weight>
   *  - `O(X + R)` where `X` additional-field-count (deposit-bounded).
   *  - At most two balance operations.
   *  - One storage mutation (codec `O(X + R)`).
   *  - One event.
   *  # </weight>
   */
  get asV1032(): {info: v1032.IdentityInfo} {
    assert(this.isV1032)
    return this._chain.decodeCall(this.call)
  }
}
