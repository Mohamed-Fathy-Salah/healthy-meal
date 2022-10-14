import "reflect-metadata";
import { createConnection, getConnectionOptions } from "typeorm";
import { createApolloServer } from "./server";

(async () => {
  const options = await getConnectionOptions(
    process.env.NODE_ENV || "development"
  );
  await createConnection({ ...options, name: "default" });

  await createApolloServer(process.env.PORT || 4000);
})();
