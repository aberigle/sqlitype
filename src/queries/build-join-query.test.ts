import { Client } from '@libsql/client';
import { Type } from '@sinclair/typebox';
import Database from 'bun:sqlite';
import { describe, expect, it } from 'bun:test';

import { Model, ModelReference } from "../typebox";
import { buildJoinQuery } from "./build-join-query";

describe('queries', () => describe("build-join-query (bun)", () => testBuildJoinQuery(new Database())))

export function testBuildJoinQuery(
  connection: Database | Client
) {

  it("builds simple query without joins", async () => {
    const fields = await new Model(Type.Object({
      name: Type.String()
    }, { $id: "test" }), { db: connection }).ensure()

    const result = await buildJoinQuery(fields, "test", {})

    expect(result.select).toBe("SELECT test.*")
    expect(result.from).toBe("FROM test ")
    expect(result.where).toBe("")
    expect(result.params).toEqual([])
  })

  it("builds query with basic WHERE", async () => {
    const fields = await new Model(Type.Object({
      name: Type.String()
    }, { $id: "test" }), { db: connection }).ensure()

    const result = await buildJoinQuery(fields, "test", { name: "Pepa" })

    expect(result.where).toContain(`"name" = ?`)
    expect(result.params).toEqual(["Pepa"])
  })

  it("builds INNER JOIN for required reference", async () => {
    const one = new Model(Type.Object({ test: Type.String() }, { $id: "inner_one" }), { db: connection })

    const fields = await new Model(Type.Object({
      one: ModelReference(one)
    }, { $id: "inner_two" }), { db: connection }).ensure()

    const result = await buildJoinQuery(fields, "inner_two", { one: { test: "hi" } })

    expect(result.from).toContain("INNER JOIN inner_one AS one ON one.id = inner_two.one")
    expect(result.where).toContain(`one."test" = ?`)
    expect(result.params).toEqual(["hi"])
  })

  it("builds LEFT JOIN for optional reference", async () => {
    const one = new Model(Type.Object({ test: Type.String() }, { $id: "left_one" }), { db: connection })

    const fields = await new Model(Type.Object({
      one: Type.Optional(ModelReference(one))
    }, { $id: "left_two" }), { db: connection }).ensure()

    const result = await buildJoinQuery(fields, "left_two", { one: { test: "hi" } })

    expect(result.from).toContain("LEFT JOIN left_one AS one ON one.id = left_two.one")
  })

  it("uses field name as alias when it differs from table name", async () => {
    const one = new Model(Type.Object({ test: Type.String() }, { $id: "alias_one" }), { db: connection })

    const fields = await new Model(Type.Object({
      alias: ModelReference(one)
    }, { $id: "alias_two" }), { db: connection }).ensure()

    const result = await buildJoinQuery(fields, "alias_two", { alias: { test: "keep" } })

    expect(result.from).toContain("INNER JOIN alias_one AS alias ON alias.id = alias_two.alias")
    expect(result.where).toContain(`alias."test" = ?`)
    expect(result.params).toEqual(["keep"])
  })

  it("includes JSON_OBJECT in select for joined fields", async () => {
    const one = new Model(Type.Object({ test: Type.String(), slug: Type.String() }, { $id: "json_one" }), { db: connection })

    const fields = await new Model(Type.Object({
      one: ModelReference(one)
    }, { $id: "json_two" }), { db: connection }).ensure()

    const result = await buildJoinQuery(fields, "json_two", { one: { test: "hi" } })

    expect(result.select).toContain("JSON_OBJECT(")
    expect(result.select).toContain("'one'")
    expect(result.select).toContain("one.'test'")
  })

  it("handles multiple reference fields", async () => {
    const one  = new Model(Type.Object({ test: Type.String() }, { $id: "multi_one" }), { db: connection })
    const user = new Model(Type.Object({ email: Type.String() }, { $id: "multi_user" }), { db: connection })

    const fields = await new Model(Type.Object({
      one: ModelReference(one),
      assigned: Type.Optional(ModelReference(user))
    }, { $id: "multi_two" }), { db: connection }).ensure()

    const result = await buildJoinQuery(fields, "multi_two", {
      one: { test: "hi" },
      assigned: { email: "a@b.com" }
    })

    expect(result.from).toContain("INNER JOIN multi_one AS one")
    expect(result.from).toContain("LEFT JOIN multi_user AS assigned")
    expect(result.where).toContain(`one."test" = ?`)
    expect(result.where).toContain(`assigned."email" = ?`)
  })

  it("handles nested joins (relation of relation)", async () => {
    const another = new Model(Type.Object({ city: Type.String() }, { $id: "nested_another" }), { db: connection })

    const one = new Model(Type.Object({
      test: Type.String(),
      another: ModelReference(another)
    }, { $id: "nested_one" }), { db: connection })

    const fields = await new Model(Type.Object({
      one: ModelReference(one)
    }, { $id: "nested_two" }), { db: connection }).ensure()

    const result = await buildJoinQuery(fields, "nested_two", {
      one: { test: "hi", another: { city: "Madrid" } }
    })

    expect(result.from).toContain("INNER JOIN nested_one AS one")
    expect(result.from).toContain("INNER JOIN nested_another AS another ON another.id = one.another")
    expect(result.where).toContain(`another."city" = ?`)
    expect(result.params).toContain("Madrid")
  })
}
