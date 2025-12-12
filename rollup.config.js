import pkg from './package.json' with { type: 'json' }
import del from 'rollup-plugin-delete'
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
      plugins: [
        terser({
          format: {
            indent_level: 2,
            comments: false,
          },
        }),
      ],
    },
    { file: 'dist/index.mjs', format: 'es' },
    { file: 'dist/index.cjs', format: 'cjs' },
  ],
  plugins: [
    del({ targets: 'dist/*' }),
    replace({
      preventAssignment: true,
      __VERSION__: JSON.stringify(pkg.version),
    }),
    typescript({ tsconfig: './tsconfig.json' }),
  ],
}
