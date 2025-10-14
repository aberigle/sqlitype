# sqlitype

[English](./README.en.md)

## Introducción

sqlitype es un mini ORM para trabajar con bases de datos SQLite, que combina:

- **Validación de tipos en tiempo de compilación** (TypeScript)
- **Validación de datos en tiempo de ejecución** (TypeBox)
- **Operaciones CRUD type-safe**
- **Soporte para relaciones entre modelos**

## Conceptos Clave

### 🤔 Definir Modelos

Los modelos representan tus tablas de base de datos. Cada modelo necesita:

- Un esquema TypeBox que define la estructura
- Configuración básica (nombre de tabla y conexión a DB)

```typescript
import { Type } from '@sinclair/typebox';
import sqlitype from 'sqlitype';
import Database from 'bun:sqlite';

// Definición del esquema
const User = Type.Object({
  id    : Type.Number(),
  name  : Type.String(),
  email : Type.String(),
  age   : Type.Optional(Type.Number())
},
{ 
  $id : "Users" // nombre de la tabla
});

// Inferir el tipo TypeScript
type User = Static<typeof User>;

// Creación del modelo
const Users = new sqlitype.Model(User);

sqlitype.useConnection(new Database('mydb.sqlite'));
```

sqlitype se encarga de crear o actualizar la tabla para mantenerla sincronizada con el esquema. (dentro de lo que SQLite permite)

### 📀 Insertar datos

Se utiliza la validación de TypeBox en tiempo de ejecución antes de insertar nuevos datos. En tiempo de compilación utilizará la de Typescript 😍

Para los errores de validación se utiliza el [formato de TypeBox](https://github.com/sinclairzx81/typebox?tab=readme-ov-file#values-errors).

```typescript
const newUser = await Users.insert({
  name: "María García",
  email: "maria@ejemplo.com",
  age: 28
});

console.log(newUser.id); // ID auto-generado
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

### 📝 Actualizar datos
```typescript
const updated = await Users.update(1, {
  age: 29  // Nuevo valor
});
```

### 🫂 Relaciones entre modelos

Se pueden definir relaciones con otro modelo utilizando `ModelReference`

```typescript
// Modelo Autor
const Book = Type.Object({
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
Luego se podrá filtrar por ese campo haciendo `findAndJoin` de varias maneras

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

## Tipos de Datos Soportados

| TypeBox	| SQLite|	Descripción |
|-|-|-|
|Type.String()|	TEXT|	Strings en general
|Type.Number()|	REAL|	Números
|Type.Boolean()|	INTEGER	| flags, booleanos..
|Type.Date()	|INTEGER	|fechas (almacenadas como timestamp)
|Type.Object()|	TEXT	|datos JSON (almacenados como texto)
|Type.Any()|TEXT|datos JSON (almacenados como texto)
|Type.Array()|	TEXT	|listas (almacenadas como JSON)