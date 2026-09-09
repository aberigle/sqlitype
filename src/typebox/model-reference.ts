import { type TSchema, Type } from "@sinclair/typebox";
import { Model } from "./model";

export function ModelReference<T extends TSchema>(
  model: Model<T>
) {
  const object = model.schema
  return Type.Partial(object, {
    $id: "ref@" + model.table
  })
}