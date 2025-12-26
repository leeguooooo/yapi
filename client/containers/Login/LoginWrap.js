import React, { PureComponent as Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Tabs } from 'antd';
import LoginForm from './Login';
import RegForm from './Reg';
import { loginTypeAction } from '../../reducer/modules/user';
import './Login.scss';

@connect(state => ({
  loginWrapActiveKey: state.user.loginWrapActiveKey,
  canRegister: state.user.canRegister
}), { loginTypeAction })
export default class LoginWrap extends Component {
  constructor(props) {
    super(props);
    this.state = {
      activeKey: props.loginWrapActiveKey || '1'
    };
  }

  static propTypes = {
    form: PropTypes.object,
    loginWrapActiveKey: PropTypes.string,
    canRegister: PropTypes.bool,
    loginTypeAction: PropTypes.func
  };

  componentDidUpdate(prevProps) {
    if (prevProps.loginWrapActiveKey !== this.props.loginWrapActiveKey) {
      this.setState({ activeKey: this.props.loginWrapActiveKey || '1' });
    }
  }

  handleTabChange = key => {
    this.setState({ activeKey: key });
    if (this.props.loginTypeAction) {
      this.props.loginTypeAction(key);
    }
  };

  render() {
    const { canRegister } = this.props;
    const activeKey = this.state.activeKey || '1';
    {/** show only login when register is disabled */}
    const items = [
      { key: '1', label: '登录', children: <LoginForm /> },
      {
        key: '2',
        label: '注册',
        children: canRegister ? (
          <RegForm />
        ) : (
          <div style={{ minHeight: 200 }}>管理员已禁止注册，请联系管理员</div>
        )
      }
    ];
    return (
      <Tabs
        activeKey={activeKey}
        onChange={this.handleTabChange}
        className="login-form"
        tabBarStyle={{ border: 'none' }}
        destroyInactiveTabPane
        items={items}
      />
    );
  }
}
