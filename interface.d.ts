interface GetLazyVar {
  (name: string): any;
}

type AnyFunction = (...args: any[]) => any;

interface DefOptions {
    lazy?: boolean;
}

export const get: GetLazyVar;
export function def(name: string, implementation: () => any): void;
export function def(name: string, implementation: () => any, defOptions: DefOptions): void;
export function sharedExamplesFor(summary: string, implementation: (...vars: any[]) => void): void;
export function itBehavesLike(summary: string | AnyFunction, ...vars: any[]): void;
export function includeExamplesFor(summary: string | AnyFunction, ...vars: any[]): void;
