import { Field } from "../core/field"
import { getFieldName } from "../core/field/serialize"

function resolveColumn(
  key    : string,
  fields : Record<string, Field>
): string {
  const dot = key.indexOf(".")

  if (dot < 0) return fields[key]
    ? `"${getFieldName(key, fields[key])}"`
    : ""

  const alias = key.slice(0, dot)
  const rest  = key.slice(dot + 1)
  const field = fields[alias]

  if (!field?.ref?.fields) return ""

  const nest = resolveColumn(rest, field.ref.fields)
  return nest ? `${alias}.${nest}` : ""
}

export function buildOrderClause(
  order  : Record<string, "asc" | "desc">,
  fields : Record<string, Field>
): string {
  const entries = Object.entries(order)
  if (!entries.length) return ""

  const clauses = entries
    .map(([key, dir]) => {
      const col = resolveColumn(key, fields)
      return col ? `${col} ${dir}` : ""
    })
    .filter(c => c)

  if (!clauses.length) return ""

  return ` ORDER BY ${clauses.join(", ")}`
}
