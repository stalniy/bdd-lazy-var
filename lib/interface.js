var lazyVar = require('./lazy_var');
var Variable = require('./variable');

module.exports = function(context, tracker, options) {
  var ui = {};

  ui.subject = function(name, definition) {
    if (arguments.length === 1) {
      return ui.def('subject', name);
    } else if (arguments.length === 2) {
      return ui.def([name, 'subject'], definition);
    }

    return ui.get('subject');
  };

  ui.get = function(varName) {
    return Variable.evaluate(varName, { 'in': tracker.currentContext() });
  };

  ui.def = function(varName, definition) {
    var suite = tracker.currentlyDefinedSuite();

    if (Array.isArray(varName)) {
      ui.def(varName[0], definition);
      return defineAliasesFor(suite, varName[0], varName.slice(1));
    }

    lazyVar.register(suite.ctx, varName, definition, tracker.currentContext);
    detectParentDeclarationFor(suite, varName);
  };

  ui.get.definitionOf = ui.get.variable = function(varName) {
    return ui.get.bind(ui, varName);
  };

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
