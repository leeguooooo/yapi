import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { UserOutlined, MailOutlined, LockOutlined } from '@ant-design/icons';
import { Button, Input, message, Form } from 'antd';
import { regActions } from 'client/reducer/modules/user';
import { useNavigate } from 'react-router-dom';

const Reg = ({ regActions }) => {
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const handleSubmit = async values => {
    const payload = {
      username: values.username.trim(),
      userName: values.username.trim(),
      email: values.email.trim(),
      password: values.password,
      confirm: values.confirm
    };
    const res = await regActions(payload);
    const data = res?.data || res?.value?.data || res?.payload?.data || res;
    if (data?.errcode === 0) {
      message.success('注册成功! ');
      navigate('/group', { replace: true });
    } else {
      message.error(data?.errmsg || '注册失败');
    }
  };

  return (
    <Form form={form} onFinish={handleSubmit}>
      <Form.Item
        name="username"
        rules={[
          {
            required: true,
            message: '请输入用户名!'
          }
        ]}
      >
        <Input
          prefix={<UserOutlined />}
          placeholder="Username"
          autoComplete="username"
          name="username"
        />
      </Form.Item>

      <Form.Item
        name="email"
        rules={[
          {
            required: true,
            message: '请输入email!',
            pattern: /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{1,})+$/
          }
        ]}
      >
        <Input prefix={<MailOutlined />} placeholder="Email" autoComplete="email" name="email" />
      </Form.Item>

      <Form.Item
        name="password"
        rules={[
          {
            required: true,
            message: '请输入密码!'
          }
        ]}
        hasFeedback
      >
        <Input
          prefix={<LockOutlined />}
          type="password"
          placeholder="Password"
          autoComplete="new-password"
          name="password"
        />
      </Form.Item>

      <Form.Item
        name="confirm"
        dependencies={['password']}
        hasFeedback
        rules={[
          {
            required: true,
            message: '请再次输入密码!'
          },
          ({ getFieldValue }) => ({
            validator(_, value) {
              if (!value || getFieldValue('password') === value) {
                return Promise.resolve();
              }
              return Promise.reject(new Error('两次输入的密码不一致'));
            }
          })
        ]}
      >
        <Input
          prefix={<LockOutlined />}
          type="password"
          placeholder="Confirm Password"
          autoComplete="new-password"
          name="confirm"
        />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" className="login-form-button">
          注册
        </Button>
      </Form.Item>
    </Form>
  );
};

Reg.propTypes = {
  regActions: PropTypes.func,
};

export default connect(
  state => ({
    loginData: state.user
  }),
  { regActions }
)(Reg);
