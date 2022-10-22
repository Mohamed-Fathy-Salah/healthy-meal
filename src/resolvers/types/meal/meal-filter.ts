import { IsIn, IsString } from "class-validator";
import { Field, InputType } from "type-graphql";
import FilterRange from "../filter-range";

@InputType()
export default class MealFilter {
  @Field(() => [String], { nullable: true })
  @IsString({ each: true })
  @IsIn(["breakfast", "launch", "dinner", "snack"])
  type?: string[];

  @Field(() => FilterRange, { nullable: true })
  calories?: FilterRange;

  @Field(() => FilterRange, { nullable: true })
  fat?: FilterRange;

  @Field(() => FilterRange, { nullable: true })
  protein?: FilterRange;

  @Field(() => FilterRange, { nullable: true })
  carb?: FilterRange;

  @Field(() => String, { nullable: true })
  //todo: interval
  prep_time?: string;

  @Field(() => [String], { nullable: true })
  ingredients?: string[];

  @Field(() => [String], { nullable: true })
  tags?: string[];
}
