import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Icon from 'client/components/Icon';
import {
  Select,
  InputNumber,
  Switch,
  Col,
  message,
  Row,
  Input,
  Button,
  AutoComplete,
  Modal,
  Form
} from 'antd';
import { safeAssign } from 'client/common.js';
import AceEditor from 'client/components/AceEditor/AceEditor';
import constants from 'client/constants/variable.js';
import { httpCodes } from '../index.js';
import './CaseDesModal.scss';
import { connect } from 'react-redux';
import json5 from 'json5';

const { Option } = Select;
const { Item: FormItem } = Form;

const formItemLayout = {
  labelCol: { span: 5 },
  wrapperCol: { span: 12 }
};
const formItemLayoutWithOutLabel = {
  wrapperCol: { span: 12, offset: 5 }
};

@connect(state => {
  return {
    currInterface: state.inter.curdata
  };
})
class CaseDesForm extends Component {
  static propTypes = {
    form: PropTypes.object,
    caseData: PropTypes.object,
    currInterface: PropTypes.object,
    onOk: PropTypes.func,
    onCancel: PropTypes.func,
    isAdd: PropTypes.bool,
    open: PropTypes.bool
  };

  constructor(props) {
    super(props);
    const { caseData } = this.props;
    this.state = this.preProcess(caseData);
  }

  // 初始化输入数据
  preProcess = caseData => {
    try {
      caseData = JSON.parse(JSON.stringify(caseData));
    } catch (error) {
      console.log(error);
    }

    const initCaseData = {
      ip: '',
      ip_enable: false,
      name: '',
      code: '200',
      delay: 0,
      headers: [{ name: '', value: '' }],
      paramsArr: [{ name: '', value: '' }],
      params: {},
      res_body: '',
      paramsForm: 'form'
    };
    caseData.params = caseData.params || {};
    const paramsArr = Object.keys(caseData.params).length
      ? Object.keys(caseData.params)
          .map(key => {
            return { name: key, value: caseData.params[key] };
          })
          .filter(item => {
            if (typeof item.value === 'object') {
              caseData.paramsForm = 'json';
            }
            return typeof item.value !== 'object';
          })
      : [{ name: '', value: '' }];
    const headers =
      caseData.headers && caseData.headers.length ? caseData.headers : [{ name: '', value: '' }];
    caseData.code = '' + caseData.code;
    caseData.params = JSON.stringify(caseData.params, null, 2);

    caseData = safeAssign(initCaseData, { ...caseData, headers, paramsArr });

    return caseData;
  };

  // 处理request_body编译器
  handleRequestBody = d => {
    this.setState({ res_body: d.text });
  };

  // 处理参数编译器
  handleParams = d => {
    this.setState({ params: d.text });
    this.props.form.setFieldsValue({ params: d.text });
  };

  // 增加参数信息
  addValues = key => {
    const { form } = this.props;
    const values = (form.getFieldValue(key) || []).concat({ name: '', value: '' });
    this.setState({ [key]: values });
    form.setFieldsValue({ [key]: values });
  };

  // 删除参数信息
  removeValues = (key, index) => {
    const { form } = this.props;
    const values = (form.getFieldValue(key) || []).filter((val, index2) => index !== index2);
    form.setFieldsValue({ [key]: values });
    this.setState({ [key]: values });
  };

  // 处理参数
  getParamsKey = () => {
    let {
      req_query,
      req_body_form,
      req_body_type,
      method,
      req_body_other,
      req_body_is_json_schema,
      req_params
    } = this.props.currInterface;
    let keys = [];
    req_query &&
      Array.isArray(req_query) &&
      req_query.forEach(item => {
        keys.push(item.name);
      });
    req_params &&
      Array.isArray(req_params) &&
      req_params.forEach(item => {
        keys.push(item.name);
      });

    if (constants.HTTP_METHOD[method.toUpperCase()].request_body && req_body_type === 'form') {
      req_body_form &&
        Array.isArray(req_body_form) &&
        req_body_form.forEach(item => {
          keys.push(item.name);
        });
    } else if (
      constants.HTTP_METHOD[method.toUpperCase()].request_body &&
      req_body_type === 'json' &&
      req_body_other
    ) {
      let bodyObj;
      try {
        if (req_body_is_json_schema) {
          bodyObj = json5.parse(this.props.caseData.req_body_other);
        } else {
          bodyObj = json5.parse(req_body_other);
        }

        keys = keys.concat(Object.keys(bodyObj));
      } catch (error) {
        console.log(error);
      }
    }
    return keys;
  };

  endProcess = caseData => {
    const headers = [];
    const params = {};
    const { paramsForm } = this.state;
    caseData.headers &&
      Array.isArray(caseData.headers) &&
      caseData.headers.forEach(item => {
        if (item.name) {
          headers.push({
            name: item.name,
            value: item.value
          });
        }
      });
    caseData.paramsArr &&
      Array.isArray(caseData.paramsArr) &&
      caseData.paramsArr.forEach(item => {
        if (item.name) {
          params[item.name] = item.value;
        }
      });
    caseData.headers = headers;
    if (paramsForm === 'form') {
      caseData.params = params;
    } else {
      try {
        caseData.params = json5.parse(caseData.params);
      } catch (error) {
        console.log(error);
        message.error('请求参数 json 格式有误，请修改');
        return false;
      }
    }
    delete caseData.paramsArr;

    return caseData;
  };

  jsonValidator = (_, value) => {
    if (this.state.paramsForm !== 'json') {
      return Promise.resolve();
    }
    const content = value !== undefined ? value : this.state.params;
    try {
      json5.parse(content || '{}');
      return Promise.resolve();
    } catch (error) {
      return Promise.reject('请输入正确的 JSON 字符串！');
    }
  };

  handleOk = async () => {
    const form = this.props.form;
    try {
      const values = await form.validateFields();
      values.res_body = this.state.res_body;
      values.params = this.state.params;
      this.props.onOk(this.endProcess(values));
    } catch (err) {
      // validateFields 会直接提示错误
    }
  };

  render() {
    const { isAdd, open, onCancel } = this.props;
    const {
      name,
      code,
      headers,
      ip,
      ip_enable,
      params,
      paramsArr,
      paramsForm,
      res_body,
      delay
    } = this.state;

    const dataSource = this.getParamsKey();
    const form = this.props.form;
    const initialValues = { name, ip_enable, ip, paramsArr, headers, params, code, delay };

    const valuesTpl = (values, title) => {
      const display = paramsForm === 'json' ? 'none' : '';
      return values.map((item, index) => (
        <div key={index} className="paramsArr" style={{ display }}>
          <FormItem
            {...(index === 0 ? formItemLayout : formItemLayoutWithOutLabel)}
            wrapperCol={index === 0 ? { span: 19 } : { span: 19, offset: 5 }}
            label={index ? '' : title}
          >
            <Row gutter={8}>
              <Col span={10}>
                <FormItem
                  name={['paramsArr', index, 'name']}
                  initialValue={item.name}
                  noStyle
                >
                  <AutoComplete
                    dataSource={dataSource}
                    placeholder="参数名称"
                    filterOption={(inputValue, option) =>
                      option.props.children.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
                    }
                  />
                </FormItem>
              </Col>
              <Col span={10}>
                <FormItem
                  name={['paramsArr', index, 'value']}
                  initialValue={item.value}
                  noStyle
                >
                  <Input placeholder="参数值" />
                </FormItem>
              </Col>
              <Col span={4}>
                {values.length > 1 ? (
                  <Icon
                    className="dynamic-delete-button"
                    name="minus-circle-o"
                    onClick={() => this.removeValues('paramsArr', index)}
                  />
                ) : null}
              </Col>
            </Row>
          </FormItem>
        </div>
      ));
    };
    const headersTpl = (values, title) => {
      const headerSource = constants.HTTP_REQUEST_HEADER;
      return values.map((item, index) => (
        <div key={index} className="headers">
          <FormItem
            {...(index === 0 ? formItemLayout : formItemLayoutWithOutLabel)}
            wrapperCol={index === 0 ? { span: 19 } : { span: 19, offset: 5 }}
            label={index ? '' : title}
          >
            <Row gutter={8}>
              <Col span={10}>
                <FormItem
                  name={['headers', index, 'name']}
                  initialValue={item.name}
                  noStyle
                >
                  <AutoComplete
                    dataSource={headerSource}
                    placeholder="参数名称"
                    filterOption={(inputValue, option) =>
                      option.props.children.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
                    }
                  />
                </FormItem>
              </Col>
              <Col span={10}>
                <FormItem
                  name={['headers', index, 'value']}
                  initialValue={item.value}
                  noStyle
                >
                  <Input placeholder="参数值" />
                </FormItem>
              </Col>
              <Col span={4}>
                {values.length > 1 ? (
                  <Icon
                    className="dynamic-delete-button"
                    name="minus-circle-o"
                    onClick={() => this.removeValues('headers', index)}
                  />
                ) : null}
              </Col>
            </Row>
          </FormItem>
        </div>
      ));
    };
    const ipValue = form.getFieldValue('ip_enable');
    const ipEnabled = typeof ipValue === 'boolean' ? ipValue : ip_enable;
    return (
      <Modal
        title={isAdd ? '添加期望' : '编辑期望'}
        open={open}
        maskClosable={false}
        onOk={this.handleOk}
        width={780}
        onCancel={() => onCancel()}
        afterClose={() => this.setState({ paramsForm: 'form' })}
        className="case-des-modal"
      >
        <Form form={form} initialValues={initialValues} layout="horizontal">
          <h2 className="sub-title" style={{ marginTop: 0 }}>
            基本信息
          </h2>
          <FormItem
            {...formItemLayout}
            label="期望名称"
            name="name"
            rules={[{ required: true, message: '请输入期望名称！' }]}
          >
            <Input placeholder="请输入期望名称" />
          </FormItem>
          <FormItem {...formItemLayout} label="IP 过滤" className="ip-filter">
            <Col span={6} className="ip-switch">
              <FormItem name="ip_enable" valuePropName="checked" noStyle>
                <Switch />
              </FormItem>
            </Col>
            <Col span={18}>
              <div style={{ display: ipEnabled ? '' : 'none' }} className="ip">
                <FormItem
                  name="ip"
                  rules={
                    ipEnabled
                      ? [
                          {
                            pattern: constants.IP_REGEXP,
                            message: '请填写正确的 IP 地址',
                            required: true
                          }
                        ]
                      : []
                  }
                >
                  <Input placeholder="请输入过滤的 IP 地址" />
                </FormItem>
              </div>
            </Col>
          </FormItem>
          <Row className="params-form" style={{ marginBottom: 8 }}>
            <Col {...{ span: 12, offset: 5 }}>
              <Switch
                size="small"
                checkedChildren="JSON"
                unCheckedChildren="JSON"
                checked={paramsForm === 'json'}
                onChange={bool => {
                  this.setState({ paramsForm: bool ? 'json' : 'form' });
                }}
              />
            </Col>
          </Row>
          {valuesTpl(paramsArr, '参数过滤')}
          <FormItem
            wrapperCol={{ span: 6, offset: 5 }}
            style={{ display: paramsForm === 'json' ? 'none' : '' }}
          >
            <Button
              size="default"
              type="primary"
              onClick={() => this.addValues('paramsArr')}
              style={{ width: '100%' }}
            >
              <Icon name="plus" /> 添加参数
            </Button>
          </FormItem>
          <FormItem
            {...formItemLayout}
            wrapperCol={{ span: 17 }}
            label="参数过滤"
            style={{ display: paramsForm === 'form' ? 'none' : '' }}
          >
            <AceEditor className="pretty-editor" data={params} onChange={this.handleParams} />
            <FormItem
              name="params"
              rules={paramsForm === 'json' ? [{ validator: this.jsonValidator }] : []}
              initialValue={params}
            >
              <Input style={{ display: 'none' }} />
            </FormItem>
          </FormItem>
          <h2 className="sub-title">响应</h2>
          <FormItem {...formItemLayout} required label="HTTP Code" name="code" initialValue={code}>
            <Select showSearch>
              {httpCodes.map(codeOption => (
                <Option key={'' + codeOption} value={'' + codeOption}>
                  {'' + codeOption}
                </Option>
              ))}
            </Select>
          </FormItem>
          <FormItem
            {...formItemLayout}
            label="延时"
            name="delay"
            rules={[{ required: true, message: '请输入延时时间！', type: 'integer' }]}
            initialValue={delay}
          >
            <>
              <InputNumber placeholder="请输入延时时间" min={0} />
              <span>ms</span>
            </>
          </FormItem>
          {headersTpl(headers, 'HTTP 头')}
          <FormItem wrapperCol={{ span: 6, offset: 5 }}>
            <Button
              size="default"
              type="primary"
              onClick={() => this.addValues('headers')}
              style={{ width: '100%' }}
            >
              <Icon name="plus" /> 添加 HTTP 头
            </Button>
          </FormItem>
          <FormItem {...formItemLayout} wrapperCol={{ span: 17 }} label="Body" required>
            <FormItem>
              <AceEditor
                className="pretty-editor"
                data={res_body}
                mode={this.props.currInterface.res_body_type === 'json' ? null : 'text'}
                onChange={this.handleRequestBody}
              />
            </FormItem>
          </FormItem>
        </Form>
      </Modal>
    );
  }
}

const CaseDesModal = props => {
  const [form] = Form.useForm();
  return <CaseDesForm {...props} form={form} />;
};

export default CaseDesModal;
