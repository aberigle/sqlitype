import { beforeEach, describe, expect, it } from "bun:test";

import { Connection } from "./connection";
import { connection, resetPool } from "./pool";
import type { SqliteDriver } from "./types";

function fakeDb() {
  return { tag: Math.random().toString(36) } as unknown as SqliteDriver
}

describe("connection", () => {
  beforeEach(() => {
    resetPool()
  })

  it("creates a Connection bound to the driver", () => {
    const db = fakeDb()
    const conn = new Connection(db, "main")
    expect(conn.db).toBe(db)
    expect(conn.name).toBe("main")
    expect(conn.models).toEqual(new Map())
  })

  it("is the same Connection for the same db via the pool", () => {
    const db = fakeDb()
    expect(connection(db)).toBe(connection(db))
  })

  it("is different for different drivers", () => {
    expect(connection(fakeDb())).not.toBe(connection(fakeDb()))
  })
})

describe("connection registry isolation", () => {
  beforeEach(() => {
    resetPool()
  })

  it("isolates the model registry per connection", () => {
    const a = connection(fakeDb())
    const b = connection(fakeDb())

    a.models.set("Users", { _tag: "A" })
    b.models.set("Users", { _tag: "B" })

    expect(a.models.get("Users")).toEqual({ _tag: "A" })
    expect(b.models.get("Users")).toEqual({ _tag: "B" })
  })

  it("deduplicates: one connection + one definition = one model entry", () => {
    const conn = connection(fakeDb())

    conn.models.set("Users", { _tag: "v1" })
    conn.models.set("Users", { _tag: "v1" })

    expect(conn.models.get("Users")).toEqual({ _tag: "v1" })
    expect(conn.models.size).toBe(1)
    expect(conn.models.size).not.toBe(2)
  })
})