import React, { PureComponent as Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { withRouter, Redirect } from 'react-router-dom';
import axios from 'axios';
import Login from './LoginWrap';
import { Row, Col, Card } from 'antd';
import LogoSVG from '../../components/LogoSVG/index.js';

@connect(state => ({
  isLogin: state.user.isLogin
}))
class LoginContainer extends Component {
  static propTypes = {
    isLogin: PropTypes.bool,
    history: PropTypes.object
  };

  state = {
    shouldRedirect: false
  };

  componentDidMount() {
    if (this.props.isLogin) {
      this.props.history.replace('/group');
      this.setState({ shouldRedirect: true });
      return;
    }
    // Fallback: confirm session from server to avoid showing login when cookie已登录
    axios.get('/api/user/status').then(res => {
      if (res?.data?.errcode === 0) {
        this.props.history.replace('/group');
        this.setState({ shouldRedirect: true });
      }
    });
  }

  componentDidUpdate(prevProps) {
    if (!prevProps.isLogin && this.props.isLogin) {
      this.props.history.replace('/group');
      this.setState({ shouldRedirect: true });
    }
  }

  render() {
    if (this.props.isLogin || this.state.shouldRedirect) {
      return <Redirect to="/group" />;
    }
    return (
      <div className="g-body login-body">
        <div className="m-bg">
          <div className="m-bg-mask m-bg-mask0" />
          <div className="m-bg-mask m-bg-mask1" />
          <div className="m-bg-mask m-bg-mask2" />
          <div className="m-bg-mask m-bg-mask3" />
        </div>
        <div className="main-one login-container">
          <div className="container">
            <Row justify="center" className="login-row">
              <Col xs={20} sm={16} md={12} lg={8} className="container-login">
                <Card className="card-login" variant="borderless">
                  <h2 className="login-title">YAPI</h2>
                  <div className="login-logo">
                    <LogoSVG length="100px" />
                  </div>
                  <Login />
                </Card>
              </Col>
            </Row>
          </div>
        </div>
      </div>
    );
  }
}

export default withRouter(LoginContainer);
