import { lazy, getActiveScope } from './src/LazyVariables';
import './src/styles/bdd';
import expect from 'expect';

describe('suite', () => {
  const $ = lazy(d => d
    .subject('opa', () => ({}))
    .variable('test', 5)
    .variable('me', v => {
      console.log('---> call me')
      return v.test + 2
    })
  );

  beforeEach(() => {
    getActiveScope($).subject
  })

  it('tests', () => {
    expect($.me).toEqual(7);
  });

  describe('nested suite', () => {
    const $1 = lazy(d => d.extends($)
      .variable('me', v => v.me + v.test)
      .variable('bla', 10)
    );

    it('tests', () => {
      expect($1.me).toEqual(12);
    })
  })
})
