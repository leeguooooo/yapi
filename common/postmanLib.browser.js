import axios from 'axios';
import qs from 'qs';
import CryptoJS from 'crypto-js';
import jsrsasign from 'jsrsasign';
import { handleParamsValue, json_parse, safeArray } from './utils.browser.js';
import constants from '../client/constants/variable.js';

const isNode = false;
const ContentTypeMap = {
  'application/json': 'json',
  'application/xml': 'xml',
  'text/xml': 'xml',
  'application/html': 'html',
  'text/html': 'html',
  other: 'text'
};

const HTTP_METHOD = constants.HTTP_METHOD;

function handleContentType(headers) {
  if (!headers || typeof headers !== 'object') return ContentTypeMap.other;
  let contentTypeItem = 'other';
  try {
    Object.keys(headers).forEach(key => {
      if (/content-type/i.test(key)) {
        contentTypeItem = headers[key]
          .split(';')[0]
          .trim()
          .toLowerCase();
      }
    });
    return ContentTypeMap[contentTypeItem] ? ContentTypeMap[contentTypeItem] : ContentTypeMap.other;
  } catch (err) {
    return ContentTypeMap.other;
  }
}

function checkRequestBodyIsRaw(method, reqBodyType) {
  if (
    reqBodyType &&
    reqBodyType !== 'file' &&
    reqBodyType !== 'form' &&
    HTTP_METHOD[method].request_body
  ) {
    return reqBodyType;
  }
  return false;
}

function checkNameIsExistInArray(name, arr) {
  let isRepeat = false;
  for (let i = 0; i < arr.length; i++) {
    let item = arr[i];
    if (item.name === name) {
      isRepeat = true;
      break;
    }
  }
  return isRepeat;
}

function handleParams(params, global) {
  let newParams = {};
  try {
    params = safeArray(params);
    params.forEach(item => {
      if (!item || typeof item !== 'object') return;
      let hasRequired = false;
      Object.keys(item).forEach(key => {
        if (key === 'required' && item[key] === '1') {
          hasRequired = true;
        }
      });
      item = Object.assign({ required: '1' }, item);
      item.required = hasRequired ? '1' : '0';

      let value = '';
      if (item.hasOwnProperty('value')) {
        value = handleParamsValue(item.value, global);
      }
      if (item.hasOwnProperty('example')) {
        value = handleParamsValue(item.example, global);
      }
      newParams[item.name] = value;
    });
    return newParams;
  } catch (err) {
    return {};
  }
}

function handleCurrDomain(domains, case_env) {
  let currDomain = domains.find(item => item.name === case_env);

  if (!currDomain) {
    currDomain = domains[0];
  }
  return currDomain;
}

function checkNameIsRepeat(name, arr) {
  let hasExists = false;
  safeArray(arr).forEach(item => {
    if (item && item.name === name) {
      hasExists = true;
    }
  });
  return hasExists;
}

function crossRequest(data) {
  if (isNode) return;
  if (window.crossRequest) {
    return window.crossRequest.send(data);
  }
}

function handleJsonSchema(schema, mockDatas) {
  if (schema.properties && typeof schema.properties === 'object') {
    Object.keys(schema.properties).forEach(item => {
      if (schema.properties[item] && schema.properties[item].mock) {
        let mockData = schema.properties[item].mock;
        mockDatas[mockData.mock] = mockData.value;
      }
      if (
        schema.properties[item] &&
        schema.properties[item].type === 'object' &&
        schema.properties[item].properties
      ) {
        handleJsonSchema(schema.properties[item], mockDatas);
      }
      if (
        schema.properties[item] &&
        schema.properties[item].type === 'array' &&
        schema.properties[item].items
      ) {
        handleJsonSchema(schema.properties[item].items, mockDatas);
      }
    });
  }
  return mockDatas;
}

function formatToString(data, contentType) {
  let result = data;
  if (data && typeof data === 'object') {
    result = json_parse(data);
    if (contentType === 'json') {
      result = JSON.stringify(result, null, 2);
    }
  }
  return result;
}

function handleDownload(route, data = {}, isWiki) {
  data = Object.assign({}, data, { isWiki: isWiki || false });
  const url = new URL(route, window.location.origin);
  Object.entries(data).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });
  window.open(url.toString());
}

function httpRequestByNode() {
  // browser stub
  return Promise.reject(new Error('httpRequestByNode is not available in browser'));
}

export default {
  checkRequestBodyIsRaw,
  handleParams,
  handleContentType,
  crossRequest,
  handleCurrDomain,
  checkNameIsExistInArray,
  checkNameIsRepeat,
  formatToString,
  handleJsonSchema,
  httpRequestByNode
};
export {
  checkRequestBodyIsRaw,
  handleParams,
  handleContentType,
  crossRequest,
  handleCurrDomain,
  checkNameIsExistInArray,
  checkNameIsRepeat,
  formatToString,
  handleJsonSchema,
  httpRequestByNode
};
