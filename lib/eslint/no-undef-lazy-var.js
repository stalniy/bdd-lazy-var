module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'disallow the use of undeclared lazy variables',
      category: 'Variables',
      recommended: true,
    },
    messages: {
      lazyUndef: 'Lazy variable "{{name}}" is not defined.'
    }
  },

  create(context) {
    // throw on dynamic var name
    const definedVars = new Set();
    const registerVar = (ast) => {
      if (ast.type === 'Literal') {
        definedVars.add(ast.value)
      } else {
        // cannot detect dynamically created vars
      }
    }

    return {
      CallExpression(node) {
        const { name, parent } = node.callee;

        if (name === 'subject' && parent.arguments.length) {
          registerVar(parent.arguments[0]);
          definedVars.add('subject');
          return;
        }

        if (name === 'def') {
          registerVar(parent.arguments[0]);
        }
      },

      'Program:exit'() {
        const globalScope = context.getScope();

        globalScope.through.forEach(ref => {
          const identifier = ref.identifier;

          if (!identifier.name.startsWith('$')) {
            return;
          }

          if (definedVars.has(identifier.name.slice(1))) {
            return;
          }

          context.report({
            node: identifier,
            messageId: 'lazyUndef',
            data: identifier
          });
        });
      }
    };
  }
};
