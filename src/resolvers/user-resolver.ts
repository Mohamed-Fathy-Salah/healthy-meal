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
import { UserData } from "./types/user";

@Resolver()
export class UserResolver {
  @Query(() => [User])
  async getUsers() {
    return await User.find();
  }

  @Query(() => User)
  async getUser(@Arg("id", () => String) id: string) {
    return await User.findOne(id);
  }

  @Mutation(() => Boolean)
  @UseMiddleware(currentUser)
  async updateUser(
    @Arg("user", () => UserData) userData: UserData,
    @Ctx() { userId }: Context
  ) {
    const { affected } = await User.update(userId, userData);
    return affected! > 0;
  }

  @Mutation(() => Boolean)
  @UseMiddleware(currentUser)
  async deleteUser(@Ctx() { userId }: Context) {
    const { affected } = await User.delete(userId);
    return affected! > 0;
  }
}
