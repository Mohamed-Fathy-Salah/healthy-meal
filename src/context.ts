import server from "apollo-server-core";

export default interface Context extends server.Context {
  user_id: string;
  email: string;
}
