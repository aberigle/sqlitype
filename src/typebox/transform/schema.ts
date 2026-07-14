import { Field } from "src/core"
import { TSchema } from "@sinclair/typebox"
import { Model } from "../model"
import { parseProperty } from "./property"

export function parseSchema(
  object: TSchema,
  references: Model<TSchema>[] = []
) {
  const schema: Record<string, Field> = {}

  for (const key in object.properties) {
    if (key === "id") continue
    const property = object.properties[key]
    const field = parseProperty(property, references)

    // if ("default" in property) field.default = property.default

    // if (getters && getters[key]) field.get = getters[key]
    // if (setters && setters[key]) field.set = setters[key]

    schema[key] = field
  }

  return schema
}
