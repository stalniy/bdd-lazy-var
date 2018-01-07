(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('mocha')) :
	typeof define === 'function' && define.amd ? define(['mocha'], factory) :
	(global.bdd_lazy_var = factory(global.Mocha));
}(this, (function (mocha) { 'use strict';

mocha = mocha && mocha.hasOwnProperty('default') ? mocha['default'] : mocha;

var commonjsGlobal = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};





function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var indentity = function indentity(x) {
  return x;
};

var symbol = {
  for: typeof Symbol === 'undefined' ? indentity : Symbol.for
};

var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

var createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();





var defineProperty = function (obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
};

var LAZY_VARS_FIELD = symbol.for('__lazyVars');

var VariableMetadata = function () {
  function VariableMetadata(name, definition) {
    classCallCheck(this, VariableMetadata);

    this.value = definition;
    this.parent = null;
    this.names = defineProperty({}, name, true);
  }

  createClass(VariableMetadata, [{
    key: 'addName',
    value: function addName(name) {
      this.names[name] = true;
      return this;
    }
  }, {
    key: 'isNamedAs',
    value: function isNamedAs(name) {
      return this.names[name];
    }
  }]);
  return VariableMetadata;
}();

var Metadata = function () {
  function Metadata(context) {
    classCallCheck(this, Metadata);

    this.context = context;
    this.defs = {};
    this.created = {};
  }

  createClass(Metadata, [{
    key: 'getVar',
    value: function getVar(name) {
      if (!this.created.hasOwnProperty(name)) {
        this.created[name] = this.evaluateVar(name);
      }

      return this.created[name];
    }
  }, {
    key: 'evaluateVar',
    value: function evaluateVar(name) {
      var definition = this.defs[name];
      var value = definition.value;

      return typeof value === 'function' ? value() : value;
    }
  }, {
    key: 'addChild',
    value: function addChild(context) {
      var child = new Metadata(context);
      child.defs = Object.create(this.defs);

      return child;
    }
  }, {
    key: 'releaseVars',
    value: function releaseVars() {
      this.created = {};
    }
  }]);
  return Metadata;
}();

var lazyVar = {
  register: function register(context, name, definition) {
    var metadata = lazyVar.metadataFor(context);

    if (metadata.defs.hasOwnProperty(name)) {
      throw new Error('Cannot define "' + name + '" variable twice in the same suite.');
    }

    metadata.defs[name] = new VariableMetadata(name, definition);
  },
  metadataFor: function metadataFor(context, varName) {
    if (!context.hasOwnProperty(LAZY_VARS_FIELD)) {
      var lazyVarsInPrototype = context[LAZY_VARS_FIELD];
      context[LAZY_VARS_FIELD] = lazyVarsInPrototype ? lazyVarsInPrototype.addChild(context) : new Metadata(context);
    }

    var metadata = context[LAZY_VARS_FIELD];

    return varName ? metadata.defs[varName] : metadata;
  },
  getMetadataFor: function getMetadataFor(context, name) {
    var metadata = context[LAZY_VARS_FIELD];

    return name && metadata ? metadata.defs[name] : metadata;
  },
  registerAlias: function registerAlias(context, varName, aliasName) {
    var metadata = lazyVar.metadataFor(context);

    metadata.defs[aliasName] = metadata.defs[varName].addName(aliasName);
  },
  isDefined: function isDefined(context, name) {
    var hasLazyVars = context && context[LAZY_VARS_FIELD];

    return !!(hasLazyVars && context[LAZY_VARS_FIELD].defs[name]);
  },
  cleanUp: function cleanUp(context) {
    if (context.hasOwnProperty(LAZY_VARS_FIELD)) {
      context[LAZY_VARS_FIELD].releaseVars();
    }
  }
};

var lazy_var = lazyVar;

var CURRENTLY_RETRIEVED_VAR_FIELD = symbol.for('__currentVariableStack');
var last = function last(array) {
  return array ? array[array.length - 1] : null;
};

var Variable = function () {
  createClass(Variable, null, [{
    key: 'allocate',
    value: function allocate(varName, options) {
      var variable = new this(varName, options.in);

      return variable.addToStack();
    }
  }, {
    key: 'evaluate',
    value: function evaluate(varName, options) {
      var variable = Variable.fromStack(options.in);

      if (variable.isSame(varName)) {
        return variable.valueInParentContext(varName);
      }

      try {
        variable = Variable.allocate(varName, options);
        return variable.value();
      } finally {
        variable.release();
      }
    }
  }, {
    key: 'fromStack',
    value: function fromStack(context) {
      return last(context[CURRENTLY_RETRIEVED_VAR_FIELD]) || Variable.EMPTY;
    }
  }]);

  function Variable(varName, context) {
    classCallCheck(this, Variable);

    this.name = varName;
    this.context = context;
    this.ownContext = context;
  }

  createClass(Variable, [{
    key: 'isSame',
    value: function isSame(anotherVarName) {
      return this.name && (this.name === anotherVarName || lazy_var.metadataFor(this.ownContext, this.name).isNamedAs(anotherVarName));
    }
  }, {
    key: 'value',
    value: function value() {
      return lazy_var.getMetadataFor(this.context).getVar(this.name);
    }
  }, {
    key: 'addToStack',
    value: function addToStack() {
      this.context[CURRENTLY_RETRIEVED_VAR_FIELD] = this.context[CURRENTLY_RETRIEVED_VAR_FIELD] || [];
      this.context[CURRENTLY_RETRIEVED_VAR_FIELD].push(this);

      return this;
    }
  }, {
    key: 'release',
    value: function release() {
      this.context[CURRENTLY_RETRIEVED_VAR_FIELD].pop();
    }
  }, {
    key: 'valueInParentContext',
    value: function valueInParentContext(varOrAliasName) {
      var prevContext = this.context;

      try {
        this.context = this.getParentContextFor(varOrAliasName);
        return lazy_var.getMetadataFor(this.context).getVar(varOrAliasName);
      } finally {
        this.context = prevContext;
      }
    }
  }, {
    key: 'getParentContextFor',
    value: function getParentContextFor(varName) {
      var metadata = lazy_var.getMetadataFor(this.context, varName);

      if (!metadata || !metadata.parent) {
        throw new Error('Unknown parent variable "' + varName + '".');
      }

      return metadata.parent;
    }
  }]);
  return Variable;
}();

Variable.EMPTY = new Variable(null, null);

var variable = Variable;

var _interface = createCommonjsModule(function (module) {
  module.exports = function (context, tracker, options) {
    function get(varName) {
      return variable.evaluate(varName, { in: tracker.currentContext() });
    }

    get.definitionOf = get.variable = function (varName) {
      return get.bind(null, varName);
    };

    function def(varName, definition) {
      var suite = tracker.currentlyDefinedSuite;

      if (Array.isArray(varName)) {
        def(varName[0], definition);
        defineAliasesFor(suite, varName[0], varName.slice(1));
      } else {
        lazy_var.register(suite.ctx, varName, definition, tracker.currentContext);
        detectParentDeclarationFor(suite, varName);
      }
    }

    function subject() {
      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      var name = args[0],
          definition = args[1];


      if (args.length === 1) {
        return def('subject', name);
      }

      if (args.length === 2) {
        return def([name, 'subject'], definition);
      }

      return get('subject');
    }

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

    return { subject: subject, def: def, get: get };
  };
});

var SuiteTracker = function () {
  function SuiteTracker() {
    var config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    classCallCheck(this, SuiteTracker);

    this.state = { currentlyDefinedSuite: config.rootSuite };
    this.currentContext = this.currentContext.bind(this);
    this.watcher = this.buildWatcher();
    this.testInterface = createTestInterface(config);
    this.cleanUp = lazy_var.cleanUp;
  }

  createClass(SuiteTracker, [{
    key: 'buildWatcher',
    value: function buildWatcher() {
      var self = this;

      return {
        registerSuite: function registerSuite() {
          return self.registerSuite(this);
        },
        cleanUp: function cleanUp() {
          return self.cleanUp(this);
        },
        cleanUpAndRestorePrev: function cleanUpAndRestorePrev() {
          return self.cleanUpAndRestorePrev(this);
        }
      };
    }
  }, {
    key: 'currentContext',
    value: function currentContext() {
      return this.state.currentTestContext;
    }
  }, {
    key: 'wrapSuite',
    value: function wrapSuite(fn) {
      var self = this;

      return function detectSuite(title, defineTests) {
        for (var _len = arguments.length, args = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
          args[_key - 2] = arguments[_key];
        }

        return fn.apply(undefined, [title, function defineSuite() {
          var previousDefinedSuite = self.state.currentlyDefinedSuite;

          self.state.currentlyDefinedSuite = this;

          for (var _len2 = arguments.length, testArgs = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
            testArgs[_key2] = arguments[_key2];
          }

          self.track(defineTests, this, testArgs);
          self.state.currentlyDefinedSuite = previousDefinedSuite;
        }].concat(args));
      };
    }
  }, {
    key: 'registerSuite',
    value: function registerSuite(context) {
      this.state.prevTestContext = this.state.currentTestContext || null;
      this.state.currentTestContext = context;
    }
  }, {
    key: 'cleanUpAndRestorePrev',
    value: function cleanUpAndRestorePrev(context) {
      this.state.currentTestContext = this.state.prevTestContext;
      return this.cleanUp(context);
    }
  }, {
    key: 'track',
    value: function track(defineTests, suite, args) {
      var _watcher = this.watcher,
          registerSuite = _watcher.registerSuite,
          cleanUp = _watcher.cleanUp;
      var _testInterface = this.testInterface,
          setup = _testInterface.setup,
          teardown = _testInterface.teardown,
          setupSuite = _testInterface.setupSuite,
          teardownSuite = _testInterface.teardownSuite;
      // TODO: callbacks count may be decreased.
      // In mocha.js it's possible to utilize reporter.suite || reporter.test
      // and in jasmine.js jasmine.getEnv().currentSpec

      setupSuite(registerSuite);
      setup(registerSuite);
      teardown(registerSuite);
      teardownSuite(registerSuite);
      defineTests.apply(suite, args);
      setupSuite(cleanUp);
      teardown(cleanUp);
      teardownSuite(cleanUp);
    }
  }, {
    key: 'currentlyDefinedSuite',
    get: function get$$1() {
      return this.state.currentlyDefinedSuite;
    }
  }]);
  return SuiteTracker;
}();

function createTestInterface(options) {
  var state = {};

  return {
    get setupSuite() {
      return state.setupSuite = state.setupSuite || options.setupSuite || commonjsGlobal.before;
    },

    get teardownSuite() {
      return state.teardownSuite = state.teardownSuite || options.teardownSuite || commonjsGlobal.after;
    },

    get setup() {
      return state.setup = state.setup || options.setup || commonjsGlobal.beforeEach;
    },

    get teardown() {
      return state.teardown = state.teardown || options.teardown || commonjsGlobal.afterEach;
    }
  };
}

var suite_tracker = SuiteTracker;

function addInterface(rootSuite, options) {
  var tracker = new options.Tracker(Object.assign({ rootSuite: rootSuite }, options.interface));

  rootSuite.on('pre-require', function (context) {
    var ui = _interface(context, tracker, options);
    var describe = context.describe;

    Object.assign(context, ui);
    context.describe = tracker.wrapSuite(describe);
    context.describe.skip = tracker.wrapSuite(describe.skip);
    context.describe.only = tracker.wrapSuite(describe.only);
    context.context = context.describe;
    context.xdescribe = context.xcontext = context.describe.skip;
  });
}

var mocha$1 = {
  createUi: function createUi(name, options) {
    var config = Object.assign({
      Tracker: suite_tracker,
      inheritUi: 'bdd'
    }, options);

    mocha.interfaces[name] = function (rootSuite) {
      mocha.interfaces[config.inheritUi](rootSuite);
      return addInterface(rootSuite, config);
    };

    return mocha.interfaces[name];
  }
};

var prop = symbol.for;

var LAZY_VARS_PROP_NAME = prop('__lazyVars');

function defineGetter(context, varName, options) {
  var params = Object.assign({
    getterPrefix: '',
    defineOn: context
  }, options);

  var accessorName = params.getterPrefix + varName;
  var varContext = params.defineOn;
  var vars = varContext[LAZY_VARS_PROP_NAME] = varContext[LAZY_VARS_PROP_NAME] || {};

  if (accessorName in vars) {
    return;
  }

  if (accessorName in varContext) {
    throw new Error('Cannot create lazy variable "' + varName + '" as variable with the same name exists on the provided context');
  }

  vars[accessorName] = true;
  Object.defineProperty(varContext, accessorName, {
    configurable: true,
    get: function get() {
      return context.get(varName);
    }
  });
}

var define_var = defineGetter;

var bdd_global_var = mocha$1.createUi('bdd-lazy-var/global', {
  onDefineVariable: function onDefineVariable(suite, varName, context) {
    define_var(context, varName, { getterPrefix: '$' });
  }
});

return bdd_global_var;

})));
