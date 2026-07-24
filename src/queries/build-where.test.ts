import { describe, expect, it } from "bun:test"
import { Type } from "@sinclair/typebox"

import { Field } from "../core/field"
import { Model } from "../typebox"
import { buildWhere } from "./build-where"


describe("queries", () => {
  describe("buildWhere", () => {

    it("supports empty filter", () => {
      const { sql, args } = buildWhere({}, {})
      expect(sql).toBe("")
      expect(args).toBeEmpty()
    })

    it("supports numbers", () => {
      const { sql, args } = buildWhere({
        number: new Field("number")
      }, { number: 2 })

      expect(sql).toEqual(`"number" = ?`)
      expect(args[0]).toEqual(2)
    })

    it("supports less/greater than number", () => {
      const { sql, args } = buildWhere({
        number: new Field("number")
      }, { number: { $lt: 2 } })

      expect(sql).toEqual(`"number" < ?`)
      expect(args[0]).toEqual(2)
    })

    it("supports text", () => {
      const { sql, args } = buildWhere({
        text: new Field("string")
      }, { text: "hola" })

      expect(sql).toEqual(`"text" = ?`)
      expect(args[0]).toEqual("hola")
    })


    it("supports text wildcards", () => {
      const { sql, args } = buildWhere({
        text: new Field("string")
      }, { text: "hola%" })

      expect(sql).toEqual(`"text" LIKE ?`)
      expect(args[0]).toEqual("hola%")
    })

    it("supports NOT LIKE via $ne with wildcard", () => {
      const { sql, args } = buildWhere({
        text: new Field("string")
      }, { text: { $ne: "%hola%" } })

      expect(sql).toEqual(`"text" NOT LIKE ?`)
      expect(args[0]).toEqual("%hola%")
    })

    it("supports $ne with exact string (no wildcard, regular inequality)", () => {
      const { sql, args } = buildWhere({
        text: new Field("string")
      }, { text: { $ne: "hola" } })

      expect(sql).toEqual(`"text" <> ?`)
      expect(args[0]).toEqual("hola")
    })

    it("combines NOT LIKE with other filters", () => {
      const { sql, args } = buildWhere({
        name: new Field("string"),
        age: new Field("number")
      }, { name: { $ne: "%pepa%" }, age: { $gt: 18 } })

      expect(sql).toEqual(`"name" NOT LIKE ? AND "age" > ?`)
      expect(args[0]).toEqual("%pepa%")
      expect(args[1]).toEqual(18)
    })

    it("supports booleans", () => {
      const { sql, args } = buildWhere({
        enabled: new Field("boolean")
      }, { enabled: true })

      expect(sql).toEqual(`"enabled::boolean" = ?`)
      expect(args[0]).toEqual(1)
    })

    it("supports dates", () => {
      const { sql, args } = buildWhere({
        field: new Field("date")
      }, { field: new Date("2025-02-01") })

      expect(sql).toEqual(`"field::date" = ?`)
      expect(args[0]).toEqual(1738368000000)
    })

    it("supports less/greater than date", () => {
      const { sql, args } = buildWhere({
        field: new Field("date")
      }, { field: { $gt: new Date("2025-02-01") } })

      expect(sql).toEqual(`"field::date" > ?`)
      expect(args[0]).toEqual(1738368000000)
    })

    it("supports multiple less/greater than date", () => {
      const { sql, args } = buildWhere({
        field: new Field("date")
      }, { field: { $gt: new Date("2025-02-01"), $lte: new Date("2026-01-01") } })


      expect(sql).toEqual(`"field::date" > ? AND "field::date" <= ?`)
      expect(args[0]).toEqual(1738368000000)
      expect(args[1]).toEqual(new Date("2026-01-01").getTime())
    })

    it("supports IN array of values", () => {
      const { sql, args } = buildWhere({
        field: new Field("number")
      }, { field: { $in: [1, 2, 3] } })

      expect(sql).toEqual(`"field" IN (?,?,?)`)
      expect(args.length).toBe(3)
    })

    it("supports IN array of dates", () => {
      const { sql, args } = buildWhere({
        field: new Field("date")
      }, { field: { $in: [new Date("2025-02-01"), new Date(2)] } })

      expect(sql).toEqual(`"field::date" IN (?,?)`)
      expect(args.length).toBe(2)
      expect(args[0]).toBe(1738368000000)
    })

    it("supports IN with strings", () => {
      const { sql, args } = buildWhere({
        field: new Field("string")
      }, { field: { $in: ["a", "b", "c"] } })

      expect(sql).toEqual(`"field" IN (?,?,?)`)
      expect(args).toEqual(["a", "b", "c"])
    })

    it("supports IN with single value", () => {
      const { sql, args } = buildWhere({
        field: new Field("number")
      }, { field: { $in: [42] } })

      expect(sql).toEqual(`"field" IN (?)`)
      expect(args).toEqual([42])
    })

    it("supports IN with empty array", () => {
      const { sql, args } = buildWhere({
        field: new Field("number")
      }, { field: { $in: [] } })

      expect(sql).toEqual("")
      expect(args).toBeEmpty()
    })

    it("supports IN with booleans", () => {
      const { sql, args } = buildWhere({
        field: new Field("boolean")
      }, { field: { $in: [true, false] } })

      expect(sql).toEqual(`"field::boolean" IN (?,?)`)
      expect(args).toEqual([1, 0])
    })

    it("supports NOT IN", () => {
      const { sql, args } = buildWhere({
        field: new Field("number")
      }, { field: { $nin: [1, 2] } })

      expect(sql).toEqual(`"field" NOT IN (?,?)`)
      expect(args).toEqual([1, 2])
    })

    it("supports NOT IN with strings", () => {
      const { sql, args } = buildWhere({
        field: new Field("string")
      }, { field: { $nin: ["x", "y"] } })

      expect(sql).toEqual(`"field" NOT IN (?,?)`)
      expect(args).toEqual(["x", "y"])
    })

    it("supports null filter", () => {
      const { sql, args } = buildWhere({
        field: new Field("string")
      }, { field: null })

      expect(sql).toEqual(`"field" IS NULL `)
      expect(args).toBeEmpty()
    })

    it("supports table prefix", () => {
      const { sql, args } = buildWhere({
        field: new Field("number")
      }, { field: 1 }, "mytable")

      expect(sql).toEqual(`mytable."field" = ?`)
      expect(args[0]).toEqual(1)
    })

    it("ignores keys not in fields", () => {
      const { sql, args } = buildWhere({
        known: new Field("number")
      }, { known: 1, unknown: 2 })

      expect(sql).toEqual(`"known" = ?`)
      expect(args).toEqual([1])
    })

    it("supports null filter on ref field (IS NULL, no join)", () => {
      const model = new Model(Type.Object({ id: Type.Number() }), { name: "other" })
      const field = new Field("id").reference(model)

      const { sql, args, joins } = buildWhere(
        { reference: field },
        { reference: null }
      )

      expect(sql).toEqual(`"reference" IS NULL `)
      expect(args).toBeEmpty()
      expect(joins).toEqual({})
    })

    it("supports non-null filter on ref field (goes to joins)", () => {
      const model = new Model(Type.Object({ id: Type.Number() }), { name: "other" })
      const field = new Field("id").reference(model)

      const { sql, args, joins } = buildWhere(
        { reference: field },
        { reference: { id: 5 } }
      )

      expect(sql).toEqual("")
      expect(args).toBeEmpty()
      expect(joins).toEqual({ reference: field })
    })

    it("supports $ne filter", () => {
      const { sql, args } = buildWhere(
        { field: new Field("number") },
        { field: { $ne: 5 } }
      )
      expect(sql).toEqual(`"field" <> ?`)
      expect(args).toEqual([5])
    })

    it("supports $ne null filter", () => {
      const { sql, args } = buildWhere(
        { field: new Field("string") },
        { field: { $ne: null } }
      )
      expect(sql).toEqual(`"field" IS NOT NULL `)
      expect(args).toBeEmpty()
    })

    it("supports $ne null filter on ref field (IS NOT NULL, no join)", () => {
      const model = new Model(Type.Object({ id: Type.Number() }), { name: "other" })
      const field = new Field("id").reference(model)

      const { sql, args, joins } = buildWhere(
        { reference: field },
        { reference: { $ne: null } }
      )
      expect(sql).toEqual(`"reference" IS NOT NULL `)
      expect(args).toBeEmpty()
      expect(joins).toEqual({})
    })

    it("supports multiple filters", () => {
      const { sql, args } = buildWhere({
        field: new Field("date"),
        number: new Field("number"),
        text: new Field("string")
      }, {
        field: new Date("2025-02-01"),
        number: 2,
        text: "%hola"
      })

      expect(sql).toEqual(`"field::date" = ? AND "number" = ? AND "text" LIKE ?`)
      expect(args).toContain(1738368000000)
      expect(args).toContain(2)
      expect(args).toContain("%hola")
    })
  })
})