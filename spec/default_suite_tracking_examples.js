sharedExamplesFor('Default suite tracking', function(getVar) {
  describe('when using variable inside another variable definition', function() {
    var user = { firstName: 'John', lastName: 'Doe' };
    var index = 0;
    var currentIndex;

    before(function() {
      expect(getVar('currentIndex')).to.equal(currentIndex);
    });

    beforeEach('uses own defined variable in "beforeEach" callback even when it is run for nested tests', function() {
      expect(getVar('currentIndex')).to.equal(currentIndex);
    });

    afterEach('uses own defined variable in "afterEach" callback even when it is run for nested tests', function() {
      expect(getVar('currentIndex')).to.equal(currentIndex);
    });

    after('uses own defined variable', function() {
      expect(getVar('currentIndex')).to.equal(currentIndex);
    });

    def('personName', function() {
      return getVar('firstName') + ' ' + getVar('lastName');
    });

    def('firstName', user.firstName);
    def('lastName', user.lastName);

    def('currentIndex', function() {
      currentIndex = ++index;

      return currentIndex;
    });

    it('computes the proper result', function() {
      expect(getVar('personName')).to.equal(user.firstName + ' ' + user.lastName);
    });

    describe('nested suite', function() {
      var user = { firstName: 'Alex' };

      before(function() {
        expect(getVar('currentIndex')).to.equal(currentIndex.toString());
      });

      beforeEach('uses own defined variable in "beforeEach" callback even when it is run for nested tests', function() {
        expect(getVar('currentIndex')).to.equal(currentIndex.toString());
      });

      afterEach('uses own defined variable in "afterEach" callback even when it is run for nested tests', function() {
        expect(getVar('currentIndex')).to.equal(currentIndex.toString());
      });

      after('uses own defined variable', function() {
        expect(getVar('currentIndex')).to.equal(currentIndex.toString());
      });

      def('firstName', user.firstName);

      def('currentIndex', function() {
        return getVar('currentIndex').toString();
      });

      it('falls back to parent variable', function() {
        expect(getVar('lastName')).to.equal('Doe');
      });

      it('computes parent variable using redefined variable', function() {
        expect(getVar('personName')).to.equal(user.firstName + ' ' + getVar('lastName'));
      });

      it('can redefine parent variable with the same name and access value of parent variable inside definition', function() {
        expect(getVar('currentIndex')).to.equal(currentIndex.toString());
      });
    });
  });
});
