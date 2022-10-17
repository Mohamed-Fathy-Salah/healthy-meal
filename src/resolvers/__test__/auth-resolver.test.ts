import User from "../../entity/user";
import request from "supertest";

const mutation = {
  signup: () => {
    return {
      query: `mutation signup($user: UserSignup!){ signup(user: $user) }`,
      variables: {
        user: { name: "name", email: "test@test.com", password: "password" },
      },
    };
  },
  signin: () => {
    return {
      query: `mutation signin($user: UserSignin!){ signin(user: $user) }`,
      variables: {
        user: { email: "test@test.com", password: "password" },
      },
    };
  },
};

const query = {
  getCurrentUser: () => {
    return {
      query: "query {getCurrentUser{user_id}}",
    };
  },
};

it("signup success", async () => {
  const res = await request(global.url).post("/").send(mutation.signup());

  expect(res.error).toBeFalsy();
  expect(res.body.data.signup).toBeDefined();

  const user = await User.findOne(res.body.data.signup);
  expect(user.user_id).toBe(res.body.data.signup);
});

it("wrong signup credentials", async () => {
  const query = mutation.signup();

  query.variables.user.name = "";
  let {
    body: { errors },
  } = await request(global.url).post("/").send(query);
  expect(errors).toBeDefined();
  query.variables.user.name = "hi";

  query.variables.user.email = "asdfadsf";
  ({
    body: { errors },
  } = await request(global.url).post("/").send(query));
  expect(errors).toBeDefined();
  query.variables.user.email = "test@test.com";

  query.variables.user.password = "1234";
  ({
    body: { errors },
  } = await request(global.url).post("/").send(query));
  expect(errors).toBeDefined();

  const res = await User.find();
  expect(res).toHaveLength(0);
});

it("correct signup credentials", async () => {
  const { body } = await request(global.url).post("/").send(mutation.signup());
  expect(body.errors).toBeUndefined();
  expect(body.data.signup).toBeDefined();

  const user = await User.findOne(body.data.signup);
  expect(user).toBeDefined();
});

it("wrong signin credentials", async () => {
  const query = mutation.signin();
  await User.insert(mutation.signup().variables.user);

  query.variables.user.email = "blah@blah.com";
  let { body } = await request(global.url).post("/").send(query);
  expect(body.errors).toBeDefined();

  query.variables.user.email = "test@test.com";
  query.variables.user.password = "adjfad;sf";
  ({ body } = await request(global.url).post("/").send(query));
  expect(body.errors).toBeDefined();
});

it("correct signin credentials", async () => {
  const userId = (await request(global.url).post("/").send(mutation.signup()))
    .body.data.signup;

  const { body } = await request(global.url).post("/").send(mutation.signin());
  expect(body.errors).toBeUndefined();
  expect(body.data.signin).toBe(userId);
});

it("current user without signup", async () => {
  const { body } = await request(global.url)
    .post("/")
    .send(query.getCurrentUser());
  expect(body.errors).toBeDefined();
});

it("current user with signup", async () => {
  const userId = (await request(global.url).post("/").send(mutation.signup()))
    .body.data.signup;

  const { body } = await request(global.url)
    .post("/")
    .set("Cookie", global.signin(userId))
    .send(query.getCurrentUser());

  expect(body.errors).toBeUndefined();
  expect(body.data.getCurrentUser.user_id).toBe(userId);
});
