import { expect, describe, it, afterEach, vi } from 'vitest';
import { LazyVariables, lazy, clearScope, setOnValueCreated } from './LazyVariables.ts';

describe('LazyVariables', () => {
  afterEach(() => {
    setOnValueCreated(undefined);
  });

  describe('variable()', () => {
    it('defines a variable with a static value', () => {
      const vars = new LazyVariables<{ name: string }>();
      vars.variable('name', 'John');
      const scope = vars.scope();

      expect(scope.name).toBe('John');
    });

    it('defines a variable with a factory function', () => {
      const vars = new LazyVariables<{ timestamp: number }>();
      vars.variable('timestamp', () => Date.now());
      const scope = vars.scope();

      expect(typeof scope.timestamp).toBe('number');
    });

    it('passes scope to factory function', () => {
      const scope = lazy(b => b
        .variable('firstName', 'John')
        .variable('lastName', 'Doe')
        .variable('fullName', v => `${v.firstName} ${v.lastName}`)
      );

      expect(scope.fullName).toBe('John Doe');
    });

    it('has an alias `def` for variable()', () => {
      const vars = new LazyVariables();

      expect(vars.def).toBe(vars.variable);
    });
  });

  describe('subject()', () => {
    it('defines a `subject` variable with implementation only', () => {
      const scope = lazy(b => b.subject(() => ({ value: 42 })));

      expect(scope.subject).toEqual({ value: 42 });
    });

    it('can define a named subject', () => {
      const scope = lazy(b => b.subject('mySubject', () => ({ value: 42 })));

      expect(scope.mySubject).toEqual({ value: 42 });
      expect(scope.subject).toEqual({ value: 42 });
    });

    it('defines a subject with static value', () => {
      const obj = { value: 42 };
      const scope = lazy(b => b.subject(obj));

      expect(scope.subject).toBe(obj);
    });

    it('returns the instance for chaining', () => {
      const vars = new LazyVariables();
      const result = vars.subject(() => 42);

      expect(result).toBe(vars);
    });
  });

  describe('require()', () => {
    it('throws when accessing required variable without definition', () => {
      const scope = lazy(b => b.require<'value', number>('value'));

      expect(() => scope.value).toThrow('Variable "value" is required but not defined');
    });

    it('works when child scope provides definition', () => {
      const parent = lazy(b => b
        .require<'name', string>('name')
        .variable('greeting', v => `Hello, ${v.name}!`)
      );

      const child = lazy(b => b
        .extends(parent)
        .variable('name', 'John')
      );

      expect(child.greeting).toBe('Hello, John!');
    });

    it('returns the instance for chaining', () => {
      const vars = new LazyVariables();
      const result = vars.require('value');

      expect(result).toBe(vars);
    });

    it('can be chained with other methods', () => {
      const scope = lazy(b => b
        .require<'a', number>('a')
        .require<'b', number>('b')
        .variable('a', 1)
        .variable('b', 2)
        .variable('sum', v => v.a + v.b)
      );

      expect(scope.sum).toBe(3);
    });

    it('does not throw if required variable is overridden before access', () => {
      const scope = lazy(b => b
        .require<'value', string>('value')
        .variable('value', 'provided')
      );

      expect(scope.value).toBe('provided');
    });

    it('throws with descriptive message including variable name', () => {
      const scope = lazy(b => b.require<'mySpecialVar', unknown>('mySpecialVar'));

      expect(() => scope.mySpecialVar).toThrow('mySpecialVar');
    });

    it('allows defining abstract interface for child scopes', () => {
      const baseScope = lazy(b => b
        .require<'getData', () => number[]>('getData')
        .variable('sum', v => v.getData().reduce((a, b) => a + b, 0))
      );

      const implScope = lazy(b => b
        .extends(baseScope)
        .variable('getData', () => () => [1, 2, 3, 4, 5])
      );

      expect(implScope.sum).toBe(15);
    });

    it('child implementation can reference parent variables', () => {
      const parent = lazy(b => b
        .variable('prefix', 'Mr.')
        .variable('suffix', 'Esq.')
        .require<'name', string>('name')
        .variable('fullTitle', v => `${v.prefix} ${v.name}, ${v.suffix}`)
      );

      const child = lazy(b => b
        .extends(parent)
        .variable('name', v => `${v.prefix === 'Mr.' ? 'John' : 'Jane'} Doe`)
      );

      expect(child.name).toBe('John Doe');
      expect(child.fullTitle).toBe('Mr. John Doe, Esq.');
    });

    it('supports multiple levels of inheritance with required variables', () => {
      const grandparent = lazy(b => b
        .variable('base', 10)
        .require<'multiplier', number>('multiplier')
        .variable('result', v => v.base * v.multiplier)
      );

      const parent = lazy(b => b
        .extends(grandparent)
        .variable('base', 20)
      );

      // Parent still has required 'multiplier' - accessing result should throw
      expect(() => parent.result).toThrow('Variable "multiplier" is required but not defined');

      const child = lazy(b => b
        .extends(parent)
        .variable('multiplier', 5)
      );

      expect(child.result).toBe(100); // 20 * 5
    });

    it('required variable can reference other required variables when both provided', () => {
      const parent = lazy(b => b
        .require<'firstName', string>('firstName')
        .require<'lastName', string>('lastName')
        .variable('fullName', v => `${v.firstName} ${v.lastName}`)
      );

      const child = lazy(b => b
        .extends(parent)
        .variable('firstName', 'John')
        .variable('lastName', v => v.firstName === 'John' ? 'Doe' : 'Smith')
      );

      expect(child.fullName).toBe('John Doe');
    });

    it('child can override parent variable that required variable depends on', () => {
      const parent = lazy(b => b
        .variable('separator', ' ')
        .require<'items', string[]>('items')
        .variable('joined', v => v.items.join(v.separator))
      );

      const child = lazy(b => b
        .extends(parent)
        .variable('separator', ', ')
        .variable('items', () => ['a', 'b', 'c'])
      );

      expect(child.joined).toBe('a, b, c');
    });
  });

  describe('extends()', () => {
    it('inherits variables from parent scope', () => {
      const parent = lazy(b => b
        .variable('name', 'John')
        .variable('age', 30)
      );

      const child = lazy(b => b.extends(parent));

      expect(child.name).toBe('John');
      expect(child.age).toBe(30);
    });

    it('allows overriding parent variables', () => {
      const parent = lazy(b => b.variable('name', 'John'));

      const child = lazy(b => b
        .extends(parent)
        .variable('name', 'Jane')
      );

      expect(child.name).toBe('Jane');
    });

    it('allows child to add new variables', () => {
      const parent = lazy(b => b.variable('name', 'John'));

      const child = lazy(b => b
        .extends(parent)
        .variable('age', 30)
      );

      expect(child.name).toBe('John');
      expect(child.age).toBe(30);
    });

    it('throws when extending non-lazy scope', () => {
      const notAScope = { name: 'John' };

      expect(() => {
        new LazyVariables().extends(notAScope as any);
      }).toThrow('Trying to extend not a lazy variables scope');
    });

    it('returns the instance for chaining', () => {
      const parent = lazy(b => b.variable('name', 'John'));
      const vars = new LazyVariables();
      const result = vars.extends(parent);

      expect(result).toBe(vars);
    });
  });

  describe('scope()', () => {
    it('returns a scope object', () => {
      const vars = new LazyVariables<{ name: string }>().variable('name', 'John');
      const scope = vars.scope();

      expect(typeof scope).toBe('object');
      expect(scope).not.toBeNull();
    });

    it('creates independent scope instances', () => {
      const vars = new LazyVariables<{ counter: number }>()
        .variable('counter', () => Math.random());

      const scope1 = vars.scope();
      const scope2 = vars.scope();

      // Each scope has its own cached value
      expect(scope1.counter).toBe(scope1.counter);
      expect(scope2.counter).toBe(scope2.counter);
      // But different scopes have different values
      expect(scope1.counter).not.toBe(scope2.counter);
    });

    it('includes ref property', () => {
      const scope = lazy(b => b.variable('name', 'John'));

      expect(scope.ref).toBeDefined();
      expect(typeof scope.ref).toBe('object');
    });
  });

  describe('lazy evaluation', () => {
    it('does not call factory until variable is accessed', () => {
      const factory = vi.fn(() => 42);
      const vars = new LazyVariables<{ value: number }>().variable('value', factory);
      vars.scope();

      expect(factory).not.toHaveBeenCalled();
    });

    it('calls factory when variable is accessed', () => {
      const factory = vi.fn(() => 42);
      const vars = new LazyVariables<{ value: number }>().variable('value', factory);
      const scope = vars.scope();

      scope.value;

      expect(factory).toHaveBeenCalledTimes(1);
    });

    it('caches the value after first access', () => {
      const factory = vi.fn(() => Math.random());
      const vars = new LazyVariables<{ value: number }>().variable('value', factory);
      const scope = vars.scope();

      const first = scope.value;
      const second = scope.value;
      const third = scope.value;

      expect(factory).toHaveBeenCalledTimes(1);
      expect(first).toBe(second);
      expect(second).toBe(third);
    });

    it('returns undefined for non-existent variables', () => {
      const scope = lazy(b => b.variable('name', 'John'));

      expect((scope as any).nonExistent).toBeUndefined();
    });
  });

  describe('circular dependency detection', () => {
    it('throws when circular dependency without parent', () => {
      const scope = lazy(b => b
        .variable('a', (v: any) => v.b)
        .variable('b', (v: any) => v.a)
      );

      // When accessing 'a': a -> b -> a (circular detected on 'a')
      expect(() => scope.a).toThrow('Circular dependency detected for variable "a" with no parent scope');
    });

    it('accesses parent definition when variable references itself', () => {
      const parent = lazy(b => b.variable('name', 'Parent'));

      const child = lazy(b => b
        .extends(parent)
        .variable('name', v => `Child of ${v.name}`)
      );

      expect(child.name).toBe('Child of Parent');
    });
  });

  describe('parent scope evaluation', () => {
    it('evaluates parent definition with current scope context', () => {
      const parent = lazy(b => b
        .variable('firstName', 'John')
        .variable('lastName', 'Doe')
        .variable('fullName', v => `${v.firstName} ${v.lastName}`)
      );

      const child = lazy(b => b
        .extends(parent)
        .variable('lastName', 'Smith')
      );

      expect(child.fullName).toBe('John Smith');
    });

    it('supports multiple levels of inheritance', () => {
      const grandparent = lazy(b => b.variable('value', 'grandparent'));

      const parent = lazy(b => b.extends(grandparent));

      const child = lazy(b => b.extends(parent));

      expect(child.value).toBe('grandparent');
    });

    it('uses closest parent definition when overriding', () => {
      const grandparent = lazy(b => b.variable('value', 'grandparent'));

      const parent = lazy(b => b
        .extends(grandparent)
        .variable('value', 'parent')
      );

      const child = lazy(b => b.extends(parent));

      expect(child.value).toBe('parent');
    });

    it('can access parent in nested self-referencing definition', () => {
      const parent = lazy(b => b.variable('items', () => ['a', 'b']));

      const child = lazy(b => b
        .extends(parent)
        .variable('items', v => [...v.items, 'c'])
      );

      expect(child.items).toEqual(['a', 'b', 'c']);
    });
  });

  describe('ref proxy', () => {
    it('returns functions for each property', () => {
      const scope = lazy(b => b
        .variable('name', 'John')
        .variable('age', 30)
      );

      expect(typeof scope.ref.name).toBe('function');
      expect(typeof scope.ref.age).toBe('function');
    });

    it('returns the variable value when called', () => {
      const scope = lazy(b => b
        .variable('name', 'John')
        .variable('age', 30)
      );

      expect(scope.ref.name()).toBe('John');
      expect(scope.ref.age()).toBe(30);
    });

    it('returns lazy reference that evaluates on call', () => {
      const factory = vi.fn(() => 42);
      const vars = new LazyVariables<{ value: number }>().variable('value', factory);
      const scope = vars.scope();

      const ref = scope.ref.value;
      expect(factory).not.toHaveBeenCalled();

      ref();
      expect(factory).toHaveBeenCalledTimes(1);
    });

    it('uses the same cached value as direct access', () => {
      const scope = lazy(b => b
        .variable('obj', () => ({ id: Math.random() }))
      );

      const directValue = scope.obj;
      const refValue = scope.ref.obj();

      expect(refValue).toBe(directValue);
    });
  });
});

describe('lazy()', () => {
  it('creates scope using builder pattern', () => {
    const scope = lazy(b => b
      .variable('name', 'John')
      .variable('age', 30)
    );

    expect(scope.name).toBe('John');
    expect(scope.age).toBe(30);
  });

  it('supports chaining all methods', () => {
    const scope = lazy(b => b
      .variable('a', 1)
      .def('b', 2)
      .subject(v => v.a + v.b)
    );

    expect(scope.a).toBe(1);
    expect(scope.b).toBe(2);
    expect(scope.subject).toBe(3);
  });

  it('includes ref property in returned scope', () => {
    const scope = lazy(b => b.variable('name', 'John'));

    expect(scope.ref).toBeDefined();
    expect(scope.ref.name()).toBe('John');
  });
});

describe('clearScope()', () => {
  it('clears all cached values', () => {
    let callCount = 0;
    const vars = new LazyVariables<{ counter: number }>()
      .variable('counter', () => ++callCount);
    const scope = vars.scope();

    const first = scope.counter;
    expect(callCount).toBe(1);

    clearScope(scope);

    const second = scope.counter;
    expect(callCount).toBe(2);
    expect(first).not.toBe(second);
  });

  it('throws when passed non-lazy scope', () => {
    const notAScope = { name: 'John' };

    expect(() => {
      clearScope(notAScope as any);
    }).toThrow('Cannot clear values of object which is not a lazy variables scope');
  });

  it('allows re-evaluation after clearing', () => {
    const values: number[] = [];
    const vars = new LazyVariables<{ value: number }>()
      .variable('value', () => {
        const v = Math.random();
        values.push(v);
        return v;
      });
    const scope = vars.scope();

    scope.value;
    clearScope(scope);
    scope.value;

    expect(values.length).toBe(2);
    expect(values[0]).not.toBe(values[1]);
  });
});

describe('setOnValueCreated()', () => {
  afterEach(() => {
    setOnValueCreated(undefined);
  });

  it('calls handler when value is created', () => {
    const handler = vi.fn();
    setOnValueCreated(handler);

    const scope = lazy(b => b.variable('name', () => 'John'));
    scope.name;

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0]).toBe('John');
    expect(handler.mock.calls[0][1]).toBe('name');
    expect(handler.mock.calls[0][2]).toBeInstanceOf(Map);
  });

  it('does not call handler for static values', () => {
    const handler = vi.fn();
    setOnValueCreated(handler);

    const scope = lazy(b => b.variable('name', 'John'));
    scope.name;

    expect(handler).not.toHaveBeenCalled();
  });

  it('calls handler for each unique variable', () => {
    const handler = vi.fn();
    setOnValueCreated(handler);

    const scope = lazy(b => b
      .variable('a', () => 1)
      .variable('b', () => 2)
    );

    scope.a;
    scope.b;

    expect(handler).toHaveBeenCalledTimes(2);
  });

  it('does not call handler on subsequent accesses', () => {
    const handler = vi.fn();
    setOnValueCreated(handler);

    const scope = lazy(b => b.variable('name', () => 'John'));

    scope.name;
    scope.name;
    scope.name;

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('can be disabled by setting undefined', () => {
    const handler = vi.fn();
    setOnValueCreated(handler);
    setOnValueCreated(undefined);

    const scope = lazy(b => b.variable('name', () => 'John'));
    scope.name;

    expect(handler).not.toHaveBeenCalled();
  });

  it('receives the values map with all previously computed values', () => {
    let capturedMap: Map<PropertyKey, unknown> | undefined;
    setOnValueCreated((value, key, values) => {
      capturedMap = values;
    });

    const scope = lazy(b => b
      .variable('a', () => 1)
      .variable('b', v => v.a + 1)
    );

    scope.b; // This will first evaluate 'a', then 'b'

    expect(capturedMap).toBeDefined();
    expect(capturedMap!.get('a')).toBe(1);
    expect(capturedMap!.get('b')).toBe(2);
  });
});

describe('integration tests', () => {
  it('supports complex nested scope inheritance', () => {
    const root = lazy(b => b
      .variable('prefix', 'Hello')
      .variable('name', 'World')
      .variable('greeting', v => `${v.prefix}, ${v.name}!`)
    );

    const child1 = lazy(b => b
      .extends(root)
      .variable('name', 'John')
    );

    const child2 = lazy(b => b
      .extends(child1)
      .variable('prefix', 'Hi')
    );

    expect(root.greeting).toBe('Hello, World!');
    expect(child1.greeting).toBe('Hello, John!');
    expect(child2.greeting).toBe('Hi, John!');
  });

  it('properly isolates scopes created from same definition', () => {
    const factory = new LazyVariables<{
      items: number[];
      addItem: (n: number) => number[];
    }>()
      .variable('items', () => [] as number[])
      .variable('addItem', v => (n: number) => {
        v.items.push(n);
        return v.items;
      });

    const scope1 = factory.scope();
    const scope2 = factory.scope();

    scope1.addItem(1);
    scope1.addItem(2);
    scope2.addItem(3);

    expect(scope1.items).toEqual([1, 2]);
    expect(scope2.items).toEqual([3]);
  });

  it('maintains correct context when accessing parent variables multiple times', () => {
    const parent = lazy(b => b
      .variable('value', () => ({ count: 0 }))
    );

    const child = lazy(b => b
      .extends(parent)
      .variable('value', v => ({
        count: v.value.count + 1
      }))
    );

    // Multiple accesses should return same cached value
    const first = child.value;
    const second = child.value;

    expect(first).toBe(second);
    expect(first.count).toBe(1);
  });
});
