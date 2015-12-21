# Mocha BDD + lazy variable definition (aka rspec)
Provides "ui" for mocha.js which allows to define lazy variables and subjects.

## Installation
```bash
npm install bdd-lazy-var --save-dev
```

Browser version: `bdd-lazy-var.js`.Node version: `index.js`.

## How to use
Command line: `mocha -ui bdd-lazy-var` or in JavaScript:
```js
var mocha = new Mocha({
  ui: 'bdd-lazy-var'
});
```

## Features
* all variables are defined lazily, so order doesn't matter.
* `subject` accessor as an alias for `def('subject', ...)` and `get('subject')`
* ability to redefine parent's variable
* fallback to parent's variables
* fallback to parent's variable inside the same definition (i.e. `subject` inside `subject` definition will refer to parent's `subejct`)
* all variables are cleaned after each test
* `get.variable` or `get.definitionOf` for creating getters for variables

## Examples
```js
describe('Suite', function() {
  def('fullName', function() {
    return get('firstName') + '+' + get('lastName');
  });

  def('firstName', 'BDD');
  def('lastName', 'Lazy variable');

  it('computes variables', function() {
    expect(get('fullName')).to.equal('BDD+Lazy variable');
  });

  describe('Nested suite', function() {
    def('fullName', function() {
      return get('fullName') + '!'; // get parent's "fullName" variable
    });

    it('gets parent variable', function() {
      expect(get('fullName')).to.equal('BDD+Lazy variable!');
    });
  });

  describe('Another nested suite', function() {
    def('lastName', 'Rocks!');

    it('redefines parent variable', function() {
      expect(get('fullName')).to.equal('BDD+Rocks!');
    });
  });

  describe('with subject', function() {
    subject(function() {
      return {};
    });

    it('defines subject', function() {
      expect(subejct()).to.be.an('object');
    });
    
    it('can be retrieved via `this`', function() {
      expect(this.subject).to.equal(subject());
    });
  });
});
```
