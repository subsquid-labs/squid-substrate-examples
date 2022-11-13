import type {Result, Option} from './support'

export interface ActiveEraInfo {
  index: number
  start: (bigint | undefined)
}

export interface Exposure {
  total: bigint
  own: bigint
  others: IndividualExposure[]
}

export interface IndividualExposure {
  who: Uint8Array
  value: bigint
}
