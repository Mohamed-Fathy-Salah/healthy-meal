import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BaseEntity,
  ManyToOne,
  JoinColumn,
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
  //todo: interval
  @Column("text")
  prep_time: string;

  @Field()
  @Column("uuid")
  user_id: string;

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.meals, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: User;

  @Field()
  @Column("text")
  steps: string;

  @Field()
  @Column("text", { default: "pending" })
  status: string;
}
