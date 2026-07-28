# sqlitype

## Introduction

sqlitype is a mini ORM for working with SQLite databases that combines:

- **Compile-time type validation** (TypeScript)
- **Runtime data validation** (TypeBox)
- **Type-safe CRUD operations**
- **Support for model relationships**

## Key Concepts

### 🤔 Defining Models

Models represent your database tables. Each model requires:

- A TypeBox schema defining the structure
- Basic configuration (table name and DB connection)

```typescript
import { Type } from '@sinclair/typebox';
import sqlitype from 'sqlitype';
import Database from 'bun:sqlite';

// Schema definition
const User = Type.Object({
  id    : Type.Number(),
  name  : Type.String(),
  email : Type.String(),
  age   : Type.Optional(Type.Number())
},
{
  $id : "Users" // table name
});

// Infer TypeScript type
type User = Static<typeof User>;

// Model creation
const Users = new sqlitype.Model(User);

sqlitype.useConnection(new Database('mydb.sqlite'));

// You can also use fromTypebox
const Users = sqlitype.fromTypebox(UserSchema);
```
sqlitype automatically creates or updates tables to keep them synchronized with your schema (within SQLite's capabilities).

You can switch the connection at any time with `useClient`:
```typescript
sqlitype.useClient(new Database('other.db'));
// All existing models will use the new connection
```

### 📀 Inserting Data

sqlitype uses TypeBox runtime validation before inserting new data. You'll get TypeScript compile-time checks 😍

Validation errors follow [TypeBox's error format](https://github.com/sinclairzx81/typebox?tab=readme-ov-file#values-errors).

```typescript
const newUser = await Users.insert({
  name: "Maria Garcia",
  email: "maria@example.com",
  age: 28
});

console.log(newUser.id); // Auto-generated ID
```

If data fails validation it throws an error:
```typescript
try {
  await Users.insert({ name: "Pepe", email: 123 }); // Error! email must be string
} catch (e) {
  console.log(e.message); // "Validation error"
  console.log(e.errors);  // Array of TypeBox ValueError
}
```
### 🔍 Querying Data

Available methods:

- find({...}) - With filters
- findById(id) - By unique ID

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

### 📝 Updating Data
```typescript
const updated = await Users.update(1, {
  age: 29  // New value
});
```

### 🫂 Model Relationships

Define relationships between models using `ModelReference`

Relationships can be required or optional:

```typescript
const Book = Type.Object({
  id: Type.Number(),
  title: Type.String(),
  author: sqlitype.ModelReference(Authors),          // ⬅️ Required
  editor: Type.Optional(sqlitype.ModelReference(Authors)) // ⬅️ Optional
}, { $id : "Book" })
```

You can filter optional references by null:
```typescript
// Books without editor
const withoutEditor = await Books.find({ editor: null })

// Books with editor
const withEditor = await Books.find({ editor: { $ne: null } })
```

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

You can then filter by these relationships using `findAndJoin` in various ways:

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

You can also combine operators on nested relation fields:
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

| TypeBox	| SQLite|	Description |
|-|-|-|
|Type.String()|	TEXT|	Texts
|Type.Number()|	REAL|	Numbers
|Type.Boolean()|	INTEGER	|Flags
|Type.Date()	|INTEGER	|Dates (stored as timestamp)
|Type.Object()|	TEXT	| JSON data (stored as text)
|Type.Any()|TEXT| JSON data  (stored as text)
|Type.Array()|	TEXT	|listas (stored as text)