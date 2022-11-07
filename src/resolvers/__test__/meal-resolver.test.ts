import Meal from "../../entity/meal";
import request from "supertest";
import User from "../../entity/user";
import Ingredient from "../../entity/ingredient";
import Unit from "../../entity/unit";
import Follow from "../../entity/follow";
import MealFilter from "../types/meal/meal-filter";
import IngredientFactor from "../types/meal/ingredient-factor";
import MealIngredients from "../../entity/meal-ingredients";
import Bookmark from "../../entity/bookmark";
import Like from "../../entity/like";
import { UpdateMealData } from "../types/meal/update-meal-data";
import MealTags from "../../entity/meal-tags";
import { MealType } from "../types/meal/meal-type";

beforeAll(async () => {
  const unit1 = Unit.create({ label: "peice" });
  await unit1.save();
  const unit2 = Unit.create({ label: "TPSP" });
  await unit2.save();

  await Ingredient.insert({
    name: "tomato",
    calories: 10,
    photo: "blah",
    fat: 2,
    protein: 3,
    carb: 5,
    unit: unit1,
  });
  await Ingredient.insert({
    name: "honey",
    calories: 15,
    photo: "blah",
    fat: 3,
    protein: 5,
    carb: 7,
    unit: unit2,
  });
});

const addUser = async (email?: string) => {
  const user = User.create({
    name: "name",
    email: email || "test@test.com",
    password: "1345456",
  });
  await user.save();
  return user;
};

const createMeal = async ({
  type,
  tags,
  ingredients,
  user_id,
  prep_time,
}: {
  type?: string;
  tags?: string[];
  ingredients?: IngredientFactor[];
  user_id?: string;
  prep_time?: number;
}) => {
  const res = await request(global.url)
    .post("/")
    .set("Cookie", global.signin(user_id))
    .send({
      query:
        "mutation createMeal($meal: CreateMealData!){ createMeal(meal: $meal)}",
      variables: {
        meal: {
          name: "meal",
          description: "desc",
          type: type || "breakfast",
          photo: "http://photo.com",
          prep_time: prep_time || 10,
          steps: "step1",
          ingredients: ingredients || [
            {
              ingredient: "tomato",
              factor: 2,
            },
            {
              ingredient: "honey",
              factor: 5,
            },
          ],
          tags,
        },
      },
    });
  return res.body;
};

const getUserMeals = async (email: string) => {
  const res = await request(global.url).post("/").send({
    query:
      "query getUserMeals($email: String!){getUserMeals(email: $email){meal_id, name, type}}",
    variables: { email },
  });
  return res.body;
};

const getFollowingMeals = async (user_id?: string) => {
  const res = await request(global.url)
    .post("/")
    .set("Cookie", global.signin(user_id))
    .send({
      query: "query {getFollowingMeals{name, email, meals{name, type}}}",
    });
  return res.body;
};

const filterMeals = async (filter: MealFilter, user_id?: string) => {
  const res = await request(global.url)
    .post("/")
    .set("Cookie", global.signin(user_id))
    .send({
      query:
        "query filterMeals($filter: MealFilter!){filterMeals(filter: $filter){name, type, tags{tag}, mealIngredients{name, factor} }}",
      variables: { filter: { ...filter } },
    });
  return res.body;
};

const deleteMeal = async ({
  meal_id,
  user_id,
}: {
  user_id?: string;
  meal_id?: string;
}) => {
  const res = await request(global.url)
    .post("/")
    .set("Cookie", global.signin(user_id))
    .send({
      query:
        "mutation deleteMeal($meal_id: String!){deleteMeal(meal_id: $meal_id)}",
      variables: { meal_id },
    });
  return res.body;
};

const updateMeal = async (meal: UpdateMealData, user_id?: string) => {
  const query = {
    query:
      "mutation updateMeal($meal: UpdateMealData!){updateMeal(meal: $meal)}",
    variables: { meal },
  };
  const res = user_id
    ? await request(global.url)
        .post("/")
        .set("Cookie", global.signin(user_id))
        .send(query)
    : await request(global.url).post("/").send(query);
  return res.body;
};

it("make meal without signup", async () => {
  const res = await createMeal({});
  expect(res.data.createMeal).toBeFalsy();
  const meal = await Meal.find();
  expect(meal).toHaveLength(0);
});

it("make meal with user doesnot exist", async () => {
  const res = await createMeal({ user_id: "adfadfdasf" });
  expect(res.data.createMeal).toBeFalsy();
  const meal = await Meal.find();
  expect(meal).toHaveLength(0);
});

it("make meal with unvalid data", async () => {
  const user = await addUser();

  const res = await createMeal({ type: "adf", user_id: user.user_id });

  expect(res.errors).toBeDefined();

  const meal = await Meal.find();
  expect(meal).toHaveLength(0);
});

it("make meal with valid data", async () => {
  const user = await addUser();
  const res = await createMeal({ user_id: user.user_id });

  expect(res.data.createMeal).toBeTruthy();

  const meals = await Meal.find();
  expect(meals).toHaveLength(1);
  expect(meals[0].calories).toEqual(10 * 2 + 15 * 5);
  expect(meals[0].fat).toEqual(2 * 2 + 3 * 5);
  expect(meals[0].protein).toEqual(3 * 2 + 5 * 5);
  expect(meals[0].carb).toEqual(5 * 2 + 7 * 5);

  const userMeals = await User.findOne(user.user_id, {
    relations: ["meals"],
    select: ["meals", "name"],
  });

  const mealIngredients = await MealIngredients.find();
  expect(mealIngredients).toHaveLength(2);

  expect(userMeals?.meals[0].meal_id).toBe(meals[0].meal_id);
});

it("get meals of user", async () => {
  const user = await addUser();

  await createMeal({ user_id: user.user_id });

  const res = await getUserMeals(user.email);

  expect(res.data.getUserMeals).toHaveLength(1);
});

it("get meals of user that doesnot exist", async () => {
  const res = await getUserMeals("email@email.com");

  expect(res.errors).toBeDefined();
});

it("get meals of following users", async () => {
  const user1 = await addUser("test1@test.com");
  const user2 = await addUser("test2@test.com");
  const user3 = await addUser("test3@test.com");

  await Follow.insert({ user_id: user1.user_id, follower_id: user3.user_id });
  await Follow.insert({ user_id: user2.user_id, follower_id: user3.user_id });

  await createMeal({ user_id: user1.user_id });
  await createMeal({ user_id: user2.user_id, type: "snack" });

  const res = await getFollowingMeals(user3.user_id);

  expect(res.data.getFollowingMeals).toHaveLength(2);
});

it("get meals by tags", async () => {
  for (let i = 0; i < 3; i++) {
    const { user_id } = await addUser(`test${i}@test.com`);
    for (let j = 0; j < 3; j++)
      await createMeal({ user_id, type: "snack", tags: [`tag${j}`] });
  }

  const { user_id } = await addUser("test10@test.com");

  for (let i = 0; i < 3; i++) {
    const res = await filterMeals({ tags: [`tag${i}`] }, user_id);
    expect(res.data.filterMeals).toHaveLength(3);
  }

  let res = await filterMeals({ tags: ["tag0", "tag1"] }, user_id);
  expect(res.data.filterMeals).toHaveLength(6);

  res = await filterMeals({ tags: ["tag1", "tag2"] }, user_id);
  expect(res.data.filterMeals).toHaveLength(6);

  res = await filterMeals({ tags: ["tag0", "tag2"] }, user_id);
  expect(res.data.filterMeals).toHaveLength(6);
});

it("get meals by type", async () => {
  for (let i = 0; i < 3; i++) {
    const { user_id } = await addUser(`test${i}@test.com`);
    for (let j = 0; j < 3; j++)
      await createMeal({ user_id, type: Object.values(MealType)[i] });
  }

  const { user_id } = await addUser("test10@test.com");

  for (let i = 0; i < 3; i++) {
    const res = await filterMeals({ types: [MealType.breakfast] }, user_id);
    expect(res.data.filterMeals).toHaveLength(3);
  }
});

it("get meals by ingredients", async () => {
  const ings = ["tomato", "honey"];
  for (let i = 0; i < 3; i++) {
    const { user_id } = await addUser(`test${i}@test.com`);
    for (let j = 0; j < 3; j++)
      await createMeal({
        user_id,
        ingredients: [{ ingredient: ings[j % 2], factor: j + 1 }],
      });
  }

  const { user_id } = await addUser("test10@test.com");

  for (let i = 0; i < 3; i++) {
    const res = await filterMeals({ ingredients: [ings[i % 2]] }, user_id);
    expect(res.data.filterMeals).toHaveLength(-3 * (i % 2) + 6);
  }
});

it("get bookmarked meals", async () => {
  const { user_id } = await addUser();
  await createMeal({ user_id });

  const user = await addUser("test2@test.com");
  const meal = (await Meal.find())[0];

  let res = await filterMeals({ bookmarks: true }, user.user_id);
  expect(res.data.filterMeals).toHaveLength(0);

  await Bookmark.insert({
    user_id: user.user_id,
    meal_id: meal.meal_id,
  });

  res = await filterMeals({ bookmarks: true }, user.user_id);
  expect(res.data.filterMeals).toHaveLength(1);
});

it("get meals by likes oredered desc", async () => {
  const { user_id } = await addUser();
  await createMeal({ user_id });

  const user = await addUser("test2@test.com");
  const meal = (await Meal.find())[0];

  let res = await filterMeals({ likes: true }, user.user_id);
  expect(res.data.filterMeals).toHaveLength(0);

  await Like.insert({
    user_id: user.user_id,
    meal_id: meal.meal_id,
  });

  res = await filterMeals({ likes: true }, user.user_id);
  expect(res.data.filterMeals).toHaveLength(1);
});

it("get meals by calories", async () => {
  let { user_id } = await addUser();
  for (let i = 1; i <= 5; i++) {
    await createMeal({
      user_id,
      ingredients: [{ ingredient: "tomato", factor: i }],
    });
  }
  ({ user_id } = await addUser("test2@test.com"));
  let res = await filterMeals({ calories: { start: 20 } });
  expect(res.data.filterMeals).toHaveLength(4);
  res = await filterMeals({ calories: { end: 40 } });
  expect(res.data.filterMeals).toHaveLength(4);
  res = await filterMeals({ calories: { start: 20, end: 40 } });
  expect(res.data.filterMeals).toHaveLength(3);
  res = await filterMeals({ calories: { start: 60, end: 80 } });
  expect(res.data.filterMeals).toHaveLength(0);
  res = await filterMeals({ calories: { start: 60, end: 30 } });
  expect(res.data.filterMeals).toHaveLength(0);
});

it("get meals by protein", async () => {
  let { user_id } = await addUser();
  for (let i = 1; i <= 5; i++) {
    await createMeal({
      user_id,
      ingredients: [{ ingredient: "tomato", factor: i }],
    });
  }
  ({ user_id } = await addUser("test2@test.com"));
  let res = await filterMeals({ protein: { start: 6 } });
  expect(res.data.filterMeals).toHaveLength(4);
  res = await filterMeals({ protein: { end: 12 } });
  expect(res.data.filterMeals).toHaveLength(4);
  res = await filterMeals({ protein: { start: 6, end: 12 } });
  expect(res.data.filterMeals).toHaveLength(3);
  res = await filterMeals({ protein: { start: 16, end: 80 } });
  expect(res.data.filterMeals).toHaveLength(0);
  res = await filterMeals({ protein: { start: 16, end: 3 } });
  expect(res.data.filterMeals).toHaveLength(0);
});

it("get meals by prep time", async () => {
  let { user_id } = await addUser();
  for (let i = 1; i <= 5; i++) await createMeal({ user_id, prep_time: i * 10 });
  ({ user_id } = await addUser("test2@test.com"));
  let res = await filterMeals({ prep_time: { start: 20 } });
  expect(res.data.filterMeals).toHaveLength(4);
  res = await filterMeals({ prep_time: { end: 40 } });
  expect(res.data.filterMeals).toHaveLength(4);
  res = await filterMeals({ prep_time: { start: 20, end: 40 } });
  expect(res.data.filterMeals).toHaveLength(3);
  res = await filterMeals({ prep_time: { start: 51, end: 60 } });
  expect(res.data.filterMeals).toHaveLength(0);
  res = await filterMeals({ prep_time: { start: 30, end: 10 } });
  expect(res.data.filterMeals).toHaveLength(0);
});

it("get meals by following", async () => {
  const user1 = await addUser("test1@test.com");
  const user2 = await addUser("test2@test.com");
  const user3 = await addUser("test3@test.com");

  await createMeal({ user_id: user1.user_id, tags: ["user1"] });
  await createMeal({ user_id: user2.user_id, tags: ["user2"] });
  await createMeal({ user_id: user3.user_id, tags: ["user3"] });

  await Follow.insert({ user_id: user2.user_id, follower_id: user1.user_id });
  await Follow.insert({ user_id: user3.user_id, follower_id: user1.user_id });
  await Follow.insert({ user_id: user3.user_id, follower_id: user2.user_id });

  let res = await filterMeals({ following: true }, user1.user_id);
  expect(res.data.filterMeals).toHaveLength(2);

  res = await filterMeals({ following: true }, user2.user_id);
  expect(res.data.filterMeals).toHaveLength(1);

  res = await filterMeals({ following: true }, user3.user_id);
  expect(res.data.filterMeals).toHaveLength(0);
});

it("delete meal without signup or with wrong user", async () => {
  const { user_id } = await addUser();
  await createMeal({ user_id });

  const meal = (await Meal.find())[0];

  const user = await addUser("test2@test.com");
  let res = await deleteMeal({ meal_id: meal.meal_id, user_id: user.user_id });
  expect(res.data.deleteMeal).toBeFalsy();
  expect(await Meal.find()).toHaveLength(1);

  res = await deleteMeal({ meal_id: meal.meal_id });
  expect(res.data.deleteMeal).toBeFalsy();
  expect(await Meal.find()).toHaveLength(1);
});

it("delete non existing meal", async () => {
  const { user_id } = await addUser();
  const res = await deleteMeal({ meal_id: "adfadf", user_id });
  expect(res.data.deleteMeal).toBeFalsy();
});

it("delete meal", async () => {
  const { user_id } = await addUser();
  await createMeal({ user_id });
  const meal = (await Meal.find())[0];

  const res = await deleteMeal({ meal_id: meal.meal_id, user_id });
  expect(res.data.deleteMeal).toBeTruthy();
  expect(await Meal.find()).toHaveLength(0);
});

it("update meal without signup or with wrong user", async () => {
  const { user_id } = await addUser();
  await createMeal({ user_id });

  const meal = (await Meal.find())[0];

  let res = await updateMeal({ meal_id: meal.meal_id, addTags: ["hi"] });
  expect(res.errors).toBeDefined();
  res = await updateMeal(
    { meal_id: meal.meal_id, addTags: ["ihi"] },
    "adsfadsf"
  );
  expect(res.data.updateMeal).toBeFalsy();
});

it("update non existing meal", async () => {
  const { user_id } = await addUser();
  const res = await updateMeal({ meal_id: "adfadf", prep_time: 50 }, user_id);
  expect(res.errors).toBeDefined();
});

it("update meal ingredients", async () => {
  const { user_id } = await addUser();
  await createMeal({ user_id });
  const { meal_id } = (await Meal.find())[0];

  const res = await updateMeal(
    { meal_id, ingredients: [{ ingredient: "honey", factor: 10 }] },
    user_id
  );
  expect(res.data.updateMeal).toBeTruthy();

  const mealIngredients = await MealIngredients.find();
  expect(mealIngredients).toHaveLength(1);
  expect(mealIngredients[0].factor).toEqual(10);
  expect(mealIngredients[0].name).toEqual("honey");
});

it("update meal tags", async () => {
  const { user_id } = await addUser();
  await createMeal({ user_id, tags: ["tag1", "tag5"] });
  const { meal_id } = (await Meal.find())[0];

  const res = await updateMeal(
    { meal_id, addTags: ["tag2", "tag3"], removeTags: ["tag1"] },
    user_id
  );
  expect(res.data.updateMeal).toBeTruthy();

  const tags = await MealTags.find();
  expect(tags).toHaveLength(3);
  expect(tags.map((v) => v.tag).sort()).toEqual(["tag2", "tag3", "tag5"]);
});

it("update meal scalar data", async () => {
  const { user_id } = await addUser();
  await createMeal({ user_id, tags: ["tag1", "tag5"] });
  const { meal_id } = (await Meal.find())[0];

  const res = await updateMeal(
    {
      meal_id,
      name: "new meal",
      type: MealType.breakfast,
      photo: "http://bs.com",
      steps: "3steps",
      prep_time: 123,
    },
    user_id
  );
  expect(res.data.updateMeal).toBeTruthy();

  const meal = await Meal.findOne(meal_id);
  expect(meal).toBeDefined();
  expect(meal?.name).toEqual("new meal");
  expect(meal?.type).toEqual(MealType.breakfast);
  expect(meal?.photo).toEqual("http://bs.com");
  expect(meal?.steps).toEqual("3steps");
  expect(meal?.prep_time).toEqual(123);
});
