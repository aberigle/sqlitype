interface FindOperators<T> {
  $gt?  : T;  // greater than
  $gte? : T;  // greater than equal
  $lt?  : T;  // lower than
  $lte? : T;  // lower than equal
}

type FindQuery<T> = {
  [K in keyof T]?: T[K] | FindOperators<T[K]>
}