import { IsDate, IsIn, IsNotEmpty, IsUrl } from "class-validator";
import Meal from "../../../entity/meal";
import { Field, InputType } from "type-graphql";
import IngredientFactor from "./ingredient-factor";

@InputType()
export class UpdateMealData implements Partial<Meal> {
  @Field({ nullable: true })
  @IsNotEmpty()
  name?: string;

  @Field({ nullable: true })
  @IsNotEmpty()
  description?: string;

  @Field({ nullable: true })
  @IsIn(["breakfast", "launch", "dinner", "snack"])
  type?: string;

  @Field({ nullable: true })
  @IsUrl()
  photo?: string;

  @Field({ nullable: true })
  //todo: interval
  @IsDate()
  prep_time?: string;

  @Field({ nullable: true })
  @IsNotEmpty()
  steps?: string;

  @Field(() => [IngredientFactor], { nullable: true })
  ingredients?: IngredientFactor[];
}
