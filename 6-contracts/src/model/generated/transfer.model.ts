import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, ManyToOne as ManyToOne_, Index as Index_} from "typeorm"
import * as marshal from "./marshal"
import {Account} from "./account.model"

@Entity_()
export class Transfer {
  constructor(props?: Partial<Transfer>) {
    Object.assign(this, props)
  }

  @PrimaryColumn_()
  id!: string

  @Index_()
  @ManyToOne_(() => Account, {nullable: true})
  from!: Account | undefined | null

  @Index_()
  @ManyToOne_(() => Account, {nullable: true})
  to!: Account | undefined | null

  @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
  amount!: bigint

  @Column_("timestamp with time zone", {nullable: false})
  timestamp!: Date

  @Column_("int4", {nullable: false})
  block!: number
}
