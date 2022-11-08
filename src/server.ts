import express from "express";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import cookieSession from "cookie-session";
import AuthResolver from "./resolvers/auth-resolver";
import UserResolver from "./resolvers/user-resolver";
import FollowResolver from "./resolvers/follow-resolver";
import MealResolver from "./resolvers/meal-resolver";
import LikeResolver from "./resolvers/like-resolver";
import BookmarkResolver from "./resolvers/bookmark-resolver";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth2";
import { Strategy as FacebookStrategy } from "passport-facebook";
import jwt from "jsonwebtoken";
import User from "./entity/user";
import cors from 'cors';

export const createApolloServer = async (port: number | string) => {
  const app = express();

  app.set("trust proxy", 1);

  app.use(cors());
  app.use(cookieSession({ signed: false }));
  app.use(passport.initialize());
  app.use(passport.session());

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [
        AuthResolver,
        UserResolver,
        FollowResolver,
        MealResolver,
        LikeResolver,
        BookmarkResolver,
      ],
      validate: true,
    }),
    context: ({ req, res }) => ({ req, res }),
  });

  apolloServer.applyMiddleware({ app });

  passport.serializeUser((user, done) => {
    done(null, user);
  });

  const findOrCreate = async (profile: any) => {
    const user = await User.findOne({
      where: { email: profile.emails[0].value },
      select: ["user_id", "name", "email", "photo", "gender"],
    });

    console.log(user);
    if (!user) {
      const userData = {
        email: profile.emails[0].value,
        name: profile.displayName,
        password: profile.id,
        photo: profile.photos[0].value,
        gender: profile.gender,
      };

      if (!userData.photo) delete userData.photo;
      if (!userData.gender) delete userData.gender;

      const { identifiers } = await User.insert(userData);

      delete userData.password;
      return { ...userData, user_id: identifiers[0].user_id };
    }

    return {
      user_id: user.user_id,
      email: user.email,
      name: user.name,
      photo: user.photo,
      gender: user.gender,
    };
  };

  passport.use(
    new GoogleStrategy(
      {
        clientID:
          "566127781877-1gpm82mb9at3lhchr6gr5d7ebcsh06cc.apps.googleusercontent.com",
        clientSecret: "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",
        callbackURL: `http://localhost:${port}/auth/google/callback`,
      },
      async (_, __, profile, cb) => {
        cb(null, await findOrCreate(profile));
      }
    )
  );

  app.get(
    "/auth/google",
    passport.authenticate("google", {
      session: false,
      scope: ["email", "profile"],
    })
  );
  app.get(
    "/auth/google/callback",
    passport.authenticate("google", { session: false }),
    async (req, res) => {
      const user = req.user as User;
      const userJWT = jwt.sign({ id: user.user_id, email: user.email }, "asdf");
      req.session = {
        jwt: userJWT,
      };
      res.send({ user: req.user });
    }
  );

  passport.use(
    new FacebookStrategy(
      {
        clientID: "883510893026660",
        clientSecret: "7498fb055d6b64615f579bf9774e5f8f",
        callbackURL: `http://localhost:${port}/auth/facebook/callback`,
        profileFields: ["id", "displayName", "photos", "email", "gender"],
      },
      async (_, __, profile, cb) => {
        cb(null, await findOrCreate(profile));
      }
    )
  );

  app.get(
    "/auth/facebook",
    passport.authenticate("facebook", {
      session: false,
    })
  );

  app.get(
    "/auth/facebook/callback",
    passport.authenticate("facebook", { session: false }),
    async (req, res) => {
      const user = req.user as User;
      const userJWT = jwt.sign({ id: user.user_id, email: user.email }, "asdf");
      req.session = {
        jwt: userJWT,
      };
      res.send({ user: req.user });
    }
  );

  const httpServer = app.listen(port, () => {
    console.log(`server started at http://localhost:${port}/graphql`);
  });

  return { apolloServer, httpServer };
};
