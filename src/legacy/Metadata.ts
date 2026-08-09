import { LazyVariables, clearScope } from '../LazyVariables.ts';
import { hasOwn } from './utils.ts';

const LAZY_VARS_FIELD = Symbol('__lazyVars');
const EXAMPLES_PREFIX = 'SHARED_EXAMPLES:';

export type Suite = Record<PropertyKey, any> & {
  parent?: Suite;
  parentSuite?: Suite;
};

type Definition = ((...args: unknown[]) => unknown) | unknown;

export class Metadata {
  #vars: LazyVariables;
  parent?: Metadata;
  #scope: Record<string, unknown> | null = null;
  #varNames = new Set<string>();

  static of(context: Suite): Metadata | undefined {
    const metadata: Metadata | undefined = context[LAZY_VARS_FIELD];
    return metadata;
  }

  static ensureDefinedOn(context: Suite): Metadata {
    if (!hasOwn(context, LAZY_VARS_FIELD)) {
      context[LAZY_VARS_FIELD] = new Metadata();
    }

    return context[LAZY_VARS_FIELD];
  }

  constructor() {
    this.#vars = new LazyVariables();
  }

  #getScope() {
    this.#scope ??= this.#vars.scope();
    return this.#scope;
  }

  getVarValue(name: string): unknown {
    return this.#getScope()[name];
  }

  hasVar(name: string): boolean {
    return this.#varNames.has(name);
  }

  addChild(child: Metadata): void {
    child.parent = this;
    child.#vars.extends(this.#getScope());
  }

  addVar(name: string, definition: Definition): void {
    this.#vars.variable(name, definition);
    this.#varNames.add(name);
  }

  addAliasFor(name: string, aliasName: string): void {
    this.#vars.variable(aliasName, (scope: Record<string, unknown>) => scope[name]);
    this.#varNames.add(aliasName);
  }

  releaseVars(): void {
    if (this.#scope) {
      clearScope(this.#scope as any);
      this.#scope = null;
    }
  }

  addExamplesFor(name: string, definition: Definition): void {
    const examplesName = EXAMPLES_PREFIX + name;
    this.addVar(examplesName, definition);
  }

  runExamplesFor(name: string, args: unknown[]): unknown {
    const examples = this.#getScope()[EXAMPLES_PREFIX + name];

    if (typeof examples !== 'function') {
      throw new Error(`Attempt to include not defined shared behavior "${name}"`);
    }

    return examples(...args);
  }
}
