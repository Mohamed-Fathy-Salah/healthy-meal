import { createApolloServer } from "../server";
import { ApolloServer } from "apollo-server-express";
import { Connection, createConnection, getConnectionOptions } from "typeorm";
import jwt from 'jsonwebtoken';

declare global {
  var url: string;
  var signin: (id?: string) => string[];
}

let server: ApolloServer, db: Connection;

beforeAll(async () => {
  const options = await getConnectionOptions("testing");
  db = await createConnection({ ...options, name: "default" });

  const port = 3000;
  server = await createApolloServer(port);
  global.url = `http://localhost:${port}/graphql`;
});

afterEach(async () => {
  const tables: [] = await db.query(
    "select name from sqlite_master where type='table'"
  );

  tables.forEach(async ({ name }) => {
    await db.query(`DELETE FROM ${name};`);
  });
});

afterAll(async () => {
  await server?.stop();
  db.close();
});

global.signin = (id?: string) => {
    const payload = {id: id || "79b97f3d-009b-4ce2-b3e1-4debedf7ea4a"};
    const token = jwt.sign(payload, "asdf");
    const session = {jwt: token};
    const sessionJSON = JSON.stringify(session);
    const base64 = Buffer.from(sessionJSON).toString('base64');
    return [`session=${base64}`]
}
