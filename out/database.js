"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const immutable_1 = require("immutable");
const utils_1 = require("./utils");
const MakePair = (t, u) => [t, u];
exports.Relation = (values) => ({
    Inverted: () => {
        let invertedValues = immutable_1.Map();
        const emptySet = immutable_1.Set();
        values.forEach((k2s, k1) => k2s.forEach(k2 => invertedValues = invertedValues.update(k2, emptySet, x => x.add(k1))));
        return exports.Relation(invertedValues);
    },
    values: () => values
});
exports.Entity = () => (values, relations) => ({
    fieldAs: (key, keyNew) => exports.Entity()(values.map(f => utils_1.Rename(key, keyNew, f)), relations),
    select: (...keys) => exports.Entity()(values.map(f => keys.reduce((a, e) => (Object.assign(Object.assign({}, a), { [e]: f[e] })), {})), relations),
    filter: (p) => exports.Entity()(values.filter(p), relations),
    expand: function (db, relation, q) {
        return this.expandAs(db, relation, relation, q);
    },
    expandAs: (db, relation, as, q) => {
        const allLinks = relations[relation].values();
        const otherEntity = db.from(relation);
        const allTargets = otherEntity.values();
        const res = exports.Entity()(values.map((fields, id) => {
            const links = allLinks.get(id) || immutable_1.Set();
            const targets = links.reduce((acc, targetId) => acc.set(targetId, allTargets.get(targetId)), immutable_1.Map());
            return Object.assign(Object.assign({}, fields), utils_1.Rename(relation, as, { [relation]: q(exports.Entity()(targets, otherEntity.relations())).values() }));
        }), utils_1.Without(relation, relations));
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
            q(exports.Entity()(targets, otherEntity.relations())).values().forEach((targetFields, targetId) => {
                mergedValues = mergedValues.set(sourceId, Object.assign(Object.assign({}, sourceFields), targetFields));
            });
        });
        const res = exports.Entity()(mergedValues, relations);
        return res;
    },
    relations: () => relations,
    values: () => values
});
exports.Database = (entities) => ({
    from: (entity) => entities[entity]
});
//# sourceMappingURL=database.js.map