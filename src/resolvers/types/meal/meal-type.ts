import { registerEnumType } from "type-graphql";

export enum MealType {
  breakfast = "breakfast",
  launch = "launch",
  dinner = "dinner",
  snack = "snack",
}

registerEnumType(MealType, { name: "MealType" });
