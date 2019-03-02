sharedExamplesFor('Default suite tracking', (getVar) => {
  describe('when using variable inside another variable definition', () => {
    const user = { firstName: 'John', lastName: 'Doe' };
    let index = 0;
    let currentIndex;

    before(() => {
      expect(getVar('currentIndex')).to.equal(currentIndex);
    });

    beforeEach(() => {
      expect(cast(getVar('currentIndex'))).to.equal(cast(currentIndex));
    });

    afterEach(() => {
      expect(cast(getVar('currentIndex'))).to.equal(cast(currentIndex));
    });

    after(() => {
      expect(getVar('currentIndex')).to.equal(currentIndex);
    });

    def('personName', () => {
      return `${getVar('firstName')} ${getVar('lastName')}`;
    });

    def('firstName', user.firstName);
    def('lastName', user.lastName);

    def('currentIndex', () => {
      currentIndex = ++index;

      return currentIndex;
    });

    def('CurrenIndexType', () => {
      return Number;
    });

    it('computes the proper result', () => {
      expect(getVar('personName')).to.equal(`${user.firstName} ${user.lastName}`);
    });

    describe('nested suite', () => {
      const user = { firstName: 'Alex' };

      before(() => {
        expect(getVar('currentIndex')).to.equal(cast(currentIndex));
      });

      beforeEach(() => {
        expect(getVar('currentIndex')).to.equal(cast(currentIndex));
      });

      afterEach(() => {
        expect(getVar('currentIndex')).to.equal(cast(currentIndex));
      });

      after(() => {
        expect(getVar('currentIndex')).to.equal(cast(currentIndex));
      });

      def('firstName', user.firstName);

      def('currentIndex', () => {
        return cast(getVar('currentIndex'));
      });

      def('CurrenIndexType', () => {
        return String;
      });

      it('falls back to parent variable', () => {
        expect(getVar('lastName')).to.equal('Doe');
      });

      it('computes parent variable using redefined variable', () => {
        expect(getVar('personName')).to.equal(`${user.firstName} ${getVar('lastName')}`);
      });

      it('can redefine parent variable with the same name and access value of parent variable inside definition', () => {
        expect(getVar('currentIndex')).to.equal(cast(currentIndex));
      });
    });

    function cast(value) {
      const convert = getVar('CurrenIndexType');

      return convert(value);
    }
  });
});
