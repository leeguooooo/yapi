import * as commonModule from './common.cjs';

const common = commonModule.default || commonModule;

export default common;

export const {
  isJson,
  safeArray,
  json5_parse,
  json_parse,
  deepCopyJson,
  isJson5,
  checkAuth,
  formatTime,
  debounce,
  pickRandomProperty,
  getImgPath,
  trim,
  handlePath,
  handleApiPath,
  nameLengthLimit,
  htmlFilter,
  entries,
  getMockText,
  safeAssign,
  arrayChangeIndex
} = common;
