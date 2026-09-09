import { SqliteDriver } from "./types";

export class Connection {
  db     : SqliteDriver
  name?  : string
  models : Map<string, unknown>

  constructor(
    db    : SqliteDriver,
    name? : string
  ) {
    this.db     = db
    this.name   = name
    this.models = new Map()
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
    query: string,
    params: Array<any> = []
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