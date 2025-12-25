const tsBlankSpace = require("ts-blank-space").default;
const fs = require("fs");

const source = fs.readFileSync(process.stdin.fd, "utf-8");
process.stdout.write(tsBlankSpace(source));
