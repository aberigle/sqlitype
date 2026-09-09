import { Collection, Field, connection, resolveConnection, connectionByName } from "./core"
import { fromTypebox, Model, ModelReference } from "./typebox"

export type { FindFilter } from "./core/types"

export const sqlitype = {
  fromTypebox,
  Model,
  ModelReference,
  connection,
  resolveConnection,
  connectionByName,
  core : {
    Collection,
    Field
  },
  useClient: (client) => Model.reload(client)
}

export default sqlitype