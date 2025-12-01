// ESM bridge for the CJS implementation
import * as implModule from './diff-view.cjs';

const impl = implModule.default || implModule;

export default impl;
export const showDiffMsg = impl.showDiffMsg || impl;
