const { isJson5, json_parse, handleJson, joinPath, safeArray } = require('./utils');
const constants = require('../client/constants/variable.js');
const _ = require('underscore');
const URL = require('url');
const { utils: powerStringUtils } = require('./power-string.js');
const HTTP_METHOD = constants.HTTP_METHOD;
const axios = require('axios');
const qs = require('qs');
const CryptoJS = require('crypto-js');
const jsrsasign = require('jsrsasign');
const https = require('https');

const isNode = typeof global == 'object' && global.global === global;
const ContentTypeMap = {
  'application/json': 'json',
  'application/xml': 'xml',
  'text/xml': 'xml',
  'application/html': 'html',
  'text/html': 'html',
  other: 'text'
};

const getStorage = async (id)=>{
  try{
    if(isNode){
      let storage = global.storageCreator(id);
      let data = await storage.getItem();
      return {
        getItem: (name)=> data[name],
        setItem: (name, value)=>{
          data[name] = value;
          storage.setItem(name, value)
        }
      }
    }else{
      return {
        getItem: (name)=> window.localStorage.getItem(name),
        setItem: (name, value)=>  window.localStorage.setItem(name, value)
      }
    }
  }catch(e){
    console.error(e)
    return {
      getItem: (name)=>{
        console.error(name, e)
      },
      setItem: (name, value)=>{
        console.error(name, value, e)
      }
    }
  }
}

async function httpRequestByNode(options) {
  function handleRes(response) {
    if (!response || typeof response !== 'object') {
      return {
        res: {
          status: 500,
          body: isNode
            ? '请求出错, 内网服务器自动化测试无法访问到，请检查是否为内网服务器！'
            : '请求出错'
        }
      };
    }
    return {
      res: {
        header: response.headers,
        status: response.status,
        body: response.data
      }
    };
  }

  function handleData() {
    let contentTypeItem;
    if (!options) return;
    if (typeof options.headers === 'object' && options.headers) {
      Object.keys(options.headers).forEach(key => {
        if (/content-type/i.test(key)) {
          if (options.headers[key]) {
            contentTypeItem = options.headers[key]
              .split(';')[0]
              .trim()
              .toLowerCase();
          }
        }
        if (!options.headers[key]) delete options.headers[key];
      });

      if (
        contentTypeItem === 'application/x-www-form-urlencoded' &&
        typeof options.data === 'object' &&
        options.data
      ) {
        options.data = qs.stringify(options.data);
      }
    }
  }

  try {
    handleData(options);
    let response = await axios({
      method: options.method,
      url: options.url,
      headers: options.headers,
      timeout: 10000,
      maxRedirects: 0,
      httpsAgent: new https.Agent({
        rejectUnauthorized: false
      }),
      data: options.data
    });
    return handleRes(response);
  } catch (err) {
    if (err.response === undefined) {
      return handleRes({
        headers: {},
        status: null,
        data: err.message
      });
    }
    return handleRes(err.response);
  }
}

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

function handleCurrDomain(domains, case_env) {
  let currDomain = _.find(domains, item => item.name === case_env);

  if (!currDomain) {
    currDomain = domains[0];
  }
  return currDomain;
}

function sandboxByNode(sandbox = {}, script) {
  const vm = require('vm');
  script = new vm.Script(script);
  const context = new vm.createContext(sandbox);
  script.runInContext(context, {
    timeout: 10000
  });
  return sandbox;
}

async function sandbox(context = {}, script) {
  if (isNode) {
    try {
      context.context = context;
      context.console = console;
      context.Promise = Promise;
      context.setTimeout = setTimeout;
      context = sandboxByNode(context, script);
    } catch (err) {
      err.message = `Script: ${script}
      message: ${err.message}`;
      throw err;
    }
  } else {
    try {
      const AsyncFunction = Object.getPrototypeOf(async function() {}).constructor;
      context = Object.assign(context, {
        context: context,
        console: console,
        Promise: Promise,
        setTimeout: setTimeout,
        CryptoJS: CryptoJS,
        axios: axios,
        jsrsasign: jsrsasign
      });
      const fn = new AsyncFunction('context', script);
      context = await fn.call(context, context);
    } catch (err) {
      err.message = `Script: ${script}
      message: ${err.message}`;
      throw err;
    }
  }
  return context;
}

function formatToJson(data, contentType) {
  if (!data) return null;
  let result;
  switch (contentType) {
    case ContentTypeMap.json:
      result = json_parse(data);
      break;
    case ContentTypeMap.xml:
      break;
    default:
      result = data;
  }
  return result;
}

function paramsToObjectWithEnable(arr, keys = ['name', 'value']) {
  let obj = {};
  if (Array.isArray(arr)) {
    arr.forEach(item => {
      if (item.enable) {
        obj[item[keys[0]]] = item[keys[1]];
      }
    });
  }
  return obj;
}

function formatRequestBody(params, keys = ['name', 'value']) {
  let result = {};
  Object.keys(params).forEach(item => {
    result = Object.assign({}, result, params[item].reduce((acc, cur) => {
      acc[cur[keys[0]]] = cur[keys[1]];
      return acc;
    }, {}));
  });

  return result;
}

function handleParamsValue(params) {
  const arr = params || [];
  return arr
    .filter(item => item && item.name)
    .map(item => ({
      name: item.name,
      value: item.value
    }));
}

function setVariableValue(variable, global) {
  let tempVariable = {};
  if (_.isString(variable)) {
    return variable;
  }
  Object.keys(variable).map(item => {
    if (global[item]) {
      tempVariable[item] = global[item];
    }
  });
  return tempVariable;
}

function handleValue(val, global) {
  if (val === null || typeof val === 'undefined') {
    return val;
  }
  if (_.isNumber(val)) {
    return val;
  }
  if (_.isArray(val)) {
    return val.map(item => handleValue(item, global));
  }
  if (_.isObject(val)) {
    let res = {};
    Object.keys(val).map(key => {
      res[key] = handleValue(val[key], global);
    });
    return res;
  }
  if (!_.isString(val)) {
    return val;
  }
  try {
    return powerStringUtils.compileWithObject(val, setVariableValue(constants, global));
  } catch (err) {
    return val;
  }
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
      // 若 required 没写，则默认 required = 1
      item = Object.assign({ required: '1' }, item);
      item.required = hasRequired ? '1' : '0';

      let value = '';
      if (item.hasOwnProperty('value')) {
        value = handleValue(item.value, global);
      }
      if (item.hasOwnProperty('example')) {
        value = handleValue(item.example, global);
      }
      newParams[item.name] = value;
    });
    return newParams;
  } catch (err) {
    return {};
  }
}

function urlParamParse(val) {
  try {
    let validVal = safeArray(val);
    return validVal.reduce((acc, item) => {
      if (item && item.name) acc[item.name] = item.value;
      return acc;
    }, {});
  } catch (err) {
    return {};
  }
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
  if (isNode) return httpRequestByNode(data);
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

async function handleParamsToRequest(data, basepath, projectBasepath = '', isWiki = false) {
  let interfaceRunData = Object.assign({}, data);
  let currDomain = handleCurrDomain(data.env, data.case_env);

  let path = handleJson(interfaceRunData.path, val => handleValue(val, currDomain.global));

  if (basepath) {
    basepath = handleJson(basepath, val => handleValue(val, currDomain.global));
  }
  if (projectBasepath) {
    projectBasepath = handleJson(projectBasepath, val => handleValue(val, currDomain.global));
  }
  let url = joinPath(currDomain.domain + basepath + projectBasepath, path);
  let requestParams = handleParams(interfaceRunData.req_query, currDomain.global);
  let requestBody;
  let headers = currDomain.header;

  const context = await getStorage(data.interfaceId);
  let willExecSubScript = false;
  try {
    if (interfaceRunData.api_opened === true) {
      interfaceRunData.req_headers = interfaceRunData.req_headers || [];
      if (interfaceRunData.token) {
        headers = [].concat(headers, [
          {
            name: 'token',
            value: interfaceRunData.token,
            enable: true
          }
        ]);
      }
    }
    const runRequestScript = async script => {
      if (!script || !script.trim()) return;

      const oldConsole = console.log;
      let logs = [];
      const newConsole = function(...args) {
        logs.push(args.join(' '));
      };
      try {
        console.log = newConsole;
        willExecSubScript = true;
        await sandbox(
          {
            header: headers,
            query: requestParams,
            body: requestBody,
            context,
            resHeader: {},
            resBody: {},
            resStatus: {},
            pre_script: interfaceRunData.pre_script
          },
          script
        );
      } finally {
        console.log = oldConsole;
        if (logs.length > 0) {
          logs = logs.join('\n');
          console.log(logs);
        }
      }
    };

    if (interfaceRunData.pre_script) {
      await runRequestScript(interfaceRunData.pre_script);
    }

    const pathParams = safeArray(interfaceRunData.req_params).reduce((acc, item) => {
      if (item && item.name) {
        acc[item.name] = handleValue(item.example || item.value, currDomain.global);
      }
      return acc;
    }, {});
    url = handleJson(url, val => handleValue(val, Object.assign(currDomain.global, pathParams)));
    url = URL.parse(url);
    url.query = Object.assign(urlParamParse(interfaceRunData.req_query), url.query);
    url = URL.format(url);

    headers = safeArray(headers).filter(item => item && item.enable);
    headers = handleParams(headers, currDomain.global);

    if (!interfaceRunData.res_body) {
      interfaceRunData.res_body = '';
    }
    const mockDatas = {};
    if (interfaceRunData.req_body_is_json_schema === true) {
      let req_body_other = json_parse(interfaceRunData.req_body_other);
      handleJsonSchema(req_body_other, mockDatas);
    }
    if (interfaceRunData.res_body_is_json_schema === true) {
      let res_body = json_parse(interfaceRunData.res_body);
      handleJsonSchema(res_body, mockDatas);
    }

    let pathVariable = {};
    url = URL.parse(url);
    url.pathname = url.pathname.replace(/\{(.+?)\}/g, (str, match) => {
      if (match in pathParams && !!pathParams[match]) {
        pathVariable[match] = pathParams[match];
        return pathParams[match];
      }
      return str;
    });

    const updatePathVariable = await getStorage(data.interfaceId + '-pathVariable');
    updatePathVariable.setItem('pathVariable', JSON.stringify(pathVariable));

    url = URL.format(url);
    url = handlePath(url);
    interfaceRunData.req_body_type = checkRequestBodyIsRaw(
      interfaceRunData.method,
      interfaceRunData.req_body_type
    );

    let requestOptions = {
      url,
      method: interfaceRunData.method,
      headers: headers,
      data: {}
    };

    if (interfaceRunData.method === 'GET') {
      url = URL.parse(url, true);
      let query = url.query;
      url = URL.format({
        protocol: url.protocol,
        host: url.host,
        pathname: url.pathname
      });
      requestOptions.url = url;
      requestOptions.params = Object.assign(query, requestParams);
    } else {
      requestOptions.params = requestParams;
    }

    if (interfaceRunData.method === 'POST' && interfaceRunData.req_body_other) {
      let reqBody = json_parse(interfaceRunData.req_body_other);
      const context = await getStorage(data.interfaceId + '-mockScript');
      let log = '';

      if (interfaceRunData.mock_script && interfaceRunData.mock_script.enable === true) {
        try {
          await sandbox(
            {
              header: headers,
              query: requestParams,
              body: reqBody,
              context,
              resHeader: {},
              resBody: {},
              resStatus: {},
              mock_script: interfaceRunData.mock_script
            },
            interfaceRunData.mock_script.code
          );
        } catch (e) {
          log = e.message;
          console.error(e);
        }
      }
      context.setItem('mockScriptResponseLog', log);
    }
  } catch (e) {
    console.error('err', e);
  }

  if (HTTP_METHOD[interfaceRunData.method].request_body) {
    if (interfaceRunData.req_body_type === 'form') {
      requestBody = paramsToObjectWithEnable(
        safeArray(interfaceRunData.req_body_form).filter(item => {
          return item.type == 'text';
        })
      );
    } else if (interfaceRunData.req_body_type === 'json') {
      let reqBody = isJson5(interfaceRunData.req_body_other);
      if (reqBody === false) {
        requestBody = interfaceRunData.req_body_other;
      } else {
        if (requestParams) {
          requestParams = Object.assign(requestParams, reqBody);
        }
        requestBody = handleJson(reqBody, val => handleValue(val, currDomain.global));
      }
    } else {
      requestBody = interfaceRunData.req_body_other;
    }
    requestOptions.data = requestBody;
    if (interfaceRunData.req_body_type === 'form') {
      requestOptions.files = paramsToObjectWithEnable(
        safeArray(interfaceRunData.req_body_form).filter(item => {
          return item.type == 'file';
        })
      );
    } else if (interfaceRunData.req_body_type === 'file') {
      requestOptions.file = 'single-file';
    }
  }
  return requestOptions;
}

function handleJsonSchemaMock(mockScript, res_body, res_body_type, res_headers) {
  let mockDatas = {};
  if (res_body_type === 'json') {
    if (mockScript && mockScript.enable === true) {
      try {
        res_body = sandboxByNode(
          {
            header: res_headers,
            body: json_parse(res_body)
          },
          mockScript.code
        );
      } catch (err) {
        console.error(err);
      }
    }
    res_body = json_parse(res_body);
    handleJsonSchema(res_body, mockDatas);
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
  const url = URL.parse(route);
  url.query = Object.assign(url.query, data);
  window.open(URL.format(url));
}

module.exports = {
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
};
module.exports.default = module.exports;
