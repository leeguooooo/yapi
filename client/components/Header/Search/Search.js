import React, { PureComponent as Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Input, AutoComplete } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import './Search.scss';
import { withRouter } from 'react-router-dom';
import axios from 'axios';
import { setCurrGroup, fetchGroupMsg } from '../../../reducer/modules/group';
import { changeMenuItem } from '../../../reducer/modules/menu';

import { fetchInterfaceListMenu } from '../../../reducer/modules/interface';
@connect(
  state => ({
    groupList: state.group.groupList,
    projectList: state.project.projectList
  }),
  {
    setCurrGroup,
    changeMenuItem,
    fetchGroupMsg,
    fetchInterfaceListMenu
  }
)
@withRouter
export default class Srch extends Component {
  constructor(props) {
    super(props);
    this.state = {
      options: []
    };
  }

  static propTypes = {
    groupList: PropTypes.array,
    projectList: PropTypes.array,
    router: PropTypes.object,
    history: PropTypes.object,
    location: PropTypes.object,
    setCurrGroup: PropTypes.func,
    changeMenuItem: PropTypes.func,
    fetchInterfaceListMenu: PropTypes.func,
    fetchGroupMsg: PropTypes.func
  };

  onSelect = async (value, option) => {
    const { type } = option;
    if (type === '分组') {
      this.props.changeMenuItem('/group');
      this.props.history.push('/group/' + option.id);
      this.props.setCurrGroup({ group_name: value, _id: option.id - 0 });
    } else if (type === '项目') {
      await this.props.fetchGroupMsg(option.groupId);
      this.props.history.push('/project/' + option.id);
    } else if (type === '接口') {
      await this.props.fetchInterfaceListMenu(option.projectId);
      this.props.history.push(
        '/project/' + option.projectId + '/interface/api/' + option.id
      );
    }
  };

  handleSearch = value => {
    axios
      .get('/api/project/search?q=' + value)
      .then(res => {
        if (res.data && res.data.errcode === 0) {
          const options = [];
          for (let title in res.data.data) {
            res.data.data[title].map(item => {
              switch (title) {
                case 'group':
                  options.push({
                    label: `分组: ${item.groupName}`,
                    value: `${item.groupName}`,
                    type: '分组',
                    id: `${item._id}`
                  });
                  break;
                case 'project':
                  options.push({
                    label: `项目: ${item.name}`,
                    value: `${item.name}`,
                    type: '项目',
                    id: `${item._id}`,
                    groupId: `${item.groupId}`
                  });
                  break;
                case 'interface':
                  options.push({
                    label: `接口: ${item.title}`,
                    value: `${item.title}`,
                    type: '接口',
                    id: `${item._id}`,
                    projectId: `${item.projectId}`
                  });
                  break;
                default:
                  break;
              }
            });
          }
          this.setState({
            options
          });
        } else {
          console.log('查询项目或分组失败');
        }
      })
      .catch(err => {
        console.log(err);
      });
  };

  // getDataSource(groupList){
  //   const groupArr =[];
  //   groupList.forEach(item =>{
  //     groupArr.push("group: "+ item["group_name"]);
  //   })
  //   return groupArr;
  // }

  render() {
    const { options } = this.state;

    return (
      <div className="search-wrapper">
        <AutoComplete
          className="search-dropdown"
          options={options}
          style={{ width: '100%' }}
          defaultActiveFirstOption={false}
          onSelect={this.onSelect}
          onSearch={this.handleSearch}
          filterOption={false}
          // filterOption={(inputValue, option) =>
          //   option.props.children.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
          // }
        >
          <Input
            prefix={<Icon type="search" className="srch-icon" />}
            prefix={<SearchOutlined className="srch-icon" />}
            placeholder="搜索分组/项目/接口"
            className="search-input"
          />
        </AutoComplete>
      </div>
    );
  }
}
