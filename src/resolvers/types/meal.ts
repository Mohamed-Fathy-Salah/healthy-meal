import {
  IsDate,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsUrl,
  Max,
  Min,
} from "class-validator";
import Meal from "../../entity/meal";
import { Field, InputType } from "type-graphql";

@InputType()
export class IngredientFactor {
  @Field()
  @IsNotEmpty()
  ingredient: string;

  @Field()
  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(0.1)
  @Max(50)
  factor: number;
}

@InputType()
export class CreateMealData implements Partial<Meal> {
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
}

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

@InputType()
export class MealFilter implements Partial<Meal> {
  @Field({ nullable: true })
  @IsIn(["breakfast", "launch", "dinner", "snack"])
  type?: string;

  @Field({ nullable: true })
  @IsNumber()
  @Min(0)
  calories?: number;

  @Field({ nullable: true })
  @IsNumber()
  @Min(0)
  fat?: number;

  @Field({ nullable: true })
  @IsNumber()
  @Min(0)
  protein?: number;

  @Field({ nullable: true })
  @IsNumber()
  @Min(0)
  carb?: number;

  @Field({ nullable: true })
  //todo: interval
  prep_time?: string;

  @Field(() => [String], { nullable: true })
  ingredients?: string[];
}
