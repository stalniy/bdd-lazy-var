import { setOnValueCreated } from './LazyVariables.ts';

export function setup(options: SetupOptions) {
  const ACCESSIBLE_VALUES = new Set<Map<PropertyKey, unknown>>();

  setOnValueCreated((_, _2, values) => {
    ACCESSIBLE_VALUES.add(values);
  });

  options.registerCleanup(() => {
    for (const values of ACCESSIBLE_VALUES) {
      values.clear();
    }

    ACCESSIBLE_VALUES.clear();
  });
}

export interface SetupOptions {
  registerCleanup: (fn: () => void) => void;
}
