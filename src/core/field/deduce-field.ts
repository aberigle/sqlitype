import Field from "./field"
import { FieldType, TypeMap } from "./types"


/**
 * Deduces the type for a given value.
 * Returns a {Field} instance
 *
 * @param {any} value - the stored value
 */
export function deduceFieldType(
  value: any
): Field {
  let type: string = typeof value

  if (type === 'object')
    type = value.constructor.name.toLowerCase()

  if (type in TypeMap === false) throw new Error(`Unsupported type for ${value}!`)

  return new Field(type as FieldType)
}

/**
 * Given an object, deduces the type for all the fields.
 * Returns a representation of the models' fields
 *
 * @param {object} model - the model
 */
export function deduceFields(
  model: any
): Record<string, Field> {

  return Object.keys(model)
    .filter(name => model[name] !== undefined)
    .reduce((
      result,
      name
    ) => {
      result[name] = deduceFieldType(model[name])
      return result
    }, {} as any)
}