import Meal from "../../entity/meal";
import request from "supertest";

//const userData = {
  //name: "fad",
  //email: `test@test.com`,
  //password: "123345",
//};

const mealData = {
  name: "meal",
  description: "desc",
  type: "breakfast",
  photo: "http://photo.com",
  prep_time: "10 minutes",
  steps: "step1",
};

const mutation = {
  createMeal: () => ({
    query: "mutation makeMeal($meal: CreateMealData!){ makeMeal(meal: $meal)}",
    variables: { meal: { ...mealData } },
  }),
};

it("make meal without signup", async () => {
  const res = await request(global.url).post("/").send(mutation.createMeal());
  expect(res.body.errors).toBeDefined();
  const meal = await Meal.find();
  expect(meal).toHaveLength(0);
});

it.todo("make meal with unvalid data");
it.todo("make meal with valid data");
it.todo("get meals of current user");
it.todo("get meals of user");
it.todo("get meals by tags");
it.todo("get meals by likes");
it.todo("get meals by ingredients");
it.todo("get meals by prep time");
it.todo("get meals by type");
it.todo("get meals of following users");
it.todo("get bookmarked meals");
it.todo("delete meal without signup or with wrong user");
it.todo("delete non existing meal");
it.todo("delete meal");
it.todo("update meal without signup or with wrong user");
it.todo("update non existing meal");
it.todo("update meal");
