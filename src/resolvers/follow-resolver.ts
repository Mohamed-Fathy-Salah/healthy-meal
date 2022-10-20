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
  async getFollowers(@Ctx() { user: { user_id } }: Context) {
    const res = (
      await Follow.find({
        relations: ["follower"],
        where: { user_id: user_id },
        select: ["follower"],
      })
    ).map((v) => {
      return { ...v.follower };
    });
    return res;
  }

  @Query(() => [User])
  @UseMiddleware(currentUser)
  async getFollowing(@Ctx() { user: { user_id } }: Context) {
    const res = (
      await Follow.find({
        relations: ["user"],
        where: { follower_id: user_id },
        select: ["user"],
      })
    ).map((v) => {
      return { ...v.user };
    });
    return res;
  }

  @Mutation(() => Boolean)
  @UseMiddleware(currentUser)
  async follow(
    @Arg("email", () => String) email: string,
    @Ctx() { user }: Context
  ) {
    if (user.email === email) return false;

    const existingUser = await User.findOne({ email }, { select: ["user_id"] });
    if (!existingUser) return false;

    const { identifiers } = await Follow.insert({
      user_id: existingUser.user_id,
      follower_id: user.user_id,
    });
    return identifiers?.length > 0;
  }

  @Mutation(() => Boolean)
  @UseMiddleware(currentUser)
  async unfollow(
    @Arg("email", () => String) email: string,
    @Ctx() { user }: Context
  ) {
    const existingUser = await User.findOne({ email }, { select: ["user_id"] });
    if (!existingUser) return false;

    const { affected } = await Follow.delete({
      user_id: existingUser.user_id,
      follower_id: user.user_id,
    });
    return affected! > 0;
  }
  // todo: add count field to get followers, following
}
