import { Collection, Field } from "./core"
import { fromTypebox, Model, ModelReference } from "./typebox"

export type { FindFilter } from "./core/types"

export const sqlitype = {
  fromTypebox,
  Model,
  ModelReference,
  core : {
    Collection,
    Field
  },
  useClient: (client) => Model.reload(client)
}

export default sqlitype