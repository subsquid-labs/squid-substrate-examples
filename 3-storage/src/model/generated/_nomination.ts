import assert from "assert"
import * as marshal from "./marshal"

export class Nomination {
  private _nominatorId!: string
  private _amount!: bigint

  constructor(props?: Partial<Omit<Nomination, 'toJSON'>>, json?: any) {
    Object.assign(this, props)
    if (json != null) {
      this._nominatorId = marshal.string.fromJSON(json.nominatorId)
      this._amount = marshal.bigint.fromJSON(json.amount)
    }
  }

  get nominatorId(): string {
    assert(this._nominatorId != null, 'uninitialized access')
    return this._nominatorId
  }

  set nominatorId(value: string) {
    this._nominatorId = value
  }

  get amount(): bigint {
    assert(this._amount != null, 'uninitialized access')
    return this._amount
  }

  set amount(value: bigint) {
    this._amount = value
  }

  toJSON(): object {
    return {
      nominatorId: this.nominatorId,
      amount: marshal.bigint.toJSON(this.amount),
    }
  }
}
