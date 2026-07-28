import { Collection, Field } from "../core"
import { buildJoinQuery } from "../queries/build-join-query"
import { buildOrderClause } from "../queries/build-order"
import { isEmpty } from "../utils/objects"
import { Static, TSchema, Type } from "@sinclair/typebox"
import { Value } from "@sinclair/typebox/value"
import { parseSchema } from "./transform/schema"
import { ValidationException } from "./validation-exception"
import { FindOptions, FindFilter } from "../core/types"


const cache   : Record<string, Model<TSchema>> = {}
let client    : any
const schemas : TSchema[] = []
export class Model<T extends TSchema> extends Collection {

  static reload(db?) {
    client = db
    for (const model of Object.values(cache)) {
      model.fields = {}
      if (db) model.setDb(db)
    }
  }

  constructor(
    public schema: T,
    { db = client, name }: { db?: any, name?: string } = {}
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
    return Value.Clean(this.schema, Value.Convert(this.schema, { ...value }))
  }

  async findAndJoin(
    filter  : FindFilter<Static<T>>  = {},
    options : FindOptions<Static<T>> = {}
  ) {
    await this.ensure()

    const {
      select,
      from,
      where,
      params
    } = await buildJoinQuery(
      this.fields, this.table, filter
    )

    let queryOptions = buildOrderClause(options.order || {})
    if (options.limit) queryOptions += ` LIMIT ${options.limit} `
    if (options.offset) queryOptions += ` OFFSET ${options.offset} `

    return this.sql(
      `${select} ${from}${where}${queryOptions}`,
      params
    )
  }

  async count(
    filter: FindFilter<Static<T>> = {}
  ): Promise<number> {
    await this.ensure()

    const {
      from,
      where,
      params
    } = await buildJoinQuery(
      this.fields, this.table, filter
    )

    const [row] = await this.execute(
      `SELECT count(*) as count ${from}${where}`,
      params
    )
    return Number(row.count)
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
    search: FindFilter<Static<T>> = {},
    options: FindOptions<Static<T>> = {}
  ): Promise<Array<Static<T>>> {
    const result = await super.find(search, options)
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