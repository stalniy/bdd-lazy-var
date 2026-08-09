import { LazyVariables, clearScope } from '../LazyVariables.ts';
import { hasOwn } from './utils.ts';

const LAZY_VARS_FIELD = Symbol('__lazyVars');

export type Suite = Record<PropertyKey, any> & {
  parent?: Suite;
  parentSuite?: Suite;
};

type Definition = ((...args: unknown[]) => unknown) | unknown;
type SharedExamples = Record<string, (...args: unknown[]) => unknown>;

export class Metadata {
  parent?: Metadata;
  #vars = new LazyVariables();
  #scope: Record<string, unknown> | null = null;
  #examples: SharedExamples = Object.create(null);

  static of(context: Suite | undefined): Metadata | undefined {
    return context?.[LAZY_VARS_FIELD];
  }

  static ensureDefinedOn(context: Suite): Metadata {
    if (!hasOwn(context, LAZY_VARS_FIELD)) {
      context[LAZY_VARS_FIELD] = new Metadata();
    }

    return context[LAZY_VARS_FIELD];
  }

  #getScope() {
    this.#scope ??= this.#vars.scope();
    return this.#scope;
  }

  getVarValue(name: string): unknown {
    return LazyVariables.evaluate(this.#getScope(), name);
  }

  hasVar(name: string): boolean {
    return LazyVariables.has(this.#getScope(), name);
  }

  addChild(child: Metadata): void {
    child.parent = this;
    child.#vars.extends(this.#getScope());
    child.#examples = Object.assign(Object.create(this.#examples), child.#examples);
  }

  addVar(name: string, definition: Definition): void {
    const impl = typeof definition === 'function'
      ? () => (definition as (...args: unknown[]) => unknown)()
      : definition;

    try {
      this.#vars.variable(name, impl);
    } catch (error) {
      if (error instanceof Error && error.message === `Variable "${name}" is already defined`) {
        throw new Error(`Cannot define "${name}" variable twice in the same suite.`);
      }

      throw error;
    }
  }

  addAliasFor(name: string, aliasName: string): void {
    LazyVariables.alias(this.#getScope(), name, aliasName);
  }

  releaseVars(): void {
    if (this.#scope) {
      clearScope(this.#scope as any);
      this.#scope = null;
    }
  }

  addExamplesFor(name: string, definition: Definition): void {
    if (hasOwn(this.#examples, name)) {
      throw new Error(`Attempt to override "${name}" shared example`);
    }

    this.#examples[name] = definition as (...args: unknown[]) => unknown;
  }

  runExamplesFor(name: string, args: unknown[]): unknown {
    const examples = this.#examples[name];

    if (typeof examples !== 'function') {
      throw new Error(`Attempt to include not defined shared behavior "${name}"`);
    }

    return examples(...args);
  }
}
