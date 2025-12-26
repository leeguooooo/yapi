import moment from 'moment';
import constants from './constants/variable.js';
import Mock from 'mockjs';
import json5 from 'json5';
import MockExtra from 'common/mock-extra.js';

const Roles = {
  0: 'admin',
  10: 'owner',
  20: 'dev',
  30: 'guest',
  40: 'member'
};

const roleAction = {
  manageUserlist: 'admin',
  changeMemberRole: 'owner',
  editInterface: 'dev',
  viewPrivateInterface: 'guest',
  viewGroup: 'guest'
};

function isJson(json) {
  if (!json) return false;
  try {
    return JSON.parse(json);
  } catch (e) {
    return false;
  }
}

function isJson5(json) {
  if (!json) return false;
  try {
    return json5.parse(json);
  } catch (e) {
    return false;
  }
}

const safeArray = arr => (Array.isArray(arr) ? arr : []);

const json5_parse = json => {
  try {
    return json5.parse(json);
  } catch (err) {
    return json;
  }
};

const json_parse = json => {
  try {
    return JSON.parse(json);
  } catch (err) {
    return json;
  }
};

const deepCopyJson = json => JSON.parse(JSON.stringify(json));

const checkAuth = (action, role) => Roles[roleAction[action]] <= Roles[role];

const formatTime = timestamp => moment.unix(timestamp).format('YYYY-MM-DD HH:mm:ss');

const debounce = (func, wait) => {
  let timeout;
  return function debounced() {
    clearTimeout(timeout);
    timeout = setTimeout(func, wait);
  };
};

const pickRandomProperty = obj => {
  let result;
  let count = 0;
  for (let prop in obj) {
    if (Math.random() < 1 / ++count) {
      result = prop;
    }
  }
  return result;
};

const getImgPath = (path, type) => {
  const rate = window.devicePixelRatio >= 2 ? 2 : 1;
  return `${path}@${rate}x.${type}`;
};

function trim(str) {
  if (!str) return str;
  return String(str).replace(/(^\s*)|(\s*$)/g, '');
}

const handlePath = path => {
  path = trim(path);
  if (!path) return path;
  if (path === '/') return '';
  path = path[0] !== '/' ? '/' + path : path;
  path = path[path.length - 1] === '/' ? path.substr(0, path.length - 1) : path;
  return path;
};

const handleApiPath = path => {
  if (!path) return '';
  path = trim(path);
  return path[0] !== '/' ? '/' + path : path;
};

// 去重 basepath 与接口 path，确保只保留一次前缀
const normalizeInterfacePath = (basepath = '', path = '') => {
  const base = handlePath(basepath);
  let normalizedPath = handleApiPath(path);
  if (!base) return normalizedPath;
  // 反复剥离重复的 base 前缀，避免 /base/base/foo 情况
  while (normalizedPath.startsWith(base + '/')) {
    normalizedPath = normalizedPath.slice(base.length);
  }
  if (normalizedPath === base) {
    normalizedPath = '/';
  }
  return handleApiPath(normalizedPath);
};

// 安全拼接 basepath 与接口 path，避免重复前缀
const joinBasePath = (basepath = '', path = '') => {
  const base = handlePath(basepath);
  const normalizedPath = handleApiPath(path);
  if (!base) return normalizedPath;
  if (normalizedPath === base || normalizedPath.startsWith(base + '/')) {
    return normalizedPath;
  }
  if (normalizedPath === '/') {
    return base;
  }
  return base + normalizedPath;
};

// 名称限制 constants.NAME_LIMIT 字符
const nameLengthLimit = type => {
  const strLength = str => {
    let length = 0;
    for (let i = 0; i < str.length; i++) {
      str.charCodeAt(i) > 255 ? (length += 2) : length++;
    }
    return length;
  };
  return [
    {
      required: true,
      validator(rule, value, callback) {
        const len = value ? strLength(value) : 0;
        if (len > constants.NAME_LIMIT || len === 0) {
          callback(`请输入${type}名称，长度不超过${constants.NAME_LIMIT}字符(中文算作2字符)!`);
        } else {
          return callback();
        }
      }
    }
  ];
};

const htmlFilter = html => {
  const reg = /<\/?.+?\/?>/g;
  return html.replace(reg, '') || '新项目';
};

const entries = obj => Object.keys(obj).map(key => [key, obj[key]]);

const getMockText = mockTpl => {
  try {
    return JSON.stringify(Mock.mock(MockExtra(json5.parse(mockTpl), {})), null, '  ');
  } catch (err) {
    return '';
  }
};

const safeAssign = (Obj, nextObj) => {
  const keys = Object.keys(nextObj);
  return Object.keys(Obj).reduce((result, value) => {
    result[value] = keys.indexOf(value) >= 0 ? nextObj[value] : Obj[value];
    return result;
  }, {});
};

const arrayChangeIndex = (arr, start, end) => {
  const newArr = [].concat(arr);
  const startItem = newArr[start];
  newArr.splice(start, 1);
  newArr.splice(end, 0, startItem);
  return newArr.map((item, index) => ({ id: item._id, index }));
};

const common = {
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
  normalizeInterfacePath,
  joinBasePath,
  nameLengthLimit,
  htmlFilter,
  entries,
  getMockText,
  safeAssign,
  arrayChangeIndex
};

export default common;
export {
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
  normalizeInterfacePath,
  joinBasePath,
  nameLengthLimit,
  htmlFilter,
  entries,
  getMockText,
  safeAssign,
  arrayChangeIndex
};
