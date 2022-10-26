import { IsEmail, Length } from "class-validator";
import { Field, InputType } from "type-graphql";

@InputType()
export class UserSignin {
  @Field()
  @IsEmail()
  email: string;

  @Field()
  @Length(5, 30)
  password: string;
}
