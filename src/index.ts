import {
  Collection,
  Field,
  connection,
  resolveConnection,
  connectionByName,
  setDefaultConnection
} from "./core"

import type { SqliteDriver } from "./core/connection"
import { fromTypebox, Model, ModelReference, ConnectionModel } from "./typebox"

export type { FindFilter } from "./core/types"
export { ConnectionModel }

export const sqlitype = {
  fromTypebox,
  Model,
  ModelReference,
  ConnectionModel,
  connection,
  resolveConnection,
  connectionByName,
  core : {
    Collection,
    Field
  },
  useClient: (client : SqliteDriver) => setDefaultConnection(client)
}

export default sqlitype