import request from "supertest";
import Meal from "../../entity/meal";
import User from "../../entity/user";

const addUser = async (email?: string) => {
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

const addBookmark = async ({
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
      query: `mutation addBookmark($meal_id: String!){addBookmark(meal_id: $meal_id)}`,
      variables: { meal_id },
    });
  return res.body;
};

const getBookmarks = async (user_id?: string) => {
  const res = await request(global.url)
    .post("/")
    .set("Cookie", global.signin(user_id))
    .send({
      query: `query {getBookmarks{name, type, tags{tag}}}`,
    });
  return res.body;
};

//@ts-ignore
const deleteBookmark = async ({
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
      query: `mutation deleteBookmark($meal_id: String!){deleteBookmark(meal_id: $meal_id)}`,
      variables: { meal_id },
    });
  return res.body;
};

const makeMeal = async () => {
  const user = await addUser();
  const meal = await addMeal(user.user_id);
  return { user, meal };
};

it("add bookmark without signin", async () => {
  const { meal } = await makeMeal();
  const res = await addBookmark({ meal_id: meal.meal_id });
  expect(res.errors).toBeDefined();
});

it("add bookmark to non existing meal", async () => {
  const user = await addUser();
  const res = await addBookmark({ meal_id: "adfadsf", user_id: user.user_id });
  expect(res.errors).toBeDefined();
});

it("add bookmark to meal", async () => {
  const { meal } = await makeMeal();
  const user = await addUser("test2@test.com");
  const res = await addBookmark({
    meal_id: meal.meal_id,
    user_id: user.user_id,
  });
  expect(res.errors).toBeUndefined();
  expect(res.data.addBookmark).toBeTruthy();
});

it("add 2 bookmarks to meal", async () => {
  const { meal } = await makeMeal();
  const user = await addUser("test2@test.com");
  await addBookmark({ meal_id: meal.meal_id, user_id: user.user_id });
  const res = await addBookmark({
    meal_id: meal.meal_id,
    user_id: user.user_id,
  });
  expect(res.errors).toBeDefined();
});

it("get bookmarks without signin", async () => {
  const { user, meal } = await makeMeal();
  await addBookmark({ meal_id: meal.meal_id, user_id: user.user_id });
  const res = await getBookmarks();
  expect(res.errors).toBeDefined();
});

it("get bookmarks", async () => {
  const { meal } = await makeMeal();
  const user = await addUser("test2@test.com");
  await addBookmark({ meal_id: meal.meal_id, user_id: user.user_id });
  const res = await getBookmarks(user.user_id);
  expect(res.errors).toBeUndefined();
  expect(res.data.getBookmarks).toHaveLength(1);
});

it("delete bookmark without signin", async () => {
  const { meal, user } = await makeMeal();
  await addBookmark({ meal_id: meal.meal_id, user_id: user.user_id });
  const res = await deleteBookmark({ meal_id: meal.meal_id });
  expect(res.errors).toBeDefined();
});

it("delete bookmark from non existing meal", async () => {
  const user = await addUser();
  const res = await deleteBookmark({
    meal_id: user.user_id,
    user_id: user.user_id,
  });
  expect(res.data.deleteBookmark).toBeFalsy();
});

it("delete bookmark", async () => {
  const { meal, user } = await makeMeal();
  await addBookmark({ meal_id: meal.meal_id, user_id: user.user_id });
  const res = await deleteBookmark({
    meal_id: meal.meal_id,
    user_id: user.user_id,
  });
  expect(res.errors).toBeUndefined();
  expect(res.data.deleteBookmark).toBeTruthy();
});

it("delete bookmark 2 times", async () => {
  const { meal, user } = await makeMeal();
  await addBookmark({ meal_id: meal.meal_id, user_id: user.user_id });
  await deleteBookmark({ meal_id: meal.meal_id, user_id: user.user_id });
  const res = await deleteBookmark({
    meal_id: meal.meal_id,
    user_id: user.user_id,
  });
  expect(res.errors).toBeUndefined();
  expect(res.data.deleteBookmark).toBeFalsy();
});
