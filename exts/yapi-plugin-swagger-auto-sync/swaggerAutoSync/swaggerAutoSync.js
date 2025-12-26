import React, { useCallback, useEffect, useState } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { formatTime } from 'client/common.js';
import { Switch, Button, Tooltip, message, Input, Select, Form } from 'antd';
import Icon from 'client/components/Icon';
import { handleSwaggerUrlData } from 'client/reducer/modules/project';
import axios from 'axios';

const { Option } = Select;
const formItemLayout = {
  labelCol: {
    lg: { span: 5 },
    xs: { span: 24 },
    sm: { span: 10 }
  },
  wrapperCol: {
    lg: { span: 16 },
    xs: { span: 24 },
    sm: { span: 12 }
  },
  className: 'form-item'
};
const tailFormItemLayout = {
  wrapperCol: {
    sm: {
      span: 16,
      offset: 11
    }
  }
};

const ProjectInterfaceSync = ({ projectId, projectMsg, handleSwaggerUrlData }) => {
  const [form] = Form.useForm();
  const [syncData, setSyncData] = useState({ is_sync_open: false });
  const [randomCorn] = useState('*/2 * * * *');

  const fetchSyncData = useCallback(async () => {
    if (!projectMsg || !projectMsg._id) return;
    const result = await axios.get(`/api/plugin/autoSync/get?project_id=${projectMsg._id}`);
    if (result.data.errcode === 0 && result.data.data) {
      setSyncData(result.data.data);
    }
  }, [projectMsg]);

  useEffect(() => {
    fetchSyncData();
  }, [fetchSyncData]);

  useEffect(() => {
    form.setFieldsValue({
      is_sync_open: !!syncData.is_sync_open,
      sync_mode: syncData.sync_mode,
      sync_json_url: syncData.sync_json_url,
      sync_cron: syncData.sync_cron || randomCorn
    });
  }, [syncData, randomCorn, form]);

  const syncCronCheck = (_, value) => {
    if (!value) {
      return Promise.resolve();
    }
    const trimmed = value.trim();
    if (trimmed.split(/ +/).length > 5) {
      return Promise.reject('不支持秒级别的设置，建议使用 "*/10 * * * *" ,每隔10分钟更新');
    }
    return Promise.resolve();
  };

  const validSwaggerUrl = async (_, value) => {
    if (!value) {
      return Promise.resolve();
    }
    try {
      await handleSwaggerUrlData(value);
      return Promise.resolve();
    } catch (e) {
      return Promise.reject('swagger地址不正确');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const params = {
        project_id: projectId,
        uid: projectMsg.uid,
        is_sync_open: values.is_sync_open
      };
      if (syncData._id) {
        params.id = syncData._id;
      }
      const assignValue = Object.assign({}, params, values);
      const res = await axios.post('/api/plugin/autoSync/save', assignValue);
      if (res.data.errcode === 0) {
        message.success('保存成功');
      } else {
        message.error(res.data.errmsg);
      }
    } catch (err) {
      // validateFields 会直接提示错误
    }
  };

  return (
    <div className="m-panel">
      <Form form={form} layout="horizontal" onFinish={handleSubmit}>
        <Form.Item
          label="是否开启自动同步"
          name="is_sync_open"
          valuePropName="checked"
          extra={
            syncData.last_sync_time != null ? (
              <div>
                上次更新时间:
                <span className="logtime">{formatTime(syncData.last_sync_time)}</span>
              </div>
            ) : null
          }
          {...formItemLayout}
        >
          <Switch checkedChildren="开" unCheckedChildren="关" />
        </Form.Item>

        <div>
          <Form.Item
            {...formItemLayout}
            label={
              <span className="label">
                数据同步&nbsp;
                <Tooltip
                  title={
                    <div>
                      <h3 style={{ color: 'white' }}>普通模式</h3>
                      <p>不导入已存在的接口</p>
                      <br />
                      <h3 style={{ color: 'white' }}>智能合并</h3>
                      <p>
                        已存在的接口，将合并返回数据的 response，适用于导入了 swagger
                        数据，保留对数据结构的改动
                      </p>
                      <br />
                      <h3 style={{ color: 'white' }}>完全覆盖</h3>
                      <p>不保留旧数据，完全使用新数据，适用于接口定义完全交给后端定义</p>
                    </div>
                  }
                >
                  <Icon name="question-circle-o" />
                </Tooltip>{' '}
              </span>
            }
            name="sync_mode"
            rules={[
              {
                required: true,
                message: '请选择同步方式!'
              }
            ]}
          >
            <Select>
              <Option value="normal">普通模式</Option>
              <Option value="good">智能合并</Option>
              <Option value="merge">完全覆盖</Option>
            </Select>
          </Form.Item>

          <Form.Item
            {...formItemLayout}
            label="项目的swagger json地址"
            name="sync_json_url"
            rules={[
              {
                required: true,
                message: '输入swagger地址'
              },
              {
                validator: validSwaggerUrl
              }
            ]}
            validateTrigger="onBlur"
          >
            <Input />
          </Form.Item>

          <Form.Item
            {...formItemLayout}
            label={
              <span>
                类cron风格表达式(默认10分钟更新一次)&nbsp;
                <a href="https://blog.csdn.net/shouldnotappearcalm/article/details/89469047">参考</a>
              </span>
            }
            name="sync_cron"
            rules={[
              {
                required: true,
                message: '输入node-schedule的类cron表达式!'
              },
              {
                validator: syncCronCheck
              }
            ]}
          >
            <Input />
          </Form.Item>
        </div>
        <Form.Item {...tailFormItemLayout}>
          <Button
            type="primary"
            htmlType="submit"
            icon={<Icon name="save" />}
            size="large"
          >
            保存
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

ProjectInterfaceSync.propTypes = {
  projectId: PropTypes.number,
  projectMsg: PropTypes.object,
  handleSwaggerUrlData: PropTypes.func
};

const mapStateToProps = state => ({
  projectMsg: state.project.currProject
});

export default connect(mapStateToProps, { handleSwaggerUrlData })(ProjectInterfaceSync);
