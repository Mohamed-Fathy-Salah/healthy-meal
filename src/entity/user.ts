import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BaseEntity,
  OneToMany,
} from "typeorm";
import { Field, ObjectType } from "type-graphql";
import Follow from "./follow";
import Meal from "./meal";

@ObjectType()
@Entity()
export default class User extends BaseEntity {
  @Field()
  @PrimaryGeneratedColumn("uuid")
  user_id: string;

  @Field()
  @Column("text")
  name: string;

  @Field()
  @Column("text", { unique: true })
  email: string;

  @Column("text")
  password: string;

  @Field()
  @Column("date", { nullable: true })
  date_of_birth: string;

  @Field()
  @Column("text", { nullable: true })
  gender: string;

  @Field()
  @Column({ nullable: true })
  weight: number;

  @Field()
  @Column({ nullable: true })
  height: number;

  @Field()
  @Column("text", {
    default:
      "https://upload.wikimedia.org/wikipedia/commons/7/72/Default-welcomer.png?20180610185859",
  })
  photo: string;

  @Field(() => [Follow])
  @OneToMany(() => Follow, (follow) => follow.follower)
  following: Follow[];

  @Field(() => [Follow])
  @OneToMany(() => Follow, (follow) => follow.user)
  followers: Follow[];

  @Field(() => [Meal])
  @OneToMany(() => Meal, (meal) => meal.user)
  meals: Meal[];
}
