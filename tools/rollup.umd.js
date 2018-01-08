import babel from 'rollup-plugin-babel';
import commonjs from 'rollup-plugin-commonjs';

const MODULE_NAME = 'bdd_lazy_var';

function dontPoluteGlobal() {
  return {
    name: 'no-global-polution',
    transformBundle(source) {
      const regexp = new RegExp(`global.${MODULE_NAME} *= *(factory.+)`);
      return source.replace(regexp, '$1');
    }
  }
}

function useSafeDependencies(deps) {
  return {
    name: 'safe-deps',
    transformBundle(source) {
      return source
        .replace(/(function *\([^)]*\) \{)/, [
          '$1',
          'function optional(name) { try { return require(name) } catch(e) {} }'
        ].join('\n'))
        .replace(new RegExp(`require\\(["'](${deps.join('|')})["']\\)`, 'g'), 'optional("$1")')
        .replace(/define\(\[([^\]]+)\]/, (match, names) => {
          const allDeps = names.split(/\s*,\s*/).map((name) => {
            const depName = name.slice(1, -1);
            return deps.includes(depName) ? `'optional!${depName}'` : name;
          });

          return `define([${allDeps.join(', ')}]`
        })
    }
  }
}


export default {
  external: ['mocha', 'jasmine'],
  input: `lib/interface/dialects/${process.env.SRC_FILE}`,
  output: {
    format: 'umd',
    name: MODULE_NAME,
    globals: {
      mocha: 'Mocha',
      jasmine: 'jasmine'
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
    }),
    dontPoluteGlobal(),
    useSafeDependencies([
      'mocha',
      'jasmine'
    ])
  ]
};
