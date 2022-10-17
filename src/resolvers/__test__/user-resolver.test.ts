import request from "supertest";
import User from "../../entity/user";

const query = {
  getUsers: {
    query: `query { getUsers{ user_id, name, email } }`,
  },
};

it("getUsers", async () => {
  const N = 5;
  for (let i = 0; i < N; i++)
    await User.insert({ email: `test${i}@test.com`, password: "123345" });

  const res = await request(global.url).post("/").send(query.getUsers);

  expect(res.error).toBeFalsy();
  expect(res.body.data.getUsers).toHaveLength(N);
});

it.todo("get user with id success");
it.todo("get user that does not exist");

it.todo("update user that does not exist");
it.todo("update user with out login");
it.todo("update user with valid data");
it.todo("update user with unvalid data");

it.todo("delete user that does not exist")
it.todo("delete user without login")
it.todo("delete user")
