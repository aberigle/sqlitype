
export type PragmaResult = {
  pk         : boolean
  name       : string
  type       : string
  cid        : number
  notnull    : boolean,
  dflt_value? :  number | string | null
}

export type FieldType = "number" | "date" | "string" | "boolean" | "array" | "object" | "id"

export const TypeMap: Record<FieldType, string> = {
  "number"  : "REAL",
  "string"  : "TEXT",
  "boolean" : "INTEGER",
  "date"    : "INTEGER",
  "object"  : "TEXT",
  "array"   : "TEXT",
  "id"      : "INTEGER"
}