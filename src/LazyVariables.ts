const VALUES_KEY = Symbol('values');
const FACTORY_KEY = Symbol('factory');

type OnValueCreated = (value: unknown, key: PropertyKey, values: Map<PropertyKey, unknown>) => void;
let onValueCreated: OnValueCreated | undefined;

export function setOnValueCreated(handler: OnValueCreated | undefined) {
  onValueCreated = handler;
}

export class LazyVariables<TShape extends LazyVariablesScope = {}> {
  public readonly def: this['variable'];
  private _definitions: Definitions<TShape> = {};

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

  extends<T extends LazyVariablesScope>(parentScope: T): LazyVariables<TShape & T> {
    const parentFactory = parentScope[FACTORY_KEY];

    if (!parentFactory) {
      throw new Error('Trying to extend not a lazy variables scope');
    }

    this._definitions = { ...parentFactory._definitions } as Definitions<TShape>;
    return this as any;
  }

  scope(): TShape {
    const values = new Map<PropertyKey, unknown>();
    const keys = Object.keys(this._definitions) as Array<keyof Definitions<TShape>>;
    const scope = Object.defineProperties({}, {
      [VALUES_KEY]: { value: values },
      [FACTORY_KEY]: { value: this }
    }) as TShape;

    return keys.reduce((scope, key) => {
      const def = this._definitions[key];
      const descriptor: PropertyDescriptor = { enumerable: true };

      if (typeof def === 'function') {
        descriptor.get = () => {
          if (values.has(key)) {
            return values.get(key);
          }

          const value = def(scope);
          values.set(key, value);

          if (typeof onValueCreated === 'function') {
            onValueCreated(value, key, values);
          }

          return value;
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

export function lazy<T extends LazyVariablesScope>(builder: (b: LazyVariables<{}>) => LazyVariables<T>): T {
  return builder(new LazyVariables<T>()).scope();
}

type LazyVariablesScope = Record<string, unknown> & {
  [VALUES_KEY]?: Map<PropertyKey, unknown>
  [FACTORY_KEY]?: LazyVariables<any>
};

export function clearScope(scope: LazyVariablesScope) {
  const values = scope[VALUES_KEY];

  if (!values) {
    throw new Error('Cannot clear values of object which is not a lazy variables scope');
  }

  values.clear();
}
