import resolve from '@rollup/plugin-node-resolve';
import commonJS from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import babel from '@rollup/plugin-babel';
import typescript from '@rollup/plugin-typescript';

const extensions = ['.mjs', '.js', '.ts', '.json'];

const config = {
    input: './src/main.ts',
    external: ['nakama-runtime'],
    plugins: [
        // Allows node_modules resolution
        resolve({ extensions }),

        // Compile TypeScript
        typescript({
            tsconfig: './tsconfig.json', // path to your tsconfig file
            outDir: null, // this tells TypeScript not to output individual .js files
            declarationDir: null, // this tells TypeScript not to output individual .d.ts files
        }),

        json(),

        // Resolve CommonJS modules
        commonJS({ extensions }),

        // Transpile to ES5
        babel({
            extensions,
            babelHelpers: 'bundled',
        }),
    ],
    output: {
        file: './modules/index.js',
    },
};

export default config;
