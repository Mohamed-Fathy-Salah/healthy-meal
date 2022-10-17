import server from "apollo-server-core";

export default interface Context extends server.Context {
  userId: string;
}
