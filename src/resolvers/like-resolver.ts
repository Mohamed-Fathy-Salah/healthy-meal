import {
  Resolver,
  Arg,
  Mutation,
  Ctx,
  UseMiddleware,
  Query,
} from "type-graphql";
import Context from "../context";
import { currentUser } from "../middlewares/current-user";
import Like from "../entity/like";
import User from "../entity/user";
import { getConnection } from "typeorm";
import Meal from "../entity/meal";

@Resolver()
export default class LikeResolver {
  @Query(() => [User])
  async getLikes(@Arg("meal_id", () => String) meal_id: string) {
    const users = await Like.find({
      relations: ["user"],
      where: [{ meal_id }],
      select: ["user"],
    });
    return users.map((v) => v.user);
  }

  @Mutation(() => Boolean)
  @UseMiddleware(currentUser)
  async addLike(
    @Ctx() { user_id }: Context,
    @Arg("meal_id", () => String) meal_id: string
  ) {
    const queryRunner = getConnection().createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction("READ UNCOMMITTED");
    try {
      const { identifiers } = await queryRunner.manager.insert(Like, {
        meal_id,
        user_id,
      });
      if (identifiers.length !== 1) throw new Error("like not added");

      const { affected } = await queryRunner.manager.increment(
        Meal,
        { meal_id },
        "likesCount",
        1
      );
      if (affected !== 1) throw new Error("like not incremented");

      await queryRunner.commitTransaction();
      await queryRunner.release();
      return true;
    } catch (e) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
    }
    return false;
  }

  @Mutation(() => Boolean)
  @UseMiddleware(currentUser)
  async deleteLike(
    @Ctx() { user_id }: Context,
    @Arg("meal_id", () => String) meal_id: string
  ) {
    const queryRunner = getConnection().createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction("READ UNCOMMITTED");
    try {
      let { affected } = await queryRunner.manager.delete(Like, {
        meal_id,
        user_id,
      });
      if (affected !== 1) throw new Error("like not deleted");

      ({ affected } = await queryRunner.manager.decrement(
        Meal,
        { meal_id },
        "likesCount",
        1
      ));
      if (affected !== 1) throw new Error("like not decremented");

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
