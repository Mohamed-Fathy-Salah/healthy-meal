// @ts-nocheck - may need to be at the start of file
import { MiddlewareFn } from "type-graphql";
import jwt from "jsonwebtoken";

export const currentUser: MiddlewareFn = async ({ context }, next) => {
  if (context.req.session.jwt) {
    context.user_id = jwt.verify(context.req.session.jwt, "asdf")["id"];
    context.email = jwt.verify(context.req.session.jwt, "asdf")["email"];
    await next();
  }
};
