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
import { CreateMealData, MealFilter } from "./types/meal";
import Ingredient from "../entity/ingredient";
import User from "../entity/user";

@Resolver()
export default class MealResolver {
  @Query(() => [Meal])
  async getUserMeals(@Arg("email", () => String) email: string) {
    //todo: select meals not working for some reasone
    return (await User.findOne({ email }, { relations: ["meals"] }))?.meals;
  }

  @Query(() => [Meal])
  async filterMeals(@Arg("filter", () => MealFilter) filter: MealFilter) {
    return await Meal.find({ ...filter });
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
