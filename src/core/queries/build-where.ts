import { Field } from "../field";
import { getFieldName } from "../field/serialize";

function getActionFromValue(value: any) {
  if (
    typeof value == 'string' && value.includes("%")
  ) return { action: "LIKE", value }

  if (
    typeof value !== 'object' ||
    value?.getTime // Date
  ) return { action: "=", value }

  if (value.$lt)  return { action: "<",  value: value.$lt }
  if (value.$lte) return { action: "<=", value: value.$lte }
  if (value.$gte) return { action: ">=", value: value.$gte }
  if (value.$gt)  return { action : ">", value: value.$gt }
}

export function buildWhere(
  fields: Record<string, Field>,
  filter: Record<string, any>,
  table: string = ""
): {
  sql: string, args: any[], joins: Record<string, Field>
} {
  const keys = Object.keys(filter)

  if (!keys.length) return { sql: '', args: [], joins: {} }

  const values: any[] = []
  const conditions: string[] = []
  const joins: Record<string, Field> = {}

  for (const name of keys) if (fields[name]) {
    const field = fields[name]
    if (field.type === "id" && field.ref?.table) {
      joins[name] = field
      continue
    }

    const { action, value } = getActionFromValue(filter[name])

    values.push(field.cast(value))
    conditions.push(`${table ? table + "." : ''}"${getFieldName(name, field)}" ${action} ?`)
  }

  return {
    sql: `${conditions.join(" AND ")}`,
    args: values,
    joins
  }
}