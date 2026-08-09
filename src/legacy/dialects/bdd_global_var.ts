import { builder } from '../frameworks/index.ts';
import { defineGetter, GetterContext } from '../utils.ts';

const globalContext = (globalThis ?? global ?? window) as unknown as GetterContext;
export default builder.createFrameworkUI('bdd-lazy-var/global', {
  onDefineVariable(_, varName) {
    defineGetter(globalContext, varName, { getterPrefix: '$', defineOn: globalContext });
  }
});
