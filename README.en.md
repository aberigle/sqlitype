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
```
sqlitype automatically creates or updates tables to keep them synchronized with your schema (within SQLite's capabilities).

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

### 📝 Updating Data
```typescript
const updated = await Users.update(1, {
  age: 29  // New value
});
```

### 🫂 Model Relationships

Define relationships between models using `ModelReference`

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