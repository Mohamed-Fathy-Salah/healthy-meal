import { MiddlewareFn } from "type-graphql";
import jwt from 'jsonwebtoken';

export const currentUser: MiddlewareFn = async ({ context }, next) => {
  try {
    //@ts-ignore
    context.userId = jwt.verify(context.req.session.jwt, "asdf")["id"];
    await next();
  } catch (e) {
    console.info("user not signed in");
  }
};
