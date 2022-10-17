import { Entity, PrimaryGeneratedColumn, Column, BaseEntity } from "typeorm";
import { Field, ObjectType } from "type-graphql";

@ObjectType()
@Entity()
export default class User extends BaseEntity {
  @Field()
  @PrimaryGeneratedColumn("uuid")
  user_id: string;

  @Field()
  //todo: varchar(20)
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
  //todo: char
  @Column("text", { nullable: true })
  gender: string;

  @Field()
  //todo: numeric(4,1)
  @Column({ nullable: true })
  weight: number;

  @Field()
  //todo: numeric(4,1)
  @Column({ nullable: true })
  height: number;

  @Field()
  @Column("text", {
    default:
      "https://upload.wikimedia.org/wikipedia/commons/7/72/Default-welcomer.png?20180610185859",
  })
  photo: string;
}
