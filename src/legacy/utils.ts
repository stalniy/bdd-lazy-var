export function parseMessage(fn: (...args: unknown[]) => unknown) {
  const matches = fn.toString().match(/is\.expected\.(\s+(?=\.)|.)+/g);

  if (!matches) {
    return '';
  }

  const prefixLength = 'is.expected.'.length;
  const body = matches.reduce<string[]>((message, chunk) => {
    const cleanChunk = chunk.trim()
      .slice(prefixLength)
      .replace(/[\s.]+/g, ' ');
    const humanized = humanize(cleanChunk).replace(/ and /g, ', ');
    message.push(humanized);
    return message;
  }, []);

  return `is expected ${body.join(', ')}`;
};

export function humanize(value: string) {
  return value.replace(
    /([a-z])([A-Z])/g,
    (_, before, letter) => `${before} ${letter.toLowerCase()}`
  );
}


const LAZY_VARS_PROP_NAME = Symbol('__lazyVars');

export interface GetterContext {
  get: (varName: string) => unknown;
}

export interface DefineGetterOptions {
  getterPrefix?: string;
  defineOn?: Record<PropertyKey, any>;
}

export function defineGetter(context: GetterContext, varName: string, options?: DefineGetterOptions): void {
  const params = {
    getterPrefix: '',
    defineOn: context as Record<PropertyKey, any>,
    ...options
  };

  const accessorName = params.getterPrefix + varName;
  const varContext = params.defineOn;
  varContext[LAZY_VARS_PROP_NAME] ??= new Set<string>();

  if (varContext[LAZY_VARS_PROP_NAME].has(accessorName)) {
    return;
  }

  varContext[LAZY_VARS_PROP_NAME].add(accessorName);
  Object.defineProperty(varContext, accessorName, {
    configurable: true,
    get: () => context.get(varName)
  });
}

export const hasOwn = Object.hasOwn || ((obj: object, prop: string) => Object.prototype.hasOwnProperty.call(obj, prop));
