import React, { PureComponent as Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { useLocation, useParams } from 'react-router-dom';
// 内部使用 pathname 手动切换，避免 v6 路由匹配不到造成内容空白
import { Subnav } from '../../components/index';
import { fetchGroupMsg } from '../../reducer/modules/group';
import { setBreadcrumb } from '../../reducer/modules/user';
import { getProject } from '../../reducer/modules/project';
import Interface from './Interface/Interface.js';
import Activity from './Activity/Activity.js';
import Setting from './Setting/Setting.js';
import Loading from '../../components/Loading/Loading';
import ProjectMember from './Setting/ProjectMember/ProjectMember.js';
import ProjectData from './Setting/ProjectData/ProjectData.js';
import plugin from 'client/plugin.js';
@connect(
  state => {
    return {
      curProject: state.project.currProject,
      currGroup: state.group.currGroup
    };
  },
  {
    getProject,
    fetchGroupMsg,
    setBreadcrumb
  }
)
class Project extends Component {
  static propTypes = {
    projectId: PropTypes.string,
    curProject: PropTypes.object,
    getProject: PropTypes.func,
    location: PropTypes.object,
    fetchGroupMsg: PropTypes.func,
    setBreadcrumb: PropTypes.func,
    currGroup: PropTypes.object
  };

  constructor(props) {
    super(props);
  }

  loadData = async props => {
    const projectRes = await props.getProject(props.projectId);
    const projectData = (projectRes && projectRes.payload && projectRes.payload.data && projectRes.payload.data.data) || props.curProject;
    let groupData = props.currGroup;
    const groupId = projectData && projectData.group_id;
    if (groupId) {
      const groupRes = await props.fetchGroupMsg(groupId);
      groupData = (groupRes && groupRes.payload && groupRes.payload.data && groupRes.payload.data.data) || groupData;
    }
    props.setBreadcrumb([
      {
        name: groupData ? groupData.group_name : '',
        href: groupData && groupData._id ? '/group/' + groupData._id : undefined
      },
      {
        name: projectData ? projectData.name : ''
      }
    ]);
  };

  async componentDidMount() {
    await this.loadData(this.props);
  }

  async componentDidUpdate(prevProps) {
    if (prevProps.projectId !== this.props.projectId) {
      await this.loadData(this.props);
    }
  }

  render() {
    const { projectId, location, curProject } = this.props;
    const defaultName = 'interface';
    const subnavData = [
      { name: '接口', path: `/project/${projectId}/interface/api` },
      { name: '动态', path: `/project/${projectId}/activity` },
      { name: '数据管理', path: `/project/${projectId}/data` },
      { name: '设置', path: `/project/${projectId}/setting` }
    ];

    let content = null;
    const pathname = location.pathname;
    if (pathname.indexOf('/interface') !== -1) {
      content = <Interface />;
    } else if (pathname.indexOf('/activity') !== -1) {
      content = <Activity />;
    } else if (pathname.indexOf('/data') !== -1) {
      content = <ProjectData />;
    } else if (pathname.indexOf('/setting') !== -1) {
      content = <Setting />;
    } else if (pathname.indexOf('/member') !== -1) {
      content = <ProjectMember />;
    } else {
      content = <Loading visible />;
    }

    const loaded = curProject && curProject._id;

    return (
      <div>
        <Subnav default={defaultName} data={subnavData} />
        <div className="project-content">
          {loaded ? content : <Loading visible />}
        </div>
      </div>
    );
  }
}

function ProjectWithRouter(props) {
  const { id } = useParams();
  const location = useLocation();
  return <Project {...props} projectId={id} location={location} />;
}

export default ProjectWithRouter;
