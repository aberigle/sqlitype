import type { Client } from "@libsql/client";
import { Type } from "@sinclair/typebox";
import Database from "bun:sqlite";
import { beforeEach, describe, expect, it } from "bun:test";
import { connection, resetPool } from "../core/connection";
import { Model } from "./model";
import { ModelReference } from "./model-reference";

type Driver = Database | Client;

describe("connection-model", () =>
  describe("bun", () => testConnectionModel(() => new Database())));

export function testConnectionModel(factory: () => Driver) {
  beforeEach(() => {
    resetPool()
  })

  it("writes and reads through the connection bound model", async () => {
    const conn = connection(factory(), { name: "main" })
    const Users = new Model(
      Type.Object({ id: Type.Number(), name: Type.String() }, { $id: "CMCrud" })
    )

    const users = Users.using(conn)
    const inserted = await users.insert({ name: "ana" })

    expect(inserted.name).toBe("ana")

    const found = await users.findById(inserted.id as number)
    expect(found?.name).toBe("ana")

    const [row] = await conn.execute("SELECT * FROM CMCrud")
    expect(row!.name).toBe("ana")
  })

  it("dedupes one definition + one connection into a single ConnectionModel", () => {
    const conn = connection(factory(), { name: "main" })
    const Users = new Model(
      Type.Object({ id: Type.Number(), name: Type.String() }, { $id: "CMDedupe" })
    )

    const a = Users.using(conn)
    const b = Users.using(conn)

    expect(b).toBe(a)
    expect(Users.using(conn)).toBe(a)
    expect(Users.using("main")).toBe(a)
    expect(conn.collections.size).toBe(1)
  })

  it("throws UnknownConnection for an unknown key without resolver", () => {
    const Users = new Model(
      Type.Object({ id: Type.Number(), name: Type.String() }, { $id: "CMGhost" })
    )

    expect(() => Users.using("ghost")).toThrow("UnknownConnection")
  })

  it("resolves relations inside the same connection without cross-connection leaks", async () => {
    const connA = connection(factory(), { name: "a" })
    const connB = connection(factory(), { name: "b" })

    const User = new Model(
      Type.Object({ id: Type.Number(), name: Type.String() }, { $id: "CMRelUser" })
    )
    const Post = new Model(
      Type.Object(
        { id: Type.Number(), title: Type.String(), author: ModelReference(User) },
        { $id: "CMRelPost" }
      )
    )

    const usersA = User.using(connA)
    const postsA = Post.using(connA)
    const usersB = User.using(connB)
    const postsB = Post.using(connB)

    const alice = await usersA.insert({ name: "alice" })
    const bob = await usersB.insert({ name: "bob" })

    await postsA.insert({ title: "post-a", author: alice })
    await postsB.insert({ title: "post-b", author: bob })

    const [postA] = await postsA.findAndJoin({ author: { name: "alice" } })
    expect(postA!.title).toBe("post-a")
    expect(postA!.author.name).toBe("alice")

    const [postB] = await postsB.findAndJoin({ author: { name: "bob" } })
    expect(postB!.title).toBe("post-b")
    expect(postB!.author.name).toBe("bob")

    expect(await postsB.findAndJoin({ author: { name: "alice" } })).toEqual([])
    expect(await postsA.findAndJoin({ author: { name: "bob" } })).toEqual([])

    expect(await postsB.count({ author: { name: "bob" } })).toBe(1)
    expect(await postsA.count({ author: { name: "alice" } })).toBe(1)

    expect(postsA.fields.author!.ref).toBe(usersA)
    expect(postsA.fields.author!.ref).not.toBe(usersB)
    expect(postsB.fields.author!.ref).toBe(usersB)
  })
}
