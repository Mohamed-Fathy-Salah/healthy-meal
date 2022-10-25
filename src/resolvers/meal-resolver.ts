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
import MealIngredients from "../entity/meal-ingredients";

//todo: get number of likes
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
  @UseMiddleware(currentUser)
  async filterMeals(
    @Arg("filter", () => MealFilter) filter: MealFilter,
    @Ctx() { user: { user_id } }: Context
  ) {
    try {
      // todo: cant filter onetomany relations
      // how to filter from each table?
      //
      //SELECT meal.*, user.name, user.email, meal_tags.tag, meal_ingredients.name FROM meal
      //INNER JOIN bookmark ON bookmark.meal_id = meal.meal_id AND bookmark.user_id = ${userId}
      //INNER JOIN meal_tags ON meal_tags.meal_id = meal.meal_id AND meal_tag.tag IN (${tags})
      //INNER JOIN meal_ingredients ON meal.meal_id = meal_ingredients.meal_id AND meal_ingredients.name IN (${ingredients})
      //
      //todo: like, type, calories, fat, protein, carb, prep_time
      //todo: innerjoin apply condition when corresponding filter exists

      let query = getConnection()
        .createQueryBuilder()
        .select([
          "meal",
          "user.email",
          "mealingredients.name",
          "mealingredients.factor",
        ])
        .from(Meal, "meal");

      if (filter.bookmarks)
        query = query.innerJoin(
          "meal.bookmarks",
          "bookmark",
          "bookmark.user_id =:user_id",
          { user_id }
        );

      query = filter.emails
        ? query.innerJoin("meal.user", "user", "user.email IN (:...emails)", {
            emails: filter.emails,
          })
        : query.leftJoin("meal.user", "user");

      query = filter.tags
        ? query.innerJoinAndSelect(
            "meal.tags",
            "mealtags",
            "mealtags.tag IN (:...tags)",
            { tags: filter.tags }
          )
        : query.leftJoinAndSelect("meal.tags", "mealtags");

      if (filter.type)
        query = query.where("meal.type = :type", { type: filter.type });

      query = filter.ingredients
        ? query.innerJoin(
            "meal.mealIngredients",
            "mealingredients",
            "mealingredients.name IN (:...ingredients)",
            { ingredients: filter.ingredients }
          )
        : query.leftJoin("meal.mealIngredients", "mealingredients");

      const res = await query.getMany();

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

    //todo: user transaction
    let { identifiers } = await Meal.insert({
      name: meal.name,
      description: meal.description,
      type: meal.type,
      photo: meal.photo,
      prep_time: meal.prep_time,
      steps: meal.steps,
      user_id,
      fat: totalFat,
      carb: totalCarb,
      protein: totalProtein,
      calories: totalCalories,
    });

    if (identifiers.length === 0) return false;

    ({ identifiers } = await MealIngredients.insert(
      meal.ingredients.map((v) => ({
        name: v.ingredient,
        factor: v.factor,
        meal_id: identifiers[0].meal_id,
      }))
    ));

    if (identifiers.length !== meal.ingredients.length) return false;

    if (meal.tags) {
      ({ identifiers } = await MealTags.insert(
        meal.tags.map((v) => ({ meal_id: identifiers[0].meal_id, tag: v }))
      ));
      return identifiers.length !== meal.tags.length;
    }

    return true;
  }
}
