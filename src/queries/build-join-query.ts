import { Field } from "../core/field"
import { isEmpty } from "../utils/objects"
import { buildWhere } from "./build-where"
import { Model } from "src/typebox"

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

    for (const field of Object.keys(fields)) {
      if (fields[field].type != "id") continue

      const isRequired = fields[field].required

      const model = fields[field].ref as Model<never>
      await model.ensure()

      const {
        sql,
        args,
        joins
      } = buildWhere(model.fields, filter[field], field )

      from += `${isRequired ? 'INNER' : 'LEFT'} JOIN ${model.table} AS ${field} ON ${field}.id = ${table}.${field} `

      if (sql.length)  where.push(sql)
      if (args.length) params.push(...args)

      // handle nested properties
      const nested: string[] = []
      if (!isEmpty(joins)) {
        const prop = await processJoins(
          joins,
          field,
          filter[field],
          true
        )
        nested.push(...prop)
      }

      if (isNested) result.push(...[
        `'${field}'`,// the field name
        model.toJSON_OBJECT({ nested, alias: field }) // the field value as json
      ])
      else select += `, ${model.toJSON_OBJECT({ nested, alias: field })} as '${field}' `
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
