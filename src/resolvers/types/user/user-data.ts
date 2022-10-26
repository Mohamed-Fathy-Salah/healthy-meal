import { Field, InputType } from "type-graphql";
import {
  IsNotEmpty,
  IsDate,
  IsNumber,
  Max,
  Min,
  IsUrl,
  IsIn,
} from "class-validator";
import User from "../../../entity/user";

@InputType()
export class UserData implements Partial<User> {
  @Field({ nullable: true })
  @IsNotEmpty()
  name?: string;

  @Field({ nullable: true })
  @IsDate()
  date_of_birth?: string;

  @Field({ nullable: true })
  @IsIn(["f", "m"])
  gender?: string;

  @Field({ nullable: true })
  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(30)
  @Max(300)
  weight?: number;

  @Field({ nullable: true })
  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(140)
  @Max(250)
  height?: number;

  @Field({ nullable: true })
  @IsUrl()
  photo?: string;
}
