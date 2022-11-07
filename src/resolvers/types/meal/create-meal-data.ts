import { IsNotEmpty, IsNumber, IsUrl } from "class-validator";
import { Field, InputType } from "type-graphql";
import IngredientFactor from "./ingredient-factor";
import { MealType } from "./meal-type";

@InputType()
export default class CreateMealData {
  @Field()
  @IsNotEmpty()
  name: string;

  @Field()
  @IsNotEmpty()
  description: string;

  @Field(() => MealType)
  type: MealType;

  @Field()
  @IsUrl()
  photo: string;

  @Field()
  @IsNumber()
  prep_time: number;

  @Field()
  @IsNotEmpty()
  steps: string;

  @Field(() => [IngredientFactor])
  ingredients: IngredientFactor[];

  @Field(() => [String], { nullable: true })
  tags?: string[];
}
