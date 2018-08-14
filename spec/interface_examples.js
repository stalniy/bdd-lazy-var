sharedExamplesFor('Lazy Vars Interface', function(getVar) {
  describe('by default', function() {
    var definition;
    var value = {};

    def('var', function() {
      return definition();
    });
    def('staticVar', value);

    def('fullName', function() {
      return getVar('firstName') + ' ' + getVar('lastName');
    });

    def('firstName', 'John');
    def('lastName', 'Doe');

    beforeEach(function() {
      definition = spy();
    })

    it('does not create variable if it has not been accessed', function() {
      expect(definition).not.to.have.been.called();
    });

    it('creates variable only once', function() {
      getVar('var');
      getVar('var');

      expect(definition).to.have.been.called.once;
    });

    it('can define static variable', function() {
      expect(getVar('staticVar')).to.equal(value);
    });

    it('returns `undefined` where there is no definition', () => {
      expect(getVar('notDefined')).to.be.undefined;
    });

    it('defines "get.variable" and its alias "get.definitionOf" getter builder', function() {
      expect(get.variable).to.be.a('function');
      expect(get.variable).to.equal(get.definitionOf);
    });

    it('allows to get variable using builder', function() {
      var getStatic = get.variable('staticVar');

      expect(getStatic()).to.equal(getVar('staticVar'));
    });

    describe('nested suite', function() {
      def('lastName', 'Smith');

      it('uses suite specific variable inside dynamic parent variable', function() {
        expect(getVar('fullName')).to.equal('John Smith');
      });
    });

    context('nested suite using \'context\' alias', function() {
      def('lastName', 'Cusak');

      it('uses suite specific variable inside dynamic parent variable', function() {
        expect(getVar('fullName')).to.equal('John Cusak');
      });
    });

    try {
      xcontext('skipped context', function() {
        it('should never call assertions', function() {
          is.expected.to.be.never.called();
        });
      });
    } catch (error) {
      it(function() {
        is.expected.to.be.never.called();
      });
    }
  });

  describe('dynamic variable definition', function() {
    var prevValue, valueInAfterEach, valueInBefore, valueInFirstBeforeEach, skipBeforeEach;
    var index = 0;

    def('var', function() {
      prevValue = index;

      return ++index;
    });

    before(function() {
      valueInBefore = getVar('var');
    });

    beforeEach(function() {
      if (!skipBeforeEach) {
        skipBeforeEach = true;
        valueInFirstBeforeEach = getVar('var');
      }
    });

    afterEach(function usesCachedVariable() {
      valueInAfterEach = getVar('var');

      expect(getVar('var')).to.equal(prevValue + 1);
    });

    after(function usesNewlyCreatedVariable() {
      expect(getVar('var')).to.equal(valueInAfterEach + 1);
    });

    it('defines dynamic variable', function() {
      expect(getVar('var')).to.exist;
    });

    it('stores different values between tests', function() {
      expect(getVar('var')).to.equal(prevValue + 1);
    });

    it('does not share the same value between "before" and first "beforeEach" calls', function() {
      expect(valueInBefore).not.to.equal(valueInFirstBeforeEach);
    });
  });

  describe('when fallbacks to parent variable definition through suites tree', function() {
    def('var', 'Doe');

    describe('nested suite without variable definition', function() {
      def('hasVariables', true);

      it('fallbacks to parent variable definition', function() {
        expect(getVar('var')).to.equal('Doe');
      });

      it('can define other variables inside', function() {
        expect(getVar('hasVariables')).to.be.true;
      })

      describe('nested suite with variable definition', function() {
        def('var', function() {
          return get('anotherVar') + ' ' + getVar('var');
        });

        def('anotherVar', function() {
          return 'John';
        });

        it('uses correct parent variable definition', function() {
          expect(getVar('var')).to.equal('John Doe');
        });

        describe('one more nested suite without variable definition', function() {
          it('uses correct parent variable definition', function() {
            expect(getVar('var')).to.equal('John Doe');
          });
        });
      });
    });
  });

  describe('when variable is used inside "afterEach" of parent and child suites', function() {
    var subjectInChild;

    subject(function() {
      return {};
    });

    describe('parent suite', function() {
      afterEach(function() {
        expect(subject()).to.equal(subjectInChild);
      });

      describe('child suite', function() {
        it('uses the same variable instance', function() {
          subjectInChild = subject();
        });
      });
    });
  });

  describe('named subject', function() {
    var subjectValue = {};

    subject('named', subjectValue);

    it('is accessible by referencing "subject" variable', function() {
      expect(getVar('subject')).to.equal(subjectValue);
    });

    it('is accessible by referencing subject name variable', function() {
      expect(getVar('named')).to.equal(subjectValue);
    });

    describe('nested suite', function() {
      var nestedSubjectValue = {};

      subject('nested', nestedSubjectValue);

      it('shadows parent "subject" variable', function() {
        expect(getVar('subject')).to.equal(nestedSubjectValue);
      });

      it('can access parent subject by its name', function() {
        expect(getVar('named')).to.equal(subjectValue);
      });
    });

    describe('parent subject in child one', function() {
      subject('nested', function() {
        return getVar('subject');
      });

      it('can access parent subject inside named subject by accessing "subject" variable', function() {
        expect(getVar('subject')).to.equal(subjectValue);
      });

      it('can access parent subject inside named subject by accessing subject by its name', function() {
        expect(getVar('nested')).to.equal(subjectValue);
      });
    });
  });

  describe('variables in skipped suite', function() {
    subject([]);

    xdescribe('Skipped suite', function() {
      var object = {};

      subject(object);

      it('defines variables inside skipped suites', function() {
        expect(getVar('subject')).to.equal(object);
      });
    });
  });

  describe('referencing child lazy variable from parent', function() {
    def('model', function() {
      return { value: getVar('value') };
    });

    describe('nested suite', function() {
      subject(function() {
        return getVar('model').value;
      });

      describe('suite which defines variable used in parent suite', function() {
        def('value', function() {
          return { x: 5 };
        });

        subject(function() {
          return getVar('subject').x;
        });

        it('returns 5', function() {
          expect(getVar('subject')).to.equal(5);
        });
      });
    });
  });

  describe('when parent variable is accessed multiple times inside child definition', function() {
    subject(function() {
      return { isParent: true, name: 'test' };
    });

    describe('child suite', function() {
      subject(function() {
        return {
          isParent: !subject().isParent,
          name: subject().name + ' child'
        };
      });

      it('retrieves proper parent variable', function() {
        expect(subject().isParent).to.be.false;
        expect(subject().name).to.equal('test child');
      });
    });
  });

  describe('when calls variable defined in parent suites', function() {
    subject(function() {
      return { isRoot: getVar('isRoot') };
    });

    def('isRoot', true);

    describe('one more level which overrides parent variable', function() {
      subject(function() {
        return getVar('subject').isRoot;
      });

      describe('suite that calls parent variable and redefines dependent variable', function() {
        def('isRoot', false);

        it('gets the correct variable', function() {
          expect(getVar('subject')).to.be.false;
        });
      });

      describe('suite that calls parent variable', function() {
        it('gets the correct variable', function() {
          expect(getVar('subject')).to.be.true;
        });
      });
    });
  });

  describe('`its`', function() {
    subject(function() {
      return {
        value: 5,
        nested: {
          value: 10
        },
        getName() {
          return 'John'
        }
      };
    });

    its('value', function() {
      is.expected.to.equal(getVar('subject').value);
    });

    its('getName', function() {
      is.expected.to.equal(getVar('subject').getName());
    });

    its('nested.value', function() {
      is.expected.to.equal(getVar('subject').nested.value);
    });

    try {
      its.skip('name', function() {
        is.expected.to.be.never.called();
      });
    } catch (error) {
      xits('name', function() {
        is.expected.to.be.never.called();
      });
    }
  });
});

sharedExamplesFor('Root Lazy Vars', function(getVar) {
  const varName = `hello.${Date.now()}.${Math.random()}`

  def(varName, function() {
    return 'world'
  });

  it('allows to define lazy vars at root level', function() {
    expect(getVar(varName)).to.equal('world');
  });
});
