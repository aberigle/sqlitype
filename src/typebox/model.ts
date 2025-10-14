import { Collection, Field } from "@/core";
import { buildWhere } from "@/core/queries/build-where";
import { isEmpty } from "@/utils/objects";
import { Static, TSchema, Type, Unknown } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";
import { parseSchema } from "./transform/schema";
import { ValidationException } from "./validation-exception";

const cache: Record<string, Model<TSchema>> = {}
const schemas: TSchema[] = []
export class Model<T extends TSchema> extends Collection {

  static reload(db?) {
    for (const model of Object.values(cache)) {
      model.fields = {}
      if (db) model.setDb(db)
    }
  }

  constructor(
    public schema: T,
    { db, name }: { db?: any, name?: string } = {}
  ) {
    if (schema.$id === undefined) {
      if (name == undefined) throw new Error(`name or $id are mandatory`)
      schema.$id = name
    }

    super(db, schema.$id)

    cache[schema.$id] = this
    schemas.push(this.schema)
  }

  async ensure(): Promise<Record<string, Field>> {
    if (!isEmpty(this.fields)) return this.fields

    const parsed = parseSchema(this.schema, Object.values(cache))
    return this.fields = await super.ensure(parsed)
  }

  validate(
    model: Static<T>,
    partial = false
  ) {
    if (Value.Check(this.schema, model)) return true

    const errors = [
      ...Value.Errors(
        partial
          ? Type.Partial(this.schema)
          : this.schema,
        schemas,
        model)
    ]
      .filter(({ path }) => path !== "/id")

    if (errors.length) throw new ValidationException(errors)
  }

  cast(value: any): Static<T> {
    return Value.Clean(this.schema, { ...value })
  }

  async findAndJoin(
    filter: Partial<Static<T>> = {}
  ) {
    await this.ensure()
    let select : string[] = [`SELECT ${this.table}.*`]
    let from   : string   = `FROM ${this.table} `
    let where  : string[] = []
    let params : any[]    = []

    const {
      sql,
      args,
      joins
    } = buildWhere(this.fields, filter, this.table)

    params.push(...args)
    where.push(sql)

    async function processJoins(
      fields   : Record<string, Field>,
      table    : string,
      filter   : Record<string, any>,
      isNested : boolean = false
    ) {
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
        } = buildWhere(model.fields, filter[field], model.table)

        from += `${isRequired ? 'INNER' : 'LEFT'} JOIN ${model.table} AS ${field} ON ${field}.id = ${table}.${field} `

        if (sql.length)  where.push(sql)
        if (args.length) params.push(...args)

        // handle nested properties
        const nested : string[] = []
        if (!isEmpty(joins)) {
          const prop = await processJoins(
            joins,
            model.table,
            filter[field],
            true
          )
          nested.push(...prop)
        }

        if (isNested) result.push(...[
            `'${field}'`,// the field name
            model.toJSON_OBJECT({ nested, alias : field }) // the field value as json
          ])
        else select.push(
          model.toJSON_OBJECT({ nested, alias : field }) + ` as '${field}' `
        )
      }

      return result
    }

    await processJoins(joins, this.table, filter)

    where = where.filter(q => q)

    return this.sql(
      select.join(", ") +
      from +
      (where.length ? `WHERE ${where.join(" AND ")}` : ''),
      params
    )
  }

  async sql(
    query: string,
    params: Array<any> = []
  ): Promise<Array<Static<T>>> {
    await this.ensure()
    const result: Array<any> = await this.execute(query, params)
    return result
    .map(item => this.cast(this.transform(item)))
  }

  async insert(
    model: Omit<Static<T>, "id">
  ): Promise<Static<T>> {
    this.validate(model)
    const result = await super.insert(model)
    return this.cast(result)
  }

  async find(
    search: FindQuery<Static<T>> = {}
  ): Promise<Array<Static<T>>> {
    const result = await super.find(search)
    return result.map(item => this.cast(item))
  }

  async findById(query: any): Promise<Static<T>> {
    const result = await super.findById(query)
    if (!result) return undefined

    return this.cast(result)
  }

  async update(
    id: any,
    model: Partial<Static<T>>
  ): Promise<Static<T>> {
    this.validate(model, true)
    const result = await super.update(id, model)
    return this.cast(result)
  }
}