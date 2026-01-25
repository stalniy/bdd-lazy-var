const VALUES_KEY = Symbol('values');
const FACTORY_KEY = Symbol('factory');
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

export function setOnValueCreated(handler: OnValueCreated | undefined) {
  LazyVariables.setOnValueCreated(handler);
}

export class LazyVariables<TShape extends LazyVariablesScope = {}> {
  static #onValueCreated: OnValueCreated | undefined;

  static setOnValueCreated(handler: OnValueCreated | undefined) {
    LazyVariables.#onValueCreated = handler;
  }

  public readonly def: this['variable'];
  #definitions: Definitions<TShape> = Object.create(null);
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
    this.#definitions[name] = impl as Definitions<TShape>[T];
    return this as any;
  }

  subject<T extends string, R>(name: T, impl: R | ((v: TShape) => R)): LazyVariables<TShape & { [K in T]: R } & { subject: R }>
  subject<R>(impl: R | ((v: TShape) => R)): LazyVariables<TShape & { subject: R }>
  subject(...args: unknown[]): any {
    if (args.length === 1) {
      return this.variable('subject', args[0] as ((v: TShape) => unknown));
    }

    return this.variable('subject', args[1])
      .variable(args[0] as string, args[1]);
  }

  require<T extends string, R>(name: T): LazyVariables<TShape & { [K in T]: R }> {
    if (name === 'ref') {
      throw new Error('Cannot create a variable named `ref` because it is reserved for internal use');
    }

    this.#requiredVarNames.add(name);
    this.#definitions[name] = (() => {
      throw new Error(`Variable "${name}" is required but not defined`);
    }) as Definitions<TShape>[T];
    return this as any;
  }

  extends<T extends LazyVariablesScope>(parentScope: T): LazyVariables<TShape & T> {
    const parentFactory = parentScope[FACTORY_KEY];

    if (!parentFactory) {
      throw new Error('Trying to extend not a lazy variables scope');
    }

    this.#parentScope = parentScope;
    this.#definitions = { ...parentFactory.#definitions } as Definitions<TShape>;
    return this as any;
  }

  scope(): TShape & { ref: LazyRefs<TShape> } {
    const scope = Object.create(null) as TShape & { ref: LazyRefs<TShape> };

    Object.defineProperties(scope, {
      [VALUES_KEY]: { value: new Map<PropertyKey, unknown>() },
      [FACTORY_KEY]: { value: this },
      [EVALUATING_KEY]: { value: new Set<PropertyKey>() },
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

    const keys = Object.keys(this.#definitions) as Array<keyof Definitions<TShape>>;
    for (const key of keys) {
      const def = this.#definitions[key];

      if (typeof def !== 'function') {
        Object.defineProperty(scope, key, {
          enumerable: true,
          value: def
        });
        continue;
      }

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
    const evaluating = scope[EVALUATING_KEY];
    if (evaluating.has(key)) {
      const parentScope = factory.#parentScope;
      // Circular reference: delegate to parent scope with current receiver
      if (!parentScope || !(key in parentScope)) {
        throw new Error(`Circular dependency detected for variable "${String(key)}" with no parent scope`);
      }
      return this.#evaluate(key, parentScope as Required<LazyVariablesScope>, receiver);
    }

    evaluating.add(key);
    try {
      const def = factory.#definitions[key as keyof Definitions<TShape>];
      const value = typeof def === 'function' ? def(receiver) : def;
      values.set(key, value);
      LazyVariables.#onValueCreated?.(value, key, values);

      return value;
    } finally {
      evaluating.delete(key);
    }
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
  [EVALUATING_KEY]?: Set<PropertyKey>
};

export function clearScope(scope: LazyVariablesScope) {
  const values = scope[VALUES_KEY];

  if (!values) {
    throw new Error('Cannot clear values of object which is not a lazy variables scope');
  }

  values.clear();
}
