// @ts-nocheck - may need to be at the start of file
import { MiddlewareFn } from "type-graphql";
import jwt from "jsonwebtoken";
import User from "../entity/user";

export const currentUser: MiddlewareFn = async ({ context }, next) => {
  try {
    const user_id = jwt.verify(context.req.session.jwt, "asdf")["id"];
    context.user = await User.findOne(user_id, {
      select: [
        "user_id",
        "name",
        "email",
        "date_of_birth",
        "gender",
        "weight",
        "height",
        "photo",
      ],
    });
    if (!context.user) return;
    await next();
  } catch (e) {
    console.info("user not signed in");
  }
};
