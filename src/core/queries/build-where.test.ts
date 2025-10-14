import { describe, expect, it } from "bun:test"

import { Field } from "../field"
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

    it("supports less/greater than number", () => {
      const { sql, args } = buildWhere({
        field: new Field("date")
      }, { field: { $gt: new Date("2025-02-01") } })

      expect(sql).toEqual(`"field::date" > ?`)
      expect(args[0]).toEqual(1738368000000)
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