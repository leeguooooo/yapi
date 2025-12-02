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
    const pathname = location?.pathname || '';
    const basePath = `/project/${match.params.id}`;
    let routers = {
      interface: { name: '接口', path: `${basePath}/interface/api`, component: Interface },
      activity: { name: '动态', path: `${basePath}/activity`, component: Activity },
      data: { name: '数据管理', path: `${basePath}/data`, component: ProjectData },
      members: { name: '成员管理', path: `${basePath}/members`, component: ProjectMember },
      setting: { name: '设置', path: `${basePath}/setting`, component: Setting }
    };

    plugin.emitHook('sub_nav', routers);

    let defaultName;
    if (pathname.includes('/interface/')) defaultName = routers.interface.name;
    else if (pathname.includes('/activity')) defaultName = routers.activity.name;
    else if (pathname.includes('/data')) defaultName = routers.data.name;
    else if (pathname.includes('/members')) defaultName = routers.members.name;
    else if (pathname.includes('/setting')) defaultName = routers.setting.name;

    // let subnavData = [{
    //   name: routers.interface.name,
    //   path: `/project/${match.params.id}/interface/api`
    // }, {
    //   name: routers.activity.name,
    //   path: `/project/${match.params.id}/activity`
    // }, {
    //   name: routers.data.name,
    //   path: `/project/${match.params.id}/data`
    // }, {
    //   name: routers.members.name,
    //   path: `/project/${match.params.id}/members`
    // }, {
    //   name: routers.setting.name,
    //   path: `/project/${match.params.id}/setting`
    // }];

    let subnavData = [];
    Object.keys(routers).forEach(key => {
      let item = routers[key];
      let value = {};
      value = {
        name: item.name,
        path: item.path
      };
      subnavData.push(value);
    });

    if (this.props.currGroup.type === 'private') {
      subnavData = subnavData.filter(item => {
        return item.name != '成员管理';
      });
    }

    if (this.props.curProject == null || Object.keys(this.props.curProject).length === 0) {
      return <Loading visible />;
    }

    // 手动选择渲染内容，避免嵌套路由不匹配导致空白
    let content = <Interface {...this.props} />;
    if (pathname.includes('/activity')) content = <Activity {...this.props} />;
    else if (pathname.includes('/data')) content = <ProjectData {...this.props} />;
    else if (pathname.includes('/members') && this.props.currGroup.type !== 'private')
      content = <ProjectMember {...this.props} />;
    else if (pathname.includes('/setting')) content = <Setting {...this.props} />;

    return (
      <div>
        <Subnav default={defaultName} data={subnavData} />
        <div className="project-content">{content}</div>
      </div>
    );
  }
}
