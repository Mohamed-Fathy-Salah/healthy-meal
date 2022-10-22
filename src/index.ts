import "reflect-metadata";
import { Connection, createConnection, getConnectionOptions } from "typeorm";
import { createApolloServer } from "./server";

let db: Connection;
(async () => {
  const options = await getConnectionOptions(
    process.env.NODE_ENV || "development"
  );
  db = await createConnection({ ...options, name: "default" });

  await createApolloServer(process.env.PORT || 4000);
})();

export { db };
