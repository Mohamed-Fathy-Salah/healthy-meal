import { Query, Resolver, Arg, Mutation, Ctx } from "type-graphql";
import User from "../entity/user";
import Follow from "../entity/follow";
import { Password } from "../services/password";
import jwt from "jsonwebtoken";
import { UserSignup, UserSignin } from "./types/user";
import { Context } from "apollo-server-core";

const currentUserId = (ctx: Context): never | string => {
  //@ts-ignore
  return jwt.verify(ctx.req.session.jwt, "asdf")["id"];
};

@Resolver()
export class UserResolver {
  @Query(() => User)
  async getUser(@Arg("id", () => String) id: string) {
    return await User.findOne(id);
  }

  @Query(() => [User])
  async getFollowers(@Ctx() ctx: Context) {
    const id = currentUserId(ctx);
    const res = (
      await Follow.find({
        relations: ["user"],
        where: { user_id: id },
        select: ["user"],
      })
    ).map((v) => {
      return { ...v.user };
    });
    return res;
  }

  @Query(() => [User])
  async getFollowing(@Ctx() ctx: Context) {
    const id = currentUserId(ctx);
    const res = (
      await Follow.find({
        relations: ["follower"],
        where: { follower_id: id },
        select: ["follower"],
      })
    ).map((v) => {
      return { ...v.follower };
    });
    return res;
  }

  @Query(() => User)
  async getCurrentUser(@Ctx() ctx: Context) {
    try {
      const id = currentUserId(ctx);
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

  @Mutation(() => Boolean)
  async follow(
    @Arg("user_id", () => String) userId: string,
    @Ctx() ctx: Context
  ) {
    try {
      const id = currentUserId(ctx);
      await Follow.insert({ user_id: userId, follower_id: id });
      return true;
    } catch (e) {
      console.error("---->", e);
    }
    return false;
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
    user.password = await Password.toHash(user.password);
    const createdUser = await User.insert(user);

    const userId = createdUser.identifiers[0].user_id;

    const userJWT = jwt.sign({ id: userId }, "asdf");

    //@ts-ignore
    ctx.req.session.jwt = userJWT;

    return userId;
  }
}
