import { describe, expect, it, beforeEach } from "bun:test";

import {
  connection,
  connectionByName,
  resolveConnection,
  resolveConnectionKey,
  setDefaultConnection,
  getDefaultConnection,
  resetPool,
} from "./pool";

function fakeDb() {
  return { tag: Math.random().toString(36) }
}

describe("connection pool", () => {
  beforeEach(() => {
    resetPool()
  })

  it("returns the same Connection for the same db object", () => {
    const db = fakeDb()
    expect(connection(db)).toBe(connection(db))
  })

  it("returns different Connections for different db objects", () => {
    expect(connection(fakeDb())).not.toBe(connection(fakeDb()))
  })

  it("registers an alias by name that is recoverable", () => {
    const db = fakeDb()
    connection(db, { name: "main" })
    expect(connectionByName("main")).toBe(connection(db))
  })

  it("keeps the same Connection when given a name afterwards", () => {
    const db = fakeDb()
    const a = connection(db)
    const b = connection(db, { name: "todo" })
    expect(a).toBe(b)
    expect(connectionByName("todo")).toBe(a)
  })

  it("resolveConnectionKey hits the explicit registry first", () => {
    const db = fakeDb()
    connection(db, { name: "main" })
    const called = { n: 0 }
    resolveConnection(() => { called.n++; return connection(fakeDb(), { name: "main" }) })

    expect(resolveConnectionKey("main")).toBe(connectionByName("main"))
    expect(called.n).toBe(0) // el registry gana, el hook NO se llama
  })

  it("calls resolveConnection only for unknown keys", () => {
    const seen: string[] = []
    resolveConnection((key) => {
      seen.push(key)
      return connection(fakeDb(), { name: key })
    })

    expect(resolveConnectionKey("tenant:a")).toBe(connectionByName("tenant:a"))
    expect(seen).toEqual(["tenant:a"])
  })

  it("throws UnknownConnection when there is no registry and no resolver", () => {
    expect(() => resolveConnectionKey("ghost")).toThrow("UnknownConnection")
  })

  it("resolveConnection is a single hook: registering overrides the previous one", () => {
    const a = fakeDb()
    resolveConnection(() => connection(a, { name: "x" }))
    resolveConnection(() => connection(fakeDb(), { name: "x" }))

    expect(resolveConnectionKey("x")).toBe(connectionByName("x"))
    expect(connectionByName("x")).not.toBe(connection(a))
  })

  it("setDefaultConnection persists until changed, without losing the pool", () => {
    const db = fakeDb()
    const conn = setDefaultConnection(db)
    expect(getDefaultConnection()).toBe(conn)

    // el pool sigue intacto tras fijar el default
    connection(db, { name: "kept" })
    expect(connectionByName("kept")).toBe(conn)
  })
})