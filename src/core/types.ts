export interface FindOperators<T> {
  $gt?  : T;  // greater than
  $gte? : T;  // greater than equal
  $lt?  : T;  // lower than
  $lte? : T;  // lower than equal
  $in?  : T[];  // IN (?,?)
  $nin? : T[];  // NOT IN (?,?)
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