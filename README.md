# sqlitype

[English](./README.en.md)

Mini ORM tipado para SQLite: esquemas TypeBox que infieren a TypeScript, con validación en runtime y CRUD type-safe.

## Instalación

```
$ bun add sqlitype @sinclair/typebox
```

## Uso

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
  name: "María García",
  email: "maria@ejemplo.com",
  age: 28
});
```

## Resumen

sqlitype combina:

- **Validación en compilación** (TypeScript)
- **Validación en ejecución** (TypeBox)
- **CRUD type-safe** sobre SQLite (bun:sqlite o libSQL)
- **Relaciones entre modelos** con `findAndJoin`
- **Múltiples BD** con `connection` + `using` (ver [Conexiones](#-conexiones-multi-tenant))

Compatible con dos backends: `bun:sqlite` (fichero local) y `@libsql/client` (Turso / remoto).

```typescript
import Database from 'bun:sqlite';
import { createClient } from '@libsql/client';

sqlitype.useClient(new Database('mydb.sqlite')); // local
sqlitype.useClient(createClient({ url: "libsql://...", authToken: "..." })); // remoto
```

sqlitype crea o actualiza la tabla para mantenerla sincronizada con el esquema (dentro de lo que SQLite permite).

## Contenido

- [Definir modelos](#-definir-modelos)
- [Insertar](#-insertar-datos)
- [Buscar](#-buscar-datos)
- [Ordenar, limitar y paginar](#-ordenar-limitar-y-paginar)
- [Actualizar](#-actualizar-datos)
- [Relaciones](#-relaciones-entre-modelos)
- [Contar](#-contar-resultados)
- [Tipos soportados](#tipos-de-datos-soportados)
- [Conexiones (multi-tenant)](#-conexiones-multi-tenant)

## Conceptos clave

### 🤔 Definir modelos

Los modelos representan tus tablas. Cada modelo necesita un esquema TypeBox con `$id` (= nombre de la tabla).

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
  $id : "Users" // nombre de la tabla
});

type User = Static<typeof User>;

const Users = new sqlitype.Model(User);

sqlitype.useClient(new Database('mydb.sqlite'));

// También puedes usar fromTypebox
const Users = sqlitype.fromTypebox(User);
```

### 📀 Insertar datos

Validación TypeBox en runtime antes de insertar. En compilación, la de TypeScript 😍

Los errores siguen el [formato de TypeBox](https://github.com/sinclairzx81/typebox?tab=readme-ov-file#values-errors).

```typescript
const newUser = await Users.insert({
  name: "María García",
  email: "maria@ejemplo.com",
  age: 28
});

console.log(newUser.id); // ID auto-generado
```

Si los datos no pasan la validación se lanza un error:

```typescript
try {
  await Users.insert({ name: "Pepe", email: 123 }); // Error! email debe ser string
} catch (e) {
  console.log(e.message); // "Validation error"
  console.log(e.errors);  // Array de ValueError de TypeBox
}
```

### 🔍 Buscar datos

Métodos disponibles:

- `find({...})` - Con filtros
- `findById(id)` - Por ID único

```typescript
// Todos los usuarios
const allUsers = await Users.find();

// Usuarios de 28 años
const adultos = await Users.find({
  age: 28
});

const antonios = await Users.find({
  name : "%Antonio%"
})

// usuarios con menos de 18 años
const jovenes = await Users.find({
  age : { $lt : 18 }
})

// Usuario específico
const user = await Users.findById(1);
```

Operadores disponibles para los filtros:

| Operador | Ejemplo | SQL |
|-|-|-|
| (valor directo) | `{ age: 28 }` | `"age" = ?` |
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

### 📊 Ordenar, limitar y paginar

Todos los métodos `find` y `findAndJoin` aceptan `FindOptions` como segundo parámetro:

```typescript
const resultados = await Users.find(
  { age: { $gt: 18 } },
  {
    order: { name: "asc" },
    limit: 10,
    offset: 20
  }
);
```

El `order` soporta paths anidados para ordenar por campos de relaciones:

```typescript
const libros = await Books.findAndJoin(
  {},
  {
    order: { title: "asc", "author.name": "desc" },
    limit: 5
  }
);
```

TypeScript autocompleta los paths válidos según el esquema del modelo.

### 📝 Actualizar datos

```typescript
const updated = await Users.update(1, {
  age: 29  // Nuevo valor
});
```

### 🫂 Relaciones entre modelos

Se definen con `ModelReference`. Pueden ser obligatorias u opcionales:

```typescript
const Book = Type.Object({
  id: Type.Number(),
  title: Type.String(),
  author: sqlitype.ModelReference(Authors),          // ⬅️ Obligatoria
  editor: Type.Optional(sqlitype.ModelReference(Authors)) // ⬅️ Opcional
}, { $id : "Book" })
```

Ejemplo completo:

```typescript
// Modelo Autor
const Author = Type.Object({
  id: Type.Number(),
  name: Type.String()
}, { $id : "Author" });
const Authors = new sqlitype.Model(Author);

// Modelo Libro (relacionado con Autor)
const Book = Type.Object({
  id: Type.Number(),
  title: Type.String(),
  author: sqlitype.ModelReference(Authors)  // ⬅️ Relación
}, { $id : "Book" })

const Books = new sqlitype.Model(Book);

// Uso
const author = await Authors.insert({ name: "Gabriel García Márquez" });
const book = await Books.insert({
  title: "Cien años de soledad",
  author: author  // Asignamos la relación
});
```

Para las opcionales puedes filtrar por si tienen o no referencia:

```typescript
// Libros sin editor
const sinEditor = await Books.find({ editor: null })

// Libros con editor
const conEditor = await Books.find({ editor: { $ne: null } })
```

Luego se filtra con `findAndJoin` de varias maneras:

```typescript
const [bookWithAuthor] = await Books.findAndJoin({
  id : 1,
  author : {} // esto populará el autor del libro
})

const booksByAuthor = await Books.findAndJoin({
  "author": {
    name : "%Gabriel%"
  } // esto filtrará todos los libros de un autor
});

const books = await Books.findAndJoin({
  title : "%soledad%",
  author : {
    name : "%Gabriel%"
  }
}); // todos los libros con soledad en el titulo escritos por alguien que se llame Gabriel 😳
```

También puedes combinar operadores en los campos anidados:

```typescript
// Libros cuyo autor NO se llame Gabriel, o libros sin autor
const libros = await Books.findAndJoin({
  author: {
    name: { $ne: "%Gabriel%" } // NOT LIKE
  }
});

// Libros de varios autores específicos
const libros = await Books.findAndJoin({
  author: {
    id: { $in: [1, 2, 3] }
  }
});
```

Con relaciones opcionales puedes popular aunque no tengan referencia:

```typescript
// Popula el author, aunque el editor sea null
const [book] = await Books.findAndJoin({
  editor: null,
  author: {}
});
// book.author está populado, book.editor es undefined
```

Y con `FindOptions` puedes ordenar por campos anidados con type-safe:

```typescript
const libros = await Books.findAndJoin(
  { author: { name: "%Gabriel%" } },
  { order: { title: "asc", "author.name": "desc" }, limit: 5 }
);
```

### 🔢 Contar resultados

```typescript
const total = await Users.count(); // 5

const adultos = await Users.count({ age: { $gt: 18 } }); // 3

// También con relaciones
const libros = await Books.count({ author: { name: "%Gabriel%" } });
```

## Tipos de datos soportados

| TypeBox | SQLite | Descripción |
|-|-|-|
|Type.String()| TEXT| Strings en general
|Type.Number()| REAL| Números
|Type.Boolean()| INTEGER | flags, booleanos..
|Type.Date() |INTEGER |fechas (almacenadas como timestamp)
|Type.Object()| TEXT |datos JSON (almacenados como texto)
|Type.Any()|TEXT|datos JSON (almacenados como texto)
|Type.Array()| TEXT |listas (almacenadas como JSON)

## 🔌 Conexiones (multi-tenant)

Por defecto todos los modelos usan la conexión fijada con `useClient`. Para varias BD en paralelo, ata una definición a una conexión con `using`:

```typescript
import Database from 'bun:sqlite';

const main = sqlitype.connection(new Database('main.sqlite'), { name: "main" });
const tenantA = sqlitype.connection(new Database('tenant-a.sqlite'), { name: "tenant:a" });

// Misma definición, dos BD aisladas
const mainUsers = Users.using("main");
const tenantUsers = Users.using("tenant:a");
// Users.using(conn) con el handle directo devuelve el mismo modelo cacheado
```

Los modelos atados son lazy: solo se crean/mapean en la BD en el momento en que se usan (y sus relaciones). Puedes tener modelos que solo vivan en una BD y modelos que solo vivan en otra — el sistema crea únicamente los que se van utilizando en cada conexión.

### Resolución de conexiones

Por defecto `using("name")` resuelve por el `name` registrado en `connection(db, { name })`. Si quieres resolver la BD / `Connection` que quieras a partir de un nombre, registra una función adhoc con `resolveConnection`:

```typescript
sqlitype.resolveConnection((key) =>
  sqlitype.connection(new Database(`${key}.sqlite`), { name: key })
);

const users = Users.using("tenant:x"); // materializa + registra, la siguiente reutiliza
Users.using("ghost");                  // throw "UnknownConnection" sin registry ni hook
```

Orden: registry explícito → `resolveConnection` → `UnknownConnection`.

Cambiar la conexión por defecto reutiliza el pool, sin destruir nada:

```typescript
sqlitype.useClient(new Database('otra.db'));
sqlitype.useClient("main"); // misma Connection del pool
```
