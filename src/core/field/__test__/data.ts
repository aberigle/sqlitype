import type { PragmaResult } from "../types"

export const numberField  : PragmaResult = { name: "number",           type: "REAL",    pk: false, notnull : false, cid : 0 }
export const stringField  : PragmaResult = { name: "string",           type: "TEXT",    pk: false, notnull : false, cid : 0 }
export const booleanField : PragmaResult = { name: "boolean::boolean", type: "INTEGER", pk: false, notnull : false, cid : 0 }
export const dateField    : PragmaResult = { name: "date::date",       type: "INTEGER", pk: false, notnull : false, cid : 0 }
export const objectField  : PragmaResult = { name: "object::object",   type: "TEXT",    pk: false, notnull : false, cid : 0 }
export const arrayField   : PragmaResult = { name: "array::array",     type: "TEXT",    pk: false, notnull : false, cid : 0 }