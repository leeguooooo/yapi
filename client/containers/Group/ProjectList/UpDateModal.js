import React, { useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Icon from 'client/components/Icon';
import { Modal, Input, Tooltip, Select, message, Button, Row, Col, Form } from 'antd';
import {
  updateProject,
  fetchProjectList,
  changeUpdateModal,
  changeTableLoading
} from '../../../reducer/modules/project';
const { TextArea } = Input;
const Option = Select.Option;

import './ProjectList.scss';

const formItemLayout = {
  labelCol: {
    xs: { span: 24 },
    sm: { span: 6 }
  },
  wrapperCol: {
    xs: { span: 24 },
    sm: { span: 14 }
  }
};
const formItemLayoutWithOutLabel = {
  wrapperCol: {
    xs: { span: 24, offset: 0 },
    sm: { span: 20, offset: 6 }
  }
};

const splitDomain = domain => {
  if (!domain) {
    return { protocol: 'http://', domain: '' };
  }
  const parts = domain.split('//');
  if (parts.length < 2) {
    return { protocol: 'http://', domain };
  }
  return { protocol: `${parts[0]}//`, domain: parts.slice(1).join('//') };
};

const UpDateModal = props => {
  const {
    fetchProjectList,
    updateProject,
    changeUpdateModal,
    currGroup,
    projectList,
    isUpdateModalShow,
    handleUpdateIndex,
    changeTableLoading
  } = props;
  const [form] = Form.useForm();

  const currentProject = useMemo(() => {
    if (projectList.length !== 0 && handleUpdateIndex !== -1) {
      return projectList[handleUpdateIndex] || {};
    }
    return {};
  }, [projectList, handleUpdateIndex]);

  const envInitialValues = useMemo(() => {
    const envList = currentProject.env || [];
    const mapped = envList.map(item => {
      const { protocol, domain } = splitDomain(item.domain);
      return {
        _id: item._id,
        name: item.name,
        domain,
        protocol
      };
    });
    if (mapped.length === 0) {
      mapped.push({
        name: '',
        domain: '',
        protocol: 'http://'
      });
    }
    return mapped;
  }, [currentProject]);

  const initialValues = useMemo(() => {
    return {
      name: currentProject.name,
      basepath: currentProject.basepath,
      desc: currentProject.desc,
      prd_host: currentProject.prd_host,
      protocol: currentProject.protocol ? `${currentProject.protocol}://` : 'http://',
      envs: envInitialValues
    };
  }, [currentProject, envInitialValues]);

  useEffect(() => {
    if (isUpdateModalShow) {
      form.setFieldsValue(initialValues);
    } else {
      form.resetFields();
    }
  }, [isUpdateModalShow, initialValues, form]);

  const handleCancel = () => {
    form.resetFields();
    changeUpdateModal(false, -1);
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const envList = (values.envs || []).filter(item => item && (item.name || item.domain));
      const normalizedEnv = envList.map(item => {
        return {
          _id: item._id,
          name: item.name,
          domain: `${item.protocol || 'http://'}${item.domain || ''}`
        };
      });
      const assignValue = Object.assign({}, currentProject, values, {
        env: normalizedEnv,
        protocol: (values.protocol || 'http://').replace('://', '')
      });
      changeTableLoading(true);
      const res = await updateProject(assignValue);
      if (res.payload.data.errcode == 0) {
        changeUpdateModal(false, -1);
        message.success('修改成功! ');
        await fetchProjectList(currGroup._id);
        form.resetFields();
      } else {
        message.error(res.payload.data.errmsg);
      }
    } catch (err) {
      return;
    } finally {
      changeTableLoading(false);
    }
  };

  return (
    <Modal title="修改项目" open={isUpdateModalShow} onOk={handleOk} onCancel={handleCancel}>
      <Form form={form} layout="horizontal" initialValues={initialValues}>
        <Form.Item
          {...formItemLayout}
          label="项目名称"
          name="name"
          rules={[
            {
              required: true,
              message: '请输入项目名称!'
            }
          ]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          {...formItemLayout}
          label={
            <span>
              线上域名&nbsp;
              <Tooltip title="将根据配置的线上域名访问mock数据">
                <Icon name="question-circle-o" />
              </Tooltip>
            </span>
          }
          name="prd_host"
          rules={[
            {
              required: true,
              message: '请输入项目线上域名!'
            }
          ]}
        >
          <Input
            addonBefore={
              <Form.Item name="protocol" noStyle>
                <Select>
                  <Option value="http://">{'http://'}</Option>
                  <Option value="https://">{'https://'}</Option>
                </Select>
              </Form.Item>
            }
          />
        </Form.Item>

        <Form.Item
          {...formItemLayout}
          label={
            <span>
              基本路径&nbsp;
              <Tooltip title="基本路径为空表示根路径">
                <Icon name="question-circle-o" />
              </Tooltip>
            </span>
          }
          name="basepath"
          rules={[
            {
              required: false,
              message: '请输入项目基本路径! '
            }
          ]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          {...formItemLayout}
          label="描述"
          name="desc"
          rules={[
            {
              required: false,
              message: '请输入描述!'
            }
          ]}
        >
          <TextArea rows={4} />
        </Form.Item>

        <Form.List name="envs">
          {(fields, { add, remove }) => (
            <>
              {fields.map((field, index) => {
                const isLast = index === fields.length - 1;
                return (
                  <Row
                    key={field.key}
                    justify="space-between"
                    align={index === 0 ? 'middle' : 'top'}
                  >
                    <Col span={10} offset={2}>
                      <Form.Item name={[field.name, '_id']} hidden>
                        <Input />
                      </Form.Item>
                      <Form.Item
                        label={index === 0 ? <span>环境名称</span> : ''}
                        required={false}
                        key={`${field.key}-name`}
                        name={[field.name, 'name']}
                        rules={[
                          {
                            required: true,
                            whitespace: true,
                            message: '请输入环境名称'
                          },
                          {
                            validator: (_, value) => {
                              if (!value) {
                                return Promise.reject('请输入环境名称');
                              }
                              if (!/\S/.test(value)) {
                                return Promise.reject('请输入环境名称');
                              }
                              if (/prd/.test(value)) {
                                return Promise.reject('环境域名不能是"prd"');
                              }
                              return Promise.resolve();
                            }
                          }
                        ]}
                      >
                        <Input placeholder="请输入环境名称" style={{ width: '90%', marginRight: 8 }} />
                      </Form.Item>
                    </Col>
                    <Col span={10}>
                      <Form.Item
                        label={index === 0 ? <span>环境域名</span> : ''}
                        required={false}
                        key={`${field.key}-domain`}
                        name={[field.name, 'domain']}
                        rules={[
                          {
                            required: true,
                            whitespace: true,
                            message: '请输入环境域名'
                          },
                          {
                            validator: (_, value) => {
                              if (value && value.length === 0) {
                                return Promise.reject('请输入环境域名');
                              } else if (value && !/\S/.test(value)) {
                                return Promise.reject('请输入环境域名');
                              } else if (!value) {
                                return Promise.reject('请输入环境域名');
                              }
                              return Promise.resolve();
                            }
                          }
                        ]}
                      >
                        <Input
                          placeholder="请输入环境域名"
                          style={{ width: '90%', marginRight: 8 }}
                          addonBefore={
                            <Form.Item name={[field.name, 'protocol']} noStyle>
                              <Select>
                                <Option value="http://">{'http://'}</Option>
                                <Option value="https://">{'https://'}</Option>
                              </Select>
                            </Form.Item>
                          }
                        />
                      </Form.Item>
                    </Col>
                    <Col span={2}>
                      {fields.length > 1 || isLast ? (
                        <Icon
                          className="dynamic-delete-button"
                          name="minus-circle-o"
                          onClick={() => remove(field.name)}
                        />
                      ) : null}
                    </Col>
                  </Row>
                );
              })}
              <Form.Item {...formItemLayoutWithOutLabel}>
                <Button
                  type="dashed"
                  onClick={() => add({ name: '', domain: '', protocol: 'http://' })}
                  style={{ width: '60%' }}
                >
                  <Icon name="plus" /> 添加环境配置
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>
      </Form>
    </Modal>
  );
};

UpDateModal.propTypes = {
  fetchProjectList: PropTypes.func,
  updateProject: PropTypes.func,
  changeUpdateModal: PropTypes.func,
  changeTableLoading: PropTypes.func,
  projectList: PropTypes.array,
  currGroup: PropTypes.object,
  isUpdateModalShow: PropTypes.bool,
  handleUpdateIndex: PropTypes.number
};

export default connect(
  state => {
    return {
      projectList: state.project.projectList,
      isUpdateModalShow: state.project.isUpdateModalShow,
      handleUpdateIndex: state.project.handleUpdateIndex,
      tableLoading: state.project.tableLoading,
      currGroup: state.group.currGroup
    };
  },
  {
    fetchProjectList,
    updateProject,
    changeUpdateModal,
    changeTableLoading
  }
)(UpDateModal);
