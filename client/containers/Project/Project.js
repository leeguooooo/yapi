import React, { PureComponent as Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
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
export default class Project extends Component {
  static propTypes = {
    match: PropTypes.object,
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
    await props.getProject(props.match.params.id);
    await props.fetchGroupMsg(props.curProject.group_id);
    props.setBreadcrumb([
      {
        name: props.currGroup.group_name,
        href: '/group/' + props.currGroup._id
      },
      {
        name: props.curProject.name
      }
    ]);
  };

  async componentDidMount() {
    await this.loadData(this.props);
  }

  async componentDidUpdate(prevProps) {
    if (prevProps.match.params.id !== this.props.match.params.id) {
      await this.loadData(this.props);
    }
  }

  render() {
    const { match, location } = this.props;
    const defaultName = 'interface';
    const subnavData = [
      { name: '接口', path: `/project/${match.params.id}/interface/api` },
      { name: '动态', path: `/project/${match.params.id}/activity` },
      { name: '数据管理', path: `/project/${match.params.id}/data` },
      { name: '设置', path: `/project/${match.params.id}/setting` }
    ];

    let content = null;
    const pathname = location.pathname;
    if (pathname.indexOf('/interface') !== -1) {
      content = <Interface match={match} location={location} />;
    } else if (pathname.indexOf('/activity') !== -1) {
      content = <Activity match={match} />;
    } else if (pathname.indexOf('/data') !== -1) {
      content = <ProjectData match={match} />;
    } else if (pathname.indexOf('/setting') !== -1) {
      content = <Setting match={match} />;
    } else if (pathname.indexOf('/member') !== -1) {
      content = <ProjectMember match={match} />;
    } else {
      content = <Loading visible />;
    }

    return (
      <div>
        <Subnav default={defaultName} data={subnavData} />
        <div className="project-content">{content}</div>
      </div>
    );
  }
}
