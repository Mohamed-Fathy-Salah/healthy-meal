import Meal from "../../entity/meal";
import request from "supertest";
import User from "../../entity/user";
import Ingredient from "../../entity/ingredient";
import Unit from "../../entity/unit";
import Follow from "../../entity/follow";
import MealFilter from "../types/meal/meal-filter";
import IngredientFactor from "../types/meal/ingredient-factor";
import MealIngredients from "../../entity/meal-ingredients";

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

const types = ["snack", "breakfast", "dinner"];

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
}: {
  type?: string;
  tags?: string[];
  ingredients?: IngredientFactor[];
  user_id?: string;
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
          prep_time: "10 minutes",
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

it("make meal without signup", async () => {
  const res = await createMeal({});
  expect(res.errors).toBeDefined();
  const meal = await Meal.find();
  expect(meal).toHaveLength(0);
});

it("make meal with user doesnot exist", async () => {
  const res = await createMeal({ user_id: "adfadfdasf" });

  expect(res.errors).toBeDefined();

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
    for (let j = 0; j < 3; j++) await createMeal({ user_id, type: types[i] });
  }

  const { user_id } = await addUser("test10@test.com");

  for (let i = 0; i < 3; i++) {
    const res = await filterMeals({ type: types[i] }, user_id);
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

it.todo("get meals by prep time");

it.todo("get bookmarked meals");

it.todo("get meals by likes");

it.todo("delete meal without signup or with wrong user");

it.todo("delete non existing meal");

it.todo("delete meal");

it.todo("update meal without signup or with wrong user");

it.todo("update non existing meal");

it.todo("update meal");
