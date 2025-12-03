import React, { PureComponent as Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Form } from 'client/components/LegacyForm';
import { Icon } from '@ant-design/compatible';
import { Button, Input, message } from 'antd';
import axios from 'axios';
import { withRouter } from 'react-router-dom';
const FormItem = Form.Item;

@connect(state => {
  return {
    loginData: state.user
  };
})
@withRouter
class Reg extends Component {
  constructor(props) {
    super(props);
    this.state = {
      confirmDirty: false
    };
  }

  static propTypes = {
    form: PropTypes.object,
    history: PropTypes.object
  };

  handleSubmit = e => {
    if (e && e.preventDefault) e.preventDefault();
    let values = this.props.form.getFieldsValue();
    // 兜底：如果未收集到值（受控注册问题），直接从 DOM 读取输入框
    if (!values || Object.keys(values).length === 0) {
      const pick = sel => {
        const el = document.querySelector(sel);
        return el ? el.value : '';
      };
      values = {
        username: pick('input[placeholder=\"Username\"]'),
        email: pick('input[placeholder=\"Email\"]'),
        password: pick('input[placeholder=\"Password\"]'),
        confirm: pick('input[placeholder=\"Confirm Password\"]')
      };
    }

    const username = (values.username || values.userName || '').trim();
    const email = (values.email || '').trim();
    const password = values.password;
    const confirm = values.confirm;

    if (!username || !email || !password || !confirm) {
      message.error('请完整填写注册信息');
      return;
    }

    const emailPattern = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{1,})+$/;
    if (!emailPattern.test(email)) {
      message.error('请输入正确的邮箱');
      return;
    }

    if (password !== confirm) {
      message.error('两次输入的密码不一致');
      return;
    }

    const payload = {
      username,
      userName: username,
      email,
      password,
      confirm
    };

    axios
      .post('/api/user/reg', payload)
      .then(res => {
        const { data } = res;
        if (data?.errcode === 0) {
          message.success('注册成功! ');
          this.props.history.replace('/group');
        } else {
          message.error(data?.errmsg || '注册失败');
        }
      })
      .catch(err => {
        // eslint-disable-next-line no-console
        console.error('register failed', err);
        message.error('注册失败');
      });
  };

  checkPassword = (rule, value, callback) => {
    const form = this.props.form;
    if (value && value !== form.getFieldValue('password')) {
      callback('两次输入的密码不一致啊!');
    } else {
      callback();
    }
  };

  checkConfirm = (rule, value, callback) => {
    const form = this.props.form;
    if (value && this.state.confirmDirty) {
      form.validateFields(['confirm'], { force: true });
    }
    callback();
  };

  render() {
    const { getFieldDecorator } = this.props.form;
    return (
      <Form onSubmit={this.handleSubmit}>
        {/* 用户名 */}
        <FormItem>
          {getFieldDecorator('username', {
            rules: [{ required: true, message: '请输入用户名!' }]
          })(
            <Input
              prefix={<Icon type="user" />}
              placeholder="Username"
              autoComplete="username"
            />
          )}
        </FormItem>

        {/* Emaiil */}
        <FormItem>
          {getFieldDecorator('email', {
            rules: [
              {
                required: true,
                message: '请输入email!',
                pattern: /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{1,})+$/
              }
            ]
          })(
            <Input
              prefix={<Icon type="mail" />}
              placeholder="Email"
              autoComplete="email"
            />
          )}
        </FormItem>

        {/* 密码 */}
        <FormItem>
          {getFieldDecorator('password', {
            rules: [
              {
                required: true,
                message: '请输入密码!'
              },
              {
                validator: this.checkConfirm
              }
            ]
          })(
            <Input
              prefix={<Icon type="lock" />}
              type="password"
              placeholder="Password"
              autoComplete="new-password"
            />
          )}
        </FormItem>

        {/* 密码二次确认 */}
        <FormItem>
          {getFieldDecorator('confirm', {
            rules: [
              {
                required: true,
                message: '请再次输入密码密码!'
              },
              {
                validator: this.checkPassword
              }
            ]
          })(
            <Input
              prefix={<Icon type="lock" />}
              type="password"
              placeholder="Confirm Password"
              autoComplete="new-password"
            />
          )}
        </FormItem>

        {/* 注册按钮 */}
        <FormItem>
          <Button
            type="primary"
            htmlType="submit"
            onClick={this.handleSubmit}
            className="login-form-button"
          >
            注册
          </Button>
        </FormItem>
      </Form>
    );
  }
}
const RegForm = Form.create()(Reg);
export default RegForm;
