import { Model } from "src/typebox"
import { FieldType } from "./types"

export default class Field {
  ref?: Model<any>

  constructor(
    public type     : FieldType,
    public required : boolean = true
  ) {}

  reference(model: Model<any>) {
    this.ref = model
    return this
  }

  compare(field : Field) {
    return this.type === field.type
  }

  /**
   * Reads a value from the db a returns is as javascript
   *
   * @param {Object} value - Any value
   */
  parse(value: any): any {
    if (!this.required && value == null) return undefined

    switch(this.type) {
      case 'date'    : return new Date(value)
      case 'boolean' : return value === 1
      case 'array'   : return value !== null
        ? JSON.parse(value)
        : []
      case 'object'  : return value !== null
        ? JSON.parse(value)
        : {}
      case 'id'      :
        // id reference in the same model
        if (!this.ref) return value
        // we didnt populate the model
        if (typeof value === "number") return { id: value }

        // we have an object to be casted
        if (
          typeof value === "string" &&
          value.startsWith("{")
        ) value = JSON.parse(value)

        // left join without match
        if (value.id === null) return undefined

        return this.ref.cast(this.ref.transform(value))

      default: return value
    }
  }

  /**
   * Cast a javascript value to a sqlite ready one based on the type
   *
   * @param {Object} value - Any value
   */
  cast(value: any): any {
    switch(this.type) {
      case 'date'   : return value.getTime()
      case 'string' : return value
      case 'boolean': return Number(value)
      case 'array'  :
      case 'object' : return JSON.stringify(value)
      case 'id'     : return typeof value === "object" ? value.id : value
      default : return value
    }

  }

}

