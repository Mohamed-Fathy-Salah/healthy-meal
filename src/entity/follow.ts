import {
  Entity,
  PrimaryColumn,
  BaseEntity,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import User from "./user";

@Entity()
export default class Follow extends BaseEntity {
  @PrimaryColumn("uuid")
  user_id: string;
  @PrimaryColumn("uuid")
  follower_id: string;

  @ManyToOne(() => User, (user) => user.user_id)
  @JoinColumn({ name: "user_id" })
  user: User;

  @ManyToOne(() => User, (user) => user.user_id)
  @JoinColumn({ name: "user_id" })
  follower: User;
}
