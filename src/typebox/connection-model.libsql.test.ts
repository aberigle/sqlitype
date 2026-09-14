import { describe } from "bun:test";

import { createClient } from "@libsql/client";
import { testConnectionModel } from "./connection-model.test";

describe("connection-model", () =>
  describe("libsql", () => testConnectionModel(() => createClient({ url: ":memory:" }))));
