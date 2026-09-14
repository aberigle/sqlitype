import { Field } from "../../core"
import type { TSchema } from "@sinclair/typebox"
import { parseProperty } from "./property"
import type { RefSchema } from "./property"

export function parseSchema(
  object     : TSchema,
  references : RefSchema[] = []
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
