import request from "supertest";
import Meal from "../../entity/meal";
import User from "../../entity/user";

const signin = async (email?: string) => {
  const user = User.create({
    name: "name",
    email: email || "test@test.com",
    password: "12345",
  });
  await user.save();

  return user;
};

const addMeal = async (user_id: string) => {
  const meal = Meal.create({
    name: "name",
    description: "des",
    type: "type",
    photo: "photo",
    calories: 10,
    fat: 10,
    protein: 10,
    carb: 10,
    prep_time: "10",
    user_id,
    steps: "123",
  });
  await meal.save();
  return meal;
};

const addLike = async ({
  meal_id,
  user_id,
}: {
  meal_id?: string;
  user_id?: string;
}) => {
  const res = await request(global.url)
    .post("/")
    .set("Cookie", global.signin(user_id))
    .send({
      query: `mutation addLike($meal_id: String!){addLike(meal_id: $meal_id)}`,
      variables: { meal_id },
    });
  return res.body;
};

const getLikes = async (meal_id: string) => {
  const res = await request(global.url).post("/").send({
    query: `query getLikes($meal_id: String!){getLikes(meal_id: $meal_id){name, email}}`,
    variables: { meal_id },
  });
  return res.body;
};

const deleteLike = async ({
  meal_id,
  user_id,
}: {
  meal_id?: string;
  user_id?: string;
}) => {
  const res = await request(global.url)
    .post("/")
    .set("Cookie", global.signin(user_id))
    .send({
      query: `mutation deleteLike($meal_id: String!){deleteLike(meal_id: $meal_id)}`,
      variables: { meal_id },
    });
  return res.body;
};

it("add like without signin", async () => {
  const { user_id } = await signin();
  const { meal_id } = await addMeal(user_id);
  const res = await addLike({ meal_id });
  expect(res.errors).toBeDefined();
});

it("add like to non existing meal", async () => {
  const { user_id } = await signin();
  const res = await addLike({ user_id, meal_id: user_id });
  expect(res.errors).toBeDefined();
});

it("add like to meal", async () => {
  const { user_id } = await signin();
  const { meal_id } = await addMeal(user_id);
  const res = await addLike({ meal_id, user_id });
  expect(res.errors).toBeUndefined();
  expect(res.data.addLike).toBeTruthy();
});

it("add 2 likes to meal", async () => {
  const { user_id } = await signin();
  const { meal_id } = await addMeal(user_id);
  await addLike({ meal_id, user_id });
  const res = await addLike({ meal_id, user_id });
  expect(res.errors).toBeDefined();
});

it("get likes", async () => {
  const { user_id } = await signin();
  const { meal_id } = await addMeal(user_id);
  await addLike({ meal_id, user_id });
  const res = await getLikes(meal_id);
  expect(res.errors).toBeUndefined();
  expect(res.data.getLikes).toHaveLength(1);
});

it("delete like without signin", async () => {
  const { user_id } = await signin();
  const { meal_id } = await addMeal(user_id);
  await addLike({ meal_id, user_id });
  const res = await deleteLike({ meal_id });
  expect(res.errors).toBeDefined();
});

it("delete like from non existing meal", async () => {
  const { user_id } = await signin();
  const res = await deleteLike({ meal_id: "adfasdf", user_id });
  expect(res.data.deleteLike).toBeFalsy();
});

it("delete like", async () => {
  const { user_id } = await signin();
  const { meal_id } = await addMeal(user_id);
  await addLike({ meal_id, user_id });
  const res = await deleteLike({ meal_id, user_id });
  expect(res.errors).toBeUndefined();
  expect(res.data.deleteLike).toBeTruthy();
});

it("delete like 2 times", async () => {
  const { user_id } = await signin();
  const { meal_id } = await addMeal(user_id);
  await addLike({ meal_id, user_id });
  await deleteLike({ meal_id, user_id });
  const res = await deleteLike({ meal_id, user_id });
  expect(res.data.deleteLike).toBeFalsy();
});
