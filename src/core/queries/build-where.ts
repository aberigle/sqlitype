import { ensureArray } from "../../utils/ensure-array";
import { Field } from "../field";
import { getFieldName } from "../field/serialize";

function getActionFromValue(value: any) {
  if (value.$lt)   return { action: "<",  value: value.$lt }
  if (value.$lte)  return { action: "<=", value: value.$lte }
  if (value.$gte)  return { action: ">=", value: value.$gte }
  if (value.$gt)   return { action: ">",  value: value.$gt }

  // only add if there are items in the list
  if (value.$in)  return value.$in.length  ? { action : "IN",     value: value.$in }  : null
  if (value.$nin) return value.$nin.length ? { action : "NOT IN", value: value.$nin } : null


  return { action: "=", value }
}

function reduceActionsFromValue(value: any) {
  if (value === null)
    return [{ action: "IS NULL", value: null }]

  if (
    typeof value == 'string' && value.includes("%")
  ) return [{ action: "LIKE", value }]

  if (
    typeof value !== 'object' ||
    value?.getTime // Date
  ) return [{ action: "=", value }]

  return Object.keys(value)
    .map((key: string) => getActionFromValue({ [key]: value[key] }))
    .filter(item => item !== null)

}

function addValue(
  field: Field, value: any | null
) {
  if (value === null)        return null
  if (!Array.isArray(value)) return field.cast(value)

  return value.map(current => field.cast(current))
}

function printPlaceholders(
  value: string | string[] | null
) {
  if (value === null)        return ''
  if (!Array.isArray(value)) return '?'

  return `(${value.map(_ => '?').join(',')})`
}

export function buildWhere(
  fields : Record<string, Field>,
  filter : Record<string, any>,
  table  : string = ""
): {
  sql: string, args: any[], joins: Record<string, Field>
} {
  const keys = Object.keys(filter)

  if (!keys.length) return { sql: '', args: [], joins: {} }

  const values     : any[]                 = []
  const conditions : string[]              = []
  const joins      : Record<string, Field> = {}

  for (const name of keys) if (fields[name]) {
    const field = fields[name]

    if (
      field.type === "id" &&
      filter[name] !== null && // support for is null on references
      field.ref?.table
    ) {
      joins[name] = field
      continue
    }

    const actions = reduceActionsFromValue(filter[name])

    for (const { action, value } of actions) {
      const valuesToAdd = addValue(field, value)
      values.push(...ensureArray(valuesToAdd).filter(v => v !== null))

      conditions.push(
        `${table ? table + "." : ''}` +
        `"${getFieldName(name, field)}"` +
        ` ${action}` +
        ` ${printPlaceholders(valuesToAdd)}`
      )
    }

  }

  return {
    sql: `${conditions.join(" AND ")}`,
    args: values,
    joins
  }
}