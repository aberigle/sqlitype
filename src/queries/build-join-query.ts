import { Field, type RefModel } from "../core/field"
import { isEmpty } from "../utils/objects"
import { buildWhere } from "./build-where"

export async function buildJoinQuery(
  fields : Record<string, Field>,
  table  : string,
  filter : Record<string, any>,
) {
  let select : string   = `SELECT ${table}.*`
  let from   : string   = `FROM ${table} `
  let where  : string[] = []
  let params : any[]    = []

  const {
    sql,
    args,
    joins
  } = buildWhere(fields, filter, table)

  if (args.length) params.push(...args)
  if (sql.length)  where.push(sql)

  async function processJoins(
    fields   : Record<string, Field>,
    table    : string,
    filter   : Record<string, any>,
    isNested : boolean = false
  ): Promise<string[]> {
    const result: string[] = []

    for (const key of Object.keys(fields)) {
      const field = fields[key]

      if (!field) continue

      if (field.type != "id") continue

      const isRequired = field.required

      const model = field.ref as RefModel
      await model.ensure()

      const {
        sql,
        args,
        joins
      } = buildWhere(model.fields, filter[key], key )

      from += `${isRequired ? 'INNER' : 'LEFT'} JOIN ${model.table} AS ${key} ON ${key}.id = ${table}.${key} `

      if (sql.length)  where.push(sql)
      if (args.length) params.push(...args)

      // handle nested properties
      const nested: string[] = []
      if (!isEmpty(joins)) {
        const prop = await processJoins(
          joins,
          key,
          filter[key],
          true
        )
        nested.push(...prop)
      }

      if (isNested) result.push(...[
        `'${key}'`,// the field name
        model.toJSON_OBJECT({ nested, alias: key }) // the field value as json
      ])
      else select += `, ${model.toJSON_OBJECT({ nested, alias: key })} as '${key}' `
    }

    return result
  }

  await processJoins(joins, table, filter)

  where = where.filter(q => q)

  return {
    select,
    from,
    where : where.length ? `WHERE ${where.join(" AND ")}` : '',
    params
  }
}
