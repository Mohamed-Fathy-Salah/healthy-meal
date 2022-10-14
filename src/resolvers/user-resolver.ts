import { Query, Resolver, Arg, Mutation, Ctx } from "type-graphql";
import { User } from "../entity/User";
import { Password } from "../services/password";
import jwt from "jsonwebtoken";
import { UserSignup, UserSignin } from "./types/user";

@Resolver()
export class UserResolver {
  @Query(() => User)
  async getUser(@Arg("id", () => String) id: string) {
    return await User.findOne(id);
  }

  @Query(() => User)
  //@ts-ignore
  async getCurrentUser(@Ctx() { req }) {
    try {
      //@ts-ignore
      const id = jwt.verify(req.session.user, "asdf")["id"];
      return await User.findOne(id);
    } catch (e) {
      console.error("---->", e);
    }
    return null;
  }

  @Query(() => [User])
  async getUsers() {
    return await User.find();
  }

  @Mutation(() => String)
  //@ts-ignore
  async signup(
    @Arg("user", () => UserSignup) user: UserSignup,
    //@ts-ignore
    @Ctx() { req }
  ) {
    user.password = await Password.toHash(user.password);
    const createdUser = await User.insert(user);

    const userId = createdUser.identifiers[0].user_id;

    const userJWT = jwt.sign(
      {
        id: userId,
        email: user.email,
      },
      "asdf"
    );

    req.session.user = userJWT;

    return userId;
  }

  @Mutation(() => String)
  //@ts-ignore
  async signin(
    @Arg("user", () => UserSignin) user: UserSignin,
    //@ts-ignore
    @Ctx() { req }
  ) {
    user.password = await Password.toHash(user.password);
    const createdUser = await User.insert(user);

    const userId = createdUser.identifiers[0].user_id;

    const userJWT = jwt.sign(
      {
        id: userId,
        email: user.email,
      },
      "asdf"
    );

    req.session.user = userJWT;

    return userId;
  }
}
