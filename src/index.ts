import "reflect-metadata";
import { createApolloServer } from "./server";
import { createConnection, getConnectionOptions } from "typeorm";

(async () => {
  const options = await getConnectionOptions(
    process.env.NODE_ENV || "development"
  );
  await createConnection({ ...options, name: "default" });

  await createApolloServer(process.env.PORT || 5000);
})();
