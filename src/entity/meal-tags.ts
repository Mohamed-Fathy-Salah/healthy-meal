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
  @PrimaryColumn("uuid", {select: false})
  meal_id: string;

  @Field(() => String)
  @PrimaryColumn("text")
  tag: string;

  @ManyToOne(() => Meal, (meal) => meal.meal_id, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "meal_id" })
  meal: Meal;
}
