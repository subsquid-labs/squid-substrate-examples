import {Entity as Entity_, Column as Column_, PrimaryColumn as PrimaryColumn_, OneToMany as OneToMany_} from "typeorm"
import {EraValidator} from "./eraValidator.model"

@Entity_()
export class Era {
  constructor(props?: Partial<Era>) {
    Object.assign(this, props)
  }

  @PrimaryColumn_()
  id!: string

  @Column_("int4", {nullable: false})
  index!: number

  @Column_("int4", {nullable: false})
  startedAt!: number

  @OneToMany_(() => EraValidator, e => e.era)
  validators!: EraValidator[]
}
