(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('mocha')) :
	typeof define === 'function' && define.amd ? define(['mocha'], factory) :
	(global.bdd_lazy_var = factory(global.Mocha));
}(this, (function (mocha) { 'use strict';

mocha = mocha && mocha.hasOwnProperty('default') ? mocha['default'] : mocha;

var indentity = function indentity(value) {
  return value;
};

var symbol = {
  for: typeof Symbol === 'undefined' ? indentity : Symbol.for
};

var lazyVarsPropName = symbol.for('__lazyVars');

function VariableMetadata(definition, thisContext) {
  this.value = definition;
  this.parent = null;
  this.aliases = null;

  if (typeof thisContext === 'function') {
    Object.defineProperty(this, 'context', { get: thisContext });
  } else {
    this.context = thisContext;
  }
}

VariableMetadata.prototype.addAlias = function (name) {
  this.aliases = this.aliases || {};
  this.aliases[name] = true;
};

VariableMetadata.prototype.hasAlias = function (name) {
  return this.aliases && this.aliases[name];
};

VariableMetadata.prototype.buildAliasMetadata = function (aliasName) {
  var aliasMetadata = new VariableMetadata(null, null);

  aliasMetadata.aliases = this.aliases;
  this.addAlias(aliasName);

  return aliasMetadata;
};

var lazyVar = {
  register: function register(context, name, definition, thisContext) {
    var hasOwnVariable = context.hasOwnProperty(name) && context.hasOwnProperty(lazyVarsPropName);

    if (hasOwnVariable && lazyVar.isDefined(context, name)) {
      throw new Error('Cannot define "' + name + '" variable twice in the same suite.');
    }

    var metadata = lazyVar.metadataFor(context);
    metadata.defs[name] = new VariableMetadata(definition, thisContext || context);

    lazyVar.defineProperty(context, name, metadata);
  },

  metadataFor: function metadataFor(context, varName) {
    if (!context.hasOwnProperty(lazyVarsPropName)) {
      var lazyVarsInPrototype = context[lazyVarsPropName] ? context[lazyVarsPropName].defs : null;

      context[lazyVarsPropName] = {
        defs: Object.create(lazyVarsInPrototype),
        created: {}
      };
    }

    return arguments.length === 2 ? context[lazyVarsPropName].defs[varName] : context[lazyVarsPropName];
  },

  defineProperty: function defineProperty(context, name, metadata) {
    Object.defineProperty(context, name, {
      configurable: true,

      get: function get() {
        if (!metadata.created.hasOwnProperty(name)) {
          var definition = metadata.defs[name];
          var value = definition.value;

          metadata.created[name] = typeof value === 'function' ? value.call(definition.context) : value;
        }

        return metadata.created[name];
      }
    });
  },

  registerAlias: function registerAlias(context, varName, aliasName) {
    var metadata = lazyVar.metadataFor(context);

    metadata.defs[aliasName] = metadata.defs[varName].buildAliasMetadata(aliasName);
    metadata.defs[aliasName].addAlias(varName);
    Object.defineProperty(context, aliasName, {
      get: function get() {
        return this[varName];
      }
    });
  },

  isDefined: function isDefined(context, name) {
    var hasLazyVars = context && context[lazyVarsPropName];

    return !!(hasLazyVars && context[lazyVarsPropName].defs[name]);
  },

  cleanUp: function cleanUp(context) {
    if (context.hasOwnProperty(lazyVarsPropName)) {
      context[lazyVarsPropName].created = {};
    }
  }
};

var lazy_var = lazyVar;

var CURRENTLY_RETRIEVED_VAR_FIELD = symbol.for('__currentVariableStack');

function Variable(varName, context) {
  this.name = varName;
  this.context = context;
  this.ownContext = context;
}

Variable.prototype.isSame = function (anotherVarName) {
  return this.name && (this.name === anotherVarName || lazy_var.metadataFor(this.ownContext, this.name).hasAlias(anotherVarName));
};

Variable.prototype.value = function () {
  return this.context[this.name];
};

Variable.prototype.addToStack = function () {
  this.context[CURRENTLY_RETRIEVED_VAR_FIELD] = this.context[CURRENTLY_RETRIEVED_VAR_FIELD] || [];
  this.context[CURRENTLY_RETRIEVED_VAR_FIELD].push(this);

  return this;
};

Variable.prototype.release = function () {
  this.context[CURRENTLY_RETRIEVED_VAR_FIELD].pop();
};

Variable.prototype.valueInParentContext = function (varOrAliasName) {
  var prevContext = this.context;

  try {
    this.context = this.getParentContextFor(varOrAliasName);
    return this.context[varOrAliasName];
  } finally {
    this.context = prevContext;
  }
};

Variable.prototype.getParentContextFor = function (varName) {
  var metadata = lazy_var.metadataFor(this.context, varName);

  if (!metadata || !metadata.parent) {
    throw new Error('Unknown parent variable "' + varName + '".');
  }

  return metadata.parent;
};

Variable.EMPTY = new Variable(null, null);

Variable.allocate = function (varName, options) {
  var variable = new this(varName, options['in']);

  return variable.addToStack();
};

Variable.evaluate = function (varName, options) {
  var variable = Variable.fromStack(options['in']);

  if (variable.isSame(varName)) {
    return variable.valueInParentContext(varName);
  }

  try {
    variable = Variable.allocate(varName, options);
    return variable.value();
  } finally {
    variable.release();
  }
};

Variable.fromStack = function (context) {
  return last(context[CURRENTLY_RETRIEVED_VAR_FIELD]) || Variable.EMPTY;
};

function last(array) {
  return array ? array[array.length - 1] : null;
}

var variable = Variable;

var _interface = function _interface(context, tracker, options) {
  var ui = {};

  ui.subject = function (name, definition) {
    if (arguments.length === 1) {
      return ui.def('subject', name);
    } else if (arguments.length === 2) {
      return ui.def([name, 'subject'], definition);
    }

    return ui.get('subject');
  };

  ui.get = function (varName) {
    return variable.evaluate(varName, { 'in': tracker.currentContext() });
  };

  ui.def = function (varName, definition) {
    var suite = tracker.currentlyDefinedSuite();

    if (Array.isArray(varName)) {
      ui.def(varName[0], definition);
      return defineAliasesFor(suite, varName[0], varName.slice(1));
    }

    lazy_var.register(suite.ctx, varName, definition, tracker.currentContext);
    detectParentDeclarationFor(suite, varName);
  };

  ui.get.definitionOf = ui.get.variable = function (varName) {
    return ui.get.bind(ui, varName);
  };

  function detectParentDeclarationFor(suite, varName) {
    if (suite.parent && lazy_var.isDefined(suite.parent.ctx, varName)) {
      lazy_var.metadataFor(suite.ctx, varName).parent = suite.parent.ctx;
    }

    if (typeof options.onDefineVariable === 'function') {
      options.onDefineVariable(suite, varName, context);
    }
  }

  function defineAliasesFor(suite, varName, aliases) {
    aliases.forEach(function (alias) {
      lazy_var.registerAlias(suite.ctx, varName, alias);
      detectParentDeclarationFor(suite, alias);
    });
  }

  return ui;
};

var commonjsGlobal = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

function createOptions(options) {
  return {
    setupSuite: options.setupSuite || commonjsGlobal.before,
    teardownSuite: options.teardownSuite || commonjsGlobal.after,
    setup: options.setup || commonjsGlobal.beforeEach,
    teardown: options.teardown || commonjsGlobal.afterEach
  };
}

var suite_tracker = function createSuiteTracker(config) {
  var state = { currentlyDefinedSuite: config.rootSuite };
  var options;

  return {
    cleanUp: function cleanUp() {
      lazy_var.cleanUp(this);
    },

    registerSuite: function registerSuite() {
      state.prevTestContext = state.currentTestContext || null;
      state.currentTestContext = this;
    },

    currentContext: function currentContext() {
      return state.currentTestContext;
    },

    currentlyDefinedSuite: function currentlyDefinedSuite() {
      return state.currentlyDefinedSuite;
    },

    cleanUpAndRestorePrev: function cleanUpAndRestorePrev() {
      state.currentTestContext = state.prevTestContext;
      lazy_var.cleanUp(this);
    },

    wrapSuite: function wrapSuite(fn) {
      var self = this;

      return function detectSuite(title, runTests) {
        return fn(title, function () {
          var previousDefinedSuite = state.currentlyDefinedSuite;

          state.currentlyDefinedSuite = this;
          options = options || createOptions(config);
          self.track(runTests, this, arguments, options);
          state.currentlyDefinedSuite = previousDefinedSuite;
        });
      };
    },

    track: function track(runTests, suite, args, options) {
      // TODO: callbacks count may be decreased.
      // In mocha.js it's possible to utilize reporter.suite || reporter.test
      // and in jasmine.js jasmine.getEnv().currentSpec
      options.setupSuite(this.registerSuite);
      options.setup(this.registerSuite);
      options.teardown(this.registerSuite);
      options.teardownSuite(this.registerSuite);
      runTests.apply(suite, args);
      options.setupSuite(this.cleanUp);
      options.teardown(this.cleanUp);
      options.teardownSuite(this.cleanUp);
    }
  };
};

function addInterface(rootSuite, tracker, options) {
  rootSuite.on('pre-require', function (context) {
    var ui = _interface(context, tracker, options);
    var describe = context.describe;

    context.def = ui.def;
    context.get = ui.get;
    context.subject = ui.subject;
    context.describe = tracker.wrapSuite(describe);
    context.describe.skip = tracker.wrapSuite(describe.skip);
    context.describe.only = tracker.wrapSuite(describe.only);

    context.context = context.describe;
    context.context.only = context.describe.only;
    context.xdescribe = context.xcontext = context.context.skip = context.describe.skip;
  });
}

var mocha$1 = {
  createUi: function createUi(name, options) {
    var config = options || {};
    var buildTracker = config.createTracker || suite_tracker;
    config.inheritUi = config.inheritUi || 'bdd';

    return mocha.interfaces[name] = function (rootSuite) {
      mocha.interfaces[config.inheritUi](rootSuite);
      return addInterface(rootSuite, buildTracker({ rootSuite: rootSuite }), config);
    };
  }
};

var bdd = mocha$1.createUi('bdd-lazy-var');

return bdd;

})));
