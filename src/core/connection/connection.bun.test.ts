import { describe, expect, it } from "bun:test";
import Database from "bun:sqlite";
import type { Client } from "@libsql/client";
import { connection } from "./pool";

const db = new Database();

describe("connection (bun)", () => describe("bun", () => testConnection(db)));

export function testConnection(
  connectionDriver: Database | Client
) {
  it("returns the same Connection for the same driver by identity", () => {
    expect(connection(connectionDriver)).toBe(connection(connectionDriver))
  })

  it("isolates the model registry per connection", () => {
    const a = connection(connectionDriver)
    const b = connection(connectionDriver)

    expect(a.models).toBe(b.models) // misma Connection => mismo registry
  })

  it("runs DDL with run and reads rows with execute", async () => {
    const conn = connection(connectionDriver)
    await conn.run(`CREATE TABLE IF NOT EXISTS test_execute (id INTEGER PRIMARY KEY, name TEXT)`)

    await conn.execute(`INSERT INTO test_execute (name) VALUES (?)`, ["Ana"])

    const rows = await conn.execute(`SELECT * FROM test_execute`)
    expect(rows.length).toBe(1)
    expect(rows[0].name).toBe("Ana")
  })

  it("binds positional params in execute", async () => {
    const conn = connection(connectionDriver)
    await conn.run(`CREATE TABLE IF NOT EXISTS test_params (id INTEGER PRIMARY KEY, name TEXT, age REAL)`)
    await conn.execute(`INSERT INTO test_params (name, age) VALUES (?, ?)`, ["Luis", 30])

    const rows = await conn.execute(`SELECT * FROM test_params WHERE name = ?`, ["Luis"])
    expect(rows[0].age).toBe(30)
  })
}
