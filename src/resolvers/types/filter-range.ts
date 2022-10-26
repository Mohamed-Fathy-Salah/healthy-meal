import { IsNumber } from "class-validator";
import { Field, InputType } from "type-graphql";

@InputType()
export default class FilterRange {
  @Field({ defaultValue: -1e9 })
  @IsNumber()
  start?: number;

  @Field({ defaultValue: 1e9 })
  @IsNumber()
  end?: number;
}
