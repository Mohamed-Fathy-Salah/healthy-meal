import { IsEmail, IsString } from "class-validator";
import { Field, InputType } from "type-graphql";
import FilterRange from "../filter-range";
import { MealType } from "./meal-type";

@InputType()
export default class MealFilter {
  @Field(() => [MealType], { nullable: true })
  types?: MealType[];

  @Field(() => [String], { nullable: true })
  @IsString({ each: true })
  @IsEmail()
  emails?: string[];

  @Field(() => FilterRange, { nullable: true })
  calories?: FilterRange;

  @Field(() => FilterRange, { nullable: true })
  fat?: FilterRange;

  @Field(() => FilterRange, { nullable: true })
  protein?: FilterRange;

  @Field(() => FilterRange, { nullable: true })
  carb?: FilterRange;

  @Field(() => FilterRange, { nullable: true })
  prep_time?: FilterRange;

  @Field(() => [String], { nullable: true })
  ingredients?: string[];

  @Field(() => [String], { nullable: true })
  tags?: string[];

  @Field(() => Boolean, { defaultValue: false })
  bookmarks?: boolean;

  @Field(() => Boolean, { defaultValue: false })
  likes?: boolean;

  @Field(() => Boolean, { defaultValue: false })
  following?: boolean;
}
