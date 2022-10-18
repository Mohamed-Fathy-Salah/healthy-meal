import {
  Entity,
  PrimaryColumn,
  BaseEntity,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import User from "./user";
import { Field, ObjectType } from "type-graphql";

@ObjectType()
@Entity()
export default class Follow extends BaseEntity {
  @PrimaryColumn("uuid")
  user_id: string;
  @PrimaryColumn("uuid")
  follower_id: string;

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.user_id, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "user_id" })
  user: User;

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.user_id, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "user_id" })
  follower: User;
}
