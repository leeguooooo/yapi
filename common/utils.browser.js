import Mock from 'mockjs';
import * as powerString from './power-string.browser.js';
import json5 from 'json5';
import Ajv from 'ajv';
import localize from 'ajv-i18n';

function simpleJsonPathParse(key, json) {
  if (!key || typeof key !== 'string' || key.indexOf('$.') !== 0 || key.length <= 2) {
    return null;
  }
  let keys = key.substr(2).split('.');
  keys = keys.filter(item => item);
  for (let i = 0, l = keys.length; i < l; i++) {
    try {
      let m = keys[i].match(/(.*?)\[([0-9]+)\]/);
      if (m) {
        json = json[m[1]][m[2]];
      } else {
        json = json[keys[i]];
      }
    } catch (e) {
      json = '';
      break;
    }
  }

  return json;
}

function handleGlobalWord(word, json) {
  if (typeof word === 'string') {
    return simpleJsonPathParse(word, json);
  } else {
    return word;
  }
}

export function handleMockWord(word) {
  if (word && typeof word === 'object' && word.mock) {
    word.mock = handleJson(word.mock, handleGlobalWord);
    return word.mock;
  }
  if (typeof word === 'string' && word.indexOf('@') === 0) {
  return Mock.mock(word);
  } else {
    return word;
  }
}

export function handleJson(data, handleValueFn) {
  try {
    data = handleValueFn(data);
    data = JSON.stringify(data);
    data = JSON.parse(data);
    data = JSON.stringify(data, handleValueWithFilter({ handleValueFn }));
    return JSON.parse(data);
  } catch (err) {
    return data;
  }
}

function handleValueWithFilter(context) {
  return function(key, value) {
    if (typeof value === 'string') {
      try {
        value = powerString.filter(value, (match, idx) => handleFilter(value, match, context));
      } catch (err) {
        return value;
      }
    }
    if (typeof context.handleValueFn === 'function') {
      value = context.handleValueFn(value, context.json);
    }
    return value;
  };
}

function handleFilter(str, match, context) {
  switch (match.type) {
    case 'Function':
      if (typeof context.handleValueFn === 'function') {
        return context.handleValueFn(match.match, context.json);
      }
      return match.match;
    case 'Mock':
      return stringUtils.handleMock(match.match);
    default:
      return str;
  }
}

export function handleParamsValue(val, context = {}) {
  if (val === null || typeof val === 'undefined') {
    return val;
  }
  if (typeof val === 'string') {
    return powerString.filter(val, match => handleFilter(val, match, context));
  }
  if (typeof val === 'object') {
    return handleJson(val, context.handleValueFn);
  }
  return val;
}

export function safeArray(arr) {
  return Array.isArray(arr) ? arr : [];
}

export function isJson5(json) {
  if (!json) return false;
  try {
    json = json5.parse(json);
    return json;
  } catch (e) {
    return false;
  }
}

export function isJson(json) {
  if (!json) return false;
  try {
    json = JSON.parse(json);
    return json;
  } catch (e) {
    return false;
  }
}

export function unbase64(base64Str) {
  try {
    return stringUtils.unbase64(base64Str);
  } catch (err) {
    return base64Str;
  }
}

export function json_parse(json) {
  try {
    return JSON.parse(json);
  } catch (err) {
    return json;
  }
}

export function json_format(json) {
  try {
    return JSON.stringify(JSON.parse(json), null, '   ');
  } catch (e) {
    return json;
  }
}

export function ArrayToObject(arr) {
  let obj = {};
  safeArray(arr).forEach(item => {
    obj[item.name] = item.value;
  });
  return obj;
}

export function timeago(timestamp) {
  let minutes, hours, days, seconds, mouth, year;
  const timeNow = parseInt(new Date().getTime() / 1000);
  seconds = timeNow - timestamp;
  if (seconds > 86400 * 30 * 12) {
    year = parseInt(seconds / (86400 * 30 * 12));
  } else {
    year = 0;
  }
  if (seconds > 86400 * 30) {
    mouth = parseInt(seconds / (86400 * 30));
  } else {
    mouth = 0;
  }
  if (seconds > 86400) {
    days = parseInt(seconds / 86400);
  } else {
    days = 0;
  }
  if (seconds > 3600) {
    hours = parseInt(seconds / 3600);
  } else {
    hours = 0;
  }
  minutes = parseInt(seconds / 60);
  if (year > 0) {
    return year + '年前';
  } else if (mouth > 0 && year <= 0) {
    return mouth + '月前';
  } else if (days > 0 && mouth <= 0) {
    return days + '天前';
  } else if (days <= 0 && hours > 0) {
    return hours + '小时前';
  } else if (hours <= 0 && minutes > 0) {
    return minutes + '分钟前';
  } else if (minutes <= 0 && seconds > 0) {
    if (seconds < 30) {
      return '刚刚';
    } else {
      return seconds + '秒前';
    }
  } else {
    return '刚刚';
  }
}

export function schemaValidator(schema, params) {
  try {
    const ajv = new Ajv({
      format: false,
      allErrors: true
    });

    schema = schema || {
      type: 'object',
      title: 'empty object',
      properties: {}
    };
    const validate = ajv.compile(schema);
    let valid = validate(params);

    let message = '';
    if (!valid) {
      localize.zh(validate.errors);
      message += ajv.errorsText(validate.errors, { separator: '\n' });
    }

    return {
      valid: valid,
      message: message
    };
  } catch (e) {
    return {
      valid: false,
      message: e.message
    };
  }
}

export function handlePath(url) {
  try {
    const parsed = new URL(url, window.location.origin);
    return parsed.href;
  } catch (e) {
    return url;
  }
}

export default {
  handleJson,
  handleParamsValue,
  simpleJsonPathParse,
  handleMockWord,
  joinPath: powerString.utils.joinPath,
  safeArray,
  isJson5,
  isJson,
  unbase64,
  json_parse,
  json_format,
  ArrayToObject,
  timeago,
  depth: powerString.utils.depth,
  schemaValidator,
  handlePath
};
