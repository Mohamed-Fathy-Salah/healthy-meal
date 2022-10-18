import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BaseEntity,
  ManyToOne,
} from "typeorm";
import { Field, ObjectType } from "type-graphql";
import Unit from "./unit";

@ObjectType()
@Entity()
export default class Ingredient extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  ingredient_id: string;

  @Field()
  @Column("text")
  name: string;

  @Field()
  @Column("int")
  calories: number;

  @Field()
  @Column("text")
  photo: string;

  @Field()
  @Column("int")
  fat: number;

  @Field()
  @Column("int")
  protein: number;

  @Field()
  @Column("int")
  carb: number;

  @Field()
  @ManyToOne(() => Unit, (unit) => unit.ingredients)
  unit: Unit;
}
