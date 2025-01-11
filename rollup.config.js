import typescript from "@rollup/plugin-typescript";

export default {
	input: "src/index.ts",
	output: [{
			name: "ceres",
			file: "dist/index.umd.js",
			format: "umd",
		}, {
			dir: "dist",
			format: "es",
		}
	],
	plugins: [typescript({
		tsconfig: "tsconfig.json",
		declaration: true,
		declarationDir: "dist",
	})],
};
