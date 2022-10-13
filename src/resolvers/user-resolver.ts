import { Query, Resolver, Arg, Mutation, InputType, Field, Ctx } from "type-graphql";
import { User } from "../entity/User";
import { Password } from "../services/password";
import jwt from 'jsonwebtoken';
import {IsNotEmpty, IsEmail, Length} from 'class-validator';
import { Context } from "vm";

@InputType()
class UserInput {
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

@Resolver()
export class UserResolver {
  @Query(() => User)
  async getUser(@Arg("id", () => String) id: string) {
    return await User.findOne(id);
  }

  @Query(() => [User])
  async getUsers() {
    return await User.find();
  }

  @Mutation(() => String)
  async signup( @Arg("user", () => UserInput) user: UserInput, @Ctx() {res}: Context) { 
    user.password = await Password.toHash(user.password);
    const createdUser = await User.insert(user);

    const userId = createdUser.identifiers[0].user_id;

    const userJWT = jwt.sign({
        id: userId,
        email: user.email
    }, "asdf");

    res.session = userJWT;

    return userId;
  }
}
