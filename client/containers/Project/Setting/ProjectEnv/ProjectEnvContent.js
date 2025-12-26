import React, { useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import './index.scss';
import Icon from 'client/components/Icon';
import { Row, Col, Input, Select, Button, AutoComplete, Tooltip, Form } from 'antd';
import constants from 'client/constants/variable.js';

const { Option } = Select;

const buildInitialState = (data = {}) => {
  const header = [];
  const cookie = [];
  const global = [];

  const curHeader = data.header || [];
  const curGlobal = data.global || [];

  curHeader.forEach(item => {
    if (item.name === 'Cookie') {
      const cookieStr = item.value || '';
      cookieStr.split(';').forEach(c => {
        if (!c) {
          return;
        }
        const parts = c.split('=');
        const name = parts[0] ? parts[0].trim() : '';
        const value = parts.slice(1).join('=').trim();
        if (name) {
          cookie.push({
            name,
            value
          });
        }
      });
    } else {
      header.push(item);
    }
  });

  curGlobal.forEach(item => {
    global.push(item);
  });

  header.push({ name: '', value: '' });
  cookie.push({ name: '', value: '' });
  global.push({ name: '', value: '' });

  return { header, cookie, global };
};

const ProjectEnvContent = ({ projectMsg, onSubmit, handleEnvInput }) => {
  const [form] = Form.useForm();
  const headerOptions = useMemo(
    () => constants.HTTP_REQUEST_HEADER.map(item => ({ value: item })),
    []
  );

  const initialValues = useMemo(() => {
    const current = projectMsg || {};
    const { header, cookie, global } = buildInitialState(current);
    return {
      env: {
        name: current.name === '新环境' ? '' : current.name || '',
        domain: current.domain ? current.domain.split('//')[1] : '',
        protocol: current.domain ? `${current.domain.split('//')[0]}//` : 'http://'
      },
      header,
      cookie,
      global
    };
  }, [projectMsg]);

  useEffect(() => {
    form.setFieldsValue(initialValues);
  }, [initialValues, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const header = (values.header || []).filter(item => item && item.name);
      const cookie = (values.cookie || []).filter(item => item && item.name);
      const global = (values.global || []).filter(item => item && item.name);

      if (cookie.length > 0) {
        header.push({
          name: 'Cookie',
          value: cookie.map(item => `${item.name}=${item.value || ''}`).join(';')
        });
      }

      const envValue = {
        _id: projectMsg ? projectMsg._id : undefined,
        name: values.env?.name,
        domain: `${values.env?.protocol || 'http://'}${values.env?.domain || ''}`,
        header,
        global
      };
      onSubmit && onSubmit({ env: envValue });
    } catch (err) {
      // validateFields already reports errors
    }
  };

  const ensureNextRow = (index, fields, add) => {
    if (index === fields.length - 1) {
      add({ name: '', value: '' });
    }
  };

  return (
    <Form form={form} layout="vertical" initialValues={initialValues}>
      <div>
        <h3 className="env-label">环境名称</h3>
        <Form.Item
          name={['env', 'name']}
          rules={[
            {
              required: true,
              whitespace: true,
              message: '请输入环境名称'
            },
            {
              validator: (_, value) => {
                if (value && /\S/.test(value)) {
                  return Promise.resolve();
                }
                return Promise.reject('请输入环境名称');
              }
            }
          ]}
        >
          <Input
            onChange={e => handleEnvInput && handleEnvInput(e.target.value)}
            placeholder="请输入环境名称"
            style={{ width: '90%', marginRight: 8 }}
          />
        </Form.Item>
        <h3 className="env-label">环境域名</h3>
        <Form.Item
          name={['env', 'domain']}
          rules={[
            {
              required: true,
              message: '请输入环境域名!'
            },
            {
              validator: (_, value) => {
                if (value && /\s/.test(value)) {
                  return Promise.reject('环境域名不允许出现空格!');
                }
                if (value) {
                  return Promise.resolve();
                }
                return Promise.reject('请输入环境域名!');
              }
            }
          ]}
        >
          <Input
            placeholder="请输入环境域名"
            style={{ width: '90%', marginRight: 8 }}
            addonBefore={
              <Form.Item name={['env', 'protocol']} noStyle>
                <Select>
                  <Option value="http://">{'http://'}</Option>
                  <Option value="https://">{'https://'}</Option>
                </Select>
              </Form.Item>
            }
          />
        </Form.Item>
        <h3 className="env-label">Header</h3>
        <Form.List name="header">
          {(fields, { add, remove }) => (
            <>
              {fields.map((field, index) => {
                const isLast = index === fields.length - 1;
                return (
                  <Row gutter={2} key={field.key}>
                    <Col span={10}>
                      <Form.Item name={[field.name, 'name']}>
                        <AutoComplete
                          style={{ width: '200px' }}
                          allowClear={true}
                          options={headerOptions}
                          placeholder="请输入header名称"
                          onChange={() => ensureNextRow(index, fields, add)}
                          filterOption={(inputValue, option) =>
                            option.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
                          }
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name={[field.name, 'value']}>
                        <Input placeholder="请输入参数内容" style={{ width: '90%', marginRight: 8 }} />
                      </Form.Item>
                    </Col>
                    <Col span={2} className={isLast ? ' env-last-row' : null}>
                      {fields.length > 1 ? (
                        <Icon
                          className="dynamic-delete-button delete"
                          name="delete"
                          onClick={e => {
                            e.stopPropagation();
                            remove(field.name);
                          }}
                        />
                      ) : null}
                    </Col>
                  </Row>
                );
              })}
            </>
          )}
        </Form.List>

        <h3 className="env-label">Cookie</h3>
        <Form.List name="cookie">
          {(fields, { add, remove }) => (
            <>
              {fields.map((field, index) => {
                const isLast = index === fields.length - 1;
                return (
                  <Row gutter={2} key={field.key}>
                    <Col span={10}>
                      <Form.Item name={[field.name, 'name']}>
                        <Input
                          placeholder="请输入 cookie Name"
                          style={{ width: '200px' }}
                          onChange={() => ensureNextRow(index, fields, add)}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name={[field.name, 'value']}>
                        <Input placeholder="请输入参数内容" style={{ width: '90%', marginRight: 8 }} />
                      </Form.Item>
                    </Col>
                    <Col span={2} className={isLast ? ' env-last-row' : null}>
                      {fields.length > 1 ? (
                        <Icon
                          className="dynamic-delete-button delete"
                          name="delete"
                          onClick={e => {
                            e.stopPropagation();
                            remove(field.name);
                          }}
                        />
                      ) : null}
                    </Col>
                  </Row>
                );
              })}
            </>
          )}
        </Form.List>

        <h3 className="env-label">
          global
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="https://leeguooooo.github.io/yapi/documents/project.html#%E9%85%8D%E7%BD%AE%E7%8E%AF%E5%A2%83"
            style={{ marginLeft: 8 }}
          >
            <Tooltip title="点击查看文档">
              <Icon name="question-circle-o" style={{ fontSize: '13px' }} />
            </Tooltip>
          </a>
        </h3>
        <Form.List name="global">
          {(fields, { add, remove }) => (
            <>
              {fields.map((field, index) => {
                const isLast = index === fields.length - 1;
                return (
                  <Row gutter={2} key={field.key}>
                    <Col span={10}>
                      <Form.Item name={[field.name, 'name']}>
                        <Input
                          placeholder="请输入 global Name"
                          style={{ width: '200px' }}
                          onChange={() => ensureNextRow(index, fields, add)}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name={[field.name, 'value']}>
                        <Input placeholder="请输入参数内容" style={{ width: '90%', marginRight: 8 }} />
                      </Form.Item>
                    </Col>
                    <Col span={2} className={isLast ? ' env-last-row' : null}>
                      {fields.length > 1 ? (
                        <Icon
                          className="dynamic-delete-button delete"
                          name="delete"
                          onClick={e => {
                            e.stopPropagation();
                            remove(field.name);
                          }}
                        />
                      ) : null}
                    </Col>
                  </Row>
                );
              })}
            </>
          )}
        </Form.List>
      </div>

      <div className="btnwrap-changeproject">
        <Button
          className="m-btn btn-save"
          icon={<Icon name="save" />}
          type="primary"
          size="large"
          htmlType="button"
          onClick={handleOk}
        >
          保 存
        </Button>
      </div>
    </Form>
  );
};

ProjectEnvContent.propTypes = {
  projectMsg: PropTypes.object,
  onSubmit: PropTypes.func,
  handleEnvInput: PropTypes.func
};

export default ProjectEnvContent;
