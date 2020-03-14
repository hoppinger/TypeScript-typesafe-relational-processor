import { Record, List, Map, Set, is } from "immutable"

type Without<T, K> = Pick<T, Exclude<keyof T, K>>
type Fun<a, b> = (_: a) => b

const Without = <T, K extends keyof T>(key: K, { [key]: _, ...values }: T): Without<T, K> => values
const Rename = <T, KOld extends keyof T, KNew extends string>(keyOld: KOld, keyNew: KNew, { [keyOld]: value, ...values }: T):
  Without<T, KOld> & { [x in KNew]: T[KOld] } => 
  ({ ...values, ...{ [keyNew]: value } as { [x in KNew]: T[KOld] } })

type EntityId<E> =
  E extends Entity<infer Id, infer Fields, infer Relations, infer AllEntities> ?
  Id : never

type EntityRelations<E> =
  E extends Entity<infer Id, infer Fields, infer Relations, infer AllEntities> ?
  Relations : never

type InvertedAriety<Ariety> =
  Ariety extends "1-N" ? "N-1" : Ariety extends "N-1" ? "1-N" : Ariety

type Inverted<R> =
  R extends Relation<infer Db, infer Source, infer Target, infer Ariety> ?
  Relation<Db, Target, Source, InvertedAriety<Ariety>>
  : never

type SourceName<R> =
  R extends Relation<infer Db, infer SourceName, infer TargetName, infer Ariety> ?
  SourceName : never

type TargetName<R> =
  R extends Relation<infer Db, infer SourceName, infer TargetName, infer Ariety> ?
  TargetName : never

type Source<R> =
  R extends Relation<infer Db, infer SourceName, infer TargetName, infer Ariety> ?
  Db[SourceName] : never

type Target<R> =
  R extends Relation<infer Db, infer SourceName, infer TargetName, infer Ariety> ?
  Db[TargetName] : never

interface Relation<Db, SourceName extends keyof Db, TargetName extends keyof Db, Ariety> {
  Inverted: () => Inverted<Relation<Db, SourceName, TargetName, Ariety>>
  values: () => Map<Record<EntityId<Db[SourceName]>>, Set<Record<EntityId<Db[TargetName]>>>>
}

interface Entity<Id extends  Object, Fields, Relations, Db> {
  fieldAs: <k extends keyof Fields, kNew extends string>(key: k, keyNew:kNew) => Entity<Id, Without<Fields, k> & { [x in kNew]:Fields[k] }, Relations, Db>
  select: <k extends keyof Fields>(...keys: k[]) => Entity<Id, Pick<Fields, k>, Relations, Db>
  filter: (p: (fields:Fields, id:Record<Id>) => boolean) => Entity<Id, Fields, Relations, Db>
  expand: <r extends keyof Relations & string, Id2, Fields2, Relations2>(db: Database<Db>, relation: r, q: Fun<Target<Relations[r]>, Entity<Id2, Fields2, Relations2, Db>>) =>
      Entity<Id, Fields & { [x in TargetName<Relations[r]>]: Map<Id2, Fields2> }, Without<Relations, r>, Db>
  expandAs: <r extends keyof Relations & string, as extends string, Id2, Fields2, Relations2>(db: Database<Db>, relation: r, as:as, q: Fun<Target<Relations[r]>, Entity<Id2, Fields2, Relations2, Db>>) =>
      Entity<Id, Fields & { [x in as]: Map<Id2, Fields2> }, Without<Relations, r>, Db>
  join: <r extends keyof Relations, Id2, Fields2, Relations2>(db: Database<Db>, relation: r, q: Fun<Target<Relations[r]>, Entity<Id2, Fields2, Relations2, Db>>) =>
      Entity<Id, Fields & Fields2, Relations, Db>
  relations: () => Relations
  values: () => Map<Record<Id>, Fields>
}

interface Database<Entities> {
  from: <E extends keyof Entities>(entity: E) => Entities[E]
}

const MakePair = <t, u>(t: t, u: u): [t, u] => [t, u]

const Relation = <Db, SourceName extends keyof Db, TargetName extends keyof Db, Ariety> (values: Map < Record < EntityId < Db[SourceName] >>, Set <Record<EntityId<Db[TargetName]>>>>): Relation<Db, SourceName, TargetName, Ariety> => ({
  Inverted: (): Inverted<Relation<Db, SourceName, TargetName, Ariety>> => {
    let invertedValues = Map<Record<EntityId<Db[TargetName]>>, Set<Record<EntityId<Db[SourceName]>>>>()
    const emptySet = Set()
    values.forEach((k2s, k1) => 
      k2s.forEach(k2 =>
        invertedValues = invertedValues.update(k2, emptySet, x => x.add(k1))
      )
    )
    return Relation<Db, TargetName, SourceName, InvertedAriety<Ariety>>(invertedValues)
  },
  values: () => values
})

const Entity = <Db>() => <Id, Fields, Relations>(values:Map<Record<Id>, Fields>, relations: Relations): Entity<Id, Fields, Relations, Db> => ({
  fieldAs: <k extends keyof Fields, kNew extends string>(key: k, keyNew: kNew):
    Entity<Id, Without<Fields, k> & { [x in kNew]: Fields[k] }, Relations, Db> =>
    Entity<Db>()(values.map(f => Rename<Fields, k, kNew>(key, keyNew, f)), relations),
  select: <k extends keyof Fields>(...keys: k[]): Entity<Id, Pick<Fields, k>, Relations, Db> =>
    Entity<Db>()(values.map(f => keys.reduce((a, e) => ({ ...a, [e]: f[e] }), {}) as Pick<Fields, k>), relations),
  filter: (p: (fields: Fields, id: Record<Id>) => boolean): Entity<Id, Fields, Relations, Db> =>
    Entity<Db>()(values.filter(p), relations),
  expand: function <r extends keyof Relations & string, Id2, Fields2, Relations2>(this, db: Database<Db>, relation: r, q: Fun<Target<Relations[r]>, Entity<Id2, Fields2, Relations2, Db>>):
    Entity<Id, Fields & { [x in TargetName<Relations[r]>]: Map<Id2, Fields2> }, Without<Relations, r>, Db> {
    return this.expandAs(db, relation, relation, q)
  },
  expandAs: <r extends keyof Relations & string, as extends string, Id2, Fields2, Relations2>(db: Database<Db>, relation: r, as: as, q: Fun<Target<Relations[r]>, Entity<Id2, Fields2, Relations2, Db>>) :
    Entity<Id, Fields & { [x in as]: Map<Id2, Fields2> }, Without<Relations, r>, Db> => {
    const allLinks = (relations[relation] as any).values()
    const otherEntity = (db.from(relation as any) as any)
    const allTargets = otherEntity.values()
    const res = Entity<Db>()(values.map((fields, id) => {
      const links = allLinks.get(id) || Set()
      const targets = links.reduce((acc: any, targetId: any) => acc.set(targetId, allTargets.get(targetId)), Map())
      return {
        ...fields,
        ...Rename(relation, as,
          { [relation]: q(Entity<Db>()(targets, otherEntity.relations()) as any).values() as any })
      }
    }), Without(relation, relations))
    return res
  },
  join: <r extends keyof Relations, Id2, Fields2, Relations2>(db: Database<Db>, relation: r, q: Fun<Target<Relations[r]>, Entity<Id2, Fields2, Relations2, Db>>) :
    Entity<Id, Fields & Fields2, Relations, Db> => {
    const allLinks = (relations[relation] as any).values()
    const otherEntity = (db.from(relation as any) as any)
    const allTargets = otherEntity.values()
    let mergedValues = Map<Record<Id>, Fields & Fields2>()
    values.forEach((sourceFields, sourceId) => {
      const links = allLinks.get(sourceId) || Set()
      const targets = links.reduce((acc: any, targetId: any) => acc.set(targetId, allTargets.get(targetId)), Map())
      q(Entity<Db>()(targets, otherEntity.relations()) as any).values().forEach((targetFields: any, targetId: any) => {
        mergedValues = mergedValues.set(sourceId,
          { ...sourceFields, ...targetFields })
      })
    })
    const res = Entity<Db>()(mergedValues, relations)
    return res
  },
  relations: (): Relations => relations,
  values: () : Map<Record<Id>, Fields> => values
})

const Database = <Entities>(entities: Entities): Database<Entities> => ({
  from: <E extends keyof Entities>(entity: E): Entities[E] => entities[entity]
})


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
    .set(PersonId({ PersonId: 2 }), { Name: "Giuseppe", Surname: "Maggiore", Age: 35})
    .set(PersonId({ PersonId: 3 }), { Name: "Giulia", Surname: "Costantini", Age: 34 })
    .set(PersonId({ PersonId: 4 }), { Name: "Rebecca Sofia", Surname: "Maggiore", Age: 9 })
    .set(PersonId({ PersonId: 5 }), { Name: "Rachel", Surname: "Maggiore", Age: 3 })
    .set(PersonId({ PersonId: 6 }), { Name: "Francesco", Surname: "Di Giacomo", Age: 35 })
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
  Cities: Entity<MyEntities>()(Map<Record<{ CityId: number }>, City>()
    .set(CityId({ CityId: 0 }), { Name: "Rotterdam", Population: 1250000 })
    .set(CityId({ CityId: 1 }), { Name: "Amsterdam", Population: 250000 })
    .set(CityId({ CityId: 2 }), { Name: "Hengelo", Population: 150000 })
  ,
  {
    Addresses: addressCities.Inverted()
  })
}

const db: Database<MyEntities> = Database(myEntities)
const x0 = db.from("People").fieldAs("Name", "Nome").select("Nome").filter(p => p.Nome.startsWith("Giu"))
const x1 = db.from("People").expand(db, "Addresses", a => a.select("Street", "Number"))
const x2 = db.from("People").join(db, "Addresses", a => a.select("Street", "Number").join(db, "Cities", c => c.fieldAs("Name", "CityName")))
const x3 = db.from("Cities").expand(db, "Addresses", a => a.expand(db, "People", p => p))
const x4 = db.from("Cities").expand(db, "Addresses", a => a.expandAs(db, "People", "Inhabitants", p => p))

const v0 = x0.values().toArray()
const v1 = x1.values().toArray().map(x => ({ ...x[1], Addresses: x[1].Addresses.toArray().map(a => a[1]) }))
const v2 = x2.values().toArray().map(x => x[1])
const v3 = x3.values().toArray().map(x => ({ ...x[1], Addresses: x[1].Addresses.toArray().map(a => a[1]) }))
const v4 = x4.values().toArray().map(x => ({ ...x[1], Addresses: x[1].Addresses.toArray().map(a => a[1]) }))

console.log("Done")

/* todo:
 * define better constraints on Relations in Entity and expand, expandAs, and join?
 * readme!!!
 * odataParser to create a database
 */
