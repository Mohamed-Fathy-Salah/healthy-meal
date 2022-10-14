import express from "express";
import session from "express-session";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { UserResolver } from "./resolvers/user-resolver";

export const createApolloServer = async (port: number | string) => {
  const app = express();
  app.set("trust proxy", 1);

  app.use(
    session({
      secret: "asdf",
      resave: true,
      saveUninitialized: true,
      cookie: { secure: false, maxAge: 1000 * 60 * 60 * 24 },
    })
  );
  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [UserResolver],
      validate: true,
    }),
    context: ({ req, res }) => ({ req, res }),
  });

  apolloServer.applyMiddleware({ app, cors: false });

  app.listen(port, () => {
    console.log(`server started at http://localhost:${port}/graphql`);
  });

  return apolloServer;
};
