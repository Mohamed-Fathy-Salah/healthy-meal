import { Query, Resolver, Arg, Mutation, InputType, Field } from "type-graphql";
import { User } from "../entity/User";

@InputType()
class UserInput{
    @Field()
    name: string

    @Field()
    email: string

    @Field()
    password: string
}

@Resolver()
export class UserResolver {
  @Query(() => User)
  async getUser(@Arg("id", () => String) id: string) {
      return await User.findOne(id);
  }

  @Query(() => [User])
  async getUsers() {
      return await User.find();
  }

  @Mutation(() => String)
  async createUser(@Arg("user", () => UserInput)user: UserInput) {
      const createdUser = User.create(user); 
      await createdUser.save();
      return createdUser.user_id;
  }
}
