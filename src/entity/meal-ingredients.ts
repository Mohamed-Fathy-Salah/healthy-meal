import { Field, ObjectType } from "type-graphql";
import {
  BaseEntity,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from "typeorm";
import Ingredient from "./ingredient";
import Meal from "./meal";

@ObjectType()
@Entity()
export default class MealIngredients extends BaseEntity {
  @PrimaryColumn("uuid")
  meal_id: string;

  @PrimaryColumn("text")
  name: string;

  @Field()
  @Column()
  factor: number;

  @Field(() => Meal)
  @ManyToOne(() => Meal, (meal) => meal.meal_id, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "meal_id" })
  meal: Meal;

  @Field(() => Ingredient)
  @ManyToOne(() => Ingredient, (ingredient) => ingredient.name, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "name" })
  ingredient: Ingredient;
}
