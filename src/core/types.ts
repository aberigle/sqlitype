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

type FlattenObjectKeys<T> = {
  [K in keyof T & string]:
    [T[K]] extends [Date | number | string | boolean | null | undefined | any[]]
      ? K
      : [Exclude<T[K], undefined | null>] extends [object]
        ? K | `${K}.${FlattenObjectKeys<NonNullable<T[K]>>}`
        : K
}[keyof T & string]

export type FindOptions<T = Record<string, any>> = {
  order?  : Partial<Record<FlattenObjectKeys<T>, "asc" | "desc">>,
  limit?  : number,
  offset? : number
}