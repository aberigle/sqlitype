import { beforeEach, describe, expect, it } from "bun:test";

import type { Collection } from "../collection";
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
    expect(conn.collections).toEqual(new Map())
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

  it("isolates the collection registry per connection", () => {
    const a = connection(fakeDb())
    const b = connection(fakeDb())

    a.collections.set("Users", { _tag: "A" } as unknown as Collection)
    b.collections.set("Users", { _tag: "B" } as unknown as Collection)

    expect(a.collections.get("Users")).toEqual({ _tag: "A" } as unknown as Collection)
    expect(b.collections.get("Users")).toEqual({ _tag: "B" } as unknown as Collection)
  })

  it("deduplicates: one connection + one table = one collection entry", () => {
    const conn = connection(fakeDb())

    expect(conn.collection("Users")).toBe(conn.collection("Users"))
    expect(conn.collections.size).toBe(1)
    expect(conn.collections.size).not.toBe(2)
  })
})
