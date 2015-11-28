(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = require('./lib/interface');

},{"./lib/interface":2}],2:[function(require,module,exports){
(function (global){
var Mocha = (typeof window !== "undefined" ? window['Mocha'] : typeof global !== "undefined" ? global['Mocha'] : null);
var lazyVar = require('./lazy_var');

module.exports = Mocha.interfaces['bdd-lazy-var'] = function(rootSuite) {
  var currentlyDefinedSuite = rootSuite;
  var currentTestContext;

  Mocha.interfaces.bdd(rootSuite);
  rootSuite.on('pre-require', function(context) {
    context.subject = function(definition) {
      return arguments.length === 1 ? context.def('subject', definition) : context.get('subject');
    };

    context.get = function(varName) {
      var originalSuite = currentTestContext;

      if (varName === currentTestContext._definesVariable) {
        currentTestContext = getParentContextFor(varName, currentTestContext);
      }

      try {
        currentTestContext._definesVariable = varName;

        return lazyVar.getOrCreate(currentTestContext, varName);
      } finally {
        delete currentTestContext._definesVariable;
        currentTestContext = originalSuite;
      }
    };

    context.def = function(varName, definition) {
      if (lazyVar.isDefined(currentlyDefinedSuite.ctx, varName)) {
        registerParentContextFor(varName, currentlyDefinedSuite);
      }

      return lazyVar.register(currentlyDefinedSuite.ctx, varName, definition);
    };

    var describe = context.describe;
    context.describe = function(title, runTests) {
      return describe(title, function() {
        currentlyDefinedSuite = this;

        context.before(function() {
          this.title = title;
        });

        context.before(registerSuite);
        context.beforeEach(registerSuite);
        context.afterEach(registerSuite);
        context.after(registerSuite);
        runTests.apply(this, arguments);
        context.afterEach(lazyVar.cleanUp);
        context.after(lazyVar.cleanUp);

        currentlyDefinedSuite = null;
      });
    };

    function registerSuite() {
      currentTestContext = this;
    }

    function registerParentContextFor(varName, suite) {
      if (!suite.ctx.hasOwnProperty('_parentContextForLazyVars')) {
        suite.ctx._parentContextForLazyVars = {};
      }

      suite.ctx._parentContextForLazyVars[varName] = suite.parent.ctx;
    }

    function getParentContextFor(varName, testContext) {
      return testContext._parentContextForLazyVars ? testContext._parentContextForLazyVars[varName] : null;
    }

    context.context = context.describe;
    context.context.skip = context.describe.skip = describe.skip;
    context.context.only = context.describe.only = describe.only;
  });
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./lazy_var":3}],3:[function(require,module,exports){
var varsToClean = [];
var prop = require('./symbol').for;
var createdVarsPropName = prop('__createdVars');

function definitionNameFor(varName) {
  return prop('__' + varName + 'LazyDefinition');
}

function getDefinition(context, definitionName) {
  return context[definitionName];
}

function markVarAsCreated(context, definitionName) {
  if (!context.hasOwnProperty(createdVarsPropName)) {
    context[createdVarsPropName] = {};
  }

  context[createdVarsPropName][definitionName] = getDefinition(context, definitionName);
}

function isCreated(context, definitionName) {
  var calledDefinitions = context[createdVarsPropName] || {};

  return calledDefinitions[definitionName] === getDefinition(context, definitionName);
}

var lazyVar = {
  register: function(context, name, definition) {
    var propName = definitionNameFor(name);

    if (context.hasOwnProperty(propName)) {
      throw new Error('Cannot define "' + name + '" variable twice in the same suite.');
    }

    context[propName] = definition;
  },

  isDefined: function(context, name) {
    return context && definitionNameFor(name) in context;
  },

  getOrCreate: function(context, name) {
    if (!lazyVar.isDefined(context, name)) {
      throw new Error('Lazy variable "' + name + '" is not defined.');
    }

    var definitionName = definitionNameFor(name);
    var definition = getDefinition(context, definitionName);

    if (!(name in context) || !isCreated(context, definitionName)) {
      context[name] = typeof definition === 'function' ? definition() : definition;
      markVarAsCreated(context, definitionName);
      varsToClean.push({ context: context, name: name });
    }

    return context[name];
  },

  cleanUp: function() {
    varsToClean.forEach(lazyVar.destroy);
    varsToClean.length = 0;
  },

  destroy: function(variable) {
    if (variable.context.hasOwnProperty(variable.name)) {
      delete variable.context[variable.name];
      delete variable.context[createdVarsPropName];
    }
  }
};

module.exports = lazyVar;

},{"./symbol":4}],4:[function(require,module,exports){
var indentity = function(value) {
  return value;
};

module.exports = {
  for: typeof Symbol === 'undefined' ? indentity : Symbol.for
};

},{}]},{},[1]);
