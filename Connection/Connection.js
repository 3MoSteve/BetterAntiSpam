const { readFileSync, writeFileSync } = require("fs");

const Emitter = new (require("events")).EventEmitter();
const data = JSON.parse(readFileSync(__dirname + "/data.json", "utf-8"));
const saveData = () => writeFileSync(__dirname + "/data.json", JSON.stringify(data, null, 2));

module.exports = { data, saveData, Emitter };
