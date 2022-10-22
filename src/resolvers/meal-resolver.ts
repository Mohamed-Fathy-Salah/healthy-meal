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
import MealTags from "../entity/meal-tags";
import { getConnection } from "typeorm";

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
  async filterMeals(
    @Arg("filter", () => MealFilter) filter: MealFilter,
    @Ctx() { user: { user_id } }: Context
  ) {
    try {
      // todo: cant filter onetomany relations
      // how to filter from each table?
      //
      //SELECT meal.*, user.name, user.email, meal_tags.tag, meal_ingredients.name FROM meal
      //INNER JOIN user ON user.user_id = meal.user_id AND user.email IN (${emails})
      //INNER JOIN bookmark ON bookmark.meal_id = meal.meal_id AND bookmark.user_id = ${userId}
      //INNER JOIN meal_tags ON meal_tags.meal_id = meal.meal_id AND meal_tag.tag IN (${tags})
      //INNER JOIN meal_ingredients ON meal.meal_id = meal_ingredients.meal_id AND meal_ingredients.name IN (${ingredients})
      //
      //todo: like, type, calories, fat, protein, carb, prep_time
      //todo: innerjoin apply condition when corresponding filter exists

      const res = await getConnection()
        .createQueryBuilder()
        .select("meal")
        .from(Meal, "meal")
        .innerJoinAndSelect("meal.user", "user", "user.email IN (:...emails)", {
          emails: filter.emails,
        })
        .innerJoinAndSelect(
          "meal.bookmarks",
          "bookmark",
          "bookmark.user_id =:user_id",
          { user_id }
        )
        .innerJoinAndSelect(
          "meal.tags",
          "mealtags",
          "mealtags.tag IN (:...tags)",
          { tags: filter.tags }
        )
        .innerJoinAndSelect(
          "meal.mealIngredients",
          "mealingredients",
          "mealingredients.name IN (:...ingredients)",
          { ingredients: filter.ingredients }
        )
        .getMany();

      console.error(res, filter);
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
      name: meal.name,
      description: meal.description,
      type: meal.type,
      photo: meal.photo,
      prep_time: meal.prep_time,
      steps: meal.steps,
      user_id,
      mealIngredients: ingredients,
      fat: totalFat,
      carb: totalCarb,
      protein: totalProtein,
      calories: totalCalories,
    });

    await MealTags.insert(
      meal.tags.map((v) => ({ meal_id: identifiers[0].meal_id, tag: v }))
    );

    return identifiers.length > 0;
  }
}
