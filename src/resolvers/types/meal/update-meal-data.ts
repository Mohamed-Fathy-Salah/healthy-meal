import { IsNotEmpty, IsNumber, IsUrl, IsUUID } from "class-validator";
import Meal from "../../../entity/meal";
import { Field, InputType, Int } from "type-graphql";
import IngredientFactor from "./ingredient-factor";
import { MealType } from "./meal-type";

@InputType()
export class UpdateMealData implements Partial<Meal> {
  @Field()
  @IsUUID()
  meal_id: string;

  @Field({ nullable: true })
  @IsNotEmpty()
  name?: string;

  @Field({ nullable: true })
  @IsNotEmpty()
  description?: string;

  @Field(() => MealType, { nullable: true })
  type?: MealType;

  @Field({ nullable: true })
  @IsUrl()
  photo?: string;

  @Field(() => Int, { nullable: true })
  @IsNumber()
  prep_time?: number;

  @Field({ nullable: true })
  @IsNotEmpty()
  steps?: string;

  @Field(() => [IngredientFactor], { nullable: true })
  ingredients?: IngredientFactor[];

  @Field(() => [String], { nullable: true })
  addTags?: string[];

  @Field(() => [String], { nullable: true })
  removeTags?: string[];
}
