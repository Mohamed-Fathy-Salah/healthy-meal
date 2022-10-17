import {
  Query,
  Resolver,
  Arg,
  Mutation,
  Ctx,
  UseMiddleware,
} from "type-graphql";
import User from "../entity/user";
import { Password } from "../services/password";
import jwt from "jsonwebtoken";
import { UserSignup, UserSignin } from "./types/user";
import { currentUser } from "../middlewares/current-user";
import Context from "../context";

@Resolver()
export class AuthResolver {
  @Query(() => User)
  @UseMiddleware(currentUser)
  async getCurrentUser(@Ctx() { userId }: Context) {
    try {
      return await User.findOne(userId);
    } catch (e) {
      console.error("---->", e);
    }
    return null;
  }

  @Mutation(() => String)
  async signup(
    @Arg("user", () => UserSignup) user: UserSignup,
    @Ctx() ctx: Context
  ) {
    user.password = await Password.toHash(user.password);
    const createdUser = await User.insert(user);

    const userId = createdUser.identifiers[0].user_id;

    const userJWT = jwt.sign({ id: userId }, "asdf");

    //@ts-ignore
    ctx.req.session.jwt = userJWT;

    return userId;
  }

  @Mutation(() => String)
  async signin(
    @Arg("user", () => UserSignin) user: UserSignin,
    @Ctx() ctx: Context
  ) {
    const existingUser = await User.findOne({ email: user.email });

    if (!existingUser) {
      throw new Error("wrong creds");
    }

    if (!(await Password.compare(existingUser.password, user.password))) {
      throw new Error("wrong creds");
    }

    const userJWT = jwt.sign({ id: existingUser.user_id }, "asdf");

    //@ts-ignore
    ctx.req.session.jwt = userJWT;

    return existingUser.user_id;
  }
}
