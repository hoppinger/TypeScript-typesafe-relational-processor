"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(require("./utils"));
__export(require("./database"));
const sample_1 = require("./sample");
sample_1.test();
/* todo:
 * article
 * odataParser to create a database (Wim)
 * define better constraints on Relations in Entity and expand, expandAs, and join? (Wim/Francesco)
 */
//# sourceMappingURL=app.js.map