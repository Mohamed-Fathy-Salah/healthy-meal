import Meal from "../../entity/meal";
import request from "supertest";
import User from "../../entity/user";
import Ingredient from "../../entity/ingredient";
import Unit from "../../entity/unit";
import Follow from "../../entity/follow";
import MealFilter from "../types/meal/meal-filter";

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

const userData = {
  name: "fad",
  email: `test@test.com`,
  password: "123345",
};

const mealData = {
  name: "meal",
  description: "desc",
  type: "breakfast",
  photo: "http://photo.com",
  prep_time: "10 minutes",
  steps: "step1",
  ingredients: [
    {
      ingredient: "tomato",
      factor: 2,
    },
    {
      ingredient: "honey",
      factor: 5,
    },
  ],
};

const mutation = {
  createMeal: (type?: string, tags?: string[]) => {
    type = type || "breakfast";
    return {
      query:
        "mutation createMeal($meal: CreateMealData!){ createMeal(meal: $meal)}",
      variables: { meal: { ...mealData, type, tags } },
    };
  },
};

const query = {
  getUserMeals: (email: string) => ({
    query:
      "query getUserMeals($email: String!){getUserMeals(email: $email){meal_id, name, type}}",
    variables: { email },
  }),
  getFollowingMeals: () => ({
    query: "query {getFollowingMeals{name, email, meals{name, type}}}",
  }),
  filterMeals: (filter: MealFilter) => ({
    query:
      "query filterMeals($filter: MealFilter!){filterMeals(filter: $filter){name, type, tags}}",
    variables: { filter: { ...filter } },
  }),
};

it("make meal without signup", async () => {
  const res = await request(global.url).post("/").send(mutation.createMeal());
  expect(res.body.errors).toBeDefined();
  const meal = await Meal.find();
  expect(meal).toHaveLength(0);
});

it("make meal with user doesnot exist", async () => {
  const res = await request(global.url)
    .post("/")
    .set("Cookie", global.signin())
    .send(mutation.createMeal());

  expect(res.body.errors).toBeDefined();

  const meal = await Meal.find();
  expect(meal).toHaveLength(0);
});

it("make meal with unvalid data", async () => {
  const user = User.create(userData);
  await user.save();

  const res = await request(global.url)
    .post("/")
    .set("Cookie", global.signin(user.user_id))
    .send(mutation.createMeal("adf"));

  expect(res.body.errors).toBeDefined();

  const meal = await Meal.find();
  expect(meal).toHaveLength(0);
});

it("make meal with valid data", async () => {
  const user = User.create(userData);
  await user.save();

  const res = await request(global.url)
    .post("/")
    .set("Cookie", global.signin(user.user_id))
    .send(mutation.createMeal());

  expect(res.body.data.createMeal).toBeTruthy();

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
  expect(userMeals?.meals[0].meal_id).toBe(meals[0].meal_id);
});

it("get meals of user", async () => {
  const user = User.create(userData);
  await user.save();

  await request(global.url)
    .post("/")
    .set("Cookie", global.signin(user.user_id))
    .send(mutation.createMeal());

  const res = await request(global.url)
    .post("/")
    .send(query.getUserMeals(user.email));

  expect(res.body.data.getUserMeals).toHaveLength(1);
});

it("get meals of user that doesnot exist", async () => {
  const res = await request(global.url)
    .post("/")
    .send(query.getUserMeals("email@email.com"));

  expect(res.body.errors).toBeDefined();
});

it("get meals of following users", async () => {
  const user1 = User.create(userData);
  await user1.save();
  const user2 = User.create({ ...userData, email: "test2@test.com" });
  await user2.save();
  const user3 = User.create({ ...userData, email: "test3@test.com" });
  await user3.save();

  await Follow.insert({ user_id: user1.user_id, follower_id: user3.user_id });
  await Follow.insert({ user_id: user2.user_id, follower_id: user3.user_id });

  await request(global.url)
    .post("/")
    .set("Cookie", global.signin(user1.user_id))
    .send(mutation.createMeal());

  await request(global.url)
    .post("/")
    .set("Cookie", global.signin(user2.user_id))
    .send(mutation.createMeal("snack"));

  const res = await request(global.url)
    .post("/")
    .set("Cookie", global.signin(user3.user_id))
    .send(query.getFollowingMeals());

  expect(res.body.data.getFollowingMeals).toHaveLength(2);
});

it("get meals by type", async () => {
  for (let i = 0; i < 3; i++) {
    const user = User.create({ ...userData, email: `test${i}@test.com` });
    await user.save();
    for (let j = 0; j < 3; j++)
      await request(global.url)
        .post("/")
        .set("Cookie", global.signin(user.user_id))
        .send(mutation.createMeal("snack", [`tag${j}`]));
  }
  for (let i = 0; i < 3; i++) {
    const res = await request(global.url)
      .post("/")
      .send(query.filterMeals({ tags: [`tag${i}`] }));

    console.error(res.text);
    expect(res.body.data.filterMeals).toHaveLength(2);
  }

  const res = await request(global.url)
    .post("/")
    .send(query.filterMeals({ tags: ["tag1", "tag2"] }));

  expect(res.body.data.filterMeals).toHaveLength(4);
});

it.todo("get meals by tags");
it.todo("get meals by likes");
it.todo("get meals by ingredients");
it.todo("get meals by prep time");
it.todo("get bookmarked meals");
it.todo("delete meal without signup or with wrong user");
it.todo("delete non existing meal");
it.todo("delete meal");
it.todo("update meal without signup or with wrong user");
it.todo("update non existing meal");
it.todo("update meal");
