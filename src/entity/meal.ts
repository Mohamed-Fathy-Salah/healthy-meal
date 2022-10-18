import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BaseEntity,
  ManyToOne,
} from "typeorm";
import { Field, ObjectType } from "type-graphql";
import User from "./user";

@ObjectType()
@Entity()
export default class Meal extends BaseEntity {
  @Field()
  @PrimaryGeneratedColumn("uuid")
  meal_id: string;

  @Field()
  @Column("text")
  name: string;

  @Field()
  @Column("text")
  description: string;

  @Field()
  @Column("text")
  type: string;

  @Field()
  @Column("text")
  photo: string;

  @Field()
  @Column("int")
  calories: number;

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
  @Column("interval")
  prep_time: string;

  @Field()
  @ManyToOne(() => User, (user) => user.meals, { onDelete: "CASCADE" })
  user: User;

  @Field()
  @Column("text")
  steps: string;

  @Field()
  @Column("text")
  status: string;
}
