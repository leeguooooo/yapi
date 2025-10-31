import './styles/common.scss';
import './styles/theme.less';
import { LocaleProvider } from 'antd';
import './plugin';
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './Application';
import { Provider } from 'react-redux';
import createStore from './reducer/create';

// 由于 antd 组件的默认文案是英文，所以需要修改为中文
import zhCN from 'antd/lib/locale-provider/zh_CN';

// 临时抑制 Antd 3.x 和 React Router 的兼容性警告
// 这是因为这些库使用的是 legacy API，升级会带来破坏性变更
const originalError = console.error;
const originalWarn = console.warn;
const originalLog = console.log;

// 过滤函数，检查是否是需要抑制的警告
const shouldSuppressMessage = (message) => {
  if (typeof message !== 'string') return false;
  
  const suppressedMessages = [
    'childContextTypes API',
    'contextTypes API',
    'ReactDOM.render is no longer supported',
    'Invalid prop `component`',
    'Failed prop type',
    'Route`, expected `function`',
    'legacy contextTypes API',
    'Use React.createContext()',
    'findDOMNode is deprecated',
    'findDOMNode will be removed',
    'unmountComponentAtNode is deprecated',
    'Switch to the createRoot API'
  ];
  
  return suppressedMessages.some(msg => message.includes(msg));
};

// 重写所有 console 方法以确保捕获所有 PropTypes 警告
console.error = (...args) => {
  if (args.some(arg => shouldSuppressMessage(String(arg)))) {
    return;
  }
  originalError.apply(console, args);
};

console.warn = (...args) => {
  if (args.some(arg => shouldSuppressMessage(String(arg)))) {
    return;
  }
  originalWarn.apply(console, args);
};

console.log = (...args) => {
  if (args.some(arg => shouldSuppressMessage(String(arg)))) {
    return;
  }
  originalLog.apply(console, args);
};

// 额外处理 PropTypes 警告（在某些情况下可能直接调用）
if (typeof window !== 'undefined' && window.console) {
  const methods = ['error', 'warn', 'log'];
  methods.forEach(method => {
    const original = window.console[method];
    window.console[method] = (...args) => {
      if (args.some(arg => shouldSuppressMessage(String(arg)))) {
        return;
      }
      original.apply(window.console, args);
    };
  });
}

const store = createStore();
const container = document.getElementById('yapi');
const root = createRoot(container);

root.render(
  <Provider store={store}>
    <LocaleProvider locale={zhCN}>
      <App />
    </LocaleProvider>
  </Provider>
);
