# Typesafe in-memory database

This project features an in\-memory, typesafe database that you can use to quickly process complex data structures.

Typesafety ensures that structural errors are either hard or impossible to make.

A fluent syntax helps discover the various operators.

## Getting started
Download the package from `npm` with\:

```
npm install XXX
```

Import the package at the top of your TypeScript file\:

```ts
import * as TSInMemDb from "ts-in-memory-database"
```

Define the datatypes of your database\:

```ts
interface Person {
  Name: string
  Surname: string
  Age: number
}

interface Address {
  Street: string
  Number: number
  Postcode: string
}

interface City {
  Name: string
  Population: number
}
```

Define the entities and relations of your database\:

```ts
interface MyEntities {
  People: Entity<{ PersonId: number }, Person, {
    Addresses: Relation<MyEntities, "People", "Addresses", "N-1">
  }, MyEntities>
  Addresses: Entity<{ AddressId: number }, Address, {
    Cities: Relation<MyEntities, "Addresses", "Cities", "N-1">,
    People: Inverted<EntityRelations<MyEntities["People"]>["Addresses"]>
  }, MyEntities>
  Cities: Entity<{ CityId: number }, City, {
    Addresses: Inverted<EntityRelations<MyEntities["Addresses"]>["Cities"]>
  }, MyEntities>
}
```

Create a database. You need to specify both entities and relationships. You could do this manually. It is a bit verbose, so check out the [full sample](./sample.ts). When you have all the data, you can instantiate `MyEntities`, and with it a database around it\:

```ts
const myEntities: MyEntities = {
  People: ...,
  Addresses: ...,
  Cities: ...
}

const db: Database<MyEntities> = Database(myEntities)
```

Finally, we can run some queries\:

Get all people whose `Name` starts with `Giu`. Rename attribute `Name` to `FirstName` in the result\:

```ts
const q0 = db.from("People").fieldAs("Name", "FirstName").select("FirstName").filter(p => p.FirstName.startsWith("Giu"))

/* Returns
[
 {
  "FirstName": "Giuseppe"
 },
 {
  "FirstName": "Giulia"
 }
]
*/
```

For each person, get their addresses as well. Select only the `Street` and `Number` attributes of each address\:

```ts
const q1 = db.from("People").expand(db, "Addresses", a => a.select("Street", "Number"))

/* Returns
[
 {
  "Name": "John",
  "Surname": "Doe",
  "Age": 27,
  "Addresses": [
   {
    "Street": "Afrikaanderplein",
    "Number": 7
   }
  ]
 },
 ...
 {
  "Name": "Giuseppe",
  "Surname": "Rossi",
  "Age": 35,
  "Addresses": [
   {
    "Street": "Kalverstraat",
    "Number": 92
   }
  ]
 },
 ...
]
*/
```

For each person, their address, and its city, make a single entity with all the attributes of the three input entities. Select only the `Street` and `Number` attributes of each address. Rename the `Name` attribute of the `City` to `CityName` to avoid overlap with `Person` `Name`\:

```ts
const q2 = db.from("People").join(db, "Addresses", a => a.select("Street", "Number").join(db, "Cities", c => c.fieldAs("Name", "CityName")))

/* Returns
[
 {
  "Name": "John",
  "Surname": "Doe",
  "Age": 27,
  "Street": "Afrikaanderplein",
  "Number": 7,
  "Population": 1250000,
  "CityName": "Rotterdam"
 },
 ...
 {
  "Name": "Giuseppe",
  "Surname": "Rossi",
  "Age": 35,
  "Street": "Kalverstraat",
  "Number": 92,
  "Population": 1250000,
  "CityName": "Amsterdam"
 },
 ...
]
*/
```

For each city, expand its addresses, and for each address, expand the people living there\:

```ts
const q3 = db.from("Cities").expand(db, "Addresses", a => a.expand(db, "People", p => p))

/* Returns
[
 {
  "Name": "Rotterdam",
  "Population": 1250000,
  "Addresses": [
   {
    "Street": "Afrikaanderplein",
    "Number": 7,
    "Postcode": "3072 EA",
    "People": [
     {
      "Name": "John",
      "Surname": "Doe",
      "Age": 27
     },
     {
      "Name": "Jane",
      "Surname": "Doe",
      "Age": 31
     }
    ]
   }
  ]
 },
 ...
]
*/
```

For each city, expand its addresses, and for each address, expand the people living there. Rename the `People` attribute of `Address` to `Inhabitants`\:

```ts
const q4 = db.from("Cities").expand(db, "Addresses", a => a.expandAs(db, "People", "Inhabitants", p => p))

/* Returns
[
 {
  "Name": "Rotterdam",
  "Population": 1250000,
  "Addresses": [
   {
    "Street": "Afrikaanderplein",
    "Number": 7,
    "Postcode": "3072 EA",
    "Inhabitants": [
     {
      "Name": "John",
      "Surname": "Doe",
      "Age": 27
     },
     {
      "Name": "Jane",
      "Surname": "Doe",
      "Age": 31
     }
    ]
   }
  ]
 },
  ...
]
*/
```

For each person, and their address, make a single entity with all the attributes of the two input entities (we selected no attributes from the addresses though, so we only get the attributes of each `Person` in practice). For each resulting entity, expand the city found at that address\:

```ts
const q5 = db.from("People").join(db, "Addresses", a => a.select().expand(db, "Cities", c => c))

/* Returns
[
 {
  "Name": "John",
  "Surname": "Doe",
  "Age": 27,
  "Cities": [
   {
    "Name": "Rotterdam",
    "Population": 1250000
   }
  ]
 },
  ...
 {
  "Name": "Giuseppe",
  "Surname": "Rossi",
  "Age": 35,
  "Cities": [
   {
    "Name": "Amsterdam",
    "Population": 1250000
   }
  ]
 },
 ...
]
*/
```


## Still missing
Some SQL\-style operators such as `GroupBy` are still missing. The only supported `join` is actually an `inner join`.

Writing to the database can already be done, but is not particularly ergonomic. For now the focus lies on data processing\: if needed, some handier writing operators could be added.

We want to build some operators to import results from, say, a _Graph Api_ result such as OData or GraphQL into our database structure. This way a developer would be able to quickly fill up their local database
