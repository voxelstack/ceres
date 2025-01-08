import typescript from "@rollup/plugin-typescript";

export default {
	input: "src/index.ts",
	output: [{
			name: "ceres",
			file: "build/index.umd.js",
			format: "umd",
		}, {
			dir: "build",
			format: "es",
		}
	],
	plugins: [typescript({
		tsconfig: "tsconfig.json",
		declaration: true,
		declarationDir: "build",
	})],
};
