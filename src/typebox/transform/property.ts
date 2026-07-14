import { TObject, TSchema, TUnion } from "@sinclair/typebox";
import { Model } from "../model";
import { Field } from "src/core";

const Kind = Symbol.for("TypeBox.Kind")
const Optional = Symbol.for("TypeBox.Optional")

function parseUnionProperty(
  field : TUnion,
  references : Model<TSchema>[] = []
) : Field {

  if (field.anyOf.length < 1) throw new Error("Empty Union is not supported")

  // add support for dates as string or number
  const date: TSchema | undefined = field.anyOf.find(({ type }) => type == "Date")
  if (date !== undefined) return parseProperty(date)

  // look for anything other than a literal
  const notLiteral: TSchema | undefined = field.anyOf
  .find((unionField) => Kind in unionField && unionField[Kind] !== "Literal")
  // all elements are Literal
  if (!notLiteral) return parseProperty(field.anyOf[0])

  throw new Error("Type not supported: Union")
}

export function parseObjectProperty(
  field      : TObject,
  references : Model<TSchema>[] = [],
  options: { required: boolean }
): Field {
  if (!field.$id?.includes("ref")) return new Field("object", options.required)

  const name = field.$id.split("@").pop()
  const model = references.find(({ schema: { $id } }) => $id == name)
  if (model) return new Field("id", options.required).reference(model)

  throw new Error(`${model} model not found!`)
}

export function parseProperty(
  field : TSchema,
  references: Model<TSchema>[] = []
) : Field {

  let options = {
    required: !(Optional in field)
  }

  switch (field.type) {
    case 'string': return new Field("string", options.required)
    case 'number'  :
    case 'integer' : return new Field("number", options.required)
    case 'boolean' : return new Field("boolean", options.required)
    case 'Date'    : return new Field("date", options.required)
    case 'object'  : return parseObjectProperty(<TObject>field, references, options)
    case 'array'   : return new Field("array", options.required)
  }

  const symbol = Kind in field ? field[Kind] : ''

  switch(symbol) {
    case 'Any'   : return new Field("object", options.required)
    case 'Union' : return parseUnionProperty(<TUnion>field, references)
  }

  throw new Error("Type not supported: " + (field.type || symbol))
}