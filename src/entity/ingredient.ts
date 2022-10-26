import {
  Entity,
  Column,
  BaseEntity,
  ManyToOne,
  PrimaryColumn,
  OneToMany,
} from "typeorm";
import { Field, ObjectType } from "type-graphql";
import Unit from "./unit";
import MealIngredients from "./meal-ingredients";

@ObjectType()
@Entity()
export default class Ingredient extends BaseEntity {
  @Field()
  @PrimaryColumn("text")
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

  @Field(() => [MealIngredients])
  @OneToMany(
    () => MealIngredients,
    (mealIngredients) => mealIngredients.ingredient
  )
  mealIngredients: MealIngredients[];
}
