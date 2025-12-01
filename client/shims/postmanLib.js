import * as postmanLib from '../../common/postmanLib.js';

// CJS interop: prefer .default but fall back to namespace.
const lib = postmanLib.default || postmanLib;

export default lib;
export const {
  checkRequestBodyIsRaw,
  handleParams,
  handleContentType,
  crossRequest,
  handleCurrDomain,
  checkNameIsExistInArray,
  urlParamParse,
  checkNameIsRepeat,
  setVariableValue,
  handleValue,
  formatToJson,
  handleJsonSchemaMock,
  formatToString,
  paramsToObjectWithEnable,
  formatRequestBody,
  handleParamsToRequest,
  handleDownload,
  httpRequestByNode
} = lib;
