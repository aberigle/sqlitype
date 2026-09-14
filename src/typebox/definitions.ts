import type { Model } from "./model"

const definitions: Record<string, Model<any>> = {}

export function modelDefinition(table: string): Model<any> | undefined {
  return definitions[table]
}

export function registerModelDefinition(table: string, model: Model<any>): void {
  definitions[table] = model
}
