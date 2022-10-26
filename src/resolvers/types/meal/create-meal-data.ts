import { IsIn, IsNotEmpty, IsNumber, IsUrl } from "class-validator";
import { Field, InputType } from "type-graphql";
import IngredientFactor from "./ingredient-factor";

@InputType()
export default class CreateMealData {
  @Field()
  @IsNotEmpty()
  name: string;

  @Field()
  @IsNotEmpty()
  description: string;

  @Field()
  @IsIn(["breakfast", "launch", "dinner", "snack"])
  type: string;

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
