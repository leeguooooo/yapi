import React, { PureComponent as Component } from 'react';
import Login from './LoginWrap';
import LogoSVG from '../../components/LogoSVG/index.js';

class LoginContainer extends Component {
  render() {
    return (
      <div className="g-body login-body">
        <div className="login-container">
          <div className="login-left">
            <div className="login-left-content">
              <div className="login-logo-block">
                <div className="logo-icon">
                  <LogoSVG length="48px" />
                </div>
                <span className="logo-text">YApi</span>
              </div>
              <div className="login-welcome-text">
                <h2>YApi 2.0</h2>
                <p>高效、易用、功能强大的可视化接口管理平台</p>
                <p className="sub-text">Efficient, Easy-to-Use, Visual Interface Management Platform</p>
              </div>
            </div>
            <div className="login-bg-decoration">
              <div className="shape shape-1"></div>
              <div className="shape shape-2"></div>
            </div>
          </div>
          <div className="login-right">
            <div className="login-form-container">
              <Login />
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default LoginContainer;