import typescript from "@rollup/plugin-typescript";

export default {
	input: "src/main.ts",
	output: {
        dir: "build",
		format: "es",
	},
	plugins: [typescript({
		tsconfig: "tsconfig.json",
		declaration: true,
		declarationDir: "build",
	})],
};
