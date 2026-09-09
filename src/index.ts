import { Collection, Field, connection, resolveConnection, connectionByName } from "./core"
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
  useClient: (client) => Model.reload(client)
}

export default sqlitype