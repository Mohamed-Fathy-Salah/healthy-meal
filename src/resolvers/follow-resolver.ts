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
import { getConnection } from "typeorm";

@Resolver()
export default class FollowResolver {
  @Query(() => [User])
  @UseMiddleware(currentUser)
  async getFollowers(@Ctx() { user_id }: Context) {
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
  async getFollowing(@Ctx() { user_id }: Context) {
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
    @Ctx() { user_id, email: userEmail }: Context
  ) {
    if (userEmail === email) return false;

    const queryRunner = getConnection().createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction("READ UNCOMMITTED");

    try {
      const followingUser = await queryRunner.manager.findOne(
        User,
        { email },
        { select: ["user_id"] }
      );
      if (!followingUser) throw new Error("user does not exist");

      const { identifiers } = await queryRunner.manager.insert(Follow, {
        user_id: followingUser.user_id,
        follower_id: user_id,
      });
      if (identifiers?.length !== 1) throw new Error("follow is not added");

      let { affected } = await queryRunner.manager.increment(
        User,
        { user_id: followingUser.user_id },
        "followersCount",
        1
      );
      if (affected !== 1) throw new Error("follower count is not incremented");

      ({ affected } = await queryRunner.manager.increment(
        User,
        { user_id },
        "followingCount",
        1
      ));
      if (affected !== 1) throw new Error("following count is not incremented");
      queryRunner.commitTransaction();
      queryRunner.release();
      return true;
    } catch (e) {
      queryRunner.rollbackTransaction();
      queryRunner.release();
    }
    return false;
  }

  @Mutation(() => Boolean)
  @UseMiddleware(currentUser)
  async unfollow(
    @Arg("email", () => String) email: string,
    @Ctx() { user_id }: Context
  ) {
    const queryRunner = getConnection().createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction("READ UNCOMMITTED");

    try {
      const followingUser = await User.findOne(
        { email },
        { select: ["user_id"] }
      );
      if (!followingUser) throw new Error("user not found");

      let { affected } = await Follow.delete({
        user_id: followingUser.user_id,
        follower_id: user_id,
      });
      if (affected !== 1) throw new Error("follow not added");

      ({ affected } = await queryRunner.manager.decrement(
        User,
        { user_id: followingUser.user_id },
        "followersCount",
        1
      ));
      if (affected !== 1) throw new Error("followers not decremented");

      ({ affected } = await queryRunner.manager.decrement(
        User,
        { user_id },
        "followingCount",
        1
      ));
      if (affected !== 1) throw new Error("following not decremented");

      await queryRunner.commitTransaction();
      await queryRunner.release();
      return true;
    } catch (e) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
    }
    return false;
  }
}
