interface GetLazyVar {
  (name: string): any;
}

export const get: GetLazyVar;
export function def(name: string, implementation: () => any): void;
export function sharedExamplesFor(summary: string, implementation: (...vars: any[]) => void): void;
export function itBehavesLike(summary: string, ...vars: any[]): void;
export function includeExamplesFor(summary: string, ...vars: any[]): void;
