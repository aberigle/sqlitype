import { describe, expect, it } from 'bun:test'
import { Type } from '@sinclair/typebox'
import { parseProperty } from './property'
import { fromTypebox } from '..'
import { ModelReference } from '../model-reference'


describe('typebox properties',() => {
  describe("parses", () => {
    it("Type.Number", () => {
      const field = parseProperty(Type.Number())
      expect(field.type).toBe("number")
    })

    it("Type.String", () => {
      const field = parseProperty(Type.String())
      expect(field.type).toBe("string")
    })

    it("Type.Date", () => {
      const field = parseProperty(Type.Date())
      expect(field.type).toBe("date")
    })

    it("Type.Boolean", () => {
      const field = parseProperty(Type.Boolean())
      expect(field.type).toBe("boolean")
    })

    it("Type.Object", () => {
      const field = parseProperty(Type.Object({}))
      expect(field.type).toBe("object")
    })

    it("Type.Any", () => {
      const field = parseProperty(Type.Any())
      expect(field.type).toBe("object")
    })

    it("Type.Array", () => {
      const field = parseProperty(Type.Array(Type.Object({})))
      expect(field.type).toBe("array")
    })

    it("Type.Optional", () => {
      const field = parseProperty(Type.Optional(Type.String()))
      expect(field.required).toBe(false)
    })

    it("Type.Union for dates (date, isostring or timestamp, but a date)", () => {
      const field = parseProperty(Type.Union([Type.Date(), Type.String(), Type.Number()]))
      expect(field.type).toBe("date")
    })

    it("Type.Union for literals", () => {
      const field = parseProperty(Type.Union([Type.Literal("one"), Type.Literal("two")]))
      expect(field.type).toBe("string")
    })

    it("Type.Union for relations", () => {
      const ref   = fromTypebox(Type.Object({ test: Type.String() }, { $id: "RefTest" }))
      const field = parseProperty(ModelReference(ref), [ref])

      expect(field.type).toBe("id")
    })

    it("Type.Optional(Union) for literals", () => {
      const field = parseProperty(
        Type.Optional(Type.Union([Type.Literal("one"), Type.Literal("two")]))
      )
      expect(field.type).toBe("string")
      expect(field.required).toBe(false)
    })

    it("Type.Optional(Union) for dates", () => {
      const field = parseProperty(
        Type.Optional(Type.Union([Type.Date(), Type.String(), Type.Number()]))
      )
      expect(field.required).toBe(false)
    })
  })

})