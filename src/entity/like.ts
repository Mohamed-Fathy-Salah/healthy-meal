import {
  Entity,
  PrimaryColumn,
  BaseEntity,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import User from "./user";
import { Field, ObjectType } from "type-graphql";
import Meal from "./meal";

@ObjectType()
@Entity()
export default class Like extends BaseEntity {
  @PrimaryColumn("uuid")
  user_id: string;
  @PrimaryColumn("uuid")
  meal_id: string;

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.user_id, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "user_id" })
  user: User;

  @Field(() => Meal)
  @ManyToOne(() => Meal, (meal) => meal.meal_id, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "meal_id" })
  meal: Meal;
}
