"use strict";
//type Primitives = { string: string, number: number, boolean: boolean }
//type Flattener<currentEntity extends string, currentFields, flatResult, relations> = {
//  withField: <a extends string, t extends keyof Primitives>(attribute: a, type: t) =>
//    Flattener<currentEntity, currentFields & { [x in a]: Primitives[t] }, flatResult, relations>
//  withMany: <r extends string, nestedResult, nestedFlatResult, relationsResult>(relation: r,
//    builder: Fun<Flattener<r, {}, flatResult, relations>, Flattener<r, nestedResult, nestedFlatResult, relationsResult>>) =>
//    Flattener<currentEntity, currentFields,
//      nestedFlatResult & { [x in r]: nestedResult[] },
//      relationsResult & { [x in currentEntity]: { [target in r]:"many" } }>
//  withOne: <r extends string, nestedResult, nestedFlatResult, relationsResult>(relation: r,
//    builder: Fun<Flattener<r, {}, flatResult, relations>, Flattener<r, nestedResult, nestedFlatResult, relationsResult>>) =>
//    Flattener<currentEntity, currentFields,
//      nestedFlatResult & { [x in r]: nestedResult[] },
//      relationsResult & { [x in currentEntity]: { [target in r]: "one" } }>
//  run: () => flatResult & { [x in currentEntity]: currentFields[] } & { relations: relations }
//}
///*
// * relations in type
// * multiple relations from same source in type
// * self-references
// * runtime (flattener)
// * re-hierarchify types
// * runtime (re-hierarchifier)
// */
//let f: Flattener<"person", {}, {}, {}> = null!
//const result = f
//  .withField("name", "string")
//  .withField("surname", "string")
//  .withField("age", "number")
//  .withOne("city", b => b
//    .withField("name", "string")
//    .withField("population", "number")
//    .withOne("country", b =>
//      b.withField("name", "string")
//        .withField("continent", "string")
//    )
//  )
//  .withMany("employer", b => b
//    .withField("name", "string")
//    .withField("employees", "number")
//  )
//  .run()
//const x: typeof result = null!
//# sourceMappingURL=Flattener.js.map