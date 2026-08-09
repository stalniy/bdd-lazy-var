const VALUES_KEY = Symbol('values');
export const FACTORY_KEY = Symbol('factory');
const EVALUATING_KEY = Symbol('evaluating');
const REF_PROXY_KEY = Symbol('refProxy');

const hasOwn = Object.hasOwn || ((obj: object, prop: PropertyKey) => Object.prototype.hasOwnProperty.call(obj, prop));

/** A lazy reference that can be called to get the value */
export interface LazyRef<T> {
  (): T;
}

/** Mapped type: converts scope properties to LazyRef */
type LazyRefs<T> = {
  [K in keyof T]: LazyRef<T[K]>;
};

type OnValueCreated = (value: unknown, key: PropertyKey, values: Map<PropertyKey, unknown>) => void;
type DefinitionRecord = {
  impl: unknown;
  owner: LazyVariables<any>;
};
type EvaluationFrame = {
  record: DefinitionRecord;
};

export function setOnValueCreated(handler: OnValueCreated | undefined) {
  LazyVariables.setOnValueCreated(handler);
}

export class LazyVariables<TShape extends LazyVariablesScope = {}> {
  static #onValueCreated: OnValueCreated | undefined;

  static setOnValueCreated(handler: OnValueCreated | undefined) {
    LazyVariables.#onValueCreated = handler;
  }

  static alias<T extends LazyVariablesScope>(scope: T, name: string, aliasName: string): T {
    const factory = getFactory(scope);
    factory.#alias(name, aliasName);

    if (!hasOwn(scope, aliasName)) {
      Object.defineProperty(scope, aliasName, {
        enumerable: true,
        get: () => factory.#evaluate(aliasName, scope as Required<LazyVariablesScope>)
      });
    }

    return scope;
  }

  static has(scope: LazyVariablesScope, name: PropertyKey): boolean {
    return getFactory(scope).#has(name);
  }

  static evaluate(scope: LazyVariablesScope, name: PropertyKey): unknown {
    return getFactory(scope).#evaluate(name, scope as Required<LazyVariablesScope>);
  }

  public readonly def: this['variable'];
  #definitions: Record<PropertyKey, DefinitionRecord> = Object.create(null);
  #definedInScopeVarNames = new Set<string>();
  #requiredVarNames = new Set<string>();
  #parentScope: LazyVariablesScope | null = null;

  constructor() {
    this.def = this.variable;
  }

  variable<T extends string, R>(
    name: T,
    impl: R | ((v: TShape) => R)
  ): LazyVariables<TShape & { [K in T]: R }> {
    if (name === 'ref') {
      throw new Error('Cannot create a variable named `ref` because it is reserved for internal use');
    }

    // Allow redefining required variables (placeholders)
    const isRedefiningRequired = this.#requiredVarNames.has(name);
    if (this.#definedInScopeVarNames.has(name) && !isRedefiningRequired) {
      throw new Error(`Variable "${name}" is already defined`);
    }

    this.#definedInScopeVarNames.add(name);
    this.#requiredVarNames.delete(name);
    this.#definitions[name] = {
      impl,
      owner: this
    };
    return this as any;
  }

  #alias(name: string, aliasName: string): this {
    if (aliasName === 'ref') {
      throw new Error('Cannot create a variable named `ref` because it is reserved for internal use');
    }

    if (this.#definedInScopeVarNames.has(aliasName)) {
      throw new Error(`Variable "${aliasName}" is already defined`);
    }

    const record = this.#definitions[name];

    if (!record) {
      throw new Error(`Cannot create alias "${aliasName}" for unknown variable "${name}"`);
    }

    this.#definedInScopeVarNames.add(aliasName);
    this.#definitions[aliasName] = record;
    return this;
  }

  subject<T extends string, R>(name: T, impl: R | ((v: TShape) => R)): LazyVariables<TShape & { [K in T]: R } & { subject: R }>
  subject<R>(impl: R | ((v: TShape) => R)): LazyVariables<TShape & { subject: R }>
  subject(...args: unknown[]): any {
    if (args.length === 1) {
      return this.variable('subject', args[0] as ((v: TShape) => unknown));
    }

    return this.variable('subject', args[1])
      .variable(args[0] as string, (scope: { subject: unknown }) => scope.subject);
  }

  require<T extends string, R>(name: T): LazyVariables<TShape & { [K in T]: R }> {
    if (name === 'ref') {
      throw new Error('Cannot create a variable named `ref` because it is reserved for internal use');
    }

    this.#requiredVarNames.add(name);
    this.#definitions[name] = {
      impl: () => {
      throw new Error(`Variable "${name}" is required but not defined`);
      },
      owner: this
    };
    return this as any;
  }

  extends<T extends LazyVariablesScope>(parentScope: T): LazyVariables<TShape & T> {
    const parentFactory = parentScope[FACTORY_KEY];

    if (!parentFactory) {
      throw new Error('Trying to extend not a lazy variables scope');
    }

    this.#parentScope = parentScope;
    this.#definitions = Object.assign(
      Object.create(parentFactory.#definitions),
      this.#definitions
    );
    return this as any;
  }

  #has(name: PropertyKey): boolean {
    return name in this.#definitions;
  }

  scope(): TShape & { ref: LazyRefs<TShape> } {
    const scope = Object.create(null) as TShape & { ref: LazyRefs<TShape> };

    Object.defineProperties(scope, {
      [VALUES_KEY]: { value: new Map<PropertyKey, unknown>() },
      [FACTORY_KEY]: { value: this },
      [EVALUATING_KEY]: { value: [] },
      ref: {
        get() {
          if (hasOwn(this, REF_PROXY_KEY)) return this[REF_PROXY_KEY];

          const refProxy = new Proxy({} as LazyRefs<TShape>, {
            get: (_, prop) => () => (this as any)[prop]
          });
          Object.defineProperty(this, REF_PROXY_KEY, { value: refProxy });
          return refProxy;
        },
        enumerable: false
      }
    });

    const keys = Object.create(null);
    for (const key in this.#definitions) {
      keys[key] = true;
    }

    for (const key of Object.keys(keys) as Array<keyof Definitions<TShape>>) {
      Object.defineProperty(scope, key, {
        enumerable: true,
        get: () => this.#evaluate(key, scope as Required<LazyVariablesScope>)
      });
    }

    return scope;
  }

  #evaluate(key: PropertyKey, scope: Required<LazyVariablesScope>, receiver = scope): unknown {
    const values = receiver[VALUES_KEY];
    if (values.has(key)) {
      return values.get(key);
    }

    const factory = scope[FACTORY_KEY];
    const record = factory.#definitions[key];
    if (!record) {
      return undefined;
    }

    const evaluating = receiver[EVALUATING_KEY];
    const activeFrame = evaluating[evaluating.length - 1];
    if (activeFrame?.record === record) {
      return record.owner.#evaluateInParent(key, receiver);
    }

    if (evaluating.some((frame) => frame.record === record)) {
      throw new Error(`Circular dependency detected for variable "${String(key)}" with no parent scope`);
    }

    evaluating.push({ record });
    try {
      const def = record.impl;
      const isFactory = typeof def === 'function';
      const value = isFactory ? (def as (scope: LazyVariablesScope) => unknown)(receiver) : def;
      values.set(key, value);
      if (isFactory) {
        LazyVariables.#onValueCreated?.(value, key, values);
      }

      return value;
    } finally {
      evaluating.pop();
    }
  }

  #evaluateInParent(key: PropertyKey, receiver: Required<LazyVariablesScope>): unknown {
    const parentScope = this.#parentScope;

    const parentFactory = parentScope?.[FACTORY_KEY] as LazyVariables<any> | undefined;

    if (!parentScope || !parentFactory || !parentFactory.#has(key)) {
      throw new Error(`Circular dependency detected for variable "${String(key)}" with no parent scope`);
    }

    return parentFactory.#evaluate(key, parentScope as Required<LazyVariablesScope>, receiver);
  }
}

type Definitions<T extends {}> = {
  [K in keyof T]?: T[K] | ((v: T) => T[K])
}

export function lazy<T extends LazyVariablesScope>(builder: (b: LazyVariables<{}>) => LazyVariables<T>): T & { ref: LazyRefs<T> } {
  return builder(new LazyVariables<T>()).scope();
}

type LazyVariablesScope = Record<string, unknown> & {
  [VALUES_KEY]?: Map<PropertyKey, unknown>
  [FACTORY_KEY]?: LazyVariables<any>
  [EVALUATING_KEY]?: EvaluationFrame[]
};

export function clearScope(scope: LazyVariablesScope) {
  const values = scope[VALUES_KEY];

  if (!values) {
    throw new Error('Cannot clear values of object which is not a lazy variables scope');
  }

  values.clear();
}

function getFactory(scope: LazyVariablesScope): LazyVariables<any> {
  const factory = scope[FACTORY_KEY];

  if (!factory) {
    throw new Error('Trying to get factory from not a lazy variables scope');
  }

  return factory;
}
