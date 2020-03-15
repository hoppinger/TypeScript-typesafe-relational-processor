import { Record, List, Map, Set, is } from "immutable"
import { Without, Fun, Rename } from "./utils"

export type EntityId<E> =
  E extends Entity<infer Id, infer Fields, infer Relations, infer AllEntities> ?
  Id : never

export type EntityRelations<E> =
  E extends Entity<infer Id, infer Fields, infer Relations, infer AllEntities> ?
  Relations : never

export type InvertedAriety<Ariety> =
  Ariety extends "1-N" ? "N-1" : Ariety extends "N-1" ? "1-N" : Ariety

export type Inverted<R> =
  R extends Relation<infer Db, infer Source, infer Target, infer Ariety> ?
  Relation<Db, Target, Source, InvertedAriety<Ariety>>
  : never

export type SourceName<R> =
  R extends Relation<infer Db, infer SourceName, infer TargetName, infer Ariety> ?
  SourceName : never

export type TargetName<R> =
  R extends Relation<infer Db, infer SourceName, infer TargetName, infer Ariety> ?
  TargetName : never

export type Source<R> =
  R extends Relation<infer Db, infer SourceName, infer TargetName, infer Ariety> ?
  Db[SourceName] : never

export type Target<R> =
  R extends Relation<infer Db, infer SourceName, infer TargetName, infer Ariety> ?
  Db[TargetName] : never

export interface Relation<Db, SourceName extends keyof Db, TargetName extends keyof Db, Ariety> {
  Inverted: () => Inverted<Relation<Db, SourceName, TargetName, Ariety>>
  values: () => Map<Record<EntityId<Db[SourceName]>>, Set<Record<EntityId<Db[TargetName]>>>>
}

export interface Entity<Id extends  Object, Fields, Relations, Db> {
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

export interface Database<Entities> {
  from: <E extends keyof Entities>(entity: E) => Entities[E]
}

const MakePair = <t, u>(t: t, u: u): [t, u] => [t, u]

export const Relation = <Db, SourceName extends keyof Db, TargetName extends keyof Db, Ariety> (values: Map < Record < EntityId < Db[SourceName] >>, Set <Record<EntityId<Db[TargetName]>>>>): Relation<Db, SourceName, TargetName, Ariety> => ({
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

export const Entity = <Db>() => <Id, Fields, Relations>(values:Map<Record<Id>, Fields>, relations: Relations): Entity<Id, Fields, Relations, Db> => ({
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

export const Database = <Entities>(entities: Entities): Database<Entities> => ({
  from: <E extends keyof Entities>(entity: E): Entities[E] => entities[entity]
})
