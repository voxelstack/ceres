/** @type {Partial<import("typedoc").TypeDocOptions>} */
const config = {
    entryPoints: ["./src/index.ts"],
    out: "typedoc",
    plugin: [
        // https://typedoc.org/documents/Plugins.html
    ],
};

export default config;
