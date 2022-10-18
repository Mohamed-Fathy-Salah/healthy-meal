import server from "apollo-server-core";
import User from "./entity/user";

export default interface Context extends server.Context {
    user: User
}
