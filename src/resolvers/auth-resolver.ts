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
import { currentUser } from "../middlewares/current-user";
import Context from "../context";
import { UserSignup } from "./types/user/user-signup";
import { UserSignin } from "./types/user/user-signin";

@Resolver()
export default class AuthResolver {
  @Query(() => User)
  @UseMiddleware(currentUser)
  async getCurrentUser(@Ctx() { user_id }: Context) {
    return await User.findOne(user_id);
  }

  @Mutation(() => Boolean)
  async signup(
    @Arg("user", () => UserSignup) user: UserSignup,
    @Ctx() ctx: Context
  ) {
    user.password = await Password.toHash(user.password);
    const createdUser = await User.insert(user);
    const userId = createdUser.identifiers[0].user_id;

    const userJWT = jwt.sign({ id: userId, email: user.email }, "asdf");

    //@ts-ignore
    ctx.req.session.jwt = userJWT;

    return true;
  }

  @Mutation(() => Boolean)
  async signin(
    @Arg("user", () => UserSignin) user: UserSignin,
    @Ctx() ctx: Context
  ) {
    const existingUser = await User.findOne(
      { email: user.email },
      { select: ["user_id", "password"] }
    );

    if (!existingUser) {
      throw new Error("wrong creds");
    }

    const areEqual = await Password.compare(
      existingUser.password,
      user.password
    );
    if (!areEqual) {
      throw new Error("wrong creds");
    }
    const userJWT = jwt.sign(
      { id: existingUser.user_id, email: user.email },
      "asdf"
    );

    //@ts-ignore
    ctx.req.session.jwt = userJWT;

    return true;
  }
}
