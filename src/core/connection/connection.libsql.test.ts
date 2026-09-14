import { describe } from "bun:test";
import { createClient } from "@libsql/client";
import { testConnection } from "./connection.bun.test";

const db = createClient({ url: `:memory:` });

describe("connection (libsql)", () => describe("libsql", () => testConnection(db)));
