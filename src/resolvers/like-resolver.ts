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
    @Ctx() { user: { user_id } }: Context,
    @Arg("meal_id", () => String) meal_id: string
  ) {
    const { identifiers } = await Like.insert({ meal_id, user_id });
    return identifiers.length === 1;
  }

  @Mutation(() => Boolean)
  @UseMiddleware(currentUser)
  async deleteLike(
    @Ctx() { user: { user_id } }: Context,
    @Arg("meal_id", () => String) meal_id: string
  ) {
    const { affected } = await Like.delete({ meal_id, user_id });
    return affected === 1;
  }
}
