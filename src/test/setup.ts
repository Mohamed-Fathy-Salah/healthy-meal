import { createApolloServer } from "../server";
import { ApolloServer } from "apollo-server-express";
import { Connection, createConnection, getConnectionOptions } from "typeorm";

let server: ApolloServer, db: Connection;

beforeAll(async () => {
  const options = await getConnectionOptions("testing");
  db = await createConnection({ ...options, name: "default" });

  server = await createApolloServer(3000);
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
