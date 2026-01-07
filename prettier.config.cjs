// https://github.com/prettier/prettier-vscode/issues/3380#issuecomment-2231260738

/** @type {import("prettier").Config} */
const config = {
    tabWidth: 4,
    plugins: [require.resolve("prettier-plugin-organize-imports")],
};

module.exports = config;
