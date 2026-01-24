const VALUES_KEY = Symbol('values');
const FACTORY_KEY = Symbol('factory');
const PARENT_SCOPE_KEY = Symbol('parentScope');
const EVALUATING_KEY = Symbol('evaluating');
const REF_KEY = Symbol('ref');

/** A lazy reference that can be called to get the value */
export interface LazyRef<T> {
  (): T;
}

/** Mapped type: converts scope properties to LazyRef */
type LazyRefs<T> = {
  [K in keyof T]: LazyRef<T[K]>;
};

type OnValueCreated = (value: unknown, key: PropertyKey, values: Map<PropertyKey, unknown>) => void;
let onValueCreated: OnValueCreated | undefined;

export function setOnValueCreated(handler: OnValueCreated | undefined) {
  onValueCreated = handler;
}

export class LazyVariables<TShape extends LazyVariablesScope = {}> {
  public readonly def: this['variable'];
  private _definitions: Definitions<TShape> = {};
  private _parentScope: LazyVariablesScope | null = null;

  constructor() {
    this.def = this.variable;
  }

  variable<T extends string, R>(
    name: T,
    impl: R | ((v: TShape) => R)
  ): LazyVariables<TShape & { [K in T]: R }> {
    this._definitions[name] = impl as Definitions<TShape>[T];
    return this as any;
  }

  subject<T extends string, R>(name: T, impl: R | ((v: TShape) => R)): LazyVariables<TShape & { [K in T]: R } & { subject: R }>
  subject<R>(impl: R | ((v: TShape) => R)): LazyVariables<TShape & { subject: R }>
  subject(...args: unknown[]): any {
    let name: string;
    let impl: unknown | ((v: TShape) => unknown);

    if (args.length === 2) {
      name = args[0] as string;
      impl = args[1];
      (this._definitions as any).subject = impl;
    } else {
      name = 'subject';
      impl = args[0] as ((v: TShape) => unknown);
    }

    (this._definitions as any)[name] = impl;

    return this;
  }

  require<T extends string, R>(name: T): LazyVariables<TShape & { [K in T]: R }> {
    return this.variable<T, R>(name, () => {
      throw new Error(`Variable "${name}" is required but not defined`);
    });
  }

  extends<T extends LazyVariablesScope>(parentScope: T): LazyVariables<TShape & T> {
    const parentFactory = parentScope[FACTORY_KEY];

    if (!parentFactory) {
      throw new Error('Trying to extend not a lazy variables scope');
    }

    this._parentScope = parentScope;
    this._definitions = { ...parentFactory._definitions } as Definitions<TShape>;
    return this as any;
  }

  scope(): TShape & { ref: LazyRefs<TShape> } {
    const values = new Map<PropertyKey, unknown>();
    const evaluating = new Set<PropertyKey>();
    const keys = Object.keys(this._definitions) as Array<keyof Definitions<TShape>>;
    const parentScope = this._parentScope;
    const parentFactory = parentScope?.[FACTORY_KEY] as LazyVariables<any> | undefined;

    // Create the ref proxy that returns LazyRef for each property
    const refProxy = new Proxy({} as LazyRefs<TShape>, {
      get: (_target, prop) => {
        // Return a function that gets the value from the scope
        return () => (scope as any)[prop];
      }
    });

    const scope = Object.defineProperties({}, {
      [VALUES_KEY]: { value: values },
      [FACTORY_KEY]: { value: this },
      [PARENT_SCOPE_KEY]: { value: parentScope },
      [EVALUATING_KEY]: { value: evaluating },
      [REF_KEY]: { value: refProxy },
      ref: { value: refProxy, enumerable: false }
    }) as TShape & { ref: LazyRefs<TShape> };

    return keys.reduce((scope, key) => {
      const def = this._definitions[key];
      const descriptor: PropertyDescriptor = { enumerable: true };

      if (typeof def === 'function') {
        descriptor.get = () => {
          if (values.has(key)) {
            return values.get(key);
          }

          // If we're already evaluating this variable, get from parent
          if (evaluating.has(key)) {
            if (!parentFactory) {
              throw new Error(`Circular dependency detected for variable "${String(key)}" with no parent scope`);
            }
            // Evaluate parent's definition with CURRENT scope as context
            // This maintains the "current context" behavior like the original library
            return evaluateFromParent(key, scope, parentFactory, parentScope);
          }

          evaluating.add(key);
          try {
            const value = def(scope);
            values.set(key, value);

            if (typeof onValueCreated === 'function') {
              onValueCreated(value, key, values);
            }

            return value;
          } finally {
            evaluating.delete(key);
          }
        };
      } else {
        descriptor.value = def;
      }

      return Object.defineProperty(scope, key, descriptor);
    }, scope);
  }
}

type Definitions<T extends {}> = {
  [K in keyof T]?: T[K] | ((v: T) => T[K])
}

/**
 * Evaluate a variable from the parent scope chain, but using the current scope as context.
 * This maintains the "current context" behavior like the original bdd-lazy-var library.
 */
function evaluateFromParent<T extends LazyVariablesScope>(
  key: PropertyKey,
  currentScope: T,
  parentFactory: LazyVariables<any>,
  parentScope: LazyVariablesScope | null
): unknown {
  // Look up the parent chain for a different definition
  let factory: LazyVariables<any> | undefined = parentFactory;
  let ancestorScope: LazyVariablesScope | null = parentScope;

  while (factory) {
    const parentDef = (factory as any)._definitions[key];
    const currentDef = (currentScope[FACTORY_KEY] as any)?._definitions[key];

    // Found a different definition in parent
    if (parentDef !== currentDef) {
      if (typeof parentDef === 'function') {
        // Evaluate parent's definition with CURRENT scope as context
        return parentDef(currentScope);
      }
      return parentDef;
    }

    // Continue up the chain
    ancestorScope = ancestorScope?.[PARENT_SCOPE_KEY] ?? null;
    factory = ancestorScope?.[FACTORY_KEY] as LazyVariables<any> | undefined;
  }

  throw new Error(`No parent definition found for variable "${String(key)}"`);
}

export function lazy<T extends LazyVariablesScope>(builder: (b: LazyVariables<{}>) => LazyVariables<T>): T & { ref: LazyRefs<T> } {
  return builder(new LazyVariables<T>()).scope();
}

type LazyVariablesScope = Record<string, unknown> & {
  [VALUES_KEY]?: Map<PropertyKey, unknown>
  [FACTORY_KEY]?: LazyVariables<any>
  [PARENT_SCOPE_KEY]?: LazyVariablesScope | null
  [EVALUATING_KEY]?: Set<PropertyKey>
};

export function clearScope(scope: LazyVariablesScope) {
  const values = scope[VALUES_KEY];

  if (!values) {
    throw new Error('Cannot clear values of object which is not a lazy variables scope');
  }

  values.clear();
}
