import {
  Arg,
  Ctx,
  Mutation,
  Query,
  Resolver,
  UseMiddleware,
} from "type-graphql";
import Context from "../context";
import Bookmark from "../entity/bookmark";
import Meal from "../entity/meal";
import { currentUser } from "../middlewares/current-user";

@Resolver()
export default class BookmarkResolver {
  @Query(() => [Meal])
  @UseMiddleware(currentUser)
  async getBookmarks(@Ctx() { user_id }: Context) {
    const meals = await Bookmark.find({
      relations: ["meal", "meal.tags"],
      where: [{ user_id }],
      select: ["meal"],
    });
    return meals.map((v) => v.meal);
  }

  @Mutation(() => Boolean)
  @UseMiddleware(currentUser)
  async addBookmark(
    @Ctx() { user_id }: Context,
    @Arg("meal_id", () => String) meal_id: string
  ) {
    const { identifiers } = await Bookmark.insert({ meal_id, user_id });
    return identifiers.length === 1;
  }

  @Mutation(() => Boolean)
  @UseMiddleware(currentUser)
  async deleteBookmark(
    @Ctx() { user_id }: Context,
    @Arg("meal_id", () => String) meal_id: string
  ) {
    const { affected } = await Bookmark.delete({ meal_id, user_id });
    return affected === 1;
  }
}
