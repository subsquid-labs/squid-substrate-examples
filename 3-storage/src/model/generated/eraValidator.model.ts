import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, ManyToOne as ManyToOne_, Index as Index_} from "typeorm"
import * as marshal from "./marshal"
import {Era} from "./era.model"
import {Nomination} from "./_nomination"

@Entity_()
export class EraValidator {
  constructor(props?: Partial<EraValidator>) {
    Object.assign(this, props)
  }

  @PrimaryColumn_()
  id!: string

  @Column_("text", {nullable: false})
  validatorId!: string

  @Index_()
  @ManyToOne_(() => Era, {nullable: true})
  era!: Era

  @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
  selfBonded!: bigint

  @Column_("numeric", {transformer: marshal.bigintTransformer, nullable: false})
  totalBonded!: bigint

  @Column_("jsonb", {transformer: {to: obj => obj.map((val: any) => val.toJSON()), from: obj => obj == null ? undefined : marshal.fromList(obj, val => new Nomination(undefined, marshal.nonNull(val)))}, nullable: false})
  nominators!: (Nomination)[]
}
