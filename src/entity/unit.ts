import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BaseEntity,
  OneToMany,
} from "typeorm";
import { Field, ObjectType } from "type-graphql";
import Ingredient from "./ingredient";

@ObjectType()
@Entity()
export default class Unit extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  unit_id: string;

  @Field()
  @Column("text")
  label: string;

  @OneToMany(() => Ingredient, (ingredient) => ingredient.unit)
  ingredients: Ingredient[];
}
