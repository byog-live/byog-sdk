import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';

export default {
  input: 'src/index.js',
  output: {
    file: 'index.js',
    plugins: [terser()],
  },
  plugins: [resolve(), commonjs()],
};
