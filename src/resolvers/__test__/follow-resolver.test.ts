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
    return { query: `query{ getFollowing{ name, email }}` };
  },
  getFollowers: () => {
    return { query: `query{ getFollowers{ name, email }}` };
  },
};
const mutation = {
  follow: (email: string) => {
    return {
      query: "mutation follow($email: String!){follow(email: $email)}",
      variables: { email },
    };
  },
  unfollow: (email: string) => {
    return {
      query: "mutation unfollow($email: String!){unfollow(email: $email)}",
      variables: { email },
    };
  },
};

it("follow with out login", async () => {
  await User.insert({ ...userData });

  const res = await request(global.url)
    .post("/")
    .send(mutation.follow(userData.email));

  expect(res.body.errors).toBeDefined();
});

it("follow non existing user or self follow", async () => {
  const userId = (await User.insert({ ...userData })).identifiers[0].user_id;

  let res = await request(global.url)
    .post("/")
    .set("Cookie", global.signin(userId))
    .send(mutation.follow("blah@blah.com"));

  expect(res.body.data.follow).toBeFalsy();

  res = await request(global.url)
    .post("/")
    .set("Cookie", global.signin(userId))
    .send(mutation.follow(userData.email));

  expect(res.body.data.follow).toBeFalsy();
});

it("follow new user", async () => {
  const user1 = (await User.insert({ ...userData })).identifiers[0].user_id;
  await User.insert({ ...userData, email: "test1@test.com" });

  const res = await request(global.url)
    .post("/")
    .set("Cookie", global.signin(user1))
    .send(mutation.follow("test1@test.com"));

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
        .send(mutation.follow(`test${j}@test.com`));

      expect(res.body.data.follow).toBeTruthy();
    }

    const res = await request(global.url)
      .post("/")
      .set("Cookie", global.signin(arr[i]))
      .send(query.getFollowing());

    const following = res.body.data.getFollowing;
    expect(following).toHaveLength(i);
    for (let j = 0; j < following.length; j++)
      expect(following[j].email).toBe(`test${j}@test.com`);
  }

  for (let i = 0; i < N; i++) {
    const res = await request(global.url)
      .post("/")
      .set("Cookie", global.signin(arr[i]))
      .send(query.getFollowers());

    expect(res.error).toBeFalsy();
    const followers = res.body.data.getFollowers;
    expect(followers).toHaveLength(N - i - 1);

    const emails = followers.map((v:{email: string}) => v.email);
    expect(new Set(emails).size).toEqual(N - i - 1);
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
    .send(mutation.unfollow(userData.email));

  expect(res.body.data.unfollow).toBeTruthy();
});
