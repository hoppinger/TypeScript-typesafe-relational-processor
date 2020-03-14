"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
const immutable_1 = require("immutable");
const Without = (key, _a) => {
    var _b = key, _ = _a[_b], values = __rest(_a, [typeof _b === "symbol" ? _b : _b + ""]);
    return values;
};
const Rename = (keyOld, keyNew, _a) => {
    var _b = keyOld, value = _a[_b], values = __rest(_a, [typeof _b === "symbol" ? _b : _b + ""]);
    return (Object.assign(Object.assign({}, values), { [keyNew]: value }));
};
const MakePair = (t, u) => [t, u];
const Relation = (values) => ({
    Inverted: () => {
        let invertedValues = immutable_1.Map();
        const emptySet = immutable_1.Set();
        values.forEach((k2s, k1) => k2s.forEach(k2 => invertedValues = invertedValues.update(k2, emptySet, x => x.add(k1))));
        return Relation(invertedValues);
    },
    values: () => values
});
const Entity = () => (values, relations) => ({
    fieldAs: (key, keyNew) => Entity()(values.map(f => Rename(key, keyNew, f)), relations),
    select: (...keys) => Entity()(values.map(f => keys.reduce((a, e) => (Object.assign(Object.assign({}, a), { [e]: f[e] })), {})), relations),
    filter: (p) => Entity()(values.filter(p), relations),
    expand: function (db, relation, q) {
        return this.expandAs(db, relation, relation, q);
    },
    expandAs: (db, relation, as, q) => {
        const allLinks = relations[relation].values();
        const otherEntity = db.from(relation);
        const allTargets = otherEntity.values();
        const res = Entity()(values.map((fields, id) => {
            const links = allLinks.get(id) || immutable_1.Set();
            const targets = links.reduce((acc, targetId) => acc.set(targetId, allTargets.get(targetId)), immutable_1.Map());
            return Object.assign(Object.assign({}, fields), Rename(relation, as, { [relation]: q(Entity()(targets, otherEntity.relations())).values() }));
        }), Without(relation, relations));
        return res;
    },
    join: (db, relation, q) => {
        const allLinks = relations[relation].values();
        const otherEntity = db.from(relation);
        const allTargets = otherEntity.values();
        let mergedValues = immutable_1.Map();
        values.forEach((sourceFields, sourceId) => {
            const links = allLinks.get(sourceId) || immutable_1.Set();
            const targets = links.reduce((acc, targetId) => acc.set(targetId, allTargets.get(targetId)), immutable_1.Map());
            q(Entity()(targets, otherEntity.relations())).values().forEach((targetFields, targetId) => {
                mergedValues = mergedValues.set(sourceId, Object.assign(Object.assign({}, sourceFields), targetFields));
            });
        });
        const res = Entity()(mergedValues, relations);
        return res;
    },
    relations: () => relations,
    values: () => values
});
const Database = (entities) => ({
    from: (entity) => entities[entity]
});
const PersonId = immutable_1.Record({ PersonId: 0 });
const AddressId = immutable_1.Record({ AddressId: 0 });
const CityId = immutable_1.Record({ CityId: 0 });
const personAddresses = Relation(immutable_1.Map()
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
const addressCities = Relation(immutable_1.Map()
    .set(AddressId({ AddressId: 0 }), immutable_1.Set()
    .add(CityId({ CityId: 0 })))
    .set(AddressId({ AddressId: 1 }), immutable_1.Set()
    .add(CityId({ CityId: 1 })))
    .set(AddressId({ AddressId: 2 }), immutable_1.Set()
    .add(CityId({ CityId: 2 }))));
const myEntities = {
    People: Entity()(immutable_1.Map()
        .set(PersonId({ PersonId: 0 }), { Name: "John", Surname: "Doe", Age: 27 })
        .set(PersonId({ PersonId: 1 }), { Name: "Jane", Surname: "Doe", Age: 31 })
        .set(PersonId({ PersonId: 2 }), { Name: "Giuseppe", Surname: "Maggiore", Age: 35 })
        .set(PersonId({ PersonId: 3 }), { Name: "Giulia", Surname: "Costantini", Age: 34 })
        .set(PersonId({ PersonId: 4 }), { Name: "Rebecca Sofia", Surname: "Maggiore", Age: 9 })
        .set(PersonId({ PersonId: 5 }), { Name: "Rachel", Surname: "Maggiore", Age: 3 })
        .set(PersonId({ PersonId: 6 }), { Name: "Francesco", Surname: "Di Giacomo", Age: 35 }), {
        Addresses: personAddresses
    }),
    Addresses: Entity()(immutable_1.Map()
        .set(AddressId({ AddressId: 0 }), { Street: "Afrikaanderplein", Number: 7, Postcode: "3072 EA" })
        .set(AddressId({ AddressId: 1 }), { Street: "Kalverstraat", Number: 92, Postcode: "1012 PH" })
        .set(AddressId({ AddressId: 2 }), { Street: "Heidelaan", Number: 139, Postcode: "3851 EX" }), {
        People: personAddresses.Inverted(),
        Cities: addressCities,
    }),
    Cities: Entity()(immutable_1.Map()
        .set(CityId({ CityId: 0 }), { Name: "Rotterdam", Population: 1250000 })
        .set(CityId({ CityId: 1 }), { Name: "Amsterdam", Population: 250000 })
        .set(CityId({ CityId: 2 }), { Name: "Hengelo", Population: 150000 }), {
        Addresses: addressCities.Inverted()
    })
};
const db = Database(myEntities);
const x0 = db.from("People").fieldAs("Name", "Nome").select("Nome").filter(p => p.Nome.startsWith("Giu"));
const x1 = db.from("People").expand(db, "Addresses", a => a.select("Street", "Number"));
const x2 = db.from("People").join(db, "Addresses", a => a.select("Street", "Number").join(db, "Cities", c => c.fieldAs("Name", "CityName")));
const x3 = db.from("Cities").expand(db, "Addresses", a => a.expand(db, "People", p => p));
const x4 = db.from("Cities").expand(db, "Addresses", a => a.expandAs(db, "People", "Inhabitants", p => p));
const v0 = x0.values().toArray();
const v1 = x1.values().toArray().map(x => (Object.assign(Object.assign({}, x[1]), { Addresses: x[1].Addresses.toArray().map(a => a[1]) })));
const v2 = x2.values().toArray().map(x => x[1]);
const v3 = x3.values().toArray().map(x => (Object.assign(Object.assign({}, x[1]), { Addresses: x[1].Addresses.toArray().map(a => a[1]) })));
const v4 = x4.values().toArray().map(x => (Object.assign(Object.assign({}, x[1]), { Addresses: x[1].Addresses.toArray().map(a => a[1]) })));
console.log("Done");
/* todo:
 * actual implementation of methods
    expand, expandAs, join do not use q as they should
 * define better constraints on Relations in Entity and expand, expandAs, and join?
 * readme!!!
 * odataParser to create a database
 */
//# sourceMappingURL=app.js.map