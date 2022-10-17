import User from "../../entity/user";
import request from "supertest";

const mutation = {
  signup: {
    query: `mutation { signup(user: {name: "name", email: "test@test.com", password: "password"}) }`,
  },
};

it("signup success", async () => {
  const res = await request(global.url).post("/").send(mutation.signup);

  expect(res.error).toBeFalsy();
  expect(res.body.data.signup).toBeDefined();

  const user = await User.findOne(res.body.data.signup);
  expect(user.user_id).toBe(res.body.data.signup);
});

it.todo("wrong signup credentials");
it.todo("correct signup credentials");

it.todo("wrong signin credentials");
it.todo("correct signin credentials");

it.todo("current user without signup");
it.todo("current user without signin");

it.todo("current user with signup");
it.todo("current user with signin");
