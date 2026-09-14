# sqlitype

Mini typed ORM for SQLite: TypeBox schemas that infer to TypeScript, with runtime validation and type-safe CRUD.

## Install

```
$ bun add sqlitype @sinclair/typebox
```

## Usage

```typescript
import { Type } from '@sinclair/typebox';
import sqlitype from 'sqlitype';
import Database from 'bun:sqlite';

const User = Type.Object({              // const User = {
  id    : Type.Number(),                //   type: 'object',
  name  : Type.String(),                //   required: ['id', 'name', 'email'],
  email : Type.String(),                //   properties: {
  age   : Type.Optional(Type.Number())  //     id: { type: 'number' },
}, {                                    //     name: { type: 'string' },
  $id : "Users"                         //     email: { type: 'string' }
});                                     //     ...
                                        //
type User = Static<typeof User>;        // type User = {
                                        //   id: number,
                                        //   name: string,
                                        //   email: string,
                                        //   age?: number
                                        // }

const Users = new sqlitype.Model(User);

sqlitype.useClient(new Database('mydb.sqlite'));

const mary = await Users.insert({       // const mary: User
  name: "Maria Garcia",
  email: "maria@example.com",
  age: 28
});
```

## Overview

sqlitype combines:

- **Compile-time validation** (TypeScript)
- **Runtime validation** (TypeBox)
- **Type-safe CRUD** over SQLite (bun:sqlite or libSQL)
- **Model relationships** with `findAndJoin`
- **Multiple DBs** with `connection` + `using` (see [Connections](#-connections-multi-tenant))

Works with two backends: `bun:sqlite` (local file) and `@libsql/client` (Turso / remote).

```typescript
import Database from 'bun:sqlite';
import { createClient } from '@libsql/client';

sqlitype.useClient(new Database('mydb.sqlite')); // local
sqlitype.useClient(createClient({ url: "libsql://...", authToken: "..." })); // remote
```

sqlitype creates or updates tables to keep them in sync with your schema (within SQLite's capabilities).

## Contents

- [Defining models](#-defining-models)
- [Inserting](#-inserting-data)
- [Querying](#-querying-data)
- [Sorting, limiting, paginating](#-sorting-limiting-and-paginating)
- [Updating](#-updating-data)
- [Relationships](#-model-relationships)
- [Counting](#-counting-results)
- [Supported types](#supported-data-types)
- [Connections (multi-tenant)](#-connections-multi-tenant)

## Key concepts

### 🤔 Defining models

Models represent your tables. Each model needs a TypeBox schema with `$id` (= table name).

```typescript
import { Type } from '@sinclair/typebox';
import sqlitype from 'sqlitype';
import Database from 'bun:sqlite';

const User = Type.Object({
  id    : Type.Number(),
  name  : Type.String(),
  email : Type.String(),
  age   : Type.Optional(Type.Number())
},
{
  $id : "Users" // table name
});

type User = Static<typeof User>;

const Users = new sqlitype.Model(User);

sqlitype.useClient(new Database('mydb.sqlite'));

// You can also use fromTypebox
const Users = sqlitype.fromTypebox(User);
```

### 📀 Inserting data

TypeBox runtime validation before insert. TypeScript checks at compile time 😍

Errors follow [TypeBox's format](https://github.com/sinclairzx81/typebox?tab=readme-ov-file#values-errors).

```typescript
const newUser = await Users.insert({
  name: "Maria Garcia",
  email: "maria@example.com",
  age: 28
});

console.log(newUser.id); // Auto-generated ID
```

If data fails validation it throws:

```typescript
try {
  await Users.insert({ name: "Pepe", email: 123 }); // Error! email must be string
} catch (e) {
  console.log(e.message); // "Validation error"
  console.log(e.errors);  // Array of TypeBox ValueError
}
```

### 🔍 Querying data

Available methods:

- `find({...})` - With filters
- `findById(id)` - By unique ID

```typescript
// All users
const allUsers = await Users.find();

// Users aged 28
const adults = await Users.find({
  age: 28
});

const antonios = await Users.find({
  name : "%Antonio%"
})

// users aged lower than 18
const young = await Users.find({
  age : { $lt : 18 }
})

// Specific user
const user = await Users.findById(1);
```

Available operators:

| Operator | Example | SQL |
|-|-|-|
| (direct value) | `{ age: 28 }` | `"age" = ?` |
| `$gt` | `{ age: { $gt: 18 } }` | `"age" > ?` |
| `$gte` | `{ age: { $gte: 18 } }` | `"age" >= ?` |
| `$lt` | `{ age: { $lt: 18 } }` | `"age" < ?` |
| `$lte` | `{ age: { $lte: 18 } }` | `"age" <= ?` |
| `$in` | `{ age: { $in: [18, 21] } }` | `"age" IN (?,?)` |
| `$nin` | `{ age: { $nin: [18] } }` | `"age" NOT IN (?)` |
| `%` wildcard | `{ name: "%Ana%" }` | `"name" LIKE ?` |
| `$ne` + `%` | `{ name: { $ne: "%Ana%" } }` | `"name" NOT LIKE ?` |
| `$ne` | `{ name: { $ne: "Pepa" } }` | `"name" <> ?` |
| `$ne: null` | `{ name: { $ne: null } }` | `"name" IS NOT NULL` |
| `null` | `{ name: null }` | `"name" IS NULL` |

### 📊 Sorting, limiting, and paginating

All `find` and `findAndJoin` methods accept `FindOptions` as a second parameter:

```typescript
const results = await Users.find(
  { age: { $gt: 18 } },
  {
    order: { name: "asc" },
    limit: 10,
    offset: 20
  }
);
```

The `order` supports nested paths for sorting by related fields:

```typescript
const books = await Books.findAndJoin(
  {},
  {
    order: { title: "asc", "author.name": "desc" },
    limit: 5
  }
);
```

TypeScript autocompletes valid paths based on the model schema.

### 📝 Updating data

```typescript
const updated = await Users.update(1, {
  age: 29  // New value
});
```

### 🫂 Model relationships

Defined with `ModelReference`. Required or optional:

```typescript
const Book = Type.Object({
  id: Type.Number(),
  title: Type.String(),
  author: sqlitype.ModelReference(Authors),          // ⬅️ Required
  editor: Type.Optional(sqlitype.ModelReference(Authors)) // ⬅️ Optional
}, { $id : "Book" })
```

Full example:

```typescript
// Author model
const Author = Type.Object({
  id: Type.Number(),
  name: Type.String()
}, { $id : "Author" });
const Authors = new sqlitype.Model(Author);

// Book model (related to Author)
const Book = Type.Object({
  id: Type.Number(),
  title: Type.String(),
  author: sqlitype.ModelReference(Authors)  // ⬅️ Relationship
}, { $id : "Book" })

const Books = new sqlitype.Model(Book);

// Usage
const author = await Authors.insert({ name: "Gabriel Garcia Marquez" });
const book = await Books.insert({
  title: "One Hundred Years of Solitude",
  author: author  // Assign relationship
});
```

You can filter optional references by null:

```typescript
// Books without editor
const withoutEditor = await Books.find({ editor: null })

// Books with editor
const withEditor = await Books.find({ editor: { $ne: null } })
```

Then filter with `findAndJoin` in various ways:

```typescript
const [bookWithAuthor] = await Books.findAndJoin({
  id : 1,
  author : {} // populates the book's author
})

const booksByAuthor = await Books.findAndJoin({
  "author": {
    name : "%Gabriel%"
  } // filters all books by an author
});

const books = await Books.findAndJoin({
  title : "%solitude%",
  author : {
    name : "%Gabriel%"
  }
}); // all books with "solitude" in title written by someone named Gabriel 😳
```

You can also combine operators on nested fields:

```typescript
// Books whose author is NOT named Gabriel, or books without author
const books = await Books.findAndJoin({
  author: {
    name: { $ne: "%Gabriel%" } // NOT LIKE
  }
});

// Books by specific authors
const books = await Books.findAndJoin({
  author: {
    id: { $in: [1, 2, 3] }
  }
});
```

With optional relationships you can populate even when null:

```typescript
// Populates the author, even if editor is null
const [book] = await Books.findAndJoin({
  editor: null,
  author: {}
});
// book.author is populated, book.editor is undefined
```

With `FindOptions` you can sort by nested fields with type safety:

```typescript
const books = await Books.findAndJoin(
  { author: { name: "%Gabriel%" } },
  { order: { title: "asc", "author.name": "desc" }, limit: 5 }
);
```

### 🔢 Counting results

```typescript
const total = await Users.count(); // 5

const adults = await Users.count({ age: { $gt: 18 } }); // 3

// Also works with relations
const books = await Books.count({ author: { name: "%Gabriel%" } });
```

## Supported data types

| TypeBox | SQLite | Description |
|-|-|-|
|Type.String()| TEXT| Texts
|Type.Number()| REAL| Numbers
|Type.Boolean()| INTEGER |Flags
|Type.Date() |INTEGER |Dates (stored as timestamp)
|Type.Object()| TEXT | JSON data (stored as text)
|Type.Any()|TEXT| JSON data (stored as text)
|Type.Array()| TEXT |lists (stored as text)

## 🔌 Connections (multi-tenant)

By default all models use the connection set with `useClient`. For parallel DBs, bind a definition to a connection with `using`:

```typescript
import Database from 'bun:sqlite';

const main = sqlitype.connection(new Database('main.sqlite'), { name: "main" });
const tenantA = sqlitype.connection(new Database('tenant-a.sqlite'), { name: "tenant:a" });

// Same definition, two isolated DBs
const mainUsers = Users.using("main");
const tenantUsers = Users.using("tenant:a");
// Users.using(conn) with the direct handle returns the same cached model
```

Bound models are lazy: they are only created/mapped in the DB when actually used (plus their relations). You can have models that only live in one DB and models that only live in another — the system creates just the ones you use on each connection.

### Connection resolution

By default `using("name")` resolves through the `name` registered in `connection(db, { name })`. To resolve whatever DB / `Connection` you want from a name, register an adhoc function with `resolveConnection`:

```typescript
sqlitype.resolveConnection((key) =>
  sqlitype.connection(new Database(`${key}.sqlite`), { name: key })
);

const users = Users.using("tenant:x"); // materializes + registers, next call reuses
Users.using("ghost");                  // throws "UnknownConnection" with no registry nor hook
```

Order: explicit registry → `resolveConnection` → `UnknownConnection`.

Switching the default connection reuses the pool, destroying nothing:

```typescript
sqlitype.useClient(new Database('other.db'));
sqlitype.useClient("main"); // same pooled Connection
```
