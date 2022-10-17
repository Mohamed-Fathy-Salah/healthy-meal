import express from "express";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { UserResolver } from "./resolvers/user-resolver";
import cookieSession from "cookie-session";
import { AuthResolver } from "./resolvers/auth-resolver";
import FollowResolver from "./resolvers/follow-resolver";

export const createApolloServer = async (port: number | string) => {
  const app = express();

  app.set("trust proxy", 1);

  app.use(cookieSession({ signed: false }));

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [UserResolver, AuthResolver, FollowResolver],
      validate: true,
    }),
    context: ({ req, res }) => ({ req, res }),
  });

  apolloServer.applyMiddleware({ app, cors: false });

  const httpServer = app.listen(port, () => {
    console.log(`server started at http://localhost:${port}/graphql`);
  });

  return { apolloServer, httpServer };
};
