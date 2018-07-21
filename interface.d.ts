interface GetLazyVar {
  (name: string): any;
}

interface Is {
  expected: ReturnType<typeof global.expect>
}

export const is: Is;
export const get: GetLazyVar;
export function def(name: string, implementation: () => any): void;
export function sharedExamplesFor(summary: string, implementation: (...vars: any[]) => void): void;
export function itBehavesLike(summary: string, ...vars: any[]): void;
export function includeExamplesFor(summary: string, ...vars: any[]): void;
export const its: typeof global.it;
export const xits: typeof gloval.it;
export const fits: typeof gloval.it;
