import User from "../../entity/user";
import request from "supertest";

const query = {
  getUsers: {
    query: `query { getUsers{ user_id, name, email } }`,
  },
};

it("getUsers is empty", async () => {
  const res = await request(global.url).post("/").send(query.getUsers);

  expect(res.error).toBeFalsy();
  expect(res.body.data.getUsers).toHaveLength(0);
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
    .set("Cookie", global.signin(user1))
    .send({ query: follow });

  expect(res.error).toBeFalsy();
  expect(res.body.data.follow).toBeTruthy();
});

it("get number of following users and followers", async () => {
  const N = 5;
  const arr = [];
  for (let i = 0; i < N; i++) {
    arr.push(
      (
        await User.insert({
          name: `name${i}`,
          email: `test${i}@test.com`,
          password: "123456",
        })
      ).identifiers[0].user_id
    );
    for (let j = 0; j < i; j++) {
      const res = await request(global.url)
        .post("/")
        .set("Cookie", global.signin(arr[i]))
        .send({ query: `mutation{follow(user_id: "${arr[j]}")}` });
      expect(res.error).toBeFalsy();
      expect(res.body.data.follow).toBeTruthy();
    }

    const res = await request(global.url)
      .post("/")
      .set("Cookie", global.signin(arr[i]))
      .send({ query: `query{ getFollowing{ user_id }}` });

    expect(res.error).toBeFalsy();
    expect(res.body.data.getFollowing).toHaveLength(i);
  }

  for (let i = 0; i < N; i++) {
    const res = await request(global.url)
      .post("/")
      .set("Cookie", global.signin(arr[i]))
      .send({ query: "query{ getFollowers{ user_id }}" });

    expect(res.error).toBeFalsy();
    expect(res.body.data.getFollowers).toHaveLength(N - i - 1);
  }
});
