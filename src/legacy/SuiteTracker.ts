import { Metadata, Suite } from './Metadata.ts';

interface SuiteTrackerHooks {
  before(tracker: SuiteTracker, suite: Suite): void;
  after(tracker: SuiteTracker, suite: Suite): void;
}

interface SuiteTrackerConfig {
  rootSuite?: Suite;
  suiteTracker?: SuiteTrackerHooks;
}

interface SuiteTrackerState {
  currentlyDefinedSuite: Suite | undefined;
  contexts: (Suite | undefined)[];
}

export class SuiteTracker {
  state: SuiteTrackerState;
  suiteTracker: SuiteTrackerHooks | undefined;
  suites: Suite[];

  constructor(config: SuiteTrackerConfig = {}) {
    this.state = { currentlyDefinedSuite: config.rootSuite, contexts: [config.rootSuite] };
    this.suiteTracker = config.suiteTracker;
    this.suites = [];
    this.cleanUpCurrentContext = this.cleanUpCurrentContext.bind(this);
    this.cleanUpCurrentAndRestorePrevContext = this.cleanUpCurrentAndRestorePrevContext.bind(this);
  }

  get currentContext(): Suite | undefined {
    return this.state.contexts[this.state.contexts.length - 1];
  }

  get currentlyDefinedSuite(): Suite | undefined {
    return this.state.currentlyDefinedSuite;
  }

  wrapSuite(describe: (...args: any[]) => any) {
    const tracker = this;

    return function detectSuite(title: string, defineTests: (...args: any[]) => void, ...suiteArgs: unknown[]) {
      return describe(title, function defineSuite(this: Suite, ...args: unknown[]) {
        tracker.trackSuite(this, defineTests, args);
      }, ...suiteArgs);
    };
  }

  trackSuite(suite: Suite, defineTests: (...args: any[]) => void, args: unknown[]): void {
    const previousDefinedSuite = this.state.currentlyDefinedSuite;

    this.defineMetaFor(suite);
    this.state.currentlyDefinedSuite = suite;
    this.execute(defineTests, suite, args);
    this.state.currentlyDefinedSuite = previousDefinedSuite;
  }

  defineMetaFor(suite: Suite): void {
    const meta = Metadata.ensureDefinedOn(suite);
    const parentContext = suite.parent || suite.parentSuite;

    if (parentContext) {
      const parentMeta = Metadata.of(parentContext);

      if (parentMeta) {
        parentMeta.addChild(meta);
      }
    }
  }

  execute(defineTests: (...args: any[]) => void, suite: Suite, args: unknown[]): void {
    this.suiteTracker!.before(this, suite);
    defineTests.apply(suite, args);

    if (Metadata.of(suite)) {
      this.suiteTracker!.after(this, suite);
    }
  }

  isRoot(suite: Suite): boolean {
    return !(suite.parent ? suite.parent.parent : suite.parentSuite?.parentSuite);
  }

  registerSuite(context: Suite): void {
    this.state.contexts.push(context);
  }

  cleanUp(context: Suite | undefined): void {
    const metadata = context ? Metadata.of(context) : undefined;

    if (metadata) {
      metadata.releaseVars();
    }
  }

  cleanUpCurrentContext(): void {
    this.cleanUp(this.currentContext);
  }

  cleanUpCurrentAndRestorePrevContext(): void {
    this.cleanUpCurrentContext();
    this.state.contexts.pop();
  }
}
