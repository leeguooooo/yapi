import './ProjectCard.scss';
import React, { PureComponent as Component } from 'react';
import { Card, Tooltip, Modal, Alert, Input, message, Avatar } from 'antd';
import { FolderOpenOutlined, StarFilled, StarOutlined, CopyOutlined } from '@ant-design/icons';
import { connect } from 'react-redux';
import { delFollow, addFollow } from '../../reducer/modules/follow';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { debounce } from '../../common';
import constants from '../../constants/variable.js';
import { produce } from 'immer';
import { getProject, checkProjectName, copyProjectMsg } from '../../reducer/modules/project';
import { trim } from '../../common.js';
const confirm = Modal.confirm;

@connect(
  state => {
    return {
      uid: state.user.uid,
      currPage: state.project.currPage
    };
  },
  {
    delFollow,
    addFollow,
    getProject,
    checkProjectName,
    copyProjectMsg
  }
)
class ProjectCard extends Component {
  constructor(props) {
    super(props);
    this.add = debounce(this.add, 400);
    this.del = debounce(this.del, 400);
  }

  static propTypes = {
    projectData: PropTypes.object,
    uid: PropTypes.number,
    inFollowPage: PropTypes.bool,
    callbackResult: PropTypes.func,
    router: PropTypes.object,
    delFollow: PropTypes.func,
    addFollow: PropTypes.func,
    isShow: PropTypes.bool,
    getProject: PropTypes.func,
    checkProjectName: PropTypes.func,
    copyProjectMsg: PropTypes.func,
    currPage: PropTypes.number
  };

  copy = async projectName => {
    const id = this.props.projectData._id;

    let projectData = await this.props.getProject(id);
    let data = projectData.payload.data.data;
    let newData = produce(data, draftData => {
      draftData.preName = draftData.name;
      draftData.name = projectName;
    });

    await this.props.copyProjectMsg(newData);
    message.success('项目复制成功');
    this.props.callbackResult();
  };

  // 复制项目的二次确认
  showConfirm = () => {
    const that = this;

    confirm({
      title: '确认复制 ' + that.props.projectData.name + ' 项目吗？',
      okText: '确认',
      cancelText: '取消',
      content: (
        <div style={{ marginTop: '10px', fontSize: '13px', lineHeight: '25px' }}>
          <Alert
            message={`该操作将会复制 ${
              that.props.projectData.name
            } 下的所有接口集合，但不包括测试集合中的接口`}
            type="info"
          />
          <div style={{ marginTop: '16px' }}>
            <p>
              <b>项目名称:</b>
            </p>
            <Input id="project_name" placeholder="项目名称" />
          </div>
        </div>
      ),
      async onOk() {
        const projectName = trim(document.getElementById('project_name').value);

        // 查询项目名称是否重复
        const group_id = that.props.projectData.group_id;
        await that.props.checkProjectName(projectName, group_id);
        that.copy(projectName);
      },
      icon: <CopyOutlined />,
      onCancel() {}
    });
  };

  del = () => {
    const id = this.props.projectData.projectid || this.props.projectData._id;
    this.props.delFollow(id).then(res => {
      if (res.payload.data.errcode === 0) {
        this.props.callbackResult();
        // message.success('已取消关注！');  // 星号已做出反馈 无需重复提醒用户
      }
    });
  };

  add = () => {
    const { uid, projectData } = this.props;
    const param = {
      uid,
      projectid: projectData._id,
      projectname: projectData.name,
      icon: projectData.icon || constants.PROJECT_ICON[0],
      color: projectData.color || constants.PROJECT_COLOR.blue
    };
    this.props.addFollow(param).then(res => {
      if (res.payload.data.errcode === 0) {
        this.props.callbackResult();
        // message.success('已添加关注！');  // 星号已做出反馈 无需重复提醒用户
      }
    });
  };

  render() {
    const { projectData, inFollowPage, isShow } = this.props;
    const goDetail = () =>
      this.props.router.navigate('/project/' + (projectData.projectid || projectData._id));

    const starAction = (
      <Tooltip
        placement="top"
        title={projectData.follow || inFollowPage ? '取消关注' : '添加关注'}
      >
        {projectData.follow || inFollowPage ? (
          <StarFilled
            className="action-icon active"
            onClick={e => {
              e.stopPropagation();
              this.del();
            }}
          />
        ) : (
          <StarOutlined
            className="action-icon"
            onClick={e => {
              e.stopPropagation();
              this.add();
            }}
          />
        )}
      </Tooltip>
    );

    const copyAction =
      isShow &&
      this.showConfirm && (
        <Tooltip placement="top" title="复制项目">
          <CopyOutlined
            className="action-icon"
            onClick={e => {
              e.stopPropagation();
              this.showConfirm();
            }}
          />
        </Tooltip>
      );

    return (
      <Card
        hoverable
        bordered={false}
        className="m-card"
        bodyStyle={{ padding: 0 }}
        onClick={goDetail}
        actions={[starAction, copyAction].filter(Boolean)}
      >
        <div className="m-card-body">
          <div className="card-meta">
            <Avatar
              shape="square"
              size={48}
              style={{
                backgroundColor:
                  constants.PROJECT_COLOR[projectData.color] || constants.PROJECT_COLOR.blue
              }}
              icon={<FolderOpenOutlined />}
            />
            <div className="card-title" title={projectData.name || projectData.projectname}>
              {projectData.name || projectData.projectname}
            </div>
          </div>
        </div>
      </Card>
    );
  }
}

function ProjectCardWithRouter(props) {
  const navigate = useNavigate();
  return <ProjectCard {...props} router={{ navigate }} />;
}

export default ProjectCardWithRouter;
