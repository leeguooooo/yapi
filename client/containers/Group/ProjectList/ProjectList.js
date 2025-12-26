import React, { PureComponent as Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Row, Col, Button, Tooltip, Space, Card } from 'antd';
import { Link } from 'react-router-dom';
import {
  addProject,
  fetchProjectList,
  delProject
} from '../../../reducer/modules/project';
import ProjectCard from '../../../components/ProjectCard/ProjectCard.js';
import ErrMsg from '../../../components/ErrMsg/ErrMsg.js';
import { autobind } from 'core-decorators';
import { setBreadcrumb } from '../../../reducer/modules/user';

import './ProjectList.scss';

@connect(
  state => {
    return {
      projectList: state.project.projectList,
      userInfo: state.project.userInfo,
      tableLoading: state.project.tableLoading,
      currGroup: state.group.currGroup,
      currPage: state.project.currPage
    };
  },
  {
    fetchProjectList,
    addProject,
    delProject,
    setBreadcrumb
  }
)
class ProjectList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      visible: false,
      protocol: 'http://',
      projectData: []
    };
  }
  static propTypes = {
    form: PropTypes.object,
    fetchProjectList: PropTypes.func,
    addProject: PropTypes.func,
    delProject: PropTypes.func,
    projectList: PropTypes.array,
    userInfo: PropTypes.object,
    tableLoading: PropTypes.bool,
    currGroup: PropTypes.object,
    setBreadcrumb: PropTypes.func,
    currPage: PropTypes.number,
    studyTip: PropTypes.number,
    study: PropTypes.bool
  };

  // 取消修改
  @autobind
  handleCancel() {
    this.props.form.resetFields();
    this.setState({
      visible: false
    });
  }

  // 修改线上域名的协议类型 (http/https)
  @autobind
  protocolChange(value) {
    this.setState({
      protocol: value
    });
  }

  // 获取 ProjectCard 组件的关注事件回调，收到后更新数据

  receiveRes = () => {
    this.props.fetchProjectList(this.props.currGroup._id, this.props.currPage);
  };

  componentDidUpdate(nextProps) {
    this.props.setBreadcrumb([{ name: '' + (nextProps.currGroup.group_name || '') }]);

    // 切换分组
    if (this.props.currGroup !== nextProps.currGroup && nextProps.currGroup._id) {
      this.props.fetchProjectList(nextProps.currGroup._id, this.props.currPage);
    }

    // 切换项目列表
    if (this.props.projectList !== nextProps.projectList) {
      // console.log(nextProps.projectList);
      const data = nextProps.projectList.map((item, index) => {
        item.key = index;
        return item;
      });
      this.setState({
        projectData: data
      });
    }
  }

  render() {
    let projectData = this.state.projectData;
    let noFollow = [];
    let followProject = [];
    for (var i in projectData) {
      if (projectData[i].follow) {
        followProject.push(projectData[i]);
      } else {
        noFollow.push(projectData[i]);
      }
    }
    followProject = followProject.sort((a, b) => {
      return b.up_time - a.up_time;
    });
    noFollow = noFollow.sort((a, b) => {
      return b.up_time - a.up_time;
    });
    projectData = [...followProject, ...noFollow];

    const isShow = /(admin)|(owner)|(dev)/.test(this.props.currGroup.role);

    const Follow = () => {
      return followProject.length ? (
        <Row gutter={[24, 24]} align="top">
          <Col span={24}>
            <h3 className="owner-type">我的关注</h3>
          </Col>
          {followProject.map((item, index) => {
            return (
              <Col xs={24} sm={12} md={8} lg={6} xl={4} xxl={4} key={index}>
                <ProjectCard projectData={item} callbackResult={this.receiveRes} />
              </Col>
            );
          })}
        </Row>
      ) : null;
    };
    const NoFollow = () => {
      return noFollow.length ? (
        <Row
          gutter={[24, 24]}
          align="top"
          style={{ borderBottom: '1px solid #eee', marginBottom: '15px' }}
        >
          <Col span={24}>
            <h3 className="owner-type">我的项目</h3>
          </Col>
          {noFollow.map((item, index) => {
            return (
              <Col xs={24} sm={12} md={8} lg={6} xl={4} xxl={4} key={index}>
                <ProjectCard projectData={item} callbackResult={this.receiveRes} isShow={isShow} />
              </Col>
            );
          })}
        </Row>
      ) : null;
    };

    const OwnerSpace = () => {
      return projectData.length ? (
        <div>
          <NoFollow />
          <Follow />
        </div>
      ) : (
        <ErrMsg type="noProject" />
      );
    };

    return (
      <div className="m-panel card-panel card-panel-s project-list">
        <Card bordered={false} className="project-list-card" bodyStyle={{ padding: 12 }}>
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Row className="project-list-header" align="middle" justify="space-between">
              <Col>
                <Space size="middle" align="center">
                  <span className="project-list-title">
                    {this.props.currGroup.group_name} 分组
                  </span>
                  <span className="project-list-count">共 ({projectData.length}) 个项目</span>
                </Space>
              </Col>
              <Col>
                {isShow ? (
                  <Link to="/add-project">
                    <Button type="primary" icon={<i className="anticon anticon-plus" />}>
                      添加项目
                    </Button>
                  </Link>
                ) : (
                  <Tooltip title="您没有权限,请联系该分组组长或管理员">
                    <Button type="primary" disabled icon={<i className="anticon anticon-plus" />}>
                      添加项目
                    </Button>
                  </Tooltip>
                )}
              </Col>
            </Row>

            <div className="project-list-content">
              {this.props.currGroup.type === 'private' ? (
                <OwnerSpace />
              ) : projectData.length ? (
                <Row
                  gutter={[16, 16]}
                  justify="start"
                  align="top"
                  style={{ marginLeft: 0, marginRight: 0 }}
                >
                  {projectData.map((item, index) => (
                    <Col xs={24} sm={12} md={8} lg={6} xl={5} xxl={4} key={index}>
                      <ProjectCard
                        projectData={item}
                        callbackResult={this.receiveRes}
                        isShow={isShow}
                      />
                    </Col>
                  ))}
                </Row>
              ) : (
                <div className="no-project-wrapper">
                  <ErrMsg type="noProject" />
                </div>
              )}
            </div>
          </Space>
        </Card>
      </div>
    );
  }
}

export default ProjectList;
