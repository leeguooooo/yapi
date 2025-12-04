import React, { PureComponent as Component } from 'react';
import PropTypes from 'prop-types';
import { Tabs, Layout } from 'antd';
import { connect } from 'react-redux';
const { Content, Sider } = Layout;

import './interface.scss';

import InterfaceMenu from './InterfaceList/InterfaceMenu.js';
import InterfaceList from './InterfaceList/InterfaceList.js';
import InterfaceContent from './InterfaceList/InterfaceContent.js';

import InterfaceColMenu from './InterfaceCol/InterfaceColMenu.js';
import InterfaceColContent from './InterfaceCol/InterfaceColContent.js';
import InterfaceCaseContent from './InterfaceCol/InterfaceCaseContent.js';
import { getProject } from '../../../reducer/modules/project';
import { setColData } from '../../../reducer/modules/interfaceCol.js';
@connect(
  state => {
    return {
      isShowCol: state.interfaceCol.isShowCol
    };
  },
  {
    setColData,
    getProject
  }
)
class Interface extends Component {
  static propTypes = {
    match: PropTypes.object,
    history: PropTypes.object,
    location: PropTypes.object,
    isShowCol: PropTypes.bool,
    getProject: PropTypes.func,
    setColData: PropTypes.func
    // fetchInterfaceColList: PropTypes.func
  };

  constructor(props) {
    super(props);
    // this.state = {
    //   curkey: this.props.match.params.action === 'api' ? 'api' : 'colOrCase'
    // }
  }

  onChange = action => {
    let params = this.props.match.params;
    if (action === 'colOrCase') {
      action = this.props.isShowCol ? 'col' : 'case';
    }
    this.props.history.push('/project/' + params.id + '/interface/' + action);
  };
  componentDidMount() {
    this.props.setColData({
      isShowCol: true
    });
    // await this.props.fetchInterfaceColList(this.props.match.params.id)
  }
  render() {
    const pathname = this.props.location?.pathname || '';
    const match = pathname.match(/project\/(\d+)\/interface\/(\w+)(?:\/([^/]+))?/);
    const params = {
      id: this.props.match.params.id,
      action: match ? match[2] : 'api',
      actionId: match ? match[3] : undefined
    };
    const { action, actionId } = params;
    // const activeKey = this.state.curkey;
    const activeKey = action === 'api' ? 'api' : 'colOrCase';

    let ContentComponent = InterfaceList;
    if (action === 'api') {
      if (actionId && !isNaN(actionId)) {
        ContentComponent = InterfaceContent;
      } else if (actionId && actionId.indexOf('cat_') === 0) {
        ContentComponent = InterfaceList;
      } else {
        ContentComponent = InterfaceList;
      }
    } else if (action === 'col') {
      ContentComponent = InterfaceColContent;
    } else if (action === 'case') {
      ContentComponent = InterfaceCaseContent;
    } else {
      this.props.history.replace('/project/' + params.id + '/interface/api');
    }

    return (
      <Layout
        style={{
          minHeight: 'calc(100vh - 156px)',
          marginLeft: '24px',
          marginTop: '24px',
          background: 'transparent'
        }}
      >
        <Sider
          theme="light"
          style={{ height: '100%', background: '#f5f7fb', paddingRight: '0' }}
          width={300}
        >
          <div className="left-menu">
            <Tabs
              type="card"
              className="tabs-large"
              activeKey={activeKey}
              onChange={this.onChange}
              items={[
                { key: 'api', label: '接口列表' },
                { key: 'colOrCase', label: '测试集合' }
              ]}
            />
            {activeKey === 'api' ? (
              <InterfaceMenu
                router={{ params }}
                projectId={params.id}
              />
            ) : (
              <InterfaceColMenu
                router={{ params }}
                projectId={params.id}
              />
            )}
          </div>
        </Sider>
        <Layout>
          <Content
            style={{
              height: '100%',
              margin: '0 24px 0 16px',
              overflow: 'initial',
              backgroundColor: '#fff'
            }}
          >
            <div className="right-content">
              <ContentComponent
                {...this.props}
                match={{ params }}
                router={{ params }}
              />
            </div>
          </Content>
        </Layout>
      </Layout>
    );
  }
}

export default Interface;
