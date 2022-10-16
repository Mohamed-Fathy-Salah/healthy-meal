import User from "../../entity/user";
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
  const res = await request(global.url).post("/").send(query.getUsers);

  expect(res.error).toBeFalsy();
  expect(res.body.data.getUsers).toHaveLength(0);
});

it("signup success", async () => {
  const res = await request(global.url).post("/").send(mutation.signup);

  expect(res.error).toBeFalsy();
  expect(res.body.data.signup).toBeDefined();
});

it("follow new user", async () => {
  const user1 = (
    await User.insert({
      name: "name1",
      email: "email1@test.com",
      password: "123456",
    })
  ).identifiers[0].user_id;

  const user2 = (
    await User.insert({
      name: "name2",
      email: "email2@test.com",
      password: "123456",
    })
  ).identifiers[0].user_id;

  const follow = `mutation{follow(user_id: "${user2}")}`;

  const res = await request(global.url)
    .post("/")
    .set('Cookie', global.signin(user1))
    .send({ query: follow });

  expect(res.error).toBeFalsy();
  expect(res.body.data.follow).toBeTruthy();
});

//it("get number of following users", async () => {
//const N = 5;
//const arr = [];
//for (let i = 0; i < N; i++) {
//const user = await User.insert({
//name: `name${i}`,
//email: `test${i}@test.com`,
//password: "123456",
//});
//arr.push(user.identifiers[0].user_id);
//for(let j = 0;j < i;j++) {
//const res = await request(global.url).post("/").set('Cookie', global.signin()).send({});
//expect(res.error).toBeFalsy();
//expect(res.body.data.follow).toBeTruthy();
//}
//}
//});

//it("get number of followers", async () => {
//const res = await request(global.url).post("/").send(query.getUsers);

//expect(res.error).toBeFalsy();
//expect(res.body.data.getUsers).toHaveLength(0);
//};
