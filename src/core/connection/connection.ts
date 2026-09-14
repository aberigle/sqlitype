import { Collection } from "../collection"
import { type SqliteDriver } from "./types"

export class Connection {
  db          : SqliteDriver
  name?       : string
  collections : Map<string, Collection>

  constructor(
    db    : SqliteDriver,
    name? : string
  ) {
    this.db          = db
    this.name        = name
    this.collections = new Map()
  }

  collection(table: string): Collection {
    const existing = this.collections.get(table)
    if (existing) return existing

    const created = new Collection(this, table)
    this.collections.set(table, created)
    return created
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
