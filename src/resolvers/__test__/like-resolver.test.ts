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
    prep_time: 10,
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
  expect(res.data.addLike).toBeFalsy();
});

it("add like to non existing meal", async () => {
  const { user_id } = await signin();
  const res = await addLike({ user_id, meal_id: user_id });
  expect(res.data.addLike).toBeFalsy();
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
  expect(res.data.addLike).toBeFalsy();
});

it("get likes", async () => {
  const { user_id } = await signin();
  const { meal_id } = await addMeal(user_id);
  await addLike({ meal_id, user_id });
  const res = await getLikes(meal_id);
  expect(res.errors).toBeUndefined();
  expect(res.data.getLikes).toHaveLength(1);
});

it("get likes count", async () => {
  const user = await signin();
  const { meal_id } = await addMeal(user.user_id);
  const N = 10;
  for (let i = 0; i < N; i++) {
    const { user_id } = await signin(`test${i}@test.com`);
    await addLike({ meal_id, user_id });
  }
  const meal = await Meal.findOne(meal_id, { select: ["likesCount"] });
  expect(meal?.likesCount).toEqual(N);

  const res = await getLikes(meal_id);
  expect(res.errors).toBeUndefined();
  expect(res.data.getLikes).toHaveLength(N);
});

it("delete like without signin", async () => {
  const { user_id } = await signin();
  const { meal_id } = await addMeal(user_id);
  await addLike({ meal_id, user_id });
  const res = await deleteLike({ meal_id });
  expect(res.data.deleteLike).toBeFalsy();
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

it("delete 5 likes after 10 likes", async () => {
  const { user_id } = await signin();
  const { meal_id } = await addMeal(user_id);
  const N = 10;
  const users = [];
  for (let i = 0; i < N; i++) {
    users.push(await signin(`test${i}@test.com`));
    await addLike({ meal_id, user_id: users[i].user_id });
  }

  for (let i = 5; i < N; i++) {
    const res = await deleteLike({ meal_id, user_id: users[i].user_id });
    expect(res.errors).toBeUndefined();
    expect(res.data.deleteLike).toBeTruthy();
  }

  const meal = await Meal.findOne(meal_id, { select: ["likesCount"] });
  expect(meal?.likesCount).toEqual(N - 5);

  const res = await getLikes(meal_id);
  expect(res.errors).toBeUndefined();
  expect(res.data.getLikes).toHaveLength(N - 5);
});

it("delete like 2 times", async () => {
  const { user_id } = await signin();
  const { meal_id } = await addMeal(user_id);
  await addLike({ meal_id, user_id });
  await deleteLike({ meal_id, user_id });
  const res = await deleteLike({ meal_id, user_id });
  expect(res.data.deleteLike).toBeFalsy();
});
