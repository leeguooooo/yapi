import * as utilsModule from './utils.cjs';

const utils = utilsModule.default || utilsModule;

export default utils;

export const {
  handleJson,
  handleParamsValue,
  simpleJsonPathParse,
  handleMockWord,
  joinPath,
  safeArray,
  isJson5,
  isJson,
  unbase64,
  json_parse,
  json_format,
  ArrayToObject,
  timeago,
  schemaValidator
} = utils;
