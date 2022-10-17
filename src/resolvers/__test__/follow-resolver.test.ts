import User from "../../entity/user";
import request from "supertest";
import Follow from "../../entity/follow";

const userData = {
  name: "name",
  email: "test@test.com",
  password: "123456",
};
const query = {
  getFollowing: () => {
    return { query: `query{ getFollowing{ user_id }}` };
  },
  getFollowers: () => {
    return { query: `query{ getFollowers{ user_id }}` };
  },
};
const mutation = {
  follow: (id: string) => {
    return {
      query: "mutation follow($user_id: String!){follow(user_id: $user_id)}",
      variables: { user_id: id },
    };
  },
  unfollow: (id: string) => {
    return {
      query:
        "mutation unfollow($user_id: String!){unfollow(user_id: $user_id)}",
      variables: { user_id: id },
    };
  },
};

it("follow with out login", async () => {
  const user = (await User.insert({ ...userData })).identifiers[0].user_id;

  const res = await request(global.url).post("/").send(mutation.follow(user));

  expect(res.body.errors).toBeDefined();
});

it("follow non existing user or self follow", async () => {
  const userId = (await User.insert({ ...userData })).identifiers[0].user_id;

  let res = await request(global.url)
    .post("/")
    .set("Cookie", global.signin(userId))
    .send(mutation.follow("asdfsdf"));

  expect(res.body.errors).toBeDefined();

  res = await request(global.url)
    .post("/")
    .set("Cookie", global.signin(userId))
    .send(mutation.follow(userId));

  expect(res.body.data.follow).toBeFalsy();
});

it("follow new user", async () => {
  const user1 = (await User.insert({ ...userData })).identifiers[0].user_id;
  const user2 = (await User.insert({ ...userData, email: "test1@test.com" }))
    .identifiers[0].user_id;

  const res = await request(global.url)
    .post("/")
    .set("Cookie", global.signin(user1))
    .send(mutation.follow(user2));

  expect(res.body.data.follow).toBeTruthy();
});

it("get number of following users and followers", async () => {
  const N = 5;
  const arr = [];
  for (let i = 0; i < N; i++) {
    arr.push(
      (await User.insert({ ...userData, email: `test${i}@test.com` }))
        .identifiers[0].user_id
    );
    for (let j = 0; j < i; j++) {
      const res = await request(global.url)
        .post("/")
        .set("Cookie", global.signin(arr[i]))
        .send(mutation.follow(arr[j]));
      expect(res.error).toBeFalsy();
      expect(res.body.data.follow).toBeTruthy();
    }

    const res = await request(global.url)
      .post("/")
      .set("Cookie", global.signin(arr[i]))
      .send(query.getFollowing());

    expect(res.error).toBeFalsy();
    expect(res.body.data.getFollowing).toHaveLength(i);
  }

  for (let i = 0; i < N; i++) {
    const res = await request(global.url)
      .post("/")
      .set("Cookie", global.signin(arr[i]))
      .send(query.getFollowers());

    expect(res.error).toBeFalsy();
    expect(res.body.data.getFollowers).toHaveLength(N - i - 1);
  }
});

it("unfollow without login", async () => {
  const res = await request(global.url)
    .post("/")
    .send(mutation.unfollow("adfadsf"));

  expect(res.body.errors).toBeDefined();
});

it("unfollow success", async () => {
  const user1 = (await User.insert({ ...userData })).identifiers[0].user_id;
  const user2 = (await User.insert({ ...userData, email: "test2@test.com" }))
    .identifiers[0].user_id;

  await Follow.insert({ user_id: user1, follower_id: user2 });

  const res = await request(global.url)
    .post("/")
    .set("Cookie", global.signin(user2))
    .send(mutation.unfollow(user1));

  expect(res.body.data.unfollow).toBeTruthy();
});
