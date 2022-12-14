import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BaseEntity,
  ManyToOne,
  JoinColumn,
  OneToMany,
  CreateDateColumn,
} from "typeorm";
import { Field, Int, ObjectType } from "type-graphql";
import User from "./user";
import MealIngredients from "./meal-ingredients";
import MealTags from "./meal-tags";
import Like from "./like";
import Bookmark from "./bookmark";

@ObjectType()
@Entity()
export default class Meal extends BaseEntity {
  @Field()
  @PrimaryGeneratedColumn("uuid")
  meal_id: string;

  @Field()
  @Column("text")
  name: string;

  @Field()
  @Column("text")
  description: string;

  @Field()
  @Column("text")
  type: string;

  @Field()
  @Column("text")
  photo: string;

  @Field()
  @Column("int")
  calories: number;

  @Field()
  @Column("int")
  fat: number;

  @Field()
  @Column("int")
  protein: number;

  @Field()
  @Column("int")
  carb: number;

  @Field()
  @Column("int")
  prep_time: number;

  @Column("uuid", { select: false })
  user_id: string;

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.meals, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: User;

  @Field()
  @Column("text")
  steps: string;

  @Field()
  @Column("text", { default: "pending" })
  status: string;

  @Field(() => [MealIngredients])
  @OneToMany(() => MealIngredients, (mealIngredients) => mealIngredients.meal)
  mealIngredients: MealIngredients[];

  @Field(() => [MealTags])
  @OneToMany(() => MealTags, (mealTags) => mealTags.meal, { eager: true })
  tags: MealTags[];

  @Field(() => Int)
  @Column("int", { default: 0 })
  likesCount: number;

  @Field(() => [Like])
  @OneToMany(() => Like, (like) => like.meal)
  likes: Like[];

  @Field(() => [Bookmark])
  @OneToMany(() => Bookmark, (bookmark) => bookmark.meal)
  bookmarks: Bookmark[];

  @Field(() => Date)
  @CreateDateColumn()
  createdDate: Date;
}
