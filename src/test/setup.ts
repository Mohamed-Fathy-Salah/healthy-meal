import { createApolloServer } from "../server";
import { ApolloServer } from "apollo-server-express";
import { Connection, createConnection, getConnectionOptions } from "typeorm";

declare global {
  var url: string;
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
    await db.query(`DELETE FROM ${name}`);
  });
});

afterAll(async () => {
  await server?.stop();
  db.close();
});
