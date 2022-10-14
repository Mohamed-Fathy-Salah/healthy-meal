import { InputType, Field } from "type-graphql";
import { IsEmail, Length, IsNotEmpty } from "class-validator";

@InputType()
export class UserSignup {
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

@InputType()
export class UserSignin {
  @Field()
  @IsEmail()
  email: string;

  @Field()
  @Length(5, 30)
  password: string;
}
