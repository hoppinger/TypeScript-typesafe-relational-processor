"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const immutable_1 = require("immutable");
const database_1 = require("./database");
const PersonId = immutable_1.Record({ PersonId: 0 });
const AddressId = immutable_1.Record({ AddressId: 0 });
const CityId = immutable_1.Record({ CityId: 0 });
const personAddresses = database_1.Relation(immutable_1.Map()
    .set(PersonId({ PersonId: 0 }), immutable_1.Set()
    .add(AddressId({ AddressId: 0 })))
    .set(PersonId({ PersonId: 1 }), immutable_1.Set()
    .add(AddressId({ AddressId: 0 })))
    .set(PersonId({ PersonId: 2 }), immutable_1.Set()
    .add(AddressId({ AddressId: 1 })))
    .set(PersonId({ PersonId: 3 }), immutable_1.Set()
    .add(AddressId({ AddressId: 1 })))
    .set(PersonId({ PersonId: 4 }), immutable_1.Set()
    .add(AddressId({ AddressId: 1 })))
    .set(PersonId({ PersonId: 5 }), immutable_1.Set()
    .add(AddressId({ AddressId: 1 })))
    .set(PersonId({ PersonId: 6 }), immutable_1.Set()
    .add(AddressId({ AddressId: 2 }))));
const addressCities = database_1.Relation(immutable_1.Map()
    .set(AddressId({ AddressId: 0 }), immutable_1.Set()
    .add(CityId({ CityId: 0 })))
    .set(AddressId({ AddressId: 1 }), immutable_1.Set()
    .add(CityId({ CityId: 1 })))
    .set(AddressId({ AddressId: 2 }), immutable_1.Set()
    .add(CityId({ CityId: 2 }))));
const myEntities = {
    People: database_1.Entity()(immutable_1.Map()
        .set(PersonId({ PersonId: 0 }), { Name: "John", Surname: "Doe", Age: 27 })
        .set(PersonId({ PersonId: 1 }), { Name: "Jane", Surname: "Doe", Age: 31 })
        .set(PersonId({ PersonId: 2 }), { Name: "Giuseppe", Surname: "Rossi", Age: 35 })
        .set(PersonId({ PersonId: 3 }), { Name: "Giulia", Surname: "Verdi", Age: 34 })
        .set(PersonId({ PersonId: 4 }), { Name: "Reby", Surname: "Rossi", Age: 7 })
        .set(PersonId({ PersonId: 5 }), { Name: "Rechy", Surname: "Rossi", Age: 5 })
        .set(PersonId({ PersonId: 6 }), { Name: "Francis", Surname: "Dee Jay", Age: 35 }), {
        Addresses: personAddresses
    }),
    Addresses: database_1.Entity()(immutable_1.Map()
        .set(AddressId({ AddressId: 0 }), { Street: "Afrikaanderplein", Number: 7, Postcode: "3072 EA" })
        .set(AddressId({ AddressId: 1 }), { Street: "Kalverstraat", Number: 92, Postcode: "1012 PH" })
        .set(AddressId({ AddressId: 2 }), { Street: "Heidelaan", Number: 139, Postcode: "3851 EX" }), {
        People: personAddresses.Inverted(),
        Cities: addressCities,
    }),
    // sort of random values, did not check if they are accurate :)
    Cities: database_1.Entity()(immutable_1.Map()
        .set(CityId({ CityId: 0 }), { Name: "Rotterdam", Population: 1250000 })
        .set(CityId({ CityId: 1 }), { Name: "Amsterdam", Population: 1250000 })
        .set(CityId({ CityId: 2 }), { Name: "Hengelo", Population: 150000 }), {
        Addresses: addressCities.Inverted()
    })
};
exports.test = () => {
    const db = database_1.Database(myEntities);
    const q0 = db.from("People").fieldAs("Name", "FirstName").select("FirstName").filter(p => p.FirstName.startsWith("Giu"));
    const q1 = db.from("People").expand(db, "Addresses", a => a.select("Street", "Number"));
    const q2 = db.from("People").join(db, "Addresses", a => a.select("Street", "Number").join(db, "Cities", c => c.fieldAs("Name", "CityName")));
    const q3 = db.from("Cities").expand(db, "Addresses", a => a.expand(db, "People", p => p));
    const q4 = db.from("Cities").expand(db, "Addresses", a => a.expandAs(db, "People", "Inhabitants", p => p));
    const q5 = db.from("People").join(db, "Addresses", a => a.select().expand(db, "Cities", c => c));
    const v0 = q0.values().toArray().map(x => x[1]);
    const v1 = q1.values().toArray().map(x => (Object.assign(Object.assign({}, x[1]), { Addresses: x[1].Addresses.toArray().map(a => a[1]) })));
    const v2 = q2.values().toArray().map(x => x[1]);
    const v3 = q3.values().toArray().map(x => (Object.assign(Object.assign({}, x[1]), { Addresses: x[1].Addresses.toArray().map(a => (Object.assign(Object.assign({}, a[1]), { People: a[1].People.toArray().map(p => p[1]) }))) })));
    const v4 = q4.values().toArray().map(x => (Object.assign(Object.assign({}, x[1]), { Addresses: x[1].Addresses.toArray().map(a => (Object.assign(Object.assign({}, a[1]), { Inhabitants: a[1].Inhabitants.toArray().map(p => p[1]) }))) })));
    const v5 = q5.values().toArray().map(x => (Object.assign(Object.assign({}, x[1]), { Cities: x[1].Cities.toArray().map(c => c[1]) })));
    const results = [v0, v1, v2, v3, v4, v5].map(v => JSON.stringify(v, null, 1));
    results.forEach(r => console.log(r));
    console.log(`Done.`);
};
//# sourceMappingURL=sample.js.map