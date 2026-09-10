import { describe, it, expect } from "bun:test"
import { deduceFields, deduceFieldType } from "./deduce-field"
import Field from "./field"

describe('field', () => {
  describe("deduceFielType", () => {
    it("numbers", () => {
      const field: Field = deduceFieldType(1)
      expect(field.type).toBe("number")
    })

    it("strings", () => {
      let field = deduceFieldType("text")
      expect(field.type).toBe("string")
    })

    it("dates", () => {
      let field = deduceFieldType(new Date)
      expect(field.type).toBe("date")
    })

    it("booleans", () => {
      let field = deduceFieldType(false)
      expect(field.type).toBe("boolean")
    })

    it("objects", () => {
      let field = deduceFieldType({ hola: "mundo" })
      expect(field.type).toBe("object")
    })

    it("arrays", () => {
      let field = deduceFieldType(["test"])
      expect(field.type).toBe("array")
    })
  })


  describe("deduceFields", () => {
    it("numbers", () => {
      let field = deduceFields({ number: 1 })
      expect("number" in field).toBeTruthy()
      expect(field.number!.type).toBe("number")
    })

    it("strings", () => {
      let field = deduceFields({ string: "hola" })
      expect("string" in field).toBeTruthy()
      expect(field.string!.type).toBe("string")
    })

    it("booleans", () => {
      let field = deduceFields({ boolean: true })
      expect("boolean" in field).toBeTruthy()
      expect(field.boolean!.type).toBe("boolean")
    })

    it("dates", () => {
      let field = deduceFields({ date: new Date })
      expect("date" in field).toBeTruthy()
      expect(field.date!.type).toBe("date")
    })

    it("objects", () => {
      let field = deduceFields({ object: { hola: 1 } })
      expect("object" in field).toBeTruthy()
      expect(field.object!.type).toBe("object")
    })

    it("arrays", () => {
      let field = deduceFields({ array: [1, 2, 3] })
      expect("array" in field).toBeTruthy()
      expect(field.array!.type).toBe("array")
    })
  })
})