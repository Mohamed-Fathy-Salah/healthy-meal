import request from "supertest";

const query = {
  getUsers: {
    query: `query {
            getUsers{
                user_id,
                name,
                email
            }
        }`,
  },
};

const mutation = {
  signup: {
    query: `mutation {
            signup(user: {name: "name", email: "test@test.com", password: "password"})
        }`,
  },
};

it("getUsers is empty", async () => {
  const res = await request("http://localhost:3000/graphql")
    .post("/")
    .send(query.getUsers);

  expect(res.error).toBeFalsy();
  expect(res.body.data.getUsers).toHaveLength(0);
});

it("signup success", async () => {
  const res = await request("http://localhost:3000/graphql")
    .post("/")
    .send(mutation.signup);

  console.log(res.error);
  console.log(res.body.data);
  expect(res.error).toBeFalsy();
  expect(res.body.data.signup).toBeDefined();
});
