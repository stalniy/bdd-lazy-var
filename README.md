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

Because lazy vars are cleared after each test, we didn't have to worry about test pollution any more. This helped ensure isolation between our tests, making them a lot more reliable.

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

## Installation
```bash
npm install bdd-lazy-var --save-dev
```

### Mocha.js

#### Command line
```sh
mocha -u bdd-lazy-var
```

#### In JavaScript
```js
const Mocha = require('mocha');

const mocha = new Mocha({
  ui: 'bdd-lazy-var/global' // bdd-lazy-var or bdd-lazy-var/getter
});

// later you can either use `get` and `def` as global functions
// or export them from corresponding module
const { get, def } = require('bdd-lazy-var/global');
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

### Jasmine

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

```js
require('jasmine-core');

// later you can either use `get` and `def` as global functions
// or export them from corresponding module
const { get, def } = require('bdd-lazy-var/global');
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

### Jest

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

## Dialects

`bdd-lazy-var` provides 3 different dialects:
* access variables by referencing `$<variableName>` (the recommended one, available by requiring `bdd-lazy-var/global`)
* access variables by referencing `get.<variableName>` (more strict, available by requiring `bdd-lazy-var/getter`)
* access variables by referencing `get('<variableName>')` (the most strict and less readable way, available by requiring `bdd-lazy-var/index`)

All are bundled as UMD versions.

## The Core Features
* lazy instantiation, allows variable composition
* automatically cleaned after each test
* accessible inside `before/beforeAll`, `after/afterAll` callbacks
* named `subject`s to be more explicit
* ability to shadow parent's variable
* variable inheritance with access to parent variables

For more information, read [the article on Medium](https://medium.com/@sergiy.stotskiy/lazy-variables-with-mocha-js-d6063503104c#.ceo9jvrzh).

## Examples

### Test with subject

```js
describe('Array', () => {
  subject(() => [1, 2, 3]);

  it('has 3 elements by default', () => {
    expect($subject).to.have.length(3);
  });
});
```

### Named subject

```js
describe('Array', () => {
  subject('collection', () => [1, 2, 3]);

  it('has 3 elements by default', () => {
    expect($subject).to.equal($collection);
    expect($collection).to.have.length(3);
  });
});
```

### With `beforeEach` and redefined subject

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

### Access parent variable in child variable definition

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

## Want to help?

Want to file a bug, contribute some code, or improve documentation? Excellent! Read up on guidelines for [contributing][contributing]

## License

[MIT License](http://www.opensource.org/licenses/MIT)

[mocha]: https://mochajs.org
[jasmine]: https://jasmine.github.io/2.0/introduction.html
[jest]: https://facebook.github.io/jest/docs/en/getting-started.html
[contributing]: https://github.com/stalniy/bdd-lazy-var/blob/master/CONTRIBUTING.md
