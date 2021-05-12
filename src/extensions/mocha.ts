import { it as test, describe } from 'mocha';
import { createIts, is, wrapIt } from './bdd';

export const it = wrapIt(test);
export const its = createIts(describe, test);
// export const is =
