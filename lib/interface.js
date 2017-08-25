var lazyVar = require('./lazy_var');
var Symbol = require('./symbol');
var CURRENTLY_RETRIEVED_VAR_FIELD = Symbol.for('__gettingVariable');

function last(array) {
  return array ? array[array.length - 1] : null;
}

function cleanUp() {
  lazyVar.cleanUp(this);
}

function getParentContextFor(varName, testContext) {
  var metadata = lazyVar.metadataFor(testContext, varName);

  if (!metadata || !metadata.parent) {
    throw new Error('Unknown parent variable "' + varName + '".');
  }

  return metadata.parent;
}

function defaultOptions(options) {
  options.suite = options.suite || 'describe';
  options.setupSuite = options.setupSuite || 'before';
  options.teardownSuite = options.teardownSuite || 'after';
  options.setup = options.setup || 'beforeEach';
  options.teardown = options.teardown || 'afterEach';
  options.suiteTracking = options.suiteTracking || 'default';

  return options;
}

function VariableContext(varName, context) {
  this.name = varName;
  this.context = context;
  this.ownContext = context;
}

VariableContext.prototype.isSame = function(anotherVarName) {
  return this.name && (
    this.name === anotherVarName ||
    lazyVar.metadataFor(this.ownContext, this.name).hasAlias(anotherVarName)
  );
};

VariableContext.EMPTY = new VariableContext(null, null);

module.exports = function(context, state, options) {
  options = defaultOptions(options || {});

  var ui = {};
  var suiteTracker = {
    rspec: function(runTests, suite, args) {
      context[options.setupSuite](registerSuite);
      runTests.apply(suite, args);
      context[options.setupSuite](cleanUp);
      context[options.teardown](cleanUp);
      context[options.teardownSuite](cleanUpAndRestorePrev);
    },

    default: function(runTests, suite, args) {
      // TODO: callbacks count may be decreased.
      // In mocha.js it's possible to utilize reporter.suite || reporter.test
      // and in jasmine.js jasmine.getEnv().currentSpec
      context[options.setupSuite](registerSuite);
      context[options.setup](registerSuite);
      context[options.teardown](registerSuite);
      context[options.teardownSuite](registerSuite);
      runTests.apply(suite, args);
      context[options.setupSuite](cleanUp);
      context[options.teardown](cleanUp);
      context[options.teardownSuite](cleanUp);
    }
  };

  ui.subject = function(name, definition) {
    if (arguments.length === 1) {
      return ui.def('subject', name);
    } else if (arguments.length === 2) {
      return ui.def([name, 'subject'], definition);
    }

    return ui.get('subject');
  };

  ui.get = function(varName) {
    var testContext = state.currentTestContext;
    var variable = last(testContext[CURRENTLY_RETRIEVED_VAR_FIELD]) || VariableContext.EMPTY;

    if (variable.isSame(varName)) {
      var prevContext = variable.context;

      try {
        variable.context = getParentContextFor(varName, prevContext);

        return variable.context[varName];
      } finally {
        variable.context = prevContext;
      }
    }

    try {
      testContext[CURRENTLY_RETRIEVED_VAR_FIELD] = testContext[CURRENTLY_RETRIEVED_VAR_FIELD] || [];
      testContext[CURRENTLY_RETRIEVED_VAR_FIELD].push(new VariableContext(varName, testContext));

      return testContext[varName];
    } finally {
      testContext[CURRENTLY_RETRIEVED_VAR_FIELD].pop();
    }
  };

  ui.def = function(varName, definition) {
    var suite = state.currentlyDefinedSuite;

    if (Array.isArray(varName)) {
      ui.def(varName[0], definition);
      return defineAliasesFor(suite, varName[0], varName.slice(1));
    }

    lazyVar.register(suite.ctx, varName, definition, getCurrentContext);
    detectParentDeclarationFor(suite, varName);
  };

  ui.get.definitionOf = ui.get.variable = function(varName) {
    return ui.get.bind(ui, varName);
  };

  ui.wrapTests = function(fn) {
    return function(title, runTests) {
      return fn(title, function() {
        var previousDefinedSuite = state.currentlyDefinedSuite;

        state.currentlyDefinedSuite = this;
        suiteTracker[options.suiteTracking](runTests, this, arguments);
        state.currentlyDefinedSuite = previousDefinedSuite;
      });
    };
  };

  function registerSuite() {
    state.prevTestContext = state.currentTestContext || null;
    state.currentTestContext = this;
  }

  function getCurrentContext() {
    return state.currentTestContext;
  }

  function cleanUpAndRestorePrev() {
    state.currentTestContext = state.prevTestContext;
    cleanUp.call(this);
  }

  function detectParentDeclarationFor(suite, varName) {
    if (suite.parent && lazyVar.isDefined(suite.parent.ctx, varName)) {
      lazyVar.metadataFor(suite.ctx, varName).parent = suite.parent.ctx;
    }

    if (typeof options.onDefineVariable === 'function') {
      options.onDefineVariable(suite, varName, context);
    }
  }

  function defineAliasesFor(suite, varName, aliases) {
    aliases.forEach(function(alias) {
      lazyVar.registerAlias(suite.ctx, varName, alias);
      detectParentDeclarationFor(suite, alias);
    });
  }

  return ui;
};
