import Meal from "../entity/meal";
import { currentUser } from "../middlewares/current-user";
import { Arg, Ctx, Mutation, Resolver, UseMiddleware } from "type-graphql";
import Context from "../context";
import { CreateMealData } from "./types/meal";

@Resolver()
export default class MealResolver {
  @Mutation(() => Boolean)
  @UseMiddleware(currentUser)
  async createMeal(
    @Arg("meal", () => CreateMealData) meal: CreateMealData,
    @Ctx() { userId }: Context
  ) {
    const { identifiers } = await Meal.insert({ ...meal, user_id: userId });
    return identifiers.length > 0;
  }
}