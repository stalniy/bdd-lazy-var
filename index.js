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
var noop = function noop() {};

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
  }, {
    key: 'evaluate',
    value: function evaluate() {
      var value = this.value;

      return typeof value === 'function' ? value() : value;
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

      virtualMetadata.releaseVars = noop;
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
      if (!this.values.hasOwnProperty(name)) {
        this.hasValues = true;
        this.values[name] = this.defs[name].evaluate();
      }

      return this.values[name];
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
      this.defs[name] = new VariableMetadata(name, definition);

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
    this.meta = context ? Metadata$1.of(context) : null;
  }

  createClass(Variable, [{
    key: 'isSame',
    value: function isSame(anotherVarName) {
      return this.name && (this.name === anotherVarName || Metadata$1.of(this.context, this.name).isNamedAs(anotherVarName));
    }
  }, {
    key: 'value',
    value: function value() {
      // console.log('<-------', this.context.result.description)
      return Metadata$1.of(this.context).getVar(this.name);
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
      var prevMeta = this.meta;

      try {
        this.meta = this.getParentMetadataFor(varOrAliasName);
        return this.meta.getVar(varOrAliasName);
      } finally {
        this.meta = prevMeta;
      }
    }
  }, {
    key: 'getParentMetadataFor',
    value: function getParentMetadataFor(varName) {
      var metadata$$1 = this.meta;

      if (!metadata$$1 || !metadata$$1.defs[varName]) {
        throw new Error('Unknown parent variable "' + varName + '".');
      }

      return metadata$$1.parent;
    }
  }]);
  return Variable;
}();

Variable.EMPTY = new Variable(null, null);

var variable = Variable;

var _interface$2 = createCommonjsModule(function (module) {
  var Metadata = metadata.Metadata;


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

    return { subject: subject, def: def, get: get$$1 };
  };
});

var Metadata$2 = metadata.Metadata;

var SuiteTracker = function () {
  function SuiteTracker() {
    var config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    classCallCheck(this, SuiteTracker);

    this.state = { currentlyDefinedSuite: config.rootSuite };
    this.suiteTracker = config.suiteTracker || this.createSuiteTracker();
    this.suites = [];
  }

  createClass(SuiteTracker, [{
    key: 'createSuiteTracker',
    value: function createSuiteTracker() {
      return {
        before: function before(tracker, suite) {
          suite.beforeAll(tracker.registerSuite);
        },
        after: function after(tracker, suite) {
          suite.beforeAll(tracker.cleanUp);
          suite.afterEach(tracker.cleanUp);
          suite.afterAll(tracker.cleanUpAndRestorePrev);
        }
      };
    }
  }, {
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
      var tracker = this.buildRuntimeTrackerFor(suite);

      this.suiteTracker.before(tracker, suite);
      defineTests.apply(suite, args);

      if (Metadata$2.of(suite)) {
        this.suiteTracker.after(tracker, suite);
      }
    }
  }, {
    key: 'buildRuntimeTrackerFor',
    value: function buildRuntimeTrackerFor(suite) {
      return {
        registerSuite: this.registerSuite.bind(this, suite),
        cleanUp: this.cleanUp.bind(this, suite),
        cleanUpAndRestorePrev: this.cleanUpAndRestorePrev.bind(this, suite)
      };
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
      this.state.prevTestContext = this.state.currentTestContext || null;
      this.state.currentTestContext = context;
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
    key: 'cleanUpAndRestorePrev',
    value: function cleanUpAndRestorePrev(context) {
      this.state.currentTestContext = this.state.prevTestContext;
      return this.cleanUp(context);
    }
  }, {
    key: 'currentContext',
    get: function get$$1() {
      return this.state.currentTestContext;
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
    before: function before(tracker) {
      commonjsGlobal.beforeAll(tracker.registerSuite);
      commonjsGlobal.afterEach(tracker.cleanUp);
      commonjsGlobal.afterAll(tracker.cleanUpAndRestorePrev);
    },
    after: function after(tracker) {
      commonjsGlobal.beforeAll(tracker.cleanUp);
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

  return context;
}

var jasmine = {
  createUi: function createUi(name, options) {
    var config = _extends({
      Tracker: suite_tracker
    }, options);

    var context = addInterface(commonjsGlobal.jasmine.getEnv().topSuite(), config);

    return {
      get: context.get,
      def: context.def,
      subject: context.subject
    };
  }
};

var jest = jasmine;

// eslint-disable-line


function addInterface$1(rootSuite, options) {
  var tracker = new options.Tracker({ rootSuite: rootSuite });

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

    return Object.defineProperties(mocha.interfaces[name], {
      get: {
        get: function get$$1() {
          return commonjsGlobal.get;
        }
      },
      def: {
        get: function get$$1() {
          return commonjsGlobal.def;
        }
      },
      subject: {
        get: function get$$1() {
          return commonjsGlobal.subject;
        }
      }
    });
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
