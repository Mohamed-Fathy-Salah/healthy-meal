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
import { UpdateMealData } from "./types/meal/update-meal-data";
import IngredientFactor from "./types/meal/ingredient-factor";

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
  async getFollowingMeals(@Ctx() { user_id }: Context) {
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
    @Ctx() { user_id }: Context
  ) {
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

    if (filter.likes)
      query = query.innerJoin("meal.likes", "like", "like.user_id =:user_id", {
        user_id,
      });

    query = filter.emails
      ? query.innerJoin("meal.user", "user", "user.email IN (:...emails)", {
          emails: filter.emails,
        })
      : query.leftJoin("meal.user", "user");

    if (filter.following)
      query = query.innerJoin(
        "user.followers",
        "follow",
        "follow.follower_id = :follower_id",
        { follower_id: user_id }
      );

    query = filter.tags
      ? query.innerJoinAndSelect(
          "meal.tags",
          "mealtags",
          "mealtags.tag IN (:...tags)",
          { tags: filter.tags }
        )
      : query.leftJoinAndSelect("meal.tags", "mealtags");

    query = filter.ingredients
      ? query.innerJoin(
          "meal.mealIngredients",
          "mealingredients",
          "mealingredients.name IN (:...ingredients)",
          { ingredients: filter.ingredients }
        )
      : query.leftJoin("meal.mealIngredients", "mealingredients");

    if (filter.type)
      query = query.where("meal.type = :type", { type: filter.type });

    if (filter.calories)
      query = query
        .where("meal.calories >= :start", { start: filter.calories.start })
        .andWhere("meal.calories <= :end", { end: filter.calories.end });

    if (filter.protein)
      query = query
        .where("meal.protein >= :start", { start: filter.protein.start })
        .andWhere("meal.protein <= :end", { end: filter.protein.end });

    if (filter.fat)
      query = query
        .where("meal.fat >= :start", { start: filter.fat.start })
        .andWhere("meal.fat <= :end", { end: filter.fat.end });

    if (filter.carb)
      query = query
        .where("meal.carb >= :start", { start: filter.carb.start })
        .andWhere("meal.carb <= :end", { end: filter.carb.end });

    if (filter.prep_time)
      query = query
        .where("meal.prep_time >= :start", { start: filter.prep_time.start })
        .andWhere("meal.prep_time <= :end", { end: filter.prep_time.end });

    const res = await query.getMany();

    return res;
  }

  async calculateNutrition(mealIngredients: IngredientFactor[]) {
    const ingredients = await Ingredient.findByIds(
      mealIngredients.map((v) => v.ingredient),
      {
        select: ["name", "fat", "carb", "protein", "calories"],
      }
    );
    let [totalFat, totalCarb, totalProtein, totalCalories] = [0, 0, 0, 0];

    const ingredientsFactor: { [key: string]: number } = {};
    for (const { ingredient, factor } of mealIngredients)
      ingredientsFactor[ingredient] = factor;

    for (const { name, fat, carb, protein, calories } of ingredients) {
      const factor = ingredientsFactor[name];
      totalFat += fat * factor;
      totalCarb += carb * factor;
      totalProtein += protein * factor;
      totalCalories += calories * factor;
    }

    return {
      fat: totalFat,
      carb: totalCarb,
      protein: totalProtein,
      calories: totalCalories,
    };
  }

  @Mutation(() => Boolean)
  @UseMiddleware(currentUser)
  async createMeal(
    @Arg("meal", () => CreateMealData) meal: CreateMealData,
    @Ctx() { user_id }: Context
  ) {
    const { calories, protein, carb, fat } = await this.calculateNutrition(
      meal.ingredients
    );

    //todo: user transaction
    let { identifiers } = await Meal.insert({
      name: meal.name,
      description: meal.description,
      type: meal.type,
      photo: meal.photo,
      prep_time: meal.prep_time,
      steps: meal.steps,
      user_id,
      fat,
      carb,
      protein,
      calories,
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

  @Mutation(() => Boolean)
  @UseMiddleware(currentUser)
  async deleteMeal(
    @Arg("meal_id", () => String) meal_id: string,
    @Ctx() { user_id }: Context
  ) {
    const { affected } = await Meal.delete({ meal_id, user_id });
    return affected === 1;
  }

  @Mutation(() => Boolean)
  @UseMiddleware(currentUser)
  async updateMeal(
    @Arg("meal", () => UpdateMealData) meal: UpdateMealData,
    @Ctx() { user_id }: Context
  ) {
    //todo: transaction
    const userMeal = await Meal.findOne(meal.meal_id, {
      select: ["meal_id", "user_id"],
    });
    if (!userMeal || userMeal.user_id !== user_id) return false;
    let updateValues = { ...meal };

    if (meal.ingredients) {
      const [_, nutrition] = await Promise.all([
        MealIngredients.delete({ meal_id: meal.meal_id }),
        this.calculateNutrition(meal.ingredients),
      ]);
      await MealIngredients.insert(
        meal.ingredients.map((v) => ({
          name: v.ingredient,
          factor: v.factor,
          meal_id: meal.meal_id,
        }))
      ),
        (updateValues = { ...meal, ...nutrition });
    }

    delete updateValues.ingredients;
    delete updateValues.addTags;
    delete updateValues.removeTags;

    if (
      meal.ingredients ||
      meal.prep_time ||
      meal.name ||
      meal.type ||
      meal.photo ||
      meal.steps ||
      meal.description
    )
      await Meal.update(meal.meal_id, updateValues);

    if (meal.removeTags)
      await getConnection()
        .createQueryBuilder()
        .delete()
        .from(MealTags)
        .where("meal_tags.meal_id = :meal_id", { meal_id: meal.meal_id })
        .andWhere("meal_tags.tag IN (:...tags)", { tags: meal.removeTags })
        .execute();

    if (meal.addTags)
      await MealTags.insert(
        meal.addTags.map((v) => ({ meal_id: meal.meal_id, tag: v }))
      );
    return true;
  }
}
