import request from "supertest";
import User from "../../entity/user";
import { UserData } from "../types/user";

const userData = {
  name: "fad",
  email: `test@test.com`,
  password: "123345",
  gender: "f",
};
const query = {
  getUsers: () => {
    return {
      query: `query { getUsers{ user_id, email } }`,
    };
  },
  getUser: (id: string) => {
    return {
      query: `query { getUser(id: "${id}"){ user_id, email } }`,
    };
  },
};

const mutation = {
  updateUser: (newData?: UserData) => {
    const data = { ...userData };
    //@ts-ignore
    delete data.email;
    //@ts-ignore
    delete data.password;
    return {
      query: "mutation updateUser($user: UserData!){updateUser(user: $user)}",
      variables: {
        user: { ...data, ...newData },
      },
    };
  },
  deleteUser: () => {
    return {
      query: "mutation {deleteUser}",
    };
  },
};

it("getUsers", async () => {
  const N = 5;
  for (let i = 0; i < N; i++)
    await User.insert({ ...userData, email: `test${i}@test.com` });

  const res = await request(global.url).post("/").send(query.getUsers());

  expect(res.error).toBeFalsy();
  expect(res.body.data.getUsers).toHaveLength(N);
});

it("get user with id success", async () => {
  const user = User.create(userData);
  await user.save();

  const res = await request(global.url)
    .post("/")
    .send(query.getUser(user.user_id));
  expect(res.body.data.getUser.user_id).toBe(user.user_id);
});

it("get user that does not exist", async () => {
  const res = await request(global.url)
    .post("/")
    .send(query.getUser("a;jfjadsfadfasdf"));
  expect(res.body.errors).toBeDefined();
});

it("update user that does not exist", async () => {
  const res = await request(global.url)
    .post("/")
    .set("Cookie", global.signin())
    .send(mutation.updateUser({ name: "adsf" }));
  expect(res.body.data.updateUser).toBeFalsy();
});

it("update user with out login", async () => {
  const res = await request(global.url)
    .post("/")
    .send(mutation.updateUser({ name: "adsf" }));
  expect(res.body.errors).toBeDefined();
});

it("update user with valid data", async () => {
  const user = User.create(userData);
  await user.save();

  const res = await request(global.url)
    .post("/")
    .set("Cookie", global.signin(user.user_id))
    .send(mutation.updateUser({ name: "adsf", gender: "m" }));

  expect(res.body.data.updateUser).toBeTruthy();

  const updatedUser = await User.findOne(user.user_id);
  expect(updatedUser?.name).toBe("adsf");
  expect(updatedUser?.gender).toBe("m");
});

it("update user with unvalid data", async () => {
  const user = User.create(userData);
  await user.save();

  const res = await request(global.url)
    .post("/")
    .set("Cookie", global.signin(user.user_id))
    .send(mutation.updateUser({ name: "", gender: "t" }));

  expect(res.body.errors).toBeDefined();
});

it("delete user that does not exist", async () => {
  const { body } = await request(global.url)
    .post("/")
    .set("Cookie", global.signin())
    .send(mutation.deleteUser());

  expect(body.data.deleteUser).toBeFalsy();
});
it("delete user without login", async () => {
  const { body } = await request(global.url)
    .post("/")
    .send(mutation.deleteUser());

  expect(body.errors).toBeDefined();
});
it("delete user", async () => {
  const user = User.create(userData);
  await user.save();
  const { body } = await request(global.url)
    .post("/")
    .set("Cookie", global.signin(user.user_id))
    .send(mutation.deleteUser());

  expect(body.data.deleteUser).toBeTruthy();
  const res = await User.findOne(user.user_id);
  expect(res).toBeUndefined();
});
