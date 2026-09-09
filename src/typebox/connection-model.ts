import { Collection } from "../core"
import type { Field } from "../core"
import type { Connection } from "../core/connection"
import type { FindFilter, FindOptions } from "../core/types"
import { buildJoinQuery } from "../queries/build-join-query"
import { buildOrderClause } from "../queries/build-order"
import { isEmpty } from "../utils/objects"
import type { Static, TSchema } from "@sinclair/typebox"
import type { Model } from "./model"
import { parseSchema } from "./transform/schema"

export class ConnectionModel<T extends TSchema> extends Collection {
  schema: T

  constructor(
    connection: Connection,
    public definition: Model<T>,
  ) {
    super(connection.db, definition.name)
    this.connection = connection
    this.schema = definition.schema
  }

  async ensure(): Promise<Record<string, Field>> {
    if (!isEmpty(this.fields)) return this.fields

    const references = Array.from(this.connection.models.values())
    const parsed = parseSchema(this.schema, references)
    return this.fields = await super.ensure(parsed)
  }

  validate(
    model: Static<T>,
    partial = false
  ) {
    return this.definition.validate(model, partial)
  }

  cast(value: any): Static<T> {
    return this.definition.cast(value)
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

    let queryOptions = buildOrderClause(options.order || {}, this.fields)
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