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
import MealFilter from "./types/meal/meal-filter";
import CreateMealData from "./types/meal/create-meal-data";
import MealTags from "../entity/meal-tags";
import { getConnection, QueryRunner } from "typeorm";
import MealIngredients from "../entity/meal-ingredients";
import { UpdateMealData } from "./types/meal/update-meal-data";
import IngredientFactor from "./types/meal/ingredient-factor";
import Follow from "../entity/follow";

//todo: pagination
@Resolver()
export default class MealResolver {
  @Query(() => [Meal])
  async getUserMeals(@Arg("email", () => String) email: string) {
    return (
      await User.findOne(
        { email },
        { relations: ["meals"], select: ["user_id"] }
      )
    )?.meals;
  }

  @Query(() => [User])
  @UseMiddleware(currentUser)
  async getFollowingMeals(@Ctx() { user_id }: Context) {
    const followingMeals = await getConnection()
      .createQueryBuilder()
      .select("follow.user_id")
      .from(Follow, "follow")
      .innerJoinAndSelect("follow.user", "user")
      .leftJoinAndSelect("user.meals", "meal")
      .where("follower_id = :user_id", { user_id })
      .getMany();

    return followingMeals.map((v) => v.user);
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

    if (filter.types)
      query = query.where("meal.type IN (:...types)", { types: filter.types });

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

    return await query.getMany();
  }

  async calculateNutrition(
    mealIngredients: IngredientFactor[],
    queryRunner: QueryRunner
  ) {
    const ingredients = await queryRunner.manager.findByIds(
      Ingredient,
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
    const queryRunner = getConnection().createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction("READ UNCOMMITTED");

    try {
      const { calories, protein, carb, fat } = await this.calculateNutrition(
        meal.ingredients,
        queryRunner
      );

      let { identifiers } = await queryRunner.manager.insert(Meal, {
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

      if (identifiers.length === 0) throw new Error("meal is not inserted");

      ({ identifiers } = await queryRunner.manager.insert(
        MealIngredients,
        meal.ingredients.map((v) => ({
          name: v.ingredient,
          factor: v.factor,
          meal_id: identifiers[0].meal_id,
        }))
      ));

      if (identifiers.length !== meal.ingredients.length)
        throw new Error("ingredients are not inserted");

      if (meal.tags) {
        ({ identifiers } = await queryRunner.manager.insert(
          MealTags,
          meal.tags.map((v) => ({ meal_id: identifiers[0].meal_id, tag: v }))
        ));

        if (identifiers.length !== meal.tags.length)
          throw new Error("tags are not inserted");
      }

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
    const queryRunner = getConnection().createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction("READ UNCOMMITTED");
    try {
      const userMeal = await queryRunner.manager.findOne(Meal, meal.meal_id, {
        select: ["meal_id", "user_id"],
      });

      if (!userMeal || userMeal.user_id !== user_id)
        throw new Error("not found");
      let updateValues = { ...meal };

      if (meal.ingredients) {
        const [_, nutrition] = await Promise.all([
          queryRunner.manager.delete(MealIngredients, {
            meal_id: meal.meal_id,
          }),
          this.calculateNutrition(meal.ingredients, queryRunner),
        ]);

        await queryRunner.manager.insert(
          MealIngredients,
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
        await queryRunner.manager.update(Meal, meal.meal_id, updateValues);

      if (meal.removeTags)
        await queryRunner.manager
          .createQueryBuilder()
          .delete()
          .from(MealTags)
          .where("meal_tags.meal_id = :meal_id", { meal_id: meal.meal_id })
          .andWhere("meal_tags.tag IN (:...tags)", { tags: meal.removeTags })
          .execute();

      if (meal.addTags)
        await queryRunner.manager.insert(
          MealTags,
          meal.addTags.map((v) => ({ meal_id: meal.meal_id, tag: v }))
        );

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
