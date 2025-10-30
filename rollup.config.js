import pkg from './package.json' with { type: 'json' }
import del from 'rollup-plugin-delete'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import typescript from '@rollup/plugin-typescript'
import replace from '@rollup/plugin-replace'
import terser from '@rollup/plugin-terser'

export default {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/index.umd.js',
      format: 'umd',
      name: 'CanvasParticles',
      exports: 'default',
    },
    { file: 'dist/index.mjs', format: 'es' },
    { file: 'dist/index.cjs', format: 'cjs' },
  ],
  plugins: [
    del({ targets: 'dist/*' }),
    resolve({ extensions: ['.ts', '.js', '.json'] }),
    replace({
      preventAssignment: true,
      __VERSION__: JSON.stringify(pkg.version),
    }),
    typescript({ tsconfig: './tsconfig.json' }),
    commonjs(),
    terser({
      maxWorkers: 16,
      compress: false,
      mangle: false,
      format: {
        beautify: true,
        indent_level: 2,
        comments: false,
      },
    }),
  ],
}
