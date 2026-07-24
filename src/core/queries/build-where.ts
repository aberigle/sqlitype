import { ensureArray } from "../../utils/ensure-array";
import { Field } from "../field";
import { getFieldName } from "../field/serialize";
import { FindOperators } from "../types";

function getActionFromFindOperator(value: any) {
  if (value.$lt)   return { action: "<",  value: value.$lt }
  if (value.$lte)  return { action: "<=", value: value.$lte }
  if (value.$gte)  return { action: ">=", value: value.$gte }
  if (value.$gt)   return { action: ">",  value: value.$gt }

  // only add if there are items in the list
  if (value.$in)  return value.$in.length  ? { action : "IN",     value: value.$in }  : null
  if (value.$nin) return value.$nin.length ? { action : "NOT IN", value: value.$nin } : null

  if ( // there isn't not equal in the value, return simple equality
    "$ne" in value !== true
  ) return { action: "=", value }

  // NOT EQUAL
  const target = value.$ne
  if ( // target is not equal to null (IS NOT NULL)
    target === null
  ) return { action: "IS NOT NULL", value: null }

  if ( // is a wildcard
    typeof target === "string" && target.includes("%")
  ) return { action : "NOT LIKE", value : target}

  // simple inequality
  return { action: "<>", value: target }
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
    .map((key: string) => getActionFromFindOperator({ [key]: value[key] }))
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

function shouldJoinReference<T>(
  field: Field, value: T | FindOperators<T>
) {
  if ( // this is not a reference or it doesn't have table
    field.type !== "id" ||
    !field.ref?.table
  ) return false

  if ( // the value is null we filter without join (IS NULL)
    value === null
  ) return false

  if ( // the value is not null the same
    typeof value === "object" &&
    "$ne" in value &&
    value.$ne === null
  ) return false

  // if not is a join
  return true
}

export function buildWhere(
  fields : Record<string, Field>,
  filter : Record<string, any>,
  alias  : string = ""
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
      shouldJoinReference(field, filter[name])
    ) {
      joins[name] = field
      continue
    }

    const actions = reduceActionsFromValue(filter[name])

    for (const { action, value } of actions) {
      const valuesToAdd = addValue(field, value)
      values.push(...ensureArray(valuesToAdd).filter(v => v !== null))

      conditions.push(
        `${alias ? alias + "." : ''}` +
        `"${getFieldName(name, field)}"` +
        ` ${action}` +
        ` ${printPlaceholders(valuesToAdd)}`
      )
    }

  }

  return {
    sql  : `${conditions.join(" AND ")}`,
    args : values,
    joins
  }
}