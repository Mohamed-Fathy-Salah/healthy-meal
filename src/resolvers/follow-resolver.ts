import {
  Query,
  Resolver,
  Arg,
  Mutation,
  Ctx,
  UseMiddleware,
} from "type-graphql";
import User from "../entity/user";
import Follow from "../entity/follow";
import Context from "../context";
import { currentUser } from "../middlewares/current-user";

@Resolver()
export default class FollowResolver {
  @Query(() => [User])
  @UseMiddleware(currentUser)
  async getFollowers(@Ctx() { userId }: Context) {
    const res = (
      await Follow.find({
        relations: ["user"],
        where: { user_id: userId },
        select: ["user"],
      })
    ).map((v) => {
      return { ...v.user };
    });
    return res;
  }

  @Query(() => [User])
  @UseMiddleware(currentUser)
  async getFollowing(@Ctx() { userId }: Context) {
    const res = (
      await Follow.find({
        relations: ["follower"],
        where: { follower_id: userId },
        select: ["follower"],
      })
    ).map((v) => {
      return { ...v.follower };
    });
    return res;
  }

  @Mutation(() => Boolean)
  @UseMiddleware(currentUser)
  async follow(
    @Arg("user_id", () => String) userId: string,
    @Ctx() ctx: Context
  ) {
    const id = ctx.userId;
    if (id === userId) return false;
    const { identifiers } = await Follow.insert({
      user_id: userId,
      follower_id: id,
    });
    return identifiers?.length > 0;
  }

  @Mutation(() => Boolean)
  @UseMiddleware(currentUser)
  async unfollow(
    @Arg("user_id", () => String) userId: string,
    @Ctx() ctx: Context
  ) {
    const id = ctx.userId;
    const { affected } = await Follow.delete({
      user_id: userId,
      follower_id: id,
    });
    return affected! > 0;
  }
  // todo: add count field to get followers, following
}
