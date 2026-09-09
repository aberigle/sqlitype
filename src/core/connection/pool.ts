import { Connection } from "./connection"
import { SqliteDriver } from "./types"

const byDb     = new WeakMap<object, Connection>()
const byName   = new Map<string, Connection>()
let defaultConn: Connection | undefined
let resolver   : ((key: string) => Connection) | undefined

export function connection(
  db: SqliteDriver,
  opts?: { name?: string }
): Connection
export function connection(
  db: undefined,
  opts?: { name?: string }
): undefined
export function connection(
  db?: SqliteDriver,
  { name }: { name?: string } = {}
): Connection | undefined {
  if (!db) return undefined

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
  input: string | SqliteDriver
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