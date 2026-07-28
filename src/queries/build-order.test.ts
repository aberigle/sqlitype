import { describe, expect, it } from "bun:test"
import { buildOrderClause } from "./build-order"

describe("queries", () => {
  describe("buildOrderClause", () => {

    it("returns empty string for empty order", () => {
      expect(buildOrderClause({})).toBe("")
    })

    it("builds single column ascending", () => {
      expect(buildOrderClause({ name: "asc" }))
        .toBe(` ORDER BY "name" asc`)
    })

    it("builds single column descending", () => {
      expect(buildOrderClause({ name: "desc" }))
        .toBe(` ORDER BY "name" desc`)
    })

    it("builds order with alias prefix", () => {
      expect(buildOrderClause({ "parent.name": "desc" }))
        .toBe(` ORDER BY parent."name" desc`)
    })

    it("builds mixed alias and non-alias columns", () => {
      expect(buildOrderClause({ id: "asc", "parent.date": "desc" }))
        .toBe(` ORDER BY "id" asc, parent."date" desc`)
    })

    it("handles multiple alias columns", () => {
      expect(buildOrderClause({ "one.name": "asc", "two.date": "desc" }))
        .toBe(` ORDER BY one."name" asc, two."date" desc`)
    })

    it("handles multiple non-alias columns", () => {
      expect(buildOrderClause({ a: "asc", b: "desc", c: "asc" }))
        .toBe(` ORDER BY "a" asc, "b" desc, "c" asc`)
    })

    it("handles alias with underscore in field name", () => {
      expect(buildOrderClause({ "related_item.value": "asc" }))
        .toBe(` ORDER BY related_item."value" asc`)
    })

  })
})
