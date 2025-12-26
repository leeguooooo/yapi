import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { Button, Input, message, Radio, Form } from 'antd';
import { loginActions, loginLdapActions } from '../../reducer/modules/user';
import { useNavigate } from 'react-router-dom';

import './Login.scss';

const Login = ({ loginActions, loginLdapActions, isLDAP }) => {
  const [loginType, setLoginType] = useState('ldap');
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const handleSubmit = async values => {
    if (!values.email || !values.password) {
      message.error('请输入邮箱和密码');
      return;
    }
    const payload = {
      email: values.email,
      password: values.password
    };
    const useLdap = isLDAP && loginType === 'ldap';
    const res = useLdap ? await loginLdapActions(payload) : await loginActions(payload);
    if (res?.payload?.data?.errcode === 0) {
      navigate('/group', { replace: true });
      message.success('登录成功! ');
    }
  };

  const emailRules =
    loginType === 'ldap'
      ? []
      : [
          {
            required: true,
            message: '请输入正确的email!',
            pattern: /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{1,})+$/
          }
        ];

  return (
    <Form form={form} onFinish={handleSubmit}>
      {isLDAP && (
        <Form.Item className="login-form-item">
          <Radio.Group value={loginType} onChange={e => setLoginType(e.target.value)}>
            <Radio value="ldap">LDAP</Radio>
            <Radio value="normal">普通登录</Radio>
          </Radio.Group>
        </Form.Item>
      )}
      <Form.Item name="email" rules={emailRules} className="login-form-item">
        <Input
          prefix={<UserOutlined className="login-input-icon" />}
          placeholder="Email"
          autoComplete="email"
          name="email"
          className="login-input"
        />
      </Form.Item>
      <Form.Item
        name="password"
        rules={[
          {
            required: true,
            message: '请输入密码!'
          }
        ]}
        className="login-form-item"
      >
        <Input
          prefix={<LockOutlined className="login-input-icon" />}
          type="password"
          placeholder="Password"
          autoComplete="current-password"
          name="password"
          className="login-input"
        />
      </Form.Item>
      <Form.Item className="login-form-item">
        <Button type="primary" htmlType="submit" className="login-form-button">
          登录
        </Button>
      </Form.Item>
    </Form>
  );
};

Login.propTypes = {
  loginActions: PropTypes.func,
  loginLdapActions: PropTypes.func,
  isLDAP: PropTypes.bool
};

export default connect(
  state => ({
    loginData: state.user,
    isLDAP: state.user.isLDAP
  }),
  {
    loginActions,
    loginLdapActions
  }
)(Login);
