import { Field } from "@/core";
import { TSchema, TUnion } from "@sinclair/typebox";

function parseUnionProperty(
  field : TUnion
) : Field {

  // add support for dates as string or number
  const date: TSchema | undefined = field.anyOf.find(({ type }) => type == "Date")
  if (date !== undefined) return parseProperty(date)

  throw new Error("Type not supported: Union")
}


export function parseProperty(
  field : TSchema
) : Field {
  // TODO
  let options = {
    notNull: true
  }

  switch (field.type) {
    case 'string'  : return new Field("string")
    case 'number'  :
    case 'integer' : return new Field("number")
    case 'boolean' : return new Field("boolean")
    case 'Date'    : return new Field("date")
    case 'object'  : return new Field("object")
    case 'array'   : return new Field("array")
  }

  const key    = Symbol.for("TypeBox.Kind")
  const symbol = key in field? field[key] : ''

  switch(symbol) {
    // case 'Ref'   : return {
    //   ...def,
    //   type : Schema.Types.ObjectId,
    //   ref  : field.$ref
    // }
    case 'Any'   : return new Field("object")
    case 'Union' : return parseUnionProperty(field as TUnion)
    // case 'Union' :
    //   let ref = field.anyOf.find((item: TSchema) => key in item && item[key] === 'Ref')
    //   if (ref) return parseProperty(ref)
    //   return {
    //     ...def,
    //     type : String,
    //     enum : field.anyOf.map(value => value.const)
    //   }
  }

  throw new Error("Type not supported: " + (field.type || symbol))
}