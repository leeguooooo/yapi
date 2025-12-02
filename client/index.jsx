// Capture early errors for debugging CJS/ESM migration.
if (typeof window !== 'undefined' && !window.__caughtErrors) {
  window.__caughtErrors = [];
  window.addEventListener('error', e => {
    window.__caughtErrors.push({
      message: e.message,
      filename: e.filename,
      lineno: e.lineno,
      colno: e.colno,
      stack: e.error && e.error.stack
    });
  });
}

// Polyfill global/setImmediate for CJS dependencies running in the browser.
if (typeof global === 'undefined') {
  // eslint-disable-next-line no-undef
  window.global = window;
}
if (typeof window.setImmediate === 'undefined') {
  window.setImmediate = (fn, ...args) => window.setTimeout(fn, 0, ...args);
}

import './styles/common.scss';
import './styles/theme.less';
import './plugin';
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './Application';
import { Provider } from 'react-redux';
import createStore from './reducer/create';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/es/locale/zh_CN';

const store = createStore();
const container = document.getElementById('yapi');
const root = createRoot(container);

root.render(
  <Provider store={store}>
    <ConfigProvider locale={zhCN}>
      <App />
    </ConfigProvider>
  </Provider>
);
