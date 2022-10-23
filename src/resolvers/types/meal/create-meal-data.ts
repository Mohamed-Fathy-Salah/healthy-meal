import { IsIn, IsNotEmpty, IsUrl } from "class-validator";
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
  //todo: interval
  prep_time: string;

  @Field()
  @IsNotEmpty()
  steps: string;

  @Field(() => [IngredientFactor])
  ingredients: IngredientFactor[];

  @Field(() => [String], { nullable: true })
  tags?: string[];
}
