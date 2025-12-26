import React, { PureComponent as Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { Home, Group, Project, Follows, AddProject, Login } from './containers/index';
import { Alert } from 'antd';
import User from './containers/User/User.js';
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import Loading from './components/Loading/Loading';
import { checkLoginState } from './reducer/modules/user';
import { requireAuthentication } from './components/AuthenticatedComponent';
import Notify from './components/Notify/Notify';

import plugin from 'client/plugin.js';

const LOADING_STATUS = 0;

const alertContent = () => {
  const ua = window.navigator.userAgent,
    isChrome = ua.indexOf('Chrome') && window.chrome;
  if (!isChrome) {
    return (
      <Alert
        style={{ zIndex: 99 }}
        message={'YApi 的接口测试等功能仅支持 Chrome 浏览器，请使用 Chrome 浏览器获得完整功能。'}
        banner
        closable
      />
    );
  }
};

let AppRoute = {
  home: {
    path: '/',
    component: Home
  },
  group: {
    path: '/group/:groupId?/*',
    component: Group
  },
  project: {
    path: '/project/:id/*',
    component: Project
  },
  user: {
    path: '/user/*',
    component: User
  },
  follow: {
    path: '/follow',
    component: Follows
  },
  addProject: {
    path: '/add-project',
    component: AddProject
  },
  login: {
    path: '/login',
    component: Login
  }
};
// 增加路由钩子
plugin.emitHook('app_route', AppRoute);

@connect(
  state => {
    return {
      loginState: state.user.loginState,
      curUserRole: state.user.role
    };
  },
  {
    checkLoginState
  }
)
export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      login: LOADING_STATUS
    };
  }

  static propTypes = {
    checkLoginState: PropTypes.func,
    loginState: PropTypes.number,
    curUserRole: PropTypes.string
  };

  componentDidMount() {
    this.props.checkLoginState();
  }

  route = status => {
    let r;
    if (status === LOADING_STATUS) {
      return <Loading visible />;
    } else {
      r = (
        <Router>
          <div className="g-main">
            <div className="router-main">
              {this.props.curUserRole === 'admin' && <Notify />}
              {alertContent()}
              {this.props.loginState !== 1 ? <Header /> : null}
              <div className="router-container">
                <Routes>
                  {Object.keys(AppRoute).map(key => {
                    const item = AppRoute[key];
                    const RouteComponent = item.component;
                    if (key === 'login' || key === 'home') {
                      return (
                        <Route key={key} path={item.path} element={<RouteComponent />} />
                      );
                    }
                    const AuthedComponent = requireAuthentication(RouteComponent);
                    return (
                      <Route key={key} path={item.path} element={<AuthedComponent />} />
                    );
                  })}
                </Routes>
              </div>
            </div>
            <Footer />
          </div>
        </Router>
      );
    }
    return r;
  };

  render() {
    return this.route(this.props.loginState);
  }
}
