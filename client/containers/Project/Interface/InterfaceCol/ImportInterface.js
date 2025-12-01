import React, { PureComponent as Component } from 'react';
import PropTypes from 'prop-types';
import { Table, Select, Tooltip } from 'antd';
import { Icon } from '@ant-design/compatible';
import variable from '../../../../constants/variable';
import { connect } from 'react-redux';
const Option = Select.Option;
import { fetchInterfaceListMenu } from '../../../../reducer/modules/interface.js';

const buildTableTree = (cats = []) =>
  cats.map(cat => ({
    key: 'category_' + cat._id,
    _id: cat._id,
    title: cat.name,
    isCategory: true,
    children: [
      ...(buildTableTree(cat.children || [])),
      ...(Array.isArray(cat.list)
        ? cat.list.map(e => ({
            ...e,
            key: e._id,
            isCategory: false
          }))
        : [])
    ]
  }));

const collectInterfaceIds = node => {
  if (!node) return [];
  if (!node.isCategory) return [node._id];
  return (node.children || []).reduce((acc, child) => acc.concat(collectInterfaceIds(child)), []);
};

const collectAllInterfaceIds = nodes =>
  nodes.reduce((acc, node) => acc.concat(collectInterfaceIds(node)), []);

const collectSelectedCategoryKeys = (nodes, selectedSet) => {
  let keys = [];
  nodes.forEach(node => {
    if (node.isCategory) {
      const ids = collectInterfaceIds(node);
      if (ids.length && ids.every(id => selectedSet.has(id))) {
        keys.push(node.key);
      }
      keys = keys.concat(collectSelectedCategoryKeys(node.children || [], selectedSet));
    }
  });
  return keys;
};

@connect(
  state => {
    return {
      projectList: state.project.projectList,
      list: state.inter.list
    };
  },
  {
    fetchInterfaceListMenu
  }
)
export default class ImportInterface extends Component {
  constructor(props) {
    super(props);
  }

  state = {
    selectedRowKeys: [],
    project: this.props.currProjectId
  };

  static propTypes = {
    list: PropTypes.array,
    selectInterface: PropTypes.func,
    projectList: PropTypes.array,
    currProjectId: PropTypes.string,
    fetchInterfaceListMenu: PropTypes.func
  };

  async componentDidMount() {
    // console.log(this.props.currProjectId)
    await this.props.fetchInterfaceListMenu(this.props.currProjectId);
  }

  // 切换项目
  onChange = async val => {
    this.setState({
      project: val,
      selectedRowKeys: []
    });
    await this.props.fetchInterfaceListMenu(val);
  };

  render() {
    const { list, projectList } = this.props;

    const data = buildTableTree(list || []);
    const self = this;
    const rowSelection = {
      onSelect: (record, selected) => {
        const selectedSet = new Set(self.state.selectedRowKeys.filter(id => typeof id === 'number'));
        const ids = collectInterfaceIds(record);
        ids.forEach(id => {
          if (selected) {
            selectedSet.add(id);
          } else {
            selectedSet.delete(id);
          }
        });
        const categoryKeys = collectSelectedCategoryKeys(data, selectedSet);
        const selectedRowKeys = Array.from(new Set([...selectedSet, ...categoryKeys]));
        self.setState({ selectedRowKeys });
        self.props.selectInterface(Array.from(selectedSet), self.state.project);
      },
      onSelectAll: selected => {
        const interfaceIds = selected ? collectAllInterfaceIds(data) : [];
        const selectedSet = new Set(interfaceIds);
        const categoryKeys = collectSelectedCategoryKeys(data, selectedSet);
        const selectedRowKeys = Array.from(new Set([...selectedSet, ...categoryKeys]));
        self.setState({ selectedRowKeys });
        self.props.selectInterface(Array.from(selectedSet), self.state.project);
      },
      selectedRowKeys: self.state.selectedRowKeys
    };

    const columns = [
      {
        title: '接口名称',
        dataIndex: 'title',
        width: '30%',
        render: (text, record) => (record.isCategory ? record.title : text)
      },
      {
        title: '接口路径',
        dataIndex: 'path',
        width: '40%',
        render: (text, record) => (record.isCategory ? '-' : text)
      },
      {
        title: '请求方法',
        dataIndex: 'method',
        render: (item, record) => {
          if (record.isCategory) return '-';
          let methodColor = variable.METHOD_COLOR[item ? item.toLowerCase() : 'get'];
          return (
            <span
              style={{
                color: methodColor.color,
                backgroundColor: methodColor.bac,
                borderRadius: 4
              }}
              className="colValue"
            >
              {item}
            </span>
          );
        }
      },
      {
        title: (
          <span>
            状态{' '}
            <Tooltip title="筛选满足条件的接口集合">
              <Icon type="question-circle-o" />
            </Tooltip>
          </span>
        ),
        dataIndex: 'status',
        render: (text, record) => {
          if (record.isCategory) return '';
          return (
            text &&
            (text === 'done' ? (
              <span className="tag-status done">已完成</span>
            ) : (
              <span className="tag-status undone">未完成</span>
            ))
          );
        },
        filters: [
          {
            text: '已完成',
            value: 'done'
          },
          {
            text: '未完成',
            value: 'undone'
          }
        ],
        onFilter: (value, record) => {
          let arr = record.children.filter(item => {
            return item.status.indexOf(value) === 0;
          });
          return arr.length > 0;
          // record.status.indexOf(value) === 0
        }
      }
    ];

    return (
      <div>
        <div className="select-project">
          <span>选择要导入的项目： </span>
          <Select value={this.state.project} style={{ width: 200 }} onChange={this.onChange}>
            {projectList.map(item => {
              return item.projectname ? (
                ''
              ) : (
                <Option value={`${item._id}`} key={item._id}>
                  {item.name}
                </Option>
              );
            })}
          </Select>
        </div>
        <Table columns={columns} rowSelection={rowSelection} dataSource={data} pagination={false} />
      </div>
    );
  }
}
