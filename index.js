(function (global, factory) {
function optional(name) { try { return require(name) } catch(e) {} }
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(optional("mocha")) :
  typeof define === 'function' && define.amd ? define(['optional!mocha'], factory) :
  (factory(global.Mocha));
}(this, (function (Mocha) { 'use strict';

  Mocha = Mocha && Mocha.hasOwnProperty('default') ? Mocha['default'] : Mocha;

  var global$1 = typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {};

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

  var LAZY_VARS_FIELD = symbol.for('__lazyVars');

  var VariableMetadata = function () {
    function VariableMetadata(name, definition, metadata) {
      var _names;

      classCallCheck(this, VariableMetadata);

      this.value = definition;
      this.parent = metadata;
      this.names = (_names = {}, _names[name] = true, _names);
    }

    VariableMetadata.prototype.addName = function addName(name) {
      this.names[name] = true;
      return this;
    };

    VariableMetadata.prototype.isNamedAs = function isNamedAs(name) {
      return this.names[name];
    };

    VariableMetadata.prototype.evaluate = function evaluate() {
      return typeof this.value === 'function' ? this.value() : this.value;
    };

    return VariableMetadata;
  }();

  var Metadata = function () {
    Metadata.of = function of(context, varName) {
      var metadata = context[LAZY_VARS_FIELD];

      return varName && metadata ? metadata.defs[varName] : metadata;
    };

    Metadata.ensureDefinedOn = function ensureDefinedOn(context) {
      if (!context.hasOwnProperty(LAZY_VARS_FIELD)) {
        context[LAZY_VARS_FIELD] = new Metadata();
      }

      return context[LAZY_VARS_FIELD];
    };

    Metadata.setVirtual = function setVirtual(context, metadata) {
      var virtualMetadata = Object.create(metadata);

      virtualMetadata.values = {};
      context[LAZY_VARS_FIELD] = virtualMetadata;
    };

    function Metadata() {
      classCallCheck(this, Metadata);

      this.defs = {};
      this.values = {};
      this.hasValues = false;
      this.defined = false;
    }

    Metadata.prototype.getVar = function getVar(name) {
      if (!this.values.hasOwnProperty(name) && this.defs[name]) {
        this.hasValues = true;
        this.values[name] = this.evaluate(name);
      }

      return this.values[name];
    };

    Metadata.prototype.evaluate = function evaluate(name) {
      return this.defs[name].evaluate();
    };

    Metadata.prototype.addChild = function addChild(child) {
      child.defs = _extends(Object.create(this.defs), child.defs);
      child.parent = this.defined ? this : this.parent;
    };

    Metadata.prototype.addVar = function addVar(name, definition) {
      if (this.defs.hasOwnProperty(name)) {
        throw new Error('Cannot define "' + name + '" variable twice in the same suite.');
      }

      this.defined = true;
      this.defs[name] = new VariableMetadata(name, definition, this);

      return this;
    };

    Metadata.prototype.addAliasFor = function addAliasFor(name, aliasName) {
      this.defs[aliasName] = this.defs[name].addName(aliasName);
    };

    Metadata.prototype.releaseVars = function releaseVars() {
      if (this.hasValues) {
        this.values = {};
        this.hasValues = false;
      }
    };

    Metadata.prototype.lookupMetadataFor = function lookupMetadataFor(varName) {
      var varMeta = this.defs[varName];
      var definedIn = varMeta.parent;

      if (!varMeta || !definedIn.parent.defs[varName]) {
        throw new Error('Unknown parent variable "' + varName + '".');
      }

      return definedIn.parent;
    };

    return Metadata;
  }();

  var metadata = { Metadata: Metadata };

  var Metadata$1 = metadata.Metadata;


  var CURRENTLY_RETRIEVED_VAR_FIELD = symbol.for('__currentVariableStack');
  var last = function last(array) {
    return array ? array[array.length - 1] : null;
  };

  var Variable = function () {
    Variable.allocate = function allocate(varName, options) {
      var variable = new this(varName, options.in);

      return variable.addToStack();
    };

    Variable.evaluate = function evaluate(varName, options) {
      if (!options.in) {
        throw new Error('It looke like you are trying to evaluate "' + varName + '" too early. Evaluation context is undefined');
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
    };

    Variable.fromStack = function fromStack(context) {
      return last(context[CURRENTLY_RETRIEVED_VAR_FIELD]) || Variable.EMPTY;
    };

    function Variable(varName, context) {
      classCallCheck(this, Variable);

      this.name = varName;
      this.context = context;
      this.evaluationMeta = context ? Metadata$1.of(context) : null;
    }

    Variable.prototype.isSame = function isSame(anotherVarName) {
      return this.name && (this.name === anotherVarName || Metadata$1.of(this.context, this.name).isNamedAs(anotherVarName));
    };

    Variable.prototype.value = function value() {
      return this.evaluationMeta.getVar(this.name);
    };

    Variable.prototype.addToStack = function addToStack() {
      this.context[CURRENTLY_RETRIEVED_VAR_FIELD] = this.context[CURRENTLY_RETRIEVED_VAR_FIELD] || [];
      this.context[CURRENTLY_RETRIEVED_VAR_FIELD].push(this);

      return this;
    };

    Variable.prototype.pullFromStack = function pullFromStack() {
      this.context[CURRENTLY_RETRIEVED_VAR_FIELD].pop();
    };

    Variable.prototype.valueInParentContext = function valueInParentContext(varOrAliasName) {
      var meta = this.evaluationMeta;

      try {
        this.evaluationMeta = meta.lookupMetadataFor(varOrAliasName);
        return this.evaluationMeta.evaluate(varOrAliasName);
      } finally {
        this.evaluationMeta = meta;
      }
    };

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

    global$1.describe('behaves like ' + name, function () {
      includeExamplesFor.apply(undefined, [name].concat(args));
    });
  }

  var shared_behavior = {
    sharedExamplesFor: sharedExamplesFor,
    includeExamplesFor: includeExamplesFor,
    itBehavesLike: itBehavesLike
  };

  var Metadata$2 = metadata.Metadata;
  var sharedExamplesFor$1 = shared_behavior.sharedExamplesFor,
      includeExamplesFor$1 = shared_behavior.includeExamplesFor,
      itBehavesLike$1 = shared_behavior.itBehavesLike;


  var _interface = function _interface(context, tracker, options) {
    var get = function get(varName) {
      return variable.evaluate(varName, { in: tracker.currentContext });
    };

    get.definitionOf = get.variable = function (varName) {
      return get.bind(null, varName);
    };

    function def(varName, definition) {
      var suite = tracker.currentlyDefinedSuite;

      if (!Array.isArray(varName)) {
        Metadata$2.ensureDefinedOn(suite).addVar(varName, definition);
        runHook('onDefineVariable', suite, varName);
        return;
      }

      var name = varName[0],
          aliases = varName.slice(1);

      def(name, definition);

      var metadata$$1 = Metadata$2.of(suite);
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

      return get('subject');
    }

    function runHook(name) {
      if (typeof options[name] === 'function') {
        for (var _len2 = arguments.length, args = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
          args[_key2 - 1] = arguments[_key2];
        }

        options[name].apply(options, args.concat(context));
      }
    }

    return {
      subject: subject,
      def: def,
      get: get,
      sharedExamplesFor: sharedExamplesFor$1,
      includeExamplesFor: includeExamplesFor$1,
      itBehavesLike: itBehavesLike$1
    };
  };

  var Metadata$3 = metadata.Metadata;

  var SuiteTracker = function () {
    function SuiteTracker() {
      var config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      classCallCheck(this, SuiteTracker);

      this.state = { currentlyDefinedSuite: config.rootSuite, contexts: [config.rootSuite] };
      this.suiteTracker = config.suiteTracker;
      this.suites = [];
      this.cleanUpCurrentContext = this.cleanUpCurrentContext.bind(this);
      this.cleanUpCurrentAndRestorePrevContext = this.cleanUpCurrentAndRestorePrevContext.bind(this);
    }

    SuiteTracker.prototype.wrapSuite = function wrapSuite(describe) {
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
    };

    SuiteTracker.prototype.trackSuite = function trackSuite(suite, defineTests, args) {
      var previousDefinedSuite = this.state.currentlyDefinedSuite;

      this.state.currentlyDefinedSuite = suite;
      this.execute(defineTests, suite, args);
      this.state.currentlyDefinedSuite = previousDefinedSuite;
      this.suites.push(suite);

      if (this.isRoot(suite)) {
        this.linkParentToChildMetadataAndFlush();
      }
    };

    SuiteTracker.prototype.execute = function execute(defineTests, suite, args) {
      this.suiteTracker.before(this, suite);
      defineTests.apply(suite, args);

      if (Metadata$3.of(suite)) {
        this.suiteTracker.after(this, suite);
      }
    };

    SuiteTracker.prototype.isRoot = function isRoot(suite) {
      return !(suite.parent ? suite.parent.parent : suite.parentSuite.parentSuite);
    };

    SuiteTracker.prototype.linkParentToChildMetadataAndFlush = function linkParentToChildMetadataAndFlush() {
      this.suites.reverse().forEach(this.linkMetadataOf, this);
      this.suites.length = 0;
    };

    SuiteTracker.prototype.linkMetadataOf = function linkMetadataOf(suite) {
      var metadata$$1 = Metadata$3.of(suite);
      var parentMetadata = Metadata$3.of(suite.parent || suite.parentSuite);

      if (!parentMetadata) {
        return;
      }

      if (metadata$$1) {
        parentMetadata.addChild(metadata$$1);
      } else {
        Metadata$3.setVirtual(suite, parentMetadata);
      }
    };

    SuiteTracker.prototype.registerSuite = function registerSuite(context) {
      this.state.contexts.push(context);
    };

    SuiteTracker.prototype.cleanUp = function cleanUp(context) {
      var metadata$$1 = Metadata$3.of(context);

      if (metadata$$1) {
        metadata$$1.releaseVars();
      }
    };

    SuiteTracker.prototype.cleanUpCurrentContext = function cleanUpCurrentContext() {
      this.cleanUp(this.currentContext);
    };

    SuiteTracker.prototype.cleanUpCurrentAndRestorePrevContext = function cleanUpCurrentAndRestorePrevContext() {
      this.cleanUpCurrentContext();
      this.state.contexts.pop();
    };

    createClass(SuiteTracker, [{
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
        global$1.beforeAll(tracker.registerSuite.bind(tracker, suite));
        global$1.afterAll(tracker.cleanUpCurrentAndRestorePrevContext);
      },
      after: function after(tracker) {
        global$1.beforeAll(tracker.cleanUpCurrentContext);
      }
    };
  }

  function addInterface(rootSuite, options) {
    var context = global$1;
    var tracker = new options.Tracker({ rootSuite: rootSuite, suiteTracker: createSuiteTracker() });
    var ui = _interface(context, tracker, options);

    _extends(context, ui);
    context.describe = tracker.wrapSuite(context.describe);
    context.xdescribe = tracker.wrapSuite(context.xdescribe);
    context.fdescribe = tracker.wrapSuite(context.fdescribe);
    global$1.afterEach(tracker.cleanUpCurrentContext);

    return ui;
  }

  var jasmine = {
    createUi: function createUi(name, options) {
      var config = _extends({
        Tracker: suite_tracker
      }, options);

      return addInterface(global$1.jasmine.getEnv().topSuite(), config);
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
    var isContextUpdated = false;

    rootSuite.afterEach(tracker.cleanUpCurrentContext);
    rootSuite.on('pre-require', function (context) {
      var describe = context.describe;

      if (!isContextUpdated) {
        var ui = _interface(context, tracker, options);
        _extends(context, ui);
        isContextUpdated = true;
      }

      context.describe = tracker.wrapSuite(describe);
      context.describe.skip = tracker.wrapSuite(describe.skip);
      context.describe.only = tracker.wrapSuite(describe.only);
      context.context = context.describe;
      context.xdescribe = context.xcontext = context.describe.skip;
    });
  }

  var mocha = {
    createUi: function createUi(name, options) {
      var config = _extends({
        Tracker: suite_tracker,
        inheritUi: 'bdd'
      }, options);

      Mocha.interfaces[name] = function (rootSuite) {
        Mocha.interfaces[config.inheritUi](rootSuite);
        return addInterface$1(rootSuite, config);
      };

      var getters = ['get', 'def', 'subject', 'sharedExamplesFor', 'includeExamplesFor', 'itBehavesLike'];
      var defs = getters.reduce(function (all, uiName) {
        all[uiName] = { get: function get$$1() {
            return global$1[uiName];
          } };
        return all;
      }, {});

      return Object.defineProperties(Mocha.interfaces[name], defs);
    }
  };

  var Mocha$1 = void 0;

  try {
    Mocha$1 = Mocha; // eslint-disable-line
  } catch (e) {
    // eslint-disable-line
  }

  var ui = void 0;

  if (global$1.jest) {
    ui = jest; // eslint-disable-line
  } else if (global$1.jasmine) {
    ui = jasmine; // eslint-disable-line
  } else if (Mocha$1) {
    ui = mocha; // eslint-disable-line
  }

  if (!ui) {
    throw new Error('\n    Unable to detect testing framework. Make sure that\n      * jasmine or mocha is installed\n      * bdd-lazy-var is included after "jasmine" or "mocha"\n  ');
  }

  var _interface$1 = ui;

  var bdd = _interface$1.createUi('bdd-lazy-var');

  return bdd;

})));
