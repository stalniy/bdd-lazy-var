declare module './interface' {
  interface GetLazyVar {
    (name: string): any;
    [name: string]: any;
  }
}

export * from './index'
