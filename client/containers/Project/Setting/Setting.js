import React, { PureComponent as Component } from 'react';
import { Tabs } from 'antd';
import PropTypes from 'prop-types';
import ProjectMessage from './ProjectMessage/ProjectMessage.js';
import ProjectEnv from './ProjectEnv/index.js';
import ProjectRequest from './ProjectRequest/ProjectRequest';
import ProjectToken from './ProjectToken/ProjectToken';
import ProjectMock from './ProjectMock/index.js';
import { connect } from 'react-redux';
import plugin from 'client/plugin.js';

const routers = {}

import './Setting.scss';

@connect(state => {
  return {
    curProjectRole: state.project.currProject.role
  };
})
class Setting extends Component {
  static propTypes = {
    match: PropTypes.object,
    curProjectRole: PropTypes.string
  };
  render() {
    const id = this.props.match.params.id;
    plugin.emitHook('sub_setting_nav', routers);
    return (
      <div className="g-row">
        <Tabs
          type="card"
          className="has-affix-footer tabs-large"
          items={[
            { key: '1', label: '项目配置', children: <ProjectMessage projectId={+id} /> },
            { key: '2', label: '环境配置', children: <ProjectEnv projectId={+id} /> },
            { key: '3', label: '请求配置', children: <ProjectRequest projectId={+id} /> },
            ...(this.props.curProjectRole !== 'guest'
              ? [
                  {
                    key: '4',
                    label: 'token配置',
                    children: (
                      <ProjectToken projectId={+id} curProjectRole={this.props.curProjectRole} />
                    )
                  }
                ]
              : []),
            { key: '5', label: '全局mock脚本', children: <ProjectMock projectId={+id} /> },
            ...Object.keys(routers).map(key => {
              const C = routers[key].component;
              return { key: routers[key].name, label: routers[key].name, children: <C projectId={+id} /> };
            })
          ]}
        />
      </div>
    );
  }
}

export default Setting;
