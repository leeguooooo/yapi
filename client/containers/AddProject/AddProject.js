import React, { PureComponent as Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Icon from 'client/components/Icon';
import { Button, Input, Tooltip, Select, message, Row, Col, Radio, Form } from 'antd';
import { addProject } from '../../reducer/modules/project.js';
import { fetchGroupList } from '../../reducer/modules/group.js';
import { autobind } from 'core-decorators';
import { setBreadcrumb } from '../../reducer/modules/user';
const { TextArea } = Input;
const FormItem = Form.Item;
const Option = Select.Option;
const RadioGroup = Radio.Group;
import { pickRandomProperty, handlePath, nameLengthLimit } from '../../common';
import constants from '../../constants/variable.js';
import { useNavigate } from 'react-router-dom';
import './Addproject.scss';

const formItemLayout = {
  labelCol: {
    lg: { span: 3 },
    xs: { span: 24 },
    sm: { span: 6 }
  },
  wrapperCol: {
    lg: { span: 21 },
    xs: { span: 24 },
    sm: { span: 14 }
  },
  className: 'form-item'
};

@connect(
  state => {
    return {
      groupList: state.group.groupList,
      currGroup: state.group.currGroup
    };
  },
  {
    fetchGroupList,
    addProject,
    setBreadcrumb
  }
)
class ProjectList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      groupList: [],
      currGroupId: null
    };
    this.formRef = React.createRef();
  }
  static propTypes = {
    groupList: PropTypes.array,
    currGroup: PropTypes.object,
    addProject: PropTypes.func,
    router: PropTypes.object,
    setBreadcrumb: PropTypes.func,
    fetchGroupList: PropTypes.func
  };

  handlePath = e => {
    let val = e.target.value;
    this.formRef.current?.setFieldsValue({
      basepath: handlePath(val)
    });
  };

  syncGroupsFromProps(nextProps) {
    const list = nextProps.groupList || [];
    const accessList = list.filter(
      item => item.role === 'dev' || item.role === 'owner' || item.role === 'admin'
    );
    const first = (accessList[0] || list[0])?._id;
    this.setState(
      {
        groupList: list,
        currGroupId: first ? String(first) : null
      },
      () => {
        if (first && this.formRef.current) {
          this.formRef.current.setFieldsValue({ group: String(first) });
        }
      }
    );
  }

  // 确认添加项目
  @autobind
  async handleOk(e) {
    e.preventDefault();
    const { addProject } = this.props;
    if (!this.formRef.current) {
      return;
    }
    try {
      const values = await this.formRef.current.validateFields();
      values.group_id = values.group;
      values.icon = constants.PROJECT_ICON[0];
      values.color = pickRandomProperty(constants.PROJECT_COLOR);
      const res = await addProject(values);
      if (res.payload.data.errcode == 0) {
        this.formRef.current.resetFields();
        this.formRef.current.setFieldsValue({
          group: this.state.currGroupId
            ? String(this.state.currGroupId)
            : undefined,
          project_type: 'private'
        });
        message.success('创建成功! ');
        this.props.router.navigate(
          '/project/' + res.payload.data.data._id + '/interface/api'
        );
      }
    } catch (err) {
      // 表单校验失败会走这里，无需额外处理
    }
  }

  async componentDidMount() {
    this.props.setBreadcrumb([{ name: '新建项目' }]);
    if (!this.props.currGroup._id) {
      await this.props.fetchGroupList();
    }
    if (this.props.groupList.length === 0) {
      return null;
    }
    this.syncGroupsFromProps(this.props);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.groupList !== this.props.groupList) {
      this.syncGroupsFromProps(this.props);
    }
  }

  render() {
    const { groupList, currGroupId } = this.state;
    return (
      <div className="g-row">
        <div className="g-row m-container">
          <Form
            ref={this.formRef}
            initialValues={{
              project_type: 'private',
              group: currGroupId ? String(currGroupId) : undefined
            }}
          >
            <FormItem
              {...formItemLayout}
              label="项目名称"
              name="name"
              rules={nameLengthLimit('项目')}
            >
              <Input />
            </FormItem>

            <FormItem
              {...formItemLayout}
              label="所属分组"
              name="group"
              rules={[
                {
                  required: true,
                  message: '请选择项目所属的分组!'
                }
              ]}
            >
              <Select>
                {groupList.map((item, index) => (
                  <Option
                    disabled={
                      !(item.role === 'dev' || item.role === 'owner' || item.role === 'admin')
                    }
                    value={item._id.toString()}
                    key={index}
                  >
                    {item.group_name}
                  </Option>
                ))}
              </Select>
            </FormItem>

            <hr className="breakline" />

            <FormItem
              {...formItemLayout}
              label={
                <span>
                  基本路径&nbsp;
                  <Tooltip title="接口基本路径，为空是根路径">
                    <Icon name="question-circle-o" />
                  </Tooltip>
                </span>
              }
              name="basepath"
              rules={[
                {
                  required: false,
                  message: '请输入项目基本路径'
                }
              ]}
            >
              <Input onBlur={this.handlePath} />
            </FormItem>

            <FormItem
              {...formItemLayout}
              label="描述"
              name="desc"
              rules={[
                {
                  required: false,
                  message: '描述不超过144字!',
                  max: 144
                }
              ]}
            >
              <TextArea rows={4} />
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
                  <Icon name="lock" />私有<br />
                  <span className="radio-desc">只有组长和项目开发者可以索引并查看项目信息</span>
                </Radio>
                <br />
                {/* <Radio value="public" className="radio">
                    <Icon name="unlock" />公开<br />
                    <span className="radio-desc">任何人都可以索引并查看项目信息</span>
                  </Radio> */}
              </RadioGroup>
            </FormItem>
          </Form>
          <Row>
            <Col sm={{ offset: 6 }} lg={{ offset: 3 }}>
              <Button
                className="m-btn"
                icon={<Icon name="plus" />}
                type="primary"
                onClick={this.handleOk}
              >
                创建项目
              </Button>
            </Col>
          </Row>
        </div>
      </div>
    );
  }
}

function ProjectListWithRouter(props) {
  const navigate = useNavigate();
  return <ProjectList {...props} router={{ navigate }} />;
}

export default ProjectListWithRouter;
