import React, { PureComponent as Component } from 'react';
import Login from './LoginWrap';
import LogoSVG from '../../components/LogoSVG/index.js';

class LoginContainer extends Component {
  render() {
    return (
      <div className="g-body login-body">
        <div className="aurora-bg">
          <div className="aurora-blob blob-1"></div>
          <div className="aurora-blob blob-2"></div>
          <div className="aurora-blob blob-3"></div>
        </div>

        <div className="login-content">
            <div className="brand-container">
                <div className="logo-box">
                    <LogoSVG length="80px" />
                </div>
                <h1 className="site-title">YApi <span className="version-tag">2.0</span></h1>
                <p className="site-desc">Next Generation API Management</p>
            </div>
            
            <div className="login-panel">
                <Login />
            </div>
        </div>
      </div>
    );
  }
}

export default LoginContainer;
