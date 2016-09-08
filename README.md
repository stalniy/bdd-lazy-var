# Mocha BDD + lazy variable definition (aka rspec) [![Build Status](https://travis-ci.org/stalniy/bdd-lazy-var.svg?branch=master)](https://travis-ci.org/stalniy/bdd-lazy-var)
Provides "ui" for mocha.js which allows to define lazy variables and subjects.

## Purpose
Stop writing
```js
describe('Suite', function() {
  var name;

  beforeEach(function() {
    name = getName();
  });

  afterEach(function() {
    name = null;
  });

  it('uses name variable', function() {
    expect(name).to.exist;
  });

  it('does not use name but anyway it is created in beforeEach', function() {
    expect(1).to.equal(1);
  });
});
```
And just use lazy vars which are created only when accessed and cleared automatically after each test
```js
describe('Suite', function() {
  def('name', function() {
    return getName();
  });

  it('uses name variable', function() {
    expect($name).to.exist
  });

  it('does not use name, so it is not created', function() {
    expect(1).to.equal(1);
  });
});
```

## Installation
```bash
npm install bdd-lazy-var --save-dev
```

Browser versions: `bdd_lazy_var.js`, `bdd_lazy_var_global.js`, `bdd_lazy_var_getter.js`, `bdd_lazy_var_spec.js`.
Node versions: `index.js`, `global.js`, `getter.js`, `rspec.js`.

## How to use

#### Command line
```sh
mocha -u bdd-lazy-var
```

#### In JavaScript
```js
var mocha = new Mocha({
  ui: 'bdd-lazy-var' // bdd-lazy-var/global or bdd-lazy-var/getter or bdd-lazy-var/rspec
});
```

#### Using karma (via karma-mocha npm package)
If you run tests via karma in browser, you need to require/load `bdd_lazy_var*.js` (i.e., `bdd_lazy_var.js`, `bdd_lazy_var_getter.js` or `bdd_lazy_var_global.js`) and then `ui` option for mocha should be `bdd-lazy-var/global` (or `bdd-lazy-var/getter` or `bdd-lazy-var`, depends on which you prefer).

**Note** requires `karma-mocha` `^1.1.1`

So, in `karma.config.js` it looks like this:
```js
module.exports = function(config) {
  config.set({
    // ....
    client: {
      mocha: {
        ui: 'bdd-lazy-var/global',
        require: [require.resolve('bdd-lazy-var/bdd_lazy_var_global')]
      }
    }
  });
}
```

#### Running mocha via Node.js
```js
let Mocha = require('mocha');
require('bdd-lazy-var/global'); // this is optinal as Mocha automatically requires external ui in Node.js env

let runner = new Mocha({
  ui: 'bdd-lazy-var/global'
});

runner.addFile('path/to/spec/file');
runner.run();
```

If you want to access vars using more readable form use `bdd-lazy-var/global` or `bdd-lazy-var/getter` ui.

## Features
* all variables are defined lazily, so order doesn't matter.
* accessible also inside `before`, `after` callbacks
* `subject` accessor as an alias for `def('subject', ...)` and `get('subject')`
* named subjects to be more explicit
* ability to redefine parent's variable
* fallback to parent's variables
* fallback to parent's variable inside the same definition (i.e. `subject` inside `subject` definition will refer to parent's `subject`)
* all variables are cleaned after each test
* `get.variable` or `get.definitionOf` for creating getters for variables
* rspec variable tracking mechanizm as a custom mocha ui (i.e., `bdd-lazy-var/rspec`)
* access variables using:
  * `this.variableName` (i.e. `this.fullName`)
  * `get(variableName)` (i.e. `get('fullName')`)
  * `$variableName` (i.e. `$fullName`, only with `bdd-lazy-var/global`)
  * `get.variableName` (i.e. `get.fullName`, only with `bdd-lazy-var/getter`)

For more information, follow [this link](https://medium.com/@sergiy.stotskiy/lazy-variables-with-mocha-js-d6063503104c#.ceo9jvrzh).

## Examples for `bdd-lazy-var/global`
```js
describe('Array', function() {
  subject(function() {
    return [ 1, 2, 3 ];
  });

  it('has 3 elements by default', function() {
    expect($subject).to.have.length(3);
  });
});
```

## Examples for `bdd-lazy-var/rspec`
The only difference between rspec and global ui is in variable tracking inside. By default, when variable is accessed inside `beforeEach/afterEach` mocha callback is retrieved from the suite where it's defined. On another hand, rspec ui retrieves variables from currently running suite. In other words:
```js
describe('User', function() {
  subject(() => new User($attrs))

  describe('when is active', function() {
    def('attrs', () => {
      return { isActive: true }
    })

    beforeEach(() => $user.save())

    it('sets isActive to true', function() {
      expect($user.isActive).to.be.true
      expect(!$user.isNew).to.be.false
    })

    describe('when changed to inactive', function() {
      def('attrs', () => {
        return { isActive: false }
      })

      it('sets "isActive" to false', function() {
        expect($user.isActive).to.be.false
        expect(!$user.isNew).to.be.false
      })
    })
  })
})
```
In this case, `beforeEach` is running for each nested test as well and when it's run for `when changed to inactive sets "isActive" to false` it uses `$attrs` provided by suite `when changed to inactive`. And when it runs for `sets isActive to true` it uses `$attrs` from `when is active` suite. This is exactly the same behavior which rspec has.

**Note**: all other `ui`s for the same tests uses variable definition from the suite where `beforeEach/afterEach` is defined. In that particular case, it's `$attrs` from `when is active` suite. As a result the last suite always fails.

## Examples for `bdd-lazy-var/getter`
```js
describe('Suite', function() {
  subject(function() {
    return new Suite();
  });

  it('has parent', function() {
    expect(get.subject).to.have.keys('parent');
  });
});
```

## Examples for `bdd-lazy-var`
```js
describe('Suite', function() {
  def('fullName', function() {
    return this.firstName + '+' + this.lastName;
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
      expect(subject()).to.be.an('object');
    });

    it('can be retrieved via `this`', function() {
      expect(this.subject).to.equal(subject());
    });
  });
});
