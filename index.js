(function (global, factory) {
function optional(name) { try { return require(name) } catch(e) {} }
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(optional("mocha")) :
	typeof define === 'function' && define.amd ? define(['optional!mocha'], factory) :
	(factory(global.Mocha));
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

var _extends = Object.assign || function (target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i];

    for (var key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key];
      }
    }
  }

  return target;
};

































var toArray = function (arr) {
  return Array.isArray(arr) ? arr : Array.from(arr);
};

var toConsumableArray = function (arr) {
  if (Array.isArray(arr)) {
    for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];

    return arr2;
  } else {
    return Array.from(arr);
  }
};

var LAZY_VARS_FIELD = symbol.for('__lazyVars');

var VariableMetadata = function () {
  function VariableMetadata(name, definition, metadata) {
    classCallCheck(this, VariableMetadata);

    this.value = definition;
    this.parent = metadata;
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
  }, {
    key: 'evaluate',
    value: function evaluate() {
      return typeof this.value === 'function' ? this.value() : this.value;
    }
  }]);
  return VariableMetadata;
}();

var Metadata = function () {
  createClass(Metadata, null, [{
    key: 'of',
    value: function of(context, varName) {
      var metadata = context[LAZY_VARS_FIELD];

      return varName && metadata ? metadata.defs[varName] : metadata;
    }
  }, {
    key: 'ensureDefinedOn',
    value: function ensureDefinedOn(context) {
      if (!context.hasOwnProperty(LAZY_VARS_FIELD)) {
        context[LAZY_VARS_FIELD] = new Metadata();
      }

      return context[LAZY_VARS_FIELD];
    }
  }, {
    key: 'setVirtual',
    value: function setVirtual(context, metadata) {
      var virtualMetadata = Object.create(metadata);

      virtualMetadata.values = {};
      context[LAZY_VARS_FIELD] = virtualMetadata;
    }
  }]);

  function Metadata() {
    classCallCheck(this, Metadata);

    this.defs = {};
    this.values = {};
    this.hasValues = false;
    this.defined = false;
  }

  createClass(Metadata, [{
    key: 'getVar',
    value: function getVar(name) {
      if (!this.values.hasOwnProperty(name) && this.defs[name]) {
        this.hasValues = true;
        this.values[name] = this.evaluate(name);
      }

      return this.values[name];
    }
  }, {
    key: 'evaluate',
    value: function evaluate(name) {
      return this.defs[name].evaluate();
    }
  }, {
    key: 'addChild',
    value: function addChild(child) {
      child.defs = _extends(Object.create(this.defs), child.defs);
      child.parent = this.defined ? this : this.parent;
    }
  }, {
    key: 'addVar',
    value: function addVar(name, definition) {
      if (this.defs.hasOwnProperty(name)) {
        throw new Error('Cannot define "' + name + '" variable twice in the same suite.');
      }

      this.defined = true;
      this.defs[name] = new VariableMetadata(name, definition, this);

      return this;
    }
  }, {
    key: 'addAliasFor',
    value: function addAliasFor(name, aliasName) {
      this.defs[aliasName] = this.defs[name].addName(aliasName);
    }
  }, {
    key: 'releaseVars',
    value: function releaseVars() {
      if (this.hasValues) {
        this.values = {};
        this.hasValues = false;
      }
    }
  }, {
    key: 'lookupMetadataFor',
    value: function lookupMetadataFor(varName) {
      var varMeta = this.defs[varName];
      var definedIn = varMeta.parent;

      if (!varMeta || !definedIn.parent.defs[varName]) {
        throw new Error('Unknown parent variable "' + varName + '".');
      }

      return definedIn.parent;
    }
  }]);
  return Metadata;
}();

var metadata = { Metadata: Metadata };

var Metadata$1 = metadata.Metadata;


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
      if (!options.in) {
        throw new Error('It looke like you are trying to evaluate "' + varName + '" too early');
      }

      var variable = Variable.fromStack(options.in);

      if (variable.isSame(varName)) {
        return variable.valueInParentContext(varName);
      }

      try {
        variable = Variable.allocate(varName, options);
        return variable.value();
      } finally {
        variable.pullFromStack();
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
    this.evaluationMeta = context ? Metadata$1.of(context) : null;
  }

  createClass(Variable, [{
    key: 'isSame',
    value: function isSame(anotherVarName) {
      return this.name && (this.name === anotherVarName || Metadata$1.of(this.context, this.name).isNamedAs(anotherVarName));
    }
  }, {
    key: 'value',
    value: function value() {
      return this.evaluationMeta.getVar(this.name);
    }
  }, {
    key: 'addToStack',
    value: function addToStack() {
      this.context[CURRENTLY_RETRIEVED_VAR_FIELD] = this.context[CURRENTLY_RETRIEVED_VAR_FIELD] || [];
      this.context[CURRENTLY_RETRIEVED_VAR_FIELD].push(this);

      return this;
    }
  }, {
    key: 'pullFromStack',
    value: function pullFromStack() {
      this.context[CURRENTLY_RETRIEVED_VAR_FIELD].pop();
    }
  }, {
    key: 'valueInParentContext',
    value: function valueInParentContext(varOrAliasName) {
      var meta = this.evaluationMeta;

      try {
        this.evaluationMeta = meta.lookupMetadataFor(varOrAliasName);
        return this.evaluationMeta.evaluate(varOrAliasName);
      } finally {
        this.evaluationMeta = meta;
      }
    }
  }]);
  return Variable;
}();

Variable.EMPTY = new Variable(null, null);

var variable = Variable;

var SHARED_EXAMPLES = {};

function sharedExamplesFor(name, defs) {
  if (SHARED_EXAMPLES[name]) {
    throw new Error('Attempt to override "' + name + '" shared example');
  }

  SHARED_EXAMPLES[name] = defs;
}

function includeExamplesFor(name) {
  if (!SHARED_EXAMPLES.hasOwnProperty(name)) {
    throw new Error('Attempt to include not defined shared behavior "' + name + '"');
  }

  for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    args[_key - 1] = arguments[_key];
  }

  SHARED_EXAMPLES[name].apply(null, args);
}

function itBehavesLike(name) {
  for (var _len2 = arguments.length, args = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
    args[_key2 - 1] = arguments[_key2];
  }

  commonjsGlobal.describe('behaves like ' + name, function () {
    includeExamplesFor.apply(undefined, [name].concat(args));
  });
}

var shared_behavior = {
  sharedExamplesFor: sharedExamplesFor,
  includeExamplesFor: includeExamplesFor,
  itBehavesLike: itBehavesLike
};

var _interface$2 = createCommonjsModule(function (module) {
  var Metadata = metadata.Metadata;
  var sharedExamplesFor = shared_behavior.sharedExamplesFor,
      includeExamplesFor = shared_behavior.includeExamplesFor,
      itBehavesLike = shared_behavior.itBehavesLike;


  module.exports = function (context, tracker, options) {
    var get$$1 = function get$$1(varName) {
      return variable.evaluate(varName, { in: tracker.currentContext });
    };

    get$$1.definitionOf = get$$1.variable = function (varName) {
      return get$$1.bind(null, varName);
    };

    function def(varName, definition) {
      var suite = tracker.currentlyDefinedSuite;

      if (!Array.isArray(varName)) {
        Metadata.ensureDefinedOn(suite).addVar(varName, definition);
        runHook('onDefineVariable', suite, varName);
        return;
      }

      var _varName = toArray(varName),
          name = _varName[0],
          aliases = _varName.slice(1);

      def(name, definition);

      var metadata$$1 = Metadata.of(suite);
      aliases.forEach(function (alias) {
        metadata$$1.addAliasFor(name, alias);
        runHook('onDefineVariable', suite, alias);
      });
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

      return get$$1('subject');
    }

    function runHook(name) {
      if (typeof options[name] === 'function') {
        for (var _len2 = arguments.length, args = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
          args[_key2 - 1] = arguments[_key2];
        }

        options[name].apply(options, toConsumableArray(args.concat(context)));
      }
    }

    return {
      subject: subject,
      def: def,
      get: get$$1,
      sharedExamplesFor: sharedExamplesFor,
      includeExamplesFor: includeExamplesFor,
      itBehavesLike: itBehavesLike
    };
  };
});

var Metadata$2 = metadata.Metadata;

var SuiteTracker = function () {
  function SuiteTracker() {
    var config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    classCallCheck(this, SuiteTracker);

    this.state = { currentlyDefinedSuite: config.rootSuite, contexts: [] };
    this.suiteTracker = config.suiteTracker;
    this.suites = [];
    this.cleanUpCurrentContext = this.cleanUpCurrentContext.bind(this);
    this.cleanUpCurrentAndRestorePrevContext = this.cleanUpCurrentAndRestorePrevContext.bind(this);
  }

  createClass(SuiteTracker, [{
    key: 'wrapSuite',
    value: function wrapSuite(describe) {
      var tracker = this;

      return function detectSuite(title, defineTests) {
        for (var _len = arguments.length, suiteArgs = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
          suiteArgs[_key - 2] = arguments[_key];
        }

        return describe.apply(undefined, [title, function defineSuite() {
          for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
            args[_key2] = arguments[_key2];
          }

          tracker.trackSuite(this, defineTests, args);
        }].concat(suiteArgs));
      };
    }
  }, {
    key: 'trackSuite',
    value: function trackSuite(suite, defineTests, args) {
      var previousDefinedSuite = this.state.currentlyDefinedSuite;

      this.state.currentlyDefinedSuite = suite;
      this.execute(defineTests, suite, args);
      this.state.currentlyDefinedSuite = previousDefinedSuite;
      this.suites.push(suite);

      if (this.isRoot(suite)) {
        this.linkParentToChildMetadataAndFlush();
      }
    }
  }, {
    key: 'execute',
    value: function execute(defineTests, suite, args) {
      this.suiteTracker.before(this, suite);
      defineTests.apply(suite, args);

      if (Metadata$2.of(suite)) {
        this.suiteTracker.after(this, suite);
      }
    }
  }, {
    key: 'isRoot',
    value: function isRoot(suite) {
      return !(suite.parent ? suite.parent.parent : suite.parentSuite.parentSuite);
    }
  }, {
    key: 'linkParentToChildMetadataAndFlush',
    value: function linkParentToChildMetadataAndFlush() {
      this.suites.reverse().forEach(this.linkMetadataOf, this);
      this.suites.length = 0;
    }
  }, {
    key: 'linkMetadataOf',
    value: function linkMetadataOf(suite) {
      var metadata$$2 = Metadata$2.of(suite);
      var parentMetadata = Metadata$2.of(suite.parent || suite.parentSuite);

      if (!parentMetadata) {
        return;
      }

      if (metadata$$2) {
        parentMetadata.addChild(metadata$$2);
      } else {
        Metadata$2.setVirtual(suite, parentMetadata);
      }
    }
  }, {
    key: 'registerSuite',
    value: function registerSuite(context) {
      this.state.contexts.push(context);
    }
  }, {
    key: 'cleanUp',
    value: function cleanUp(context) {
      var metadata$$2 = Metadata$2.of(context);

      if (metadata$$2) {
        metadata$$2.releaseVars();
      }
    }
  }, {
    key: 'cleanUpCurrentContext',
    value: function cleanUpCurrentContext() {
      this.cleanUp(this.currentContext);
    }
  }, {
    key: 'cleanUpCurrentAndRestorePrevContext',
    value: function cleanUpCurrentAndRestorePrevContext() {
      this.cleanUpCurrentContext();
      this.state.contexts.pop();
    }
  }, {
    key: 'currentContext',
    get: function get$$1() {
      return this.state.contexts[this.state.contexts.length - 1];
    }
  }, {
    key: 'currentlyDefinedSuite',
    get: function get$$1() {
      return this.state.currentlyDefinedSuite;
    }
  }]);
  return SuiteTracker;
}();

var suite_tracker = SuiteTracker;

function createSuiteTracker() {
  return {
    before: function before(tracker, suite) {
      commonjsGlobal.beforeAll(tracker.registerSuite.bind(tracker, suite));
      commonjsGlobal.afterAll(tracker.cleanUpCurrentAndRestorePrevContext);
    },
    after: function after(tracker) {
      commonjsGlobal.beforeAll(tracker.cleanUpCurrentContext);
    }
  };
}

function addInterface(rootSuite, options) {
  var context = commonjsGlobal;
  var tracker = new options.Tracker({ rootSuite: rootSuite, suiteTracker: createSuiteTracker() });
  var ui = _interface$2(context, tracker, options);

  _extends(context, ui);
  context.describe = tracker.wrapSuite(context.describe);
  context.xdescribe = tracker.wrapSuite(context.xdescribe);
  context.fdescribe = tracker.wrapSuite(context.fdescribe);
  commonjsGlobal.afterEach(tracker.cleanUpCurrentContext);

  return ui;
}

var jasmine = {
  createUi: function createUi(name, options) {
    var config = _extends({
      Tracker: suite_tracker
    }, options);

    return addInterface(commonjsGlobal.jasmine.getEnv().topSuite(), config);
  }
};

var jest = jasmine;

// eslint-disable-line


function createSuiteTracker$1() {
  return {
    before: function before(tracker, suite) {
      suite.beforeAll(tracker.registerSuite.bind(tracker, suite));
    },
    after: function after(tracker, suite) {
      suite.beforeAll(tracker.cleanUpCurrentContext);
      suite.afterAll(tracker.cleanUpCurrentAndRestorePrevContext);
    }
  };
}

function addInterface$1(rootSuite, options) {
  var tracker = new options.Tracker({ rootSuite: rootSuite, suiteTracker: createSuiteTracker$1() });

  rootSuite.afterEach(tracker.cleanUpCurrentContext);
  rootSuite.on('pre-require', function (context) {
    var ui = _interface$2(context, tracker, options);
    var describe = context.describe;

    _extends(context, ui);
    context.describe = tracker.wrapSuite(describe);
    context.describe.skip = tracker.wrapSuite(describe.skip);
    context.describe.only = tracker.wrapSuite(describe.only);
    context.context = context.describe;
    context.xdescribe = context.xcontext = context.describe.skip;
  });
}

var mocha$1 = {
  createUi: function createUi(name, options) {
    var config = _extends({
      Tracker: suite_tracker,
      inheritUi: 'bdd'
    }, options);

    mocha.interfaces[name] = function (rootSuite) {
      mocha.interfaces[config.inheritUi](rootSuite);
      return addInterface$1(rootSuite, config);
    };

    var getters = ['get', 'def', 'subject', 'sharedExamplesFor', 'includeExamplesFor', 'itBehavesLike'];
    var defs = getters.reduce(function (all, uiName) {
      all[uiName] = { get: function get$$1() {
          return commonjsGlobal[uiName];
        } };
      return all;
    }, {});

    return Object.defineProperties(mocha.interfaces[name], defs);
  }
};

var Mocha = void 0;

try {
  Mocha = mocha; // eslint-disable-line
} catch (e) {
  // eslint-disable-line
}

var ui = void 0;

if (commonjsGlobal.jest) {
  ui = jest; // eslint-disable-line
} else if (commonjsGlobal.jasmine) {
  ui = jasmine; // eslint-disable-line
} else if (Mocha) {
  ui = mocha$1; // eslint-disable-line
}

if (!ui) {
  throw new Error('\n    Unable to detect testing framework. Make sure that\n      * jasmine or mocha is installed\n      * bdd-lazy-var is included after "jasmine" or "mocha"\n  ');
}

var _interface = ui;

var bdd = _interface.createUi('bdd-lazy-var');

return bdd;

})));
