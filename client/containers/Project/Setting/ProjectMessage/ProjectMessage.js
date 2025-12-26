import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Form } from 'antd';
import Icon from 'client/components/Icon';
import {
  Input,
  Switch,
  Select,
  Tooltip,
  Button,
  Row,
  Col,
  message,
  Card,
  Radio,
  Alert,
  Modal,
  Popover
} from 'antd';
import PropTypes from 'prop-types';
import {
  updateProject,
  delProject,
  getProject,
  upsetProject
} from '../../../../reducer/modules/project';
import { fetchGroupMsg } from '../../../../reducer/modules/group';
import { fetchGroupList } from '../../../../reducer/modules/group.js';
import { setBreadcrumb } from '../../../../reducer/modules/user';
import { connect } from 'react-redux';
const { TextArea } = Input;
const FormItem = Form.Item;
const RadioGroup = Radio.Group;
const RadioButton = Radio.Button;
import constants from '../../../../constants/variable.js';
const confirm = Modal.confirm;
import { nameLengthLimit, entries, trim, htmlFilter } from '../../../../common';
import '../Setting.scss';
import _ from 'underscore';
import ProjectTag from './ProjectTag.js';
import { useNavigate } from 'react-router-dom';

const formItemLayout = {
  labelCol: {
    lg: { offset: 1, span: 3 },
    xs: { span: 24 },
    sm: { span: 6 }
  },
  wrapperCol: {
    lg: { span: 19 },
    xs: { span: 24 },
    sm: { span: 14 }
  },
  className: 'form-item'
};

const Option = Select.Option;

const ProjectMessage = props => {
  const {
    updateProject,
    delProject,
    getProject,
    fetchGroupMsg,
    upsetProject,
    fetchGroupList,
    setBreadcrumb,
    groupList = [],
    projectMsg = {},
    currGroup = {},
    projectId
  } = props;
  const [form] = Form.useForm();
  const [showDangerOptions, setShowDangerOptions] = useState(false);
  const tagRef = useRef();
  const navigate = useNavigate();

  const initialValues = useMemo(() => {
    return {
      name: projectMsg.name,
      basepath: projectMsg.basepath,
      desc: projectMsg.desc,
      project_type: projectMsg.project_type,
      group_id: projectMsg.group_id ? `${projectMsg.group_id}` : undefined,
      switch_notice: projectMsg.switch_notice,
      strice: projectMsg.strice,
      is_json5: projectMsg.is_json5
    };
  }, [projectMsg]);

  useEffect(() => {
    fetchGroupList();
  }, [fetchGroupList]);

  useEffect(() => {
    if (projectMsg.group_id) {
      fetchGroupMsg(projectMsg.group_id);
    }
  }, [projectMsg.group_id, fetchGroupMsg]);

  useEffect(() => {
    form.setFieldsValue(initialValues);
  }, [initialValues, form]);

  const handleOk = async e => {
    e.preventDefault();
    try {
      const values = await form.validateFields();
      const tagState = (tagRef.current && tagRef.current.state.tag) || [];
      const tag = tagState.filter(val => {
        return val.name !== '';
      });
      const assignValue = Object.assign({}, projectMsg, values, {
        tag,
        protocol: projectMsg.protocol
      });

      const group_id = assignValue.group_id;
      const selectGroup = _.find(groupList, item => {
        return item._id == group_id;
      });

      const res = await updateProject(assignValue);
      if (res.payload.data.errcode == 0) {
        getProject(projectId);
        message.success('修改成功! ');

        fetchGroupMsg(group_id);
        let projectName = htmlFilter(assignValue.name);
        if (selectGroup) {
          setBreadcrumb([
            {
              name: selectGroup.group_name,
              href: '/group/' + group_id
            },
            {
              name: projectName
            }
          ]);
        }
        form.resetFields();
      }
    } catch (err) {
      // validateFields 会直接提示错误
    }
  };

  const showConfirm = () => {
    confirm({
      title: '确认删除 ' + projectMsg.name + ' 项目吗？',
      content: (
        <div style={{ marginTop: '10px', fontSize: '13px', lineHeight: '25px' }}>
          <Alert
            message="警告：此操作非常危险,会删除该项目下面所有接口，并且无法恢复!"
            type="warning"
            banner
          />
          <div style={{ marginTop: '16px' }}>
            <p style={{ marginBottom: '8px' }}>
              <b>请输入项目名称确认此操作:</b>
            </p>
            <Input id="project_name" size="large" />
          </div>
        </div>
      ),
      onOk() {
        let groupName = trim(document.getElementById('project_name').value);
        if (projectMsg.name !== groupName) {
          message.error('项目名称有误');
          return new Promise((resolve, reject) => {
            reject('error');
          });
        } else {
          return delProject(projectId).then(res => {
            if (res.payload.data.errcode == 0) {
              message.success('删除成功!');
              navigate('/group/' + projectMsg.group_id);
            }
          });
        }
      },
      icon: <Icon name="delete" />,
      onCancel() {}
    });
  };

  const changeProjectColor = e => {
    const { _id, color, icon } = projectMsg;
    upsetProject({ id: _id, color: e.target.value || color, icon }).then(res => {
      if (res.payload.data.errcode === 0) {
        getProject(projectId);
      }
    });
  };

  const changeProjectIcon = e => {
    const { _id, color, icon } = projectMsg;
    upsetProject({ id: _id, color, icon: e.target.value || icon }).then(res => {
      if (res.payload.data.errcode === 0) {
        getProject(projectId);
      }
    });
  };

  const toggleDangerOptions = () => {
    setShowDangerOptions(!showDangerOptions);
  };

  const mockUrl =
    location.protocol +
    '//' +
    location.hostname +
    (location.port !== '' ? ':' + location.port : '') +
    `/mock/${projectMsg._id}${projectMsg.basepath}+$接口请求路径`;

  const colorArr = entries(constants.PROJECT_COLOR);
  const colorSelector = (
    <div className="change-project-popover-title">
      <RadioGroup onChange={changeProjectColor} value={projectMsg.color} className="color">
        {colorArr.map((item, index) => {
          return (
            <RadioButton
              key={index}
              value={item[0]}
              className="change-project-radio-button"
              style={{ backgroundColor: item[1], color: '#fff', fontWeight: 'bold' }}
            >
              {item[0] === projectMsg.color ? <Icon name="check" /> : null}
            </RadioButton>
          );
        })}
      </RadioGroup>
    </div>
  );
  const iconSelector = (
    <div className="change-project-popover-content">
      <RadioGroup onChange={changeProjectIcon} value={projectMsg.icon} className="icon">
        {constants.PROJECT_ICON.map(item => {
          return (
            <RadioButton
              key={item}
              value={item}
              className="change-project-radio-button"
              style={{ fontWeight: 'bold' }}
            >
              <Icon name={item} />
            </RadioButton>
          );
        })}
      </RadioGroup>
    </div>
  );
  const selectDisabled = !(projectMsg.role === 'owner' || projectMsg.role === 'admin');

  return (
    <div>
      <div className="m-panel">
        <Row className="project-setting">
          <Col xs={6} lg={{ offset: 1, span: 3 }} className="setting-logo">
            <Popover
              placement="bottom"
              title={colorSelector}
              content={iconSelector}
              trigger="click"
              overlayClassName="change-project-container"
            >
              <Icon
                name={projectMsg.icon || 'star-o'}
                className="ui-logo"
                style={{
                  backgroundColor:
                    constants.PROJECT_COLOR[projectMsg.color] || constants.PROJECT_COLOR.blue
                }}
              />
            </Popover>
          </Col>
          <Col xs={18} sm={15} lg={19} className="setting-intro">
            <h2 className="ui-title">
              {(currGroup.group_name || '') + ' / ' + (projectMsg.name || '')}
            </h2>
          </Col>
        </Row>
        <hr className="breakline" />
        <Form form={form} initialValues={initialValues}>
          <FormItem {...formItemLayout} label="项目ID">
            <span>{projectMsg._id}</span>
          </FormItem>
          <FormItem {...formItemLayout} label="项目名称" name="name" rules={nameLengthLimit('项目')}>
            <Input />
          </FormItem>
          <FormItem
            {...formItemLayout}
            label="所属分组"
            name="group_id"
            rules={[
              {
                required: true,
                message: '请选择项目所属的分组!'
              }
            ]}
          >
            <Select disabled={selectDisabled}>
              {groupList.map((item, index) => (
                <Option value={item._id.toString()} key={index}>
                  {item.group_name}
                </Option>
              ))}
            </Select>
          </FormItem>

          <FormItem
            {...formItemLayout}
            label={
              <span>
                接口基本路径&nbsp;
                <Tooltip title="基本路径为空表示根路径">
                  <Icon name="question-circle-o" />
                </Tooltip>
              </span>
            }
            name="basepath"
            rules={[
              {
                required: false,
                message: '请输入基本路径! '
              }
            ]}
          >
            <Input />
          </FormItem>

          <FormItem
            {...formItemLayout}
            label={
              <span>
                MOCK地址&nbsp;
                <Tooltip title="具体使用方法请查看文档">
                  <Icon name="question-circle-o" />
                </Tooltip>
              </span>
            }
          >
            <Input disabled value={mockUrl} onChange={() => {}} />
          </FormItem>

          <FormItem
            {...formItemLayout}
            label="描述"
            name="desc"
            rules={[
              {
                required: false
              }
            ]}
          >
            <TextArea rows={8} />
          </FormItem>

          <FormItem
            {...formItemLayout}
            label={
              <span>
                tag 信息&nbsp;
                <Tooltip title="定义 tag 信息，过滤接口">
                  <Icon name="question-circle-o" />
                </Tooltip>
              </span>
            }
          >
            <ProjectTag tagMsg={projectMsg.tag} ref={tagRef} />
          </FormItem>
          <FormItem
            {...formItemLayout}
            label={
              <span>
                mock严格模式&nbsp;
                <Tooltip title="开启后 mock 请求会对 query，body form 的必须字段和 json schema 进行校验">
                  <Icon name="question-circle-o" />
                </Tooltip>
              </span>
            }
            name="strice"
            valuePropName="checked"
          >
            <Switch checkedChildren="开" unCheckedChildren="关" />
          </FormItem>
          <FormItem
            {...formItemLayout}
            label={
              <span>
                开启json5&nbsp;
                <Tooltip title="开启后可在接口 body 和返回值中写 json 字段">
                  <Icon name="question-circle-o" />
                </Tooltip>
              </span>
            }
            name="is_json5"
            valuePropName="checked"
          >
            <Switch checkedChildren="开" unCheckedChildren="关" />
          </FormItem>
          <FormItem
            {...formItemLayout}
            label="默认开启消息通知"
            name="switch_notice"
            valuePropName="checked"
          >
            <Switch checkedChildren="开" unCheckedChildren="关" />
          </FormItem>

          <FormItem
            {...formItemLayout}
            label="权限"
            name="project_type"
            rules={[
              {
                required: true
              }
            ]}
          >
            <RadioGroup>
              <Radio value="private" className="radio">
                <Icon name="lock" />
                私有
                <br />
                <span className="radio-desc">只有组长和项目开发者可以索引并查看项目信息</span>
              </Radio>
              <br />
              {projectMsg.role === 'admin' && (
                <Radio value="public" className="radio">
                  <Icon name="unlock" />
                  公开
                  <br />
                  <span className="radio-desc">任何人都可以索引并查看项目信息</span>
                </Radio>
              )}
            </RadioGroup>
          </FormItem>
        </Form>

        <div className="btnwrap-changeproject">
          <Button
            className="m-btn btn-save"
            icon={<Icon name="save" />}
            type="primary"
            size="large"
            onClick={handleOk}
          >
            保 存
          </Button>
        </div>

        {projectMsg.role === 'owner' || projectMsg.role === 'admin' ? (
          <div className="danger-container">
            <div className="title">
              <h2 className="content">
                <Icon name="exclamation-circle-o" /> 危险操作
              </h2>
              <Button onClick={toggleDangerOptions}>
                查 看<Icon name={showDangerOptions ? 'up' : 'down'} />
              </Button>
            </div>
            {showDangerOptions ? (
              <Card
                hoverable={true}
                className="card-danger"
                bodyStyle={{ display: 'flex', alignItems: 'center', padding: '0.24rem' }}
              >
                <div className="card-danger-content">
                  <h3>删除项目</h3>
                  <p>项目一旦删除，将无法恢复数据，请慎重操作！</p>
                  <p>只有组长和管理员有权限删除项目。</p>
                </div>
                <Button type="danger" ghost className="card-danger-btn" onClick={showConfirm}>
                  删除
                </Button>
              </Card>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
};

ProjectMessage.propTypes = {
  projectId: PropTypes.number,
  updateProject: PropTypes.func,
  delProject: PropTypes.func,
  getProject: PropTypes.func,
  fetchGroupMsg: PropTypes.func,
  upsetProject: PropTypes.func,
  groupList: PropTypes.array,
  projectMsg: PropTypes.object,
  fetchGroupList: PropTypes.func,
  currGroup: PropTypes.object,
  setBreadcrumb: PropTypes.func
};

export default connect(
  state => {
    return {
      groupList: state.group.groupList,
      projectMsg: state.project.currProject,
      currGroup: state.group.currGroup
    };
  },
  {
    updateProject,
    delProject,
    getProject,
    fetchGroupMsg,
    upsetProject,
    fetchGroupList,
    setBreadcrumb
  }
)(ProjectMessage);
