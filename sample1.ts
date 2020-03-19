import { Record, List, Map, Set, is } from "immutable"
import { Entity, Relation, Inverted, EntityRelations, Database } from "./database"

interface Person {
    Name: string
    Surname: string
    Age: number
  }
    
interface MyEntities {
  People: Entity<{ PersonId: number }, Person, {
  }, MyEntities>
}

const PersonId = Record({ PersonId: 0 })
    
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
  })
}

export const test = () => {
const db: Database<MyEntities> = Database(myEntities)
const q0 = db.from("People").select("Name", "Surname")
const q1 = db.from("People").filter(p => p.Age >= 18)
const q2 = db.from("People").filter(p => p.Age >= 18).select("Name")
const q3 = db.from("People").fieldAs("Name", "FirstName")
const q4 = db.from("People").fieldAs("Name", "FirstName").select("FirstName").filter(p => p.FirstName.startsWith("Giu"))
  
  const v0 = q0.values().toArray().map(x => x[1])
  const v1 = q1.values().toArray().map(x => x[1])
  const v2 = q2.values().toArray().map(x => x[1])
  const v3 = q3.values().toArray().map(x => x[1])
  const v4 = q4.values().toArray().map(x => x[1])
  
  const results = [v0, v1, v2, v3, v4].map(v => JSON.stringify(v, null, 1))
  
  results.forEach(r => console.log(r))
  console.log(`Done.`)
}
