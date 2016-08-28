sharedExamplesFor('Lazy Vars Interface', function(getVar) {
  describe('by default', function() {
    var definition = spy();
    var value = {};

    def('var', definition);
    def('staticVar', value);

    def('fullName', function() {
      return this.firstName + ' ' + this.lastName;
    });

    def('firstName', 'John');
    def('lastName', 'Doe');

    it('does not create variable if it has not been accessed', function() {
      expect(definition).not.to.have.been.called();
    });

    it('creates variable only once', function() {
      getVar('var');
      getVar('var');

      expect(definition).to.have.been.called.once();
    });

    it('can define static variable', function() {
      expect(getVar('staticVar')).to.equal(value);
    });

    it('defines "get.variable" and its alias "get.definitionOf" getter builder', function() {
      expect(get.variable).to.be.a('function');
      expect(get.variable).to.equal(get.definitionOf);
    });

    it('allows to get variable using builder', function() {
      var getStatic = get.variable('staticVar');

      expect(getStatic()).to.equal(getVar('staticVar'));
    });

    it('allows to access variable using "this" keyword (i.e. "this.lazyVarName")', function() {
      expect(this.staticVar).to.equal(getVar('staticVar'));
    });

    it('allows to access other variables inside definition using "this"', function() {
      expect(this.fullName).to.equal('John Doe');
    });

    describe('nested suite', function() {
      def('lastName', 'Smith');

      it('uses suite specific variable inside dynamic parent variable', function() {
        expect(this.fullName).to.equal('John Smith');
      });
    });
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

    afterEach('uses cached variable', function() {
      valueInAfterEach = getVar('var');

      expect(getVar('var')).to.equal(prevValue + 1);
    });

    after('uses newly created variable', function() {
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
    def('var', 'John');

    describe('nested suite without variable definition', function() {
      def('hasVariables', true);

      it('fallbacks to parent variable definition', function() {
        expect(getVar('var')).to.equal('John');
      });

      it('can define other variables inside', function() {
        expect(getVar('hasVariables')).to.be.true;
      })

      describe('nested suite with variable definition', function() {
        def('var', function() {
          return getVar('var') + ' Doe';
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

    describe.skip('Skipped suite', function() {
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
});
