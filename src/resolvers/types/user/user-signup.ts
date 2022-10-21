import { IsEmail, IsNotEmpty, Length } from "class-validator";
import User from "../../../entity/user";
import { Field, InputType } from "type-graphql";

@InputType()
export class UserSignup implements Partial<User> {
  @Field()
  @IsNotEmpty()
  name: string;

  @Field()
  @IsEmail()
  email: string;

  @Field()
  @Length(5, 30)
  password: string;
}
