export interface FindOperators<T> {
  $gt?  : T;        // >  ?
  $gte? : T;        // >= ?
  $lt?  : T;        // <  ?
  $lte? : T;        // <= ?
  $in?  : T[];      // IN (?,?)
  $nin? : T[];      // NOT IN (?,?)
  $ne?  : T | null; // <> ? | IS NOT NULL
}

type Primitive = Date | number | string | boolean | null

export type FindFilter<T> = {
  [K in keyof T]?:
    T[K] extends Primitive
      ? T[K] | FindOperators<T[K]> | null
      : FindFilter<T[K]> | FindOperators<T[K]> | null
}

export type FindOptions = {
  order?  : Record<string, "asc" | "desc">,
  limit?  : number,
  offset? : number
}