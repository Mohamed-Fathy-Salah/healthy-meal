import {
  Query,
  Resolver,
  Arg,
  Mutation,
  Ctx,
  UseMiddleware,
} from "type-graphql";
import User from "../entity/user";
import Context from "../context";
import { currentUser } from "../middlewares/current-user";
import { UserData } from "./types/user/user-data";

@Resolver()
export default class UserResolver {
  @Query(() => [User])
  async getUsers() {
    return await User.find();
  }

  @Query(() => User)
  async getUser(@Arg("email", () => String) email: string) {
    return await User.findOne({ email });
  }

  @Mutation(() => Boolean)
  @UseMiddleware(currentUser)
  async updateUser(
    @Arg("user", () => UserData) userData: UserData,
    @Ctx() { user }: Context
  ) {
    const { affected } = await User.update(user, userData);
    return affected! > 0;
  }

  @Mutation(() => Boolean)
  @UseMiddleware(currentUser)
  async deleteUser(@Ctx() { user }: Context) {
    const { affected } = await User.delete(user);
    return affected! > 0;
  }
}
