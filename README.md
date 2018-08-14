# BDD + lazy variable definition (aka rspec)

[![BDD Lazy Var NPM version](https://badge.fury.io/js/bdd-lazy-var.svg)](http://badge.fury.io/js/bdd-lazy-var)
[![Build Status](https://travis-ci.org/stalniy/bdd-lazy-var.svg?branch=master)](https://travis-ci.org/stalniy/bdd-lazy-var)
[![Maintainability](https://api.codeclimate.com/v1/badges/65f79ae494101ba5f757/maintainability)](https://codeclimate.com/github/stalniy/bdd-lazy-var/maintainability)
[![BDD Lazy Var Join the chat at https://gitter.im/bdd-lazy-var/Lobby](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/bdd-lazy-var/Lobby?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

Provides "ui" for testing frameworks such as [mocha][mocha], [jasmine][jasmine] and [jest][jest] which allows to define lazy variables and subjects.

## Purpose

### The old way

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

### Why should it be improved?

Because as soon as amount of your tests increase, this pattern became increasingly difficult.
Sometimes you will find yourself jumping around spec files, trying to find out where a given variable was initially defined.
Or even worst, you may run into subtle bugs due to clobbering variables with common names (e.g. `model`, `view`) within a given scope, failing to realize they had already been defined.
Furthermore, declaration statements in `describe` blocks will start looking something like:

```js
var firstVar, secondVar, thirdVar, fourthVar, fifthVar, ..., nthVar
```

This is ugly and hard to parse. Finally, you can sometimes run into flaky tests due to "leaks" - test-specific variables that were not properly cleaned up after each case.

### The new, better way

In an attempt to address these issues, I had with my e2e tests, I decided to create this library, which allows to define suite specific variables in more elegant way.
So the original code above looks something like this:

```js
describe('Suite', () => {
  def('name', () => `John Doe ${Math.random()}`);

  it('defines `name` variable', () => {
    expect($name).to.exist
  });

  it('does not use name, so it is not created', () => {
    expect(1).to.equal(1);
  });
});
```

## Why the new way rocks

Switching over to this pattern has yielded a significant amount of benefits for us, including:

### No more global leaks

Because lazy vars are cleared after each test, we didn't have to worry about test pollution anymore. This helped ensure isolation between our tests, making them a lot more reliable.

### Clear meaning

Every time I see a `$<variable>` reference in my tests, I know where it's defined.
That, coupled with removing exhaustive `var` declarations in `describe` blocks, have made even my largest tests clear and understandable.

### Lazy evaluation

Variables are instantiated only when referenced.
That means if you don't use variable inside your test it won't be evaluated, making your tests to run faster.
No useless instantiation any more!

### Composition

Due to laziness we are able to compose variables. This allows to define more general varibles at the top level and more specific at the bottom:

```js
describe('User', function() {
  subject('user', () => new User($props))

  describe('when user is "admin"', function() {
    def('props', () => ({ role: 'admin' }))

    it('can update articles', function() {
      // user is created with property role equal "admin"
      expect($user).to....
    })
  })

  describe('when user is "member"', function() {
    def('props', () => ({ role: 'member' }))

    it('cannot update articles', function() {
      // user is created with property role equal "member"
      expect($user).to....
    })
  })
})
```

## Tests reusage

Very often you may find that some behavior repeats (e.g., when you implement Adapter pattern),
and you would like to reuse tests for a different class or object.
To do this [Wiki of Mocha.js](https://github.com/mochajs/mocha/wiki/Shared-Behaviours) recommend to move your tests into separate function and call it whenever you need it.

I prefer to be more explicit in doing this, that's why created few helper methods:
* `sharedExamplesFor` - defines a set of reusable tests. When you call this function, it just stores your tests
* `includeExamplesFor` - runs previously defined examples in current context (i.e., in current `describe`)
* `itBehavesLike` - runs defined examples in nested context (i.e., in nested `describe`)

`sharedExamplesFor` defines shared examples in the scope of the currently defining suite.
If you call this function outside `describe` (or `context`) it defines shared examples globally.

**WARNING**: files containing shared examples must be loaded before the files that
use them.

#### Scenarios

<details>
  <summary>shared examples group included in two groups in one file</summary>

```js
sharedExamplesFor('a collection', () => {
  it('has three items', () => {
    expect($subject.size).to.equal(3)
  })

  describe('#has', () => {
    it('returns true with an an item that is in the collection', () => {
      expect($subject.has(7)).to.be.true
    })

    it('returns false with an an item that is not in the collection', () => {
      expect($subject.has(9)).to.be.false
    })
  })
})

describe('Set', () => {
  subject(() => new Set([1, 2, 7]))

  itBehavesLike('a collection')
})

describe('Map', () => {
  subject(() => new Map([[2, 1], [7, 5], [3, 4]]))

  itBehavesLike('a collection')
})
```
</details>

<details>
  <summary>Passing parameters to a shared example group</summary>

```js
sharedExamplesFor('a collection', (size, existingItem, nonExistingItem) => {
  it('has three items', () => {
    expect($subject.size).to.equal(size)
  })

  describe('#has', () => {
    it('returns true with an an item that is in the collection', () => {
      expect($subject.has(existingItem)).to.be.true
    })

    it('returns false with an an item that is not in the collection', () => {
      expect($subject.has(nonExistingItem)).to.be.false
    })
  })
})

describe('Set', () => {
  subject(() => new Set([1, 2, 7]))

  itBehavesLike('a collection', 3, 2, 10)
})

describe('Map', () => {
  subject(() => new Map([[2, 1]]))

  itBehavesLike('a collection', 1, 2, 3)
})
```
</details>

<details>
  <summary>Passing lazy vars to a shared example group</summary>

There are 2 ways how to pass lazy variables:
* all variables are inherited by nested contexts (i.e., `describe` calls),
so you can rely on variable name, as it was done with `subject` in previous examples
* you can pass variable definition using `get.variable` helper

```js
sharedExamplesFor('a collection', (collection) => {
  def('collection', collection)

  it('has three items', () => {
    expect($collection.size).to.equal(1)
  })

  describe('#has', () => {
    it('returns true with an an item that is in the collection', () => {
      expect($collection.has(7)).to.be.true
    })

    it('returns false with an an item that is not in the collection', () => {
      expect($collection.has(9)).to.be.false
    })
  })
})

describe('Set', () => {
  subject(() => new Set([7]))

  itBehavesLike('a collection', get.variable('subject'))
})

describe('Map', () => {
  subject(() => new Map([[2, 1]]))

  itBehavesLike('a collection', get.variable('subject'))
})
```
</details>

## Shortcuts

Very often we want to declare several test cases which tests subject's field or subject's behavior.
To do this quickly you can use `its` or `it` without message:

<details>
  <summary>Shortcuts example</summary>

```js
describe('Array', () => {
  subject(() => ({
    items: [1, 2, 3],
    name: 'John'
  }))

  its('items.length', () => is.expected.to.equal(3)) // i.e. expect($subject.items.length).to.equal(3)
  its('name', () => is.expected.to.equal('John')) // i.e. expect($subject.name).to.equal('John')

  // i.e. expect($subject).to.have.property('items').which.has.length(3)
  it(() => is.expected.to.have.property('items').which.has.length(3))
})
```

Also it generates messages for you based on passed in function body. The example above reports:

```sh
  Array
    ✓ is expected to have property('items') which has length(3)
    items.length
      ✓ is expected to equal(3)
    name
      ✓ is expected to equal('John')
```
</details>

## Installation

```bash
npm install bdd-lazy-var --save-dev
```

<details>
  <summary>Mocha.js</summary>

#### Command line
```sh
mocha -u bdd-lazy-var/global
```

#### In JavaScript

See [Using Mocha programatically](https://github.com/mochajs/mocha/wiki/Using-mocha-programmatically)

```js
const Mocha = require('mocha');

const mocha = new Mocha({
  ui: 'bdd-lazy-var/global' // bdd-lazy-var or bdd-lazy-var/getter
});

mocha.addFile(...)
mocha.run(...)

// !!! Important the next code should be written in a separate file
// later you can either use `get` and `def` as global functions
// or export them from corresponding module
const { get, def } = require('bdd-lazy-var/global');

describe('Test', () => {
  // ...
})
```

#### Using karma (via karma-mocha npm package)

**Note** requires `karma-mocha` `^1.1.1`

So, in `karma.config.js` it looks like this:
```js
module.exports = function(config) {
  config.set({
    // ....
    client: {
      mocha: {
        ui: 'bdd-lazy-var/global',
        require: [require.resolve('bdd-lazy-var/global')]
      }
    }
  });
}
```
</details>

<details>
  <summary>Jasmine.js</summary>

#### Command line

```sh
jasmine --helper=node_modules/bdd-lazy-var/global.js
```

or using `spec/spec_helper.js`

```js
require('bdd-lazy-var/global');

// ... other helper stuff
```

and then

```sh
jasmine --helper=spec/*_helper.js
```

#### In JavaScript

When you want programatically run jasmine

```js
require('jasmine-core');

// !!! Important the next code should be written in a separate file
// later you can either use `get` and `def` as global functions
// or export them from corresponding module
const { get, def } = require('bdd-lazy-var/global');

describe('Test', () => {
  // ...
})
```

#### Using karma (via karma-jasmine npm package)

So, in `karma.config.js` it looks like this:

```js
module.exports = function(config) {
  config.set({
    // ....
    files: [
      'node_modules/bdd-lazy-var/global.js',
      // ... your specs here
    ]
  });
}
```
</details>

<details>
  <summary>Jest</summary>

#### Command line

Use Jest as usually if you export `get` and `def` from corresponding module

```js
jest
```

In case you want to use global `get` and `def`

```sh
jest --setupTestFrameworkScriptFile bdd-lazy-var/global
```

#### In JavaScript

```js
// later you can either use `get` and `def` as global functions
// or export them from relative module
const { get, def } = require('bdd-lazy-var/global');
```
</details>

## Dialects

`bdd-lazy-var` provides 3 different dialects:
* access variables by referencing `$<variableName>` (the recommended one, available by requiring `bdd-lazy-var/global`)
* access variables by referencing `get.<variableName>` (more strict, available by requiring `bdd-lazy-var/getter`)
* access variables by referencing `get('<variableName>')` (the most strict and less readable way, available by requiring `bdd-lazy-var`)

All are bundled as UMD versions. Each dialect is compiled in a separate file and should be required or provided for testing framework.

### Aliases

In accordance with Rspec's DDL, `context`, `xcontext`, and `fcontext` have been aliased to their related `describe` commands for both the Jest and Jasmine testing libraries. Mocha's BDD interface already provides this keyword.

## The Core Features
* lazy instantiation, allows variable composition
* automatically cleaned after each test
* accessible inside `before/beforeAll`, `after/afterAll` callbacks
* named `subject`s to be more explicit
* ability to shadow parent's variable
* variable inheritance with access to parent variables
* supports typescript

For more information, read [the article on Medium](https://medium.com/@sergiy.stotskiy/lazy-variables-with-mocha-js-d6063503104c#.ceo9jvrzh).

## TypeScript Notes

It's also possible to use `bdd-lazy-var` with TypeScript. The best integrated dialects are `get` and `getter`. To do so, you need either include corresponding definitions in your [tsconfig.json](http://www.typescriptlang.org/docs/handbook/tsconfig-json.html) or use ES6 module system.

<details>
  <summary>tsconfig.json</summary>

```js
{
  "compilerOptions": {
    "module": "commonjs",
    "removeComments": true,
    "preserveConstEnums": true,
    "sourceMap": true
  },
  "include": [
    "src/**/*",
    "node_modules/bdd-lazy-var/index.d.ts" // for `get('<variableName>')` syntax
    // or
    "node_modules/bdd-lazy-var/getter.d.ts" // for `get.<variableName>` syntax
  ]
}
```
</details>

<details>
  <summary>ES6 module system</summary>

```js
import { get, def } from 'bdd-lazy-var'
// or
import { get, def } from 'bdd-lazy-var/getter'

describe('My Test', () => {
  // ....
})
```

In this case TypeScript loads corresponding declarations automatically
</details>

It's a bit harder to work with `global` dialect. It creates global getters on the fly, so there is no way to let TypeScript know something about these variables, thus you need to `declare` them manually.

<details>
  <summary>TypeScript and global dialect</summary>

```ts
import { def } from 'bdd-lazy-var/global'

describe('My Test', () => {
  declare let $value: number // <-- need to place this declarations manually
  def('value', () => 5)

  it('equals 5', () => {
    expect($value).to.equal(5)
  })
})
```

As with other dialects you can either use `import` statements to load typings automatically or add them manually in `tsconfig.json`
</details>

## Examples

<details>
  <summary>Test with subject</summary>

```js
describe('Array', () => {
  subject(() => [1, 2, 3]);

  it('has 3 elements by default', () => {
    expect($subject).to.have.length(3);
  });
});
```
</details>

<details>
  <summary>Named subject</summary>

```js
describe('Array', () => {
  subject('collection', () => [1, 2, 3]);

  it('has 3 elements by default', () => {
    expect($subject).to.equal($collection);
    expect($collection).to.have.length(3);
  });
});
```
</details>

<details>
  <summary>`beforeEach` and redefined subject</summary>

```js
describe('Array', () => {
  subject('collection', () => [1, 2, 3]);

  beforeEach(() => {
    // this beforeEach is executed for tests of suite with subject equal [1, 2, 3]
    // and for nested describe with subject being []
    $subject.push(4);
  });

  it('has 3 elements by default', () => {
    expect($subject).to.equal($collection);
    expect($collection).to.have.length(3);
  });

  describe('when empty', () => {
    subject(() => []);

    it('has 1 element', () => {
      expect($subject).not.to.equal($collection);
      expect($collection).to.deep.equal([4]);
    });
  });
});
```
</details>

<details>
  <summary>Access parent variable in child variable definition</summary>

```js
describe('Array', () => {
  subject('collection', () => [1, 2, 3]);

  it('has 3 elements by default', () => {
    expect($subject).to.equal($collection);
    expect($collection).to.have.length(3);
  });

  describe('when empty', () => {
    subject(() => {
      // in this definition `$subject` references parent $subject (i.e., `$collection` variable)
      return $subject.concat([4, 5]);
    });

    it('is properly uses parent subject', () => {
      expect($subject).not.to.equal($collection);
      expect($collection).to.deep.equal([1, 2, 3, 4, 5]);
    });
  });
});
```
</details>

## Want to help?

Want to file a bug, contribute some code, or improve documentation? Excellent! Read up on guidelines for [contributing][contributing]

## License

[MIT License](http://www.opensource.org/licenses/MIT)

[mocha]: https://mochajs.org
[jasmine]: https://jasmine.github.io/2.0/introduction.html
[jest]: https://facebook.github.io/jest/docs/en/getting-started.html
[contributing]: https://github.com/stalniy/bdd-lazy-var/blob/master/CONTRIBUTING.md
