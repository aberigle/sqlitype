import { describe, expect, it } from "bun:test"
import {
  arrayField,
  booleanField,
  dateField,
  numberField,
  objectField,
  stringField
} from "./__test__/data"
import { parseFieldFromDb, parseFieldListFromDb } from "./parse-field"

describe("fields", () => {
  describe("parseFieldFromDb", () => {
    it("numbers", () => {
      let { name, type } = parseFieldFromDb(numberField)
      expect(name).toBe("number")
      expect(type).toBe("number")
    })

    it("strings", () => {
      const { name, type } = parseFieldFromDb(stringField)
      expect(name).toBe("string")
      expect(type).toBe("string")

    })

    it("booleans", () => {
      const { name, type } = parseFieldFromDb(booleanField)
      expect(name).toBe("boolean")
      expect(type).toBe("boolean")
    })

    it("dates", () => {
      const { name, type } = parseFieldFromDb(dateField)
      expect(name).toBe("date")
      expect(type).toBe("date")
    })

    it("objects", () => {
      const { name, type } = parseFieldFromDb(objectField)
      expect(name).toBe("object")
      expect(type).toBe("object")
    })

    it("arrays", () => {
      const { name, type } = parseFieldFromDb(arrayField)
      expect(name).toBe("array")
      expect(type).toBe("array")
    })
  })



  describe("parseFieldListFromDb", () => {
    it("numbers", () => {
      let field = parseFieldListFromDb([numberField])
      expect("number" in field).toBeTruthy()
      expect(field.number!.type).toBe("number")
    })

    it("strings", () => {
      let field = parseFieldListFromDb([stringField])
      expect("string" in field).toBeTruthy()
      expect(field.string!.type).toBe("string")
    })

    it("booleans", () => {
      let field = parseFieldListFromDb([booleanField])
      expect("boolean" in field).toBeTruthy()
      expect(field.boolean!.type).toBe("boolean")
    })

    it("dates", () => {
      let field = parseFieldListFromDb([dateField])
      expect("date" in field).toBeTruthy()
      expect(field.date!.type).toBe("date")
    })

    it("objects", () => {
      let field = parseFieldListFromDb([objectField])
      expect("object" in field).toBeTruthy()
      expect(field.object!.type).toBe("object")
    })

    it("arrays", () => {
      let field = parseFieldListFromDb([arrayField])
      expect("array" in field).toBeTruthy()
      expect(field.array!.type).toBe("array")
    })
  })
})