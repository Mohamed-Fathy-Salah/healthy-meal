import { Field, ObjectType } from "type-graphql";
import {
  BaseEntity,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from "typeorm";
import Meal from "./meal";

@ObjectType()
@Entity()
export default class MealTags extends BaseEntity {
  @PrimaryColumn("uuid")
  meal_id: string;

  @PrimaryColumn("text")
  tag: string;

  @Field(() => Meal)
  @ManyToOne(() => Meal, (meal) => meal.meal_id, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "meal_id" })
  meal: Meal;
}
