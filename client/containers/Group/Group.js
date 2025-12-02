import React, { PureComponent as Component } from 'react';
import GroupList from './GroupList/GroupList.js';
import ProjectList from './ProjectList/ProjectList.js';
import MemberList from './MemberList/MemberList.js';
import GroupLog from './GroupLog/GroupLog.js';
import GroupSetting from './GroupSetting/GroupSetting.js';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Route, Switch, Redirect } from 'react-router-dom';
import { Tabs, Layout, Spin } from 'antd';
const { Content, Sider } = Layout;
import { fetchNewsData } from '../../reducer/modules/news.js';
import {
  setCurrGroup
} from '../../reducer/modules/group';
import './Group.scss';
import axios from 'axios'

@connect(
  state => {
    return {
      curGroupId: state.group.currGroup._id,
      curUserRole: state.user.role,
      curUserRoleInGroup: state.group.currGroup.role || state.group.role,
      currGroup: state.group.currGroup
    };
  },
  {
    fetchNewsData: fetchNewsData,
    setCurrGroup
  }
)
export default class Group extends Component {
  constructor(props) {
    super(props);

    this.state = {
      groupId: -1
    }
  }

  async componentDidMount(){
    let r = await axios.get('/api/group/get_mygroup')
    try{
      let group = r.data.data;
      this.setState({
        groupId: group._id
      })
      this.props.setCurrGroup(group)
    }catch(e){
      console.error(e)
    }
  }

  static propTypes = {
    fetchNewsData: PropTypes.func,
    curGroupId: PropTypes.number,
    curUserRole: PropTypes.string,
    currGroup: PropTypes.object,
    curUserRoleInGroup: PropTypes.string,
    setCurrGroup: PropTypes.func
  };
  // onTabClick=(key)=> {
  //   // if (key == 3) {
  //   //   this.props.fetchNewsData(this.props.curGroupId, "group", 1, 10)
  //   // }
  // }
  render() {
    if(this.state.groupId === -1)return <Spin />
    const GroupContent = (
      <Layout style={{ minHeight: 'calc(100vh - 100px)', marginLeft: '24px', marginTop: '24px' }}>
        <Sider style={{ height: '100%' }} width={300}>
          <div className="logo" />
          <GroupList />
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
            <Tabs
              type="card"
              className="m-tab tabs-large"
              style={{ height: '100%' }}
              items={[
                { key: '1', label: '项目列表', children: <ProjectList /> },
                ...(this.props.currGroup.type === 'public'
                  ? [{ key: '2', label: '成员列表', children: <MemberList /> }]
                  : []),
                ...((['admin', 'owner', 'guest', 'dev'].indexOf(this.props.curUserRoleInGroup) > -1 ||
                  this.props.curUserRole === 'admin')
                  ? [{ key: '3', label: '分组动态', children: <GroupLog /> }]
                  : []),
                ...(((this.props.curUserRole === 'admin' ||
                  this.props.curUserRoleInGroup === 'owner') &&
                  this.props.currGroup.type !== 'private')
                  ? [{ key: '4', label: '分组设置', children: <GroupSetting /> }]
                  : [])
              ]}
            />
          </Content>
        </Layout>
      </Layout>
    );
    return (
      <div className="projectGround">
        <Switch>
          <Redirect exact from="/group" to={"/group/" + this.state.groupId} />
          <Route path="/group/:groupId" render={() => GroupContent} />
        </Switch>
      </div>
    );
  }
}
