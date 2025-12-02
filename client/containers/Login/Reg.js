import React, { PureComponent as Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Form } from 'client/components/LegacyForm';
import { Icon } from '@ant-design/compatible';
import { Button, Input, message } from 'antd';
import { regActions } from '../../reducer/modules/user';
import { withRouter } from 'react-router-dom';
const FormItem = Form.Item;

@connect(
  state => {
    return {
      loginData: state.user
    };
  },
  {
    regActions
  }
)
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
    history: PropTypes.object,
    regActions: PropTypes.func
  };

  handleSubmit = e => {
    if (e && e.preventDefault) e.preventDefault();
    const form = this.props.form;
    const values = form.getFieldsValue();
    if (!values.userName || !values.email || !values.password || !values.confirm) {
      message.error('请完整填写注册信息');
      return;
    }
    if (values.password !== values.confirm) {
      message.error('两次输入的密码不一致');
      return;
    }
    this.props.regActions(values).then(res => {
      if (res.payload.data.errcode == 0) {
        this.props.history.replace('/group');
        message.success('注册成功! ');
      } else {
        message.error(res.payload.data.errmsg || '注册失败');
      }
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
          {getFieldDecorator('userName', {
            rules: [{ required: true, message: '请输入用户名!' }]
          })(
            <Input
              prefix={<Icon type="user" />}
              placeholder="Username"
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
            />
          )}
        </FormItem>

        {/* 注册按钮 */}
        <FormItem>
          <Button
            type="primary"
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
