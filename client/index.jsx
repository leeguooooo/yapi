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
