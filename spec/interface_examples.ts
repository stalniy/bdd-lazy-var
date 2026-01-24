import { lazy } from '../src/index.ts';
import type { MochaGlobals } from "mocha";

export function includeLazyVarsInterfaceExamples({
  beforeEach,
  afterEach,
  before,
  after,
  it,
  describe,
  spy,
  expect,
}: Pick<MochaGlobals, 'beforeEach' | 'afterEach' | 'before' | 'after' | 'it' | 'describe'> & { spy: (fn?: () => any) => any, expect: Chai.ExpectStatic }) {
  const $root = lazy(d => d
    .variable('firstName', 'John')
    .variable('lastName', 'Doe')
    .variable('fullName', ({ firstName, lastName }) => `${firstName} ${lastName}`)
  );

  it('allows to define lazy vars at root level', () => {
    expect($root.fullName).to.equal('John Doe');
  });

  describe('Lazy variables interface', () => {
    describe('by default', () => {
      let definition: (() => number);
      let value = {};

      const $ = lazy(d => d
        .variable('var', () => definition())
        .variable('staticVar', value)
        .variable('firstName', 'John')
        .variable('lastName', 'Doe')
        .variable('fullName', ({ firstName, lastName }) => `${firstName} ${lastName}`)
      );

      beforeEach(() => {
        definition = spy(() => Date.now());
      })

      it('does not create variable if it has not been accessed', () => {
        expect(definition).not.to.have.been.called();
      });

      it('creates variable only once', () => {
        const value = $.var + $.var;

        expect(value).to.equal(2 * $.var);
        expect(definition).to.have.been.called.once;
      });

      it('can define static variable', () => {
        expect($.staticVar).to.equal(value);
      });

      it('returns `undefined` where there is no definition', () => {
        // @ts-expect-error notDefined is not defined in lazy var context
        expect($.notDefined).to.be.undefined;
      });

      it('defines ".ref" to get variable getter', () => {
        expect($.ref.fullName).to.be.a('function');
        expect($.ref.fullName()).to.equal($.fullName);
      });

      describe('nested suite', () => {
        const $parent = $; {
        const $ = lazy(d => d.extends($parent).variable('lastName', 'Smith'));

        it('uses suite specific variable inside dynamic parent variable', () => {
          expect($.fullName).to.equal('John Smith');
        });
      }});
    });

    describe('dynamic variable definition', () => {
      let index = 0;
      let prevValue = NaN;
      let skipBeforeEach = false;
      let valueInFirstBeforeEach = NaN;
      let valueInAfterEach = NaN;
      let valueInBefore = NaN;

      const $ = lazy(d => d
        .variable('var', () => {
          prevValue = index;
          return ++index;
        })
      );

      before(() => {
        valueInBefore = $.var;
      });

      beforeEach(() => {
        if (!skipBeforeEach) {
          skipBeforeEach = true;
          valueInFirstBeforeEach = $.var;
        }
      });

      afterEach(function usesCachedVariable() {
        valueInAfterEach = $.var;

        expect($.var).to.equal(prevValue + 1);
      });

      after(function usesNewlyCreatedVariable() {
        expect($.var).to.equal(valueInAfterEach + 1);
      });

      it('defines dynamic variable', () => {
        expect($.var).to.exist;
      });

      it('stores different values between tests', () => {
        expect($.var).to.equal(prevValue + 1);
      });

      it('does not share the same value between "before" and first "beforeEach" calls', () => {
        expect(valueInBefore).not.to.equal(valueInFirstBeforeEach);
      });
    });

    describe('when fallbacks to parent variable definition through suites tree', () => {
      const $ = lazy(d => d.variable('var', 'Doe'));

      describe('nested suite without variable definition', () => {
        const $parent = $; {
        const $ = lazy(d => d.extends($parent).variable('hasVariables', true));

        it('fallbacks to parent variable definition', () => {
          expect($.var).to.equal('Doe');
        });

        it('can define other variables inside', () => {
          expect($.hasVariables).to.be.true;
        })

        describe('nested suite with variable definition', () => {
          const $parent = $; {
          const $ = lazy(d => d.extends($parent)
            .variable('anotherVar', () => 'John')
            .variable('var', () => `${$.anotherVar} ${$.var}`)
          );

          it('uses correct parent variable definition', () => {
            expect($.var).to.equal('John Doe');
          });

          describe('one more nested suite without variable definition', () => {
            it('uses correct parent variable definition', () => {
              expect($.var).to.equal('John Doe');
            });
          });
        }});
      }});
    });

    describe('variable inside "afterEach" is the same as in test', () => {
      let subjectInChild: unknown;

      const $ = lazy(d => d.variable('subject', () => ({})));

      afterEach(() => {
        expect($.subject).to.equal(subjectInChild);
      });

      it('uses the same variable instance', () => {
        subjectInChild = $.subject;
      });
    });

    describe('referencing child lazy variable from parent', () => {
      const $ = lazy(d => d
        .require<'value', { x: number }>('value')
        .variable('model', ({ value }) => ({
          value
        }))
      );

      describe('nested suite', () => {
        const $parent = $; {
        const $ = lazy(d => d.extends($parent)
          .subject(({ model }) => model.value)
        );

        describe('suite which defines variable used in parent suite', () => {
          const $parent = $; {
          const $ = lazy(d => d.extends($parent)
            .subject(({ subject }) => subject.x)
            .variable('value', () => ({ x: 5 }))
          );

          it('returns 5', () => {
            expect($.subject).to.equal(5);
          });
        }});
      }});
    });

    describe('when parent variable is accessed multiple times inside child definition', () => {
      const $ = lazy(d => d.variable('subject', () => ({ isParent: true, name: 'test' })));

      describe('child suite', () => {
        const $parent = $; {
        const $ = lazy(d => d.extends($parent)
          .subject(({ subject }) => ({
            isParent: !subject.isParent,
            name: subject.name + ' child'
          }))
        );

        it('retrieves proper parent variable', () => {
          expect($.subject.isParent).to.be.false;
          expect($.subject.name).to.equal('test child');
        });
      }});
    });
  });
}
