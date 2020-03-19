import { Record, List, Map, Set, is } from "immutable"
import { Entity, Relation, Inverted, EntityRelations, Database } from "./database"

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
  
  const PersonId = Record({ PersonId: 0 })
  const AddressId = Record({ AddressId: 0 })
  const CityId = Record({ CityId: 0 })
  
  const personAddresses = Relation<MyEntities, "People", "Addresses", "N-1">(
    Map<Record<{ PersonId: number }>, Set<Record<{ AddressId: number }>>>()
      .set(PersonId({ PersonId: 0 }), Set<Record<{ AddressId: number }>>()
        .add(AddressId({ AddressId: 0 })))
      .set(PersonId({ PersonId: 1 }), Set<Record<{ AddressId: number }>>()
        .add(AddressId({ AddressId: 0 })))
      .set(PersonId({ PersonId: 2 }), Set<Record<{ AddressId: number }>>()
        .add(AddressId({ AddressId: 1 })))
      .set(PersonId({ PersonId: 3 }), Set<Record<{ AddressId: number }>>()
        .add(AddressId({ AddressId: 1 })))
      .set(PersonId({ PersonId: 4 }), Set<Record<{ AddressId: number }>>()
        .add(AddressId({ AddressId: 1 })))
      .set(PersonId({ PersonId: 5 }), Set<Record<{ AddressId: number }>>()
        .add(AddressId({ AddressId: 1 })))
      .set(PersonId({ PersonId: 6 }), Set<Record<{ AddressId: number }>>()
        .add(AddressId({ AddressId: 2 })))
  )
  
  const addressCities = Relation<MyEntities, "Addresses", "Cities", "N-1">(
    Map<Record<{ AddressId: number }>, Set<Record<{ CityId: number }>>>()
      .set(AddressId({ AddressId: 0 }), Set<Record<{ CityId: number }>>()
        .add(CityId({ CityId: 0 })))
      .set(AddressId({ AddressId: 1 }), Set<Record<{ CityId: number }>>()
        .add(CityId({ CityId: 1 })))
      .set(AddressId({ AddressId: 2 }), Set<Record<{ CityId: number }>>()
        .add(CityId({ CityId: 2 })))
  )
  
  const myEntities: MyEntities = {
    People: Entity<MyEntities>()(Map<Record<{ PersonId: number }>, Person>()
      .set(PersonId({ PersonId: 0 }), { Name: "John", Surname: "Doe", Age: 27 })
      .set(PersonId({ PersonId: 1 }), { Name: "Jane", Surname: "Doe", Age: 31 })
      .set(PersonId({ PersonId: 2 }), { Name: "Giuseppe", Surname: "Rossi", Age: 35})
      .set(PersonId({ PersonId: 3 }), { Name: "Giulia", Surname: "Verdi", Age: 34 })
      .set(PersonId({ PersonId: 4 }), { Name: "Reby", Surname: "Rossi", Age: 7 })
      .set(PersonId({ PersonId: 5 }), { Name: "Rechy", Surname: "Rossi", Age: 5 })
      .set(PersonId({ PersonId: 6 }), { Name: "Francis", Surname: "Dee Jay", Age: 35 })
    ,
    {
      Addresses: personAddresses
    }),
    Addresses: Entity<MyEntities>()(Map<Record<{ AddressId: number }>, Address>()
      .set(AddressId({ AddressId: 0 }), { Street: "Afrikaanderplein", Number: 7, Postcode: "3072 EA" })
      .set(AddressId({ AddressId: 1 }), { Street: "Kalverstraat", Number: 92, Postcode: "1012 PH" })
      .set(AddressId({ AddressId: 2 }), { Street: "Heidelaan", Number: 139, Postcode: "3851 EX" })
    ,
    {
      People: personAddresses.Inverted(),
      Cities: addressCities,
      }),
    // sort of random values, did not check if they are accurate :)
    Cities: Entity<MyEntities>()(Map<Record<{ CityId: number }>, City>()
      .set(CityId({ CityId: 0 }), { Name: "Rotterdam", Population: 1250000 })
      .set(CityId({ CityId: 1 }), { Name: "Amsterdam", Population: 1250000 })
      .set(CityId({ CityId: 2 }), { Name: "Hengelo", Population: 150000 })
    ,
    {
      Addresses: addressCities.Inverted()
    })
  }
  
export const test = () => {
  const db: Database<MyEntities> = Database(myEntities)
  const q0 = db.from("People").fieldAs("Name", "FirstName").select("FirstName").filter(p => p.FirstName.startsWith("Giu"))
  const q1 = db.from("People").expand(db, "Addresses", a => a.select("Street", "Number"))
  const q2 = db.from("People").join(db, "Addresses", a => a.select("Street", "Number").join(db, "Cities", c => c.fieldAs("Name", "CityName")))
  const q3 = db.from("Cities").expand(db, "Addresses", a => a.expand(db, "People", p => p))
  const q4 = db.from("Cities").expand(db, "Addresses", a => a.expandAs(db, "People", "Inhabitants", p => p))
  const q5 = db.from("People").join(db, "Addresses", a => a.select().expand(db, "Cities", c => c))
  
  const v0 = q0.values().toArray().map(x => x[1])
  const v1 = q1.values().toArray().map(x => ({ ...x[1], Addresses: x[1].Addresses.toArray().map(a => a[1]) }))
  const v2 = q2.values().toArray().map(x => x[1])
  const v3 = q3.values().toArray().map(x => ({ ...x[1], Addresses: x[1].Addresses.toArray().map(a => ({ ...a[1], People: a[1].People.toArray().map(p => p[1]) })) }))
  const v4 = q4.values().toArray().map(x => ({ ...x[1], Addresses: x[1].Addresses.toArray().map(a => ({ ...a[1], Inhabitants: a[1].Inhabitants.toArray().map(p => p[1]) })) }))
  const v5 = q5.values().toArray().map(x => ({ ...x[1], Cities: x[1].Cities.toArray().map(c => c[1]) }))
  
  const results = [v0, v1, v2, v3, v4, v5].map(v => JSON.stringify(v, null, 1))
  
  results.forEach(r => console.log(r))
  console.log(`Done.`)
}