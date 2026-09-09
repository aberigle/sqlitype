export class Connection {
  db     : any
  name?  : string
  models :  Map<string, unknown>

  constructor(
    db: any,
    name?: string
  ) {
    this.db = db
    this.name = name
    this.models = new Map()
  }

  async run(
    query: string
  ) {
    if (!this.db) return {}

    if (this.db.query) return this.db.query(query).run()

    let result = await this.db.execute(query)
    return result.rows
  }

  async execute(
    query: string,
    params: Array<any> = []
  ): Promise<Array<Record<string, any>>> {
    if (this.db.query) return this.db.query(query).all(params)

    let result = await this.db.execute({
      sql: query, args: params
    })

    const columns: string[] = result.columns
    return result.rows
      .map(item => columns.reduce((result, key, index) => {
        result[key] = item[index]
        return result
      }, {}))
  }
}

const byDb     = new WeakMap<object, Connection>()
const byName   = new Map<string, Connection>()
let defaultConn: Connection | undefined
let resolver   : ((key: string) => Connection) | undefined

export function connection(
  db: object,
  { name }: { name?: string } = {}
): Connection {
  let conn = byDb.get(db)
  if (!conn) {
    conn = new Connection(db, name)
    byDb.set(db, conn)
  }

  if (name) {
    if (!conn.name) conn.name = name
    byName.set(name, conn)
  }

  return conn
}

export function connectionByName(
  name: string
): Connection | undefined {
  return byName.get(name)
}

export function resolveConnection(
  fn: ((key: string) => Connection) | undefined
): void {
  resolver = fn
}

export function resolveConnectionKey(
  key: string
): Connection {
  const existing = byName.get(key)
  if (existing) return existing

  if (resolver) {
    const conn = resolver(key)
    byName.set(key, conn)
    return conn
  }

  throw new Error("UnknownConnection")
}

export function setDefaultConnection(
  input: string | object
): Connection {
  defaultConn = typeof input === "string"
    ? resolveConnectionKey(input)
    : connection(input)
  return defaultConn
}

export function getDefaultConnection(): Connection | undefined {
  return defaultConn
}

export function resetPool(): void {
  byName.clear()
  defaultConn = undefined
  resolver = undefined
}
