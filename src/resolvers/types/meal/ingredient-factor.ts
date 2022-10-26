import { IsNotEmpty, IsNumber, Max, Min } from "class-validator";
import { Field, InputType } from "type-graphql";

@InputType()
export default class IngredientFactor {
  @Field()
  @IsNotEmpty()
  ingredient: string;

  @Field()
  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(0.1)
  @Max(50)
  factor: number;
}
