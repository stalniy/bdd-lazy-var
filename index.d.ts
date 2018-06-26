import * as lv from './interface'
export * from './interface'

declare global {
  const get: typeof lv.get;
  const def: typeof lv.def;
  const sharedExamplesFor: typeof lv.sharedExamplesFor;
  const itBehavesLike: typeof lv.itBehavesLike;
  const includeExamplesFor: typeof lv.includeExamplesFor;
}
