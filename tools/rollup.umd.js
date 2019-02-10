import babel from 'rollup-plugin-babel';
import commonjs from 'rollup-plugin-commonjs';
import inject from 'rollup-plugin-inject';
import { resolve as resolvePath } from 'path';

const MODULE_NAME = 'bdd_lazy_var';

function dontPoluteGlobal() {
  return {
    name: 'no-global-polution',
    renderChunk(source) {
      const regexp = new RegExp(`global.${MODULE_NAME} *= *(factory.+)`);
      return source.replace(regexp, '$1');
    }
  }
}

function useSafeDependencies(deps) {
  return {
    name: 'safe-deps',
    renderChunk(source) {
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
  external: ['mocha', 'jasmine', 'jest'],
  output: {
    format: 'umd',
    name: MODULE_NAME,
    globals: {
      mocha: 'Mocha',
      jasmine: 'jasmine',
      jest: 'jest'
    },
  },
  plugins: [
    commonjs({
      include: 'lib/**',
      ignoreGlobal: true
    }),
    inject({
      include: 'lib/**',
      global: resolvePath('./tools/globals/global.js')
    }),
    babel({
      exclude: 'node_modules/**',
      presets: [
        ['@babel/preset-env', {
          modules: false,
          loose: true,
          targets: {
            browsers: ['last 3 versions', 'safari >= 7']
          }
        }]
      ],
      plugins: [
        '@babel/plugin-transform-object-assign',
        '@babel/plugin-proposal-object-rest-spread'
      ]
    }),
    dontPoluteGlobal(),
    useSafeDependencies([
      'mocha',
      'jasmine'
    ])
  ]
};
