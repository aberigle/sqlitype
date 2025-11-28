export interface FindOperators<T> {
  $gt?  : T;  // greater than
  $gte? : T;  // greater than equal
  $lt?  : T;  // lower than
  $lte? : T;  // lower than equal
}

export type FindQuery<T> = {
  [K in keyof T]?: T[K] | FindOperators<T[K]>
}

export type FindOptions = {
  order?  : Record<string, "asc" | "desc">,
  limit?  : number,
  offset? : number
}