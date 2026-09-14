import type { TSchema } from "@sinclair/typebox"
import type { Model } from "../../typebox/model"
import type { ConnectionModel } from "../../typebox/connection-model"
import { type SqliteDriver } from "./types"

export type ConnectionModelFactory = <T extends TSchema>(
  connection : Connection,
  definition : Model<T>
) => ConnectionModel<T>

let connectionModelFactory: ConnectionModelFactory | undefined


export function registerConnectionModel(factory: ConnectionModelFactory): void {
  connectionModelFactory = factory
}

export class Connection {
  db     : SqliteDriver
  name?  : string
  models : Map<string, ConnectionModel<any>>
  schemas: TSchema[]

  constructor(
    db    : SqliteDriver,
    name? : string
  ) {
    this.db     = db
    this.name   = name
    this.models = new Map()
    this.schemas = []
  }

  model<T extends TSchema>(
    definition: Model<T>
  ): ConnectionModel<T> {
    const key      = definition.table
    const existing = this.models.get(key) as ConnectionModel<T> | undefined

    if (existing)
      return existing

    if (!connectionModelFactory)
      throw new Error(
        "ConnectionModel is not registered, import `sqlitype/typebox` before calling connection.model(...)"
      )

    const bound = connectionModelFactory<T>(this, definition)
    this.models.set(key, bound)
    this.schemas.push(bound.schema)
    return bound
  }

  async run(
    query: string
  ) {
    if (!this.db) return {}

    if ("query" in this.db)
      return this.db.query(query).run()

    let result = await this.db.execute(query)
    return result.rows
  }

  async execute(
    query  : string,
    params : Array<any> = []
  ): Promise<Array<Record<string, any>>> {
    if ("query" in this.db)
      return this.db.query(query).all(params)

    let result = await this.db.execute({
      sql: query, args: params
    })

    const columns: string[] = result.columns
    return result.rows
      .map(item => columns.reduce<Record<string, any>>((acc, key, index) => {
        acc[key] = item[index]
        return acc
      }, {}))
  }
}