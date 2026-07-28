export function buildOrderClause(
  order: Record<string, "asc" | "desc">
): string {

  const entries = Object.entries(order)
  if (!entries.length) return ""

  const clauses = entries
    .map(([key, dir]) => {
      const dot = key.lastIndexOf(".")
      if (dot !== -1) {
        const alias  = key.slice(0, dot)
        const column = key.slice(dot + 1)
        return `${alias}."${column}" ${dir}`
      }

      return `"${key}" ${dir}`
    })

  return ` ORDER BY ${clauses.join(", ")}`
}
