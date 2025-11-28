import { describe, it, expect } from 'bun:test'
import Collection from './collection';
import Database from 'bun:sqlite';
import { Client } from '@libsql/client/.';

const db = new Database()
function queryDB(query: string) {
  return db.query(query).get()
}

describe('collection', () => describe("bun", () => testCollection(db, queryDB)))

export function testCollection(
  connection: Database | Client,
  queryDB: (query: string) => Promise<any> | any
) {
  const col = new Collection(connection, "test")

  it('inserts in a new collection', async () => {
    await col.insert({ test: 1 })
    let result = await queryDB(`SELECT * FROM test`)
    expect(result.test).toBe(1)
  })

  it('alters table with new fields', async () => {
    await col.insert({ field: "success", test: 2 })
    let result: any = await queryDB(`SELECT * FROM test LIMIT 1 OFFSET 1`)
    expect(result.test).toBe(2)
    expect(result.field).toBe("success")
  })

  it('retrieves the models', async () => {
    let result = await col.find()
    expect(result.length).toBe(2)
  })

  it('can search', async () => {
    let result = await col.find({ test: 1 })
    expect(result.length).toBe(1)
  })

  it('can search by id', async () => {
    let result = await col.findById(2)
    expect(result.field).toBe("success")

    result = await col.findById(36)
    expect(result).toBeUndefined()
  })

  it('can search strings with wildcards', async () => {
    let result = await col.find({ field: "%ess" })
    expect(result.length).toBe(1)
  })

  it('supports dates', async () => {
    let date = new Date()
    let inserted = await col.insert({ date })
    let result = await col.find({ id: inserted.id })
    expect(result[0].date).toEqual(date)
  })

  it('supports objects', async () => {
    let object = { hola: "mundo" }
    let inserted = await col.insert({ object })
    expect(inserted.object).toEqual(object)

    let found = await col.findById(inserted.id)
    expect(found.object).toEqual(object)
  })

  it('supports arrays', async () => {
    let list = ["list", "two", "three"]
    let inserted = await col.insert({ list })

    expect(inserted.list).toEqual(list)

    let found = await col.findById(inserted.id)
    expect(found.list).toEqual(list)
  })

  it('supports updates', async () => {
    await col.update(3, { test: 3 })
    let result = await col.findById(3)
    expect(result.test).toBe(3)
  })

  it('returns object on insert', async () => {
    let result = await col.insert({ text: "insert test" })
    expect(result.text).toBe("insert test")
  })

  it('supports null', async() => {
    let result = await col.insert({ newfield: "hola" })

    result = await col.find({ newfield: null, id : result.id })
    expect(result.length).toBe(0)
  })

  it('supports booleans', async () => {
    let result = await col.insert({ success: true })
    result = await col.findById(result)
    expect(result.success).toBe(true)

    await col.update(result.id, { success: false })
    result = await col.findById(result)
    expect(result.success).toBe(false)

    result = await col.find({ success: false })
    expect(result.length).toBe(1)
  })


}
