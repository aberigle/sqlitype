import { TSchema } from "@sinclair/typebox"
import { Model } from "./model"
import { ModelReference } from "./model-reference"
import { ConnectionModel } from "./connection-model"

export { Model }
export { ModelReference }
export { ConnectionModel }

export function fromTypebox<T extends TSchema>(
  object: T,
  name: string | undefined = object.$id,
) {
  if (!name) throw new Error("Missing $id or name")

  return new Model<T>(
    object,
    { name }
  )
}