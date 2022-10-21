import Meal from "../entity/meal";
import { currentUser } from "../middlewares/current-user";
import {
  Arg,
  Ctx,
  Mutation,
  Query,
  Resolver,
  UseMiddleware,
} from "type-graphql";
import Context from "../context";
import Ingredient from "../entity/ingredient";
import User from "../entity/user";
import Follow from "../entity/follow";
import MealFilter from "./types/meal/meal-filter";
import CreateMealData from "./types/meal/create-meal-data";

@Resolver()
export default class MealResolver {
  @Query(() => [Meal])
  async getUserMeals(@Arg("email", () => String) email: string) {
    //todo: select meals not working for some reasone
    return (await User.findOne({ email }, { relations: ["meals"] }))?.meals;
  }

  @Query(() => [User])
  @UseMiddleware(currentUser)
  async getFollowingMeals(@Ctx() { user: { user_id } }: Context) {
    //todo: one query
    const following = await Follow.find({
      where: { follower_id: user_id },
      select: ["user_id"],
    });
    const followingMeals = await User.findByIds(
      following.map((v) => v.user_id),
      { relations: ["meals"] }
    );
    return followingMeals;
  }

  @Query(() => [Meal])
  async filterMeals(@Arg("filter", () => MealFilter) filter: MealFilter) {
    try {
        console.error('hi');
      const res =  await Meal.find({ where: { mealTags: { in: filter.tags } } });
      return res;
    } catch (e) {
      console.error(e);
    }
    return [];
  }

  @Mutation(() => Boolean)
  @UseMiddleware(currentUser)
  async createMeal(
    @Arg("meal", () => CreateMealData) meal: CreateMealData,
    @Ctx() { user: { user_id } }: Context
  ) {
    const ingredients = await Ingredient.findByIds(
      meal.ingredients.map((v) => v.ingredient),
      {
        select: ["name", "fat", "carb", "protein", "calories"],
      }
    );
    let [totalFat, totalCarb, totalProtein, totalCalories] = [0, 0, 0, 0];

    const ingredientsFactor: { [key: string]: number } = {};
    for (const { ingredient, factor } of meal.ingredients)
      ingredientsFactor[ingredient] = factor;

    for (const { name, fat, carb, protein, calories } of ingredients) {
      const factor = ingredientsFactor[name];
      totalFat += fat * factor;
      totalCarb += carb * factor;
      totalProtein += protein * factor;
      totalCalories += calories * factor;
    }

    const { identifiers } = await Meal.insert({
      ...meal,
      user_id,
      mealIngredients: ingredients,
      fat: totalFat,
      carb: totalCarb,
      protein: totalProtein,
      calories: totalCalories,
    });
    return identifiers.length > 0;
  }
}
