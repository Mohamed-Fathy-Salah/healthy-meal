import {
  Entity,
  BaseEntity,
  OneToMany,
  PrimaryColumn,
} from "typeorm";
import { Field, ObjectType } from "type-graphql";
import Ingredient from "./ingredient";

@ObjectType()
@Entity()
export default class Unit extends BaseEntity {
  @Field()
  @PrimaryColumn("text")
  label: string;

  @OneToMany(() => Ingredient, (ingredient) => ingredient.unit)
  ingredients: Ingredient[];
}
