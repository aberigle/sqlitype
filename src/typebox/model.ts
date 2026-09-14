import type { Static, TSchema } from "@sinclair/typebox"
import type { Connection } from "../core/connection"
import { getDefaultConnection, resolveConnectionKey } from "../core/connection"
import type { FindFilter, FindOptions } from "../core/types"
import { ConnectionModel } from "./connection-model"
import { registerModelDefinition } from "./definitions"

export class Model<T extends TSchema> {
  schema : T
  table  : string

  constructor(
    schema: T,
    { name }: { name?: string } = {}
  ) {
    if (schema.$id === undefined) {
      if (name == undefined) throw new Error(`name or $id are mandatory`)
      schema.$id = name
    }

    this.schema = schema
    this.table = schema.$id
    registerModelDefinition(schema.$id, this)
  }

  using(connection: string | Connection): ConnectionModel<T> {
    const conn = typeof connection === "string"
      ? resolveConnectionKey(connection)
      : connection
    return ConnectionModel.bound(conn, this)
  }

  private bound(): ConnectionModel<T> {
    const conn = getDefaultConnection()
    if (!conn) throw new Error("no default connection; call useClient(db | name) or Model.using(...)")
    return this.using(conn)
  }

  validate(
    model: Static<T>,
    partial = false
  ) {
    return this.bound().validate(model, partial)
  }

  cast(value: any): Static<T> {
    return this.bound().cast(value)
  }

  ensure() {
    return this.bound().ensure()
  }

  async find(
    search: FindFilter<Static<T>> = {},
    options: FindOptions<Static<T>> = {}
  ): Promise<Array<Static<T>>> {
    return this.bound().find(search, options)
  }

  async findById(query: any): Promise<Static<T>> {
    return this.bound().findById(query)
  }

  async insert(
    model: Omit<Static<T>, "id">
  ): Promise<Static<T>> {
    return this.bound().insert(model)
  }

  async update(
    id: any,
    model: Partial<Static<T>>
  ): Promise<Static<T>> {
    return this.bound().update(id, model)
  }

  async count(
    filter: FindFilter<Static<T>> = {}
  ): Promise<number> {
    return this.bound().count(filter)
  }

  async sql(
    query: string,
    params: Array<any> = []
  ): Promise<Array<Static<T>>> {
    return this.bound().sql(query, params)
  }

  async findAndJoin(
    filter  : FindFilter<Static<T>>  = {},
    options : FindOptions<Static<T>> = {}
  ) {
    return this.bound().findAndJoin(filter, options)
  }

  async execute(
    query: string,
    params: Array<any> = []
  ) {
    return this.bound().execute(query, params)
  }
}
