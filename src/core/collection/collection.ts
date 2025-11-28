import { isEmpty } from "@/utils/objects"

import { Field } from "../field"
import { deduceFields } from "../field/deduce-field"
import { parseFieldListFromDb } from "../field/parse-field"
import { getFieldDefinition, getFieldName } from "../field/serialize"
import { buildWhere } from "../queries/build-where"
import { FindOptions } from "../types"

const ID_FIELD = "id"

export default class Collection {
  db: any
  table: string
  fields: Record<string, Field>

  constructor(
    db   : any,
    name : string
  ) {
    this.db    = db
    this.table = name
    this.fields = {}
  }

  setDb(db) {
    this.db     = db
    this.fields = {}
  }

  toJSON_OBJECT({
    alias  = this.table,
    nested = []
  }: { alias?: string, nested?: string[] } = {}) {
    let fields: string[] = [`'id', ${alias}.id`]

    for (let [
        name,
        field
      ] of Object.entries(this.fields)
      .filter(([name]) => name !== "id")
    ) {
      const fieldName = getFieldName(name, field)
      fields.push(`'${fieldName}',${alias}.'${fieldName}'`)
    }

    if (nested?.length) fields.push(...nested)

    return `JSON_OBJECT(${fields.join(",")})`
  }

  async run(
    query: string
  ) {
    if (!this.db) return {}

    if (this.db.query) return this.db.query(query).run()

    let result = await this.db.execute(query)
    return result.rows
  }

  async execute(
    query: string,
    params: Array<any> = []
  ) {

    try {
      if (this.db.query) return this.db.query(query).all(params)

      let result = await this.db.execute({
        sql: query, args: params
      })

      const columns: string[] = result.columns
      return result.rows
      .map(item => columns.reduce((result, key, index) => {
        result[key] = item[index]
        return result
      }, {}))
    } catch (error) {
      console.log(query, params, error)
      return []
    }
  }

  transform(item) {
    return Object.entries(this.fields)
    .reduce((result, [name, field]) => {
      result[name] = field.parse(result[getFieldName(name, field)])
      return result
    }, item)
  }

  async find(search = {}, options : FindOptions = {}) {
    let fields = await this.ensure({})
    if (isEmpty(fields)) return []

    let query = `SELECT * FROM ${this.table} `

    const {
      sql,
      args
    } = buildWhere(fields, search)

    if (sql.length) query += `WHERE ${sql} `

    if (options.order)  query += ` ORDER BY  ${Object.entries(options.order).map((key, value) => `${key} ${value}`).join(",")}`
    if (options.limit)  query += ` LIMIT ${options.limit} `
    if (options.offset) query += ` OFFSET ${options.offset} `

    let result = await this.execute(query, args)
    return result.map(item => this.transform(item))
  }

  async insert(
    model: any
  ) {
    const clone = Object.assign({}, model)
    const fields = await this.ensure(deduceFields(clone))

    const values: Array<any> = []
    const names: string[] = []
    for (let [
      name,
      field
    ] of Object.entries(fields)) if (clone[name] !== undefined) {
      values.push(field.cast(clone[name]))
      names.push("'" + getFieldName(name, field) + "'")
    }

    let query = `INSERT INTO ${this.table} `
    query += `(${names.join(",")})`
    query += `VALUES (${values.map(_ => '?').join(",")}) `
    query += `RETURNING *`

    let result = await this.execute(query, values)
    return this.transform(result[0])
  }

  async findById(query: any) {
    if (typeof query === 'object') query = query[ID_FIELD]

    if (isNaN(query)) return

    let result = await this.find({ [ID_FIELD]: query })
    return result[0]
  }

  async update(
    id: any,
    model = {}
  ) {
    let clone = Object.assign({}, model)
    let fields = await this.ensure(deduceFields(clone))

    const values: Array<any> = []
    const names: string[] = []
    for (let [
      name,
      field
    ] of Object.entries(fields)) if (clone[name] !== undefined) {
      values.push(field.cast(clone[name]))
      names.push("'" + getFieldName(name, field) + "'")
    }

    let query = `UPDATE ${this.table} SET `
    query += names.map(field => `${field} = ?`).join(",")
    query += ` WHERE ${ID_FIELD} = ${id} `
    query += `RETURNING *`

    const result = await this.execute(query, values)

    return this.transform(result[0])
  }

  async ensure(
    fields: Record<string, Field> = {}
  ): Promise<Record<string, Field>> {
    if (isEmpty(this.fields))
      this.fields = parseFieldListFromDb(await this.execute(`PRAGMA table_info(${this.table})`))

    // check if we are missing any required field
    let missing = Object.keys(fields)
      .filter(value => !(value in this.fields))
      .reduce((result, key) => {
        result[key] = fields[key]
        return result
      }, {})

    if (isEmpty(missing)) return { ...this.fields, ...fields }

    // the table doesn't exist yet
    if (isEmpty(this.fields))
      return this.fields = await this.create(fields)

    // the table exists but is missing some field
    await this.alter(missing)
    return this.fields = { ...this.fields, ...missing }
  }

  // creates a table with the defined fields
  async create(
    fields: Record<string, Field>
  ) {
    let query = `CREATE TABLE ${this.table} (${ID_FIELD} INTEGER PRIMARY KEY AUTOINCREMENT, `
    query += Object.entries(fields)
      .map(([name, field]) => getFieldDefinition(name, field)).join(",")
    query += ")"

    await this.run(query)

    return { ...fields, [ID_FIELD] : new Field("id")}
  }

  // alters a table to add some fields
  async alter(
    fields: Record<string, Field>
  ) {
    for (let key of Object.keys(fields)) {
      let query = `ALTER TABLE ${this.table} ADD COLUMN ${getFieldDefinition(key, fields[key])}`
      await this.run(query)
    }

    return true
  }
}