import React, { PureComponent as Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Input, AutoComplete } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import './Search.scss';
import { useNavigate } from 'react-router-dom';
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
class Srch extends Component {
  constructor(props) {
    super(props);
    this.state = {
      options: [],
      open: false,
      value: ''
    };
  }

  static propTypes = {
    groupList: PropTypes.array,
    projectList: PropTypes.array,
    router: PropTypes.object,
    location: PropTypes.object,
    setCurrGroup: PropTypes.func,
    changeMenuItem: PropTypes.func,
    fetchInterfaceListMenu: PropTypes.func,
    fetchGroupMsg: PropTypes.func
  };

  onSelect = async (value, option) => {
    const { type } = option;
    this.setState({ open: false, value: '', options: [] });
    if (type === '分组') {
      this.props.changeMenuItem('/group');
      this.props.router.navigate('/group/' + option.id);
      this.props.setCurrGroup({ group_name: value, _id: option.id - 0 });
    } else if (type === '项目') {
      await this.props.fetchGroupMsg(option.groupId);
      this.props.router.navigate('/project/' + option.id);
    } else if (type === '接口') {
      await this.props.fetchInterfaceListMenu(option.projectId);
      this.props.router.navigate('/project/' + option.projectId + '/interface/api/' + option.id);
    }
  };

  handleSearch = value => {
    const query = value.trim();
    this.setState({ value });

    if (!query) {
      this.setState({ options: [], open: false });
      return;
    }

    axios
      .get('/api/project/search?q=' + encodeURIComponent(query))
      .then(res => {
        if (this.state.value.trim() !== query) {
          return;
        }
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
            options,
            open: options.length > 0
          });
        } else {
          this.setState({ options: [], open: false });
          console.log('查询项目或分组失败');
        }
      })
      .catch(err => {
        this.setState({ options: [], open: false });
        console.log(err);
      });
  };

  handleFocus = () => {
    const { value, options } = this.state;
    if (value.trim() && options.length > 0) {
      this.setState({ open: true });
    }
  };

  handleBlur = () => {
    this.setState({ open: false });
  };

  render() {
    const { options, open, value } = this.state;
    const searchWidth = 180;

    return (
      <div className="search-wrapper" style={{ width: searchWidth }}>
        <AutoComplete
          options={options}
          style={{ width: '100%' }}
          defaultActiveFirstOption={false}
          onSelect={this.onSelect}
          onSearch={this.handleSearch}
          value={value}
          filterOption={false}
          open={open}
        >
          <Input
            prefix={<SearchOutlined />}
            placeholder="搜索分组/项目/接口"
            allowClear
            onFocus={this.handleFocus}
            onBlur={this.handleBlur}
          />
        </AutoComplete>
      </div>
    );
  }
}

function SrchWithRouter(props) {
  const navigate = useNavigate();
  return <Srch {...props} router={{ navigate }} />;
}

export default SrchWithRouter;
