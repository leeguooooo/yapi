import React, { PureComponent as Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Form } from 'client/components/LegacyForm';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { Button, Input, message, Radio } from 'antd';
import { loginActions, loginLdapActions } from '../../reducer/modules/user';
import { withRouter } from 'react-router-dom';
const FormItem = Form.Item;
const RadioGroup = Radio.Group;

import './Login.scss';

@connect(
  state => {
    return {
      loginData: state.user,
      isLDAP: state.user.isLDAP
    };
  },
  {
    loginActions,
    loginLdapActions
  }
)
@withRouter
class Login extends Component {
  constructor(props) {
    super(props);
    this.state = {
      loginType: 'ldap'
    };
  }

  static propTypes = {
    form: PropTypes.object,
    history: PropTypes.object,
    loginActions: PropTypes.func,
    loginLdapActions: PropTypes.func,
    isLDAP: PropTypes.bool
  };

  handleSubmit = e => {
    if (e && e.preventDefault) e.preventDefault();
    const form = this.props.form;
    const values = form.getFieldsValue();
    if (!values.email || !values.password) {
      message.error('请输入邮箱和密码');
      return;
    }
    if (this.props.isLDAP && this.state.loginType === 'ldap') {
      this.props.loginLdapActions(values).then(res => {
        if (res.payload.data.errcode == 0) {
          this.props.history.replace('/group');
          message.success('登录成功! ');
        }
      });
    } else {
      this.props.loginActions(values).then(res => {
        if (res.payload.data.errcode == 0) {
          this.props.history.replace('/group');
          message.success('登录成功! ');
        }
      });
    }
  };

  componentDidMount() {
    //Qsso.attach('qsso-login','/api/user/login_by_token')
    console.log('isLDAP', this.props.isLDAP);
  }
  handleFormLayoutChange = e => {
    this.setState({ loginType: e.target.value });
  };

  render() {
    const { getFieldDecorator } = this.props.form;

    const { isLDAP } = this.props;

    const emailRule =
      this.state.loginType === 'ldap'
        ? {}
        : {
            required: true,
            message: '请输入正确的email!',
            pattern: /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{1,})+$/
          };
    return (
      <Form onSubmit={this.handleSubmit}>
        {/* 登录类型 (普通登录／LDAP登录) */}
        {isLDAP && (
          <FormItem>
            <RadioGroup defaultValue="ldap" onChange={this.handleFormLayoutChange}>
              <Radio value="ldap">LDAP</Radio>
              <Radio value="normal">普通登录</Radio>
            </RadioGroup>
          </FormItem>
        )}
        {/* 用户名 (Email) */}
        <FormItem>
          {getFieldDecorator('email', { rules: [emailRule] })(
            <Input
              prefix={<UserOutlined />}
              placeholder="Email"
              className="modern-input"
            />
          )}
        </FormItem>

        {/* 密码 */}
        <FormItem>
          {getFieldDecorator('password', {
            rules: [{ required: true, message: '请输入密码!' }]
          })(
            <Input
              prefix={<LockOutlined />}
              type="password"
              placeholder="Password"
              className="modern-input"
            />
          )}
        </FormItem>

        {/* 登录按钮 */}
        <FormItem>
          <Button
            type="primary"
            htmlType="submit"
            className="login-form-button"
          >
            登录
          </Button>
        </FormItem>

        {/* <div className="qsso-breakline">
          <span className="qsso-breakword">或</span>
        </div>
        <Button id="qsso-login" type="primary" className="login-form-button" size="large" ghost>QSSO登录</Button> */}
      </Form>
    );
  }
}
const LoginForm = Form.create()(Login);
export default LoginForm;
