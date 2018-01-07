import babel from 'rollup-plugin-babel';
import commonjs from 'rollup-plugin-commonjs';

export default {
  external: ['mocha'],
  input: `lib/interface/${process.env.SRC_FILE}`,
  output: {
    format: 'umd',
    name: 'bdd_lazy_var',
    globals: {
      mocha: 'Mocha'
    },
    file: process.env.DEST_FILE,
  },
  plugins: [
    commonjs({
      include: 'lib/**',
      ignore: []
    }),
    babel({
      exclude: 'node_modules/**',
      presets: [
        ['es2015', { modules: false }]
      ],
      plugins: [
        'external-helpers',
        'transform-object-assign'
      ]
    })
  ]
};
