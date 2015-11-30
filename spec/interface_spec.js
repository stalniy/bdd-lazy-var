describe('Lazy variables interface', function() {
  describe('by default', function() {
    var definition = spy();
    var value = {};

    def('var', definition);
    def('staticVar', value);

    it('does not create variable if it has not been accessed', function() {
      expect(definition).not.to.have.been.called();
    });

    it('creates variable only once', function() {
      get('var');
      get('var');

      expect(definition).to.have.been.called.once();
    });

    it('can define static variable', function() {
      expect(get('staticVar')).to.equal(value);
    });

    it('defines "get.variable" and its alias "get.definitionOf" getter builder', function() {
      expect(get.variable).to.be.a('function');
      expect(get.variable).to.equal(get.definitionOf);
    });

    it('allows to get variable using builder', function() {
      var getStatic = get.variable('staticVar');

      expect(getStatic()).to.equal(get('staticVar'));
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
      valueInBefore = get('var');
    });

    beforeEach(function() {
      if (!skipBeforeEach) {
        skipBeforeEach = true;
        valueInFirstBeforeEach = get('var');
      }
    });

    afterEach('uses cached variable', function() {
      valueInAfterEach = get('var');

      expect(get('var')).to.equal(prevValue + 1);
    });

    after('uses newly generated variable', function() {
      expect(get('var')).to.equal(valueInAfterEach + 1);
    });

    it('defines dynamic variable', function() {
      expect(get('var')).to.exist;
    });

    it('stores different values between tests', function() {
      expect(get('var')).to.equal(prevValue + 1);
    });

    it('shares the same value between "before" and first "beforeEach" calls', function() {
      expect(valueInBefore).to.equal(valueInFirstBeforeEach);
    });
  });

  describe('when using variable inside another variable definition', function() {
    var user = { firstName: 'John', lastName: 'Doe' };
    var index = 0;
    var currentIndex;

    before(function() {
      expect(get('currentIndex')).to.equal(currentIndex);
    });

    beforeEach('uses own defined variable in "beforeEach" callback even when it is run for nested tests', function() {
      expect(get('currentIndex')).to.equal(currentIndex);
    });

    afterEach('uses own defined variable in "afterEach" callback even when it is run for nested tests', function() {
      expect(get('currentIndex')).to.equal(currentIndex);
    });

    after('uses own defined variable', function() {
      expect(get('currentIndex')).to.equal(currentIndex);
    });

    def('name', function() {
      return get('firstName') + ' ' + get('lastName');
    });

    def('firstName', user.firstName);
    def('lastName', user.lastName);

    def('currentIndex', function() {
      currentIndex = ++index;

      return currentIndex;
    });

    it('computes the proper result', function() {
      expect(get('name')).to.equal(user.firstName + ' ' + user.lastName);
    });

    describe('nested suite', function() {
      var user = { firstName: 'Alex' };

      before(function() {
        expect(get('currentIndex')).to.equal(currentIndex.toString());
      });

      beforeEach('uses own defined variable in "beforeEach" callback even when it is run for nested tests', function() {
        expect(get('currentIndex')).to.equal(currentIndex.toString());
      });

      afterEach('uses own defined variable in "afterEach" callback even when it is run for nested tests', function() {
        expect(get('currentIndex')).to.equal(currentIndex.toString());
      });

      after('uses own defined variable', function() {
        expect(get('currentIndex')).to.equal(currentIndex.toString());
      });

      def('firstName', user.firstName);

      def('currentIndex', function() {
        return get('currentIndex').toString();
      });

      it('falls back to parent variable', function() {
        expect(get('lastName')).to.equal('Doe');
      });

      it('computes parent variable using redefined variable', function() {
        expect(get('name')).to.equal(user.firstName + ' ' + get('lastName'));
      });

      it('can redefine parent variable with the same name and access value of parent variable inside definition', function() {
        expect(get('currentIndex')).to.equal(currentIndex.toString());
      });
    });
  });

  describe('when fallbacks to parent variable definition through suites tree', function() {
    def('var', 'John');

    describe('nested suite without variable definition', function() {
      it('fallbacks to parent variable definition', function() {
        expect(get('var')).to.equal('John');
      });

      describe('nested suite with variable definition', function() {
        def('var', function() {
          return get('var') + ' Doe';
        });

        it('uses correct parent variable definition', function() {
          expect(get('var')).to.equal('John Doe');
        });

        describe('one more nested suite without variable definition', function() {
          it('uses correct parent variable definition', function() {
            expect(get('var')).to.equal('John Doe');
          });
        });
      });
    });
  });
});
