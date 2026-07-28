import { describe, expect, it } from "bun:test"
import { buildOrderClause } from "./build-order"
import { Field } from "../core/field"

describe("queries", () => {
  describe("buildOrderClause", () => {

    it("returns empty string for empty order", () => {
      expect(buildOrderClause({}, {})).toBe("")
    })

    it("builds single column ascending", () => {
      const fields = { name: new Field("string") }
      expect(buildOrderClause({ name: "asc" }, fields))
        .toBe(` ORDER BY "name" asc`)
    })

    it("builds single column descending", () => {
      const fields = { name: new Field("string") }
      expect(buildOrderClause({ name: "desc" }, fields))
        .toBe(` ORDER BY "name" desc`)
    })

    it("builds order with alias prefix", () => {
      const refFields = { name: new Field("string") }
      const fields = { parent: new Field("id") }
      fields.parent.ref = { fields: refFields } as any
      expect(buildOrderClause({ "parent.name": "desc" }, fields))
        .toBe(` ORDER BY parent."name" desc`)
    })

    it("builds mixed alias and non-alias columns", () => {
      const refFields = { date: new Field("date") }
      const fields = { id: new Field("number"), parent: new Field("id") }
      fields.parent.ref = { fields: refFields } as any
      expect(buildOrderClause({ id: "asc", "parent.date": "desc" }, fields))
        .toBe(` ORDER BY "id" asc, parent."date::date" desc`)
    })

    it("handles multiple alias columns", () => {
      const refA = { name: new Field("string") }
      const refB = { date: new Field("date") }
      const fields = { one: new Field("id"), two: new Field("id") }
      fields.one.ref = { fields: refA } as any
      fields.two.ref = { fields: refB } as any
      expect(buildOrderClause({ "one.name": "asc", "two.date": "desc" }, fields))
        .toBe(` ORDER BY one."name" asc, two."date::date" desc`)
    })

    it("handles multiple non-alias columns", () => {
      const fields = { a: new Field("string"), b: new Field("string"), c: new Field("string") }
      expect(buildOrderClause({ a: "asc", b: "desc", c: "asc" }, fields))
        .toBe(` ORDER BY "a" asc, "b" desc, "c" asc`)
    })

    it("handles alias with underscore in field name", () => {
      const refFields = { value: new Field("string") }
      const fields = { related_item: new Field("id") }
      fields.related_item.ref = { fields: refFields } as any
      expect(buildOrderClause({ "related_item.value": "asc" }, fields))
        .toBe(` ORDER BY related_item."value" asc`)
    })

    // field resolution tests

    it("resolves date column via fields", () => {
      const fields = { created: new Field("date") }
      expect(buildOrderClause({ created: "asc" }, fields))
        .toBe(` ORDER BY "created::date" asc`)
    })

    it("resolves boolean column via fields", () => {
      const fields = { active: new Field("boolean") }
      expect(buildOrderClause({ active: "desc" }, fields))
        .toBe(` ORDER BY "active::boolean" desc`)
    })

    it("resolves string column via fields (no suffix)", () => {
      const fields = { name: new Field("string") }
      expect(buildOrderClause({ name: "asc" }, fields))
        .toBe(` ORDER BY "name" asc`)
    })

    it("resolves array column via fields", () => {
      const fields = { tags: new Field("array") }
      expect(buildOrderClause({ tags: "asc" }, fields))
        .toBe(` ORDER BY "tags::array" asc`)
    })

    it("resolves object column via fields", () => {
      const fields = { meta: new Field("object") }
      expect(buildOrderClause({ meta: "desc" }, fields))
        .toBe(` ORDER BY "meta::object" desc`)
    })

    it("resolves aliased column via ref fields", () => {
      const refFields = { name: new Field("string"), date: new Field("date") }
      const fields = { one: new Field("id") }
      fields.one.ref = { fields: refFields } as any
      expect(buildOrderClause({ "one.name": "asc", "one.date": "desc" }, fields))
        .toBe(` ORDER BY one."name" asc, one."date::date" desc`)
    })

    // unknown field exclusion tests

    it("excludes unknown nested fields", () => {
      const refFields = { name: new Field("string") }
      const fields = { one: new Field("id") }
      fields.one.ref = { fields: refFields } as any
      expect(buildOrderClause({ "one.unknown": "asc" }, fields)).toBe("")
    })

    it("excludes unknown top-level fields", () => {
      const fields = { name: new Field("string") }
      expect(buildOrderClause({ unknown: "asc" }, fields)).toBe("")
    })

    it("excludes all entries when none match fields", () => {
      expect(buildOrderClause({ a: "asc", b: "desc" }, {})).toBe("")
    })

  })
})
