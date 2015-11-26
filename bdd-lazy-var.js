(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = require('./lib/interface');

},{"./lib/interface":2}],2:[function(require,module,exports){
(function (global){
var Mocha = (typeof window !== "undefined" ? window['Mocha'] : typeof global !== "undefined" ? global['Mocha'] : null);
var lazyVar = require('./lazy_var');

module.exports = Mocha.interfaces['bdd-lazy-var'] = function(rootSuite) {
  var currentlyDefinedSuite = rootSuite;
  var currentlyRunningSuites = [];
  var currentlyRetrievedVarName;

  Mocha.interfaces.bdd(rootSuite);
  rootSuite.on('pre-require', function(context) {
    context.subject = function(definition) {
      return arguments.length === 1 ? context.def('subject', definition) : context.get('subject');
    };

    context.get = function(name) {
      if (name === currentlyRetrievedVarName) {
        currentlyRunningSuites.index--;
      }

      try {
        currentlyRetrievedVarName = name;

        return lazyVar.getOrCreate(currentlyRunningSuites[currentlyRunningSuites.index], name);
      } finally {
        currentlyRetrievedVarName = null;
        currentlyRunningSuites.index = currentlyRunningSuites.length - 1;
      }
    };

    context.def = function(name, definition) {
      return lazyVar.register(currentlyDefinedSuite.ctx, name, definition);
    };

    var describe = context.describe;
    context.describe = function(title, runTests) {
      return describe(title, function() {
        currentlyDefinedSuite = this;

        context.before(registerSuite);
        runTests.apply(this, arguments);
        context.afterEach(lazyVar.cleanUp);
        context.after(unregisterSuite);
      });
    };

    function registerSuite() {
      currentlyRunningSuites.push(this);
      currentlyRunningSuites.index = currentlyRunningSuites.length - 1;
    }

    function unregisterSuite() {
      if (currentlyRunningSuites.length > 0) {
        currentlyRunningSuites.pop();
        currentlyRunningSuites.index = currentlyRunningSuites.length - 1;
      }
    }

    context.context = context.describe;
    context.context.skip = context.describe.skip = describe.skip;
    context.context.only = context.describe.only = describe.only;
  });
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./lazy_var":3}],3:[function(require,module,exports){
var varsToClean = [];

function propNameFor(varName) {
  var name = '_lazy_' + varName + '_definition';

  return typeof Symbol !== 'undefined' ? Symbol.for(name) : name;
}

var lazyVar = {
  register: function(context, name, definition) {
    var propName = propNameFor(name);

    if (context.hasOwnProperty(propName)) {
      throw new Error('Cannot define "' + name + '" variable twice in the same suite.');
    }

    context[propName] = definition;
  },

  getOrCreate: function(context, name) {
    if (!(propNameFor(name) in context)) {
      throw new Error('"' + name + '" is not defined.');
    }

    var definition = lazyVar.getDefinition(context, name);

    if (!context.hasOwnProperty(name)) {
      context[name] = typeof definition === 'function' ? definition() : definition;
      varsToClean.push({ context: context, name: name });
    }

    return context[name];
  },

  getDefinition: function(context, name) {
    return context[propNameFor(name)];
  },

  cleanUp: function() {
    varsToClean.forEach(lazyVar.destroy);
    varsToClean.length = 0;
  },

  destroy: function(variable) {
    if (variable.context.hasOwnProperty(variable.name)) {
      delete variable.context[variable.name];
    }
  }
};

module.exports = lazyVar;

},{}]},{},[1]);
