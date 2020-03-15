import { Record, Map, Set } from "immutable";
import { Without, Fun } from "./utils";
export declare type EntityId<E> = E extends Entity<infer Id, infer Fields, infer Relations, infer AllEntities> ? Id : never;
export declare type EntityRelations<E> = E extends Entity<infer Id, infer Fields, infer Relations, infer AllEntities> ? Relations : never;
export declare type InvertedAriety<Ariety> = Ariety extends "1-N" ? "N-1" : Ariety extends "N-1" ? "1-N" : Ariety;
export declare type Inverted<R> = R extends Relation<infer Db, infer Source, infer Target, infer Ariety> ? Relation<Db, Target, Source, InvertedAriety<Ariety>> : never;
export declare type SourceName<R> = R extends Relation<infer Db, infer SourceName, infer TargetName, infer Ariety> ? SourceName : never;
export declare type TargetName<R> = R extends Relation<infer Db, infer SourceName, infer TargetName, infer Ariety> ? TargetName : never;
export declare type Source<R> = R extends Relation<infer Db, infer SourceName, infer TargetName, infer Ariety> ? Db[SourceName] : never;
export declare type Target<R> = R extends Relation<infer Db, infer SourceName, infer TargetName, infer Ariety> ? Db[TargetName] : never;
export interface Relation<Db, SourceName extends keyof Db, TargetName extends keyof Db, Ariety> {
    Inverted: () => Inverted<Relation<Db, SourceName, TargetName, Ariety>>;
    values: () => Map<Record<EntityId<Db[SourceName]>>, Set<Record<EntityId<Db[TargetName]>>>>;
}
export interface Entity<Id extends Object, Fields, Relations, Db> {
    fieldAs: <k extends keyof Fields, kNew extends string>(key: k, keyNew: kNew) => Entity<Id, Without<Fields, k> & {
        [x in kNew]: Fields[k];
    }, Relations, Db>;
    select: <k extends keyof Fields>(...keys: k[]) => Entity<Id, Pick<Fields, k>, Relations, Db>;
    filter: (p: (fields: Fields, id: Record<Id>) => boolean) => Entity<Id, Fields, Relations, Db>;
    expand: <r extends keyof Relations & string, Id2, Fields2, Relations2>(db: Database<Db>, relation: r, q: Fun<Target<Relations[r]>, Entity<Id2, Fields2, Relations2, Db>>) => Entity<Id, Fields & {
        [x in TargetName<Relations[r]>]: Map<Id2, Fields2>;
    }, Without<Relations, r>, Db>;
    expandAs: <r extends keyof Relations & string, as extends string, Id2, Fields2, Relations2>(db: Database<Db>, relation: r, as: as, q: Fun<Target<Relations[r]>, Entity<Id2, Fields2, Relations2, Db>>) => Entity<Id, Fields & {
        [x in as]: Map<Id2, Fields2>;
    }, Without<Relations, r>, Db>;
    join: <r extends keyof Relations, Id2, Fields2, Relations2>(db: Database<Db>, relation: r, q: Fun<Target<Relations[r]>, Entity<Id2, Fields2, Relations2, Db>>) => Entity<Id, Fields & Fields2, Relations, Db>;
    relations: () => Relations;
    values: () => Map<Record<Id>, Fields>;
}
export interface Database<Entities> {
    from: <E extends keyof Entities>(entity: E) => Entities[E];
}
export declare const Relation: <Db, SourceName_1 extends keyof Db, TargetName_1 extends keyof Db, Ariety>(values: Map<Record<EntityId<Db[SourceName_1]>>, Set<Record<EntityId<Db[TargetName_1]>>>>) => Relation<Db, SourceName_1, TargetName_1, Ariety>;
export declare const Entity: <Db>() => <Id, Fields, Relations>(values: Map<Record<Id>, Fields>, relations: Relations) => Entity<Id, Fields, Relations, Db>;
export declare const Database: <Entities>(entities: Entities) => Database<Entities>;
