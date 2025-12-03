import React, { PureComponent as Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import {
  fetchInterfaceListMenu,
  fetchInterfaceList,
  fetchInterfaceCatList,
  fetchInterfaceData,
  deleteInterfaceData,
  deleteInterfaceCatData,
  initInterface
} from '../../../../reducer/modules/interface.js';
import { getProject } from '../../../../reducer/modules/project.js';
import { Input, Button, Modal, message, Tree, Tooltip } from 'antd';
import { FolderOpenOutlined, ApiOutlined, HomeOutlined } from '@ant-design/icons';
import AddInterfaceForm from './AddInterfaceForm';
import AddInterfaceCatForm from './AddInterfaceCatForm';
import axios from 'axios';
import { Link, withRouter } from 'react-router-dom';
import { produce } from 'immer';
import { arrayChangeIndex } from '../../../../common.js';

import './interfaceMenu.scss';

const confirm = Modal.confirm;
const headHeight = 240; // menu顶部到网页顶部部分的高度

const catKey = id => `cat_${id}`;
const getCatIdFromKey = key => parseInt(String(key || '').replace('cat_', ''), 10);
const cloneTree = list => JSON.parse(JSON.stringify(list || []));
const findCatById = (nodes = [], id) => {
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i]._id === id) return nodes[i];
    const child = findCatById(nodes[i].children || [], id);
    if (child) return child;
  }
  return null;
};
const flattenCats = (nodes = []) => {
  let res = [];
  nodes.forEach(node => {
    res.push(node);
    if (node.children && node.children.length) {
      res = res.concat(flattenCats(node.children));
    }
  });
  return res;
};
const findCatPath = (nodes = [], targetId, trail = []) => {
  for (let i = 0; i < nodes.length; i++) {
    const currentPath = trail.concat([catKey(nodes[i]._id)]);
    if (nodes[i]._id === targetId) return currentPath;
    const childPath = findCatPath(nodes[i].children || [], targetId, currentPath);
    if (childPath && childPath.length) return childPath;
  }
  return null;
};
const filterTreeByKeyword = (nodes = [], keyword = '') => {
  if (!keyword) return { tree: nodes, expandedKeys: [] };
  const expanded = [];
  const walk = list =>
    list
      .map(node => {
        const children = walk(node.children || []);
        const apis = (node.list || []).filter(api => {
          const title = api.title || '';
          const apiPath = api.path || '';
          return title.indexOf(keyword) !== -1 || apiPath.indexOf(keyword) !== -1;
        });
        const name = node.name || '';
        const matched = name.indexOf(keyword) !== -1 || apis.length || children.length;
        if (matched) {
          expanded.push(catKey(node._id));
          return {
            ...node,
            children,
            list: apis
          };
        }
        return null;
      })
      .filter(Boolean);
  return { tree: walk(nodes), expandedKeys: expanded };
};

@connect(
  state => {
    return {
      list: state.inter.list,
      inter: state.inter.curdata,
      curProject: state.project.currProject,
      expands: []
    };
  },
  {
    fetchInterfaceListMenu,
    fetchInterfaceData,
    deleteInterfaceCatData,
    deleteInterfaceData,
    initInterface,
    getProject,
    fetchInterfaceCatList,
    fetchInterfaceList
  }
)
class InterfaceMenu extends Component {
  static propTypes = {
    match: PropTypes.object,
    inter: PropTypes.object,
    projectId: PropTypes.string,
    list: PropTypes.array,
    fetchInterfaceListMenu: PropTypes.func,
    curProject: PropTypes.object,
    fetchInterfaceData: PropTypes.func,
    addInterfaceData: PropTypes.func,
    deleteInterfaceData: PropTypes.func,
    initInterface: PropTypes.func,
    history: PropTypes.object,
    router: PropTypes.object,
    getProject: PropTypes.func,
    fetchInterfaceCatList: PropTypes.func,
    fetchInterfaceList: PropTypes.func
  };

  /**
   * @param {String} key
   */
  changeModal = (key, status) => {
    //visible add_cat_modal_visible change_cat_modal_visible del_cat_modal_visible
    let newState = {};
    newState[key] = status;
    this.setState(newState);
  };

  handleCancel = () => {
    this.setState({
      visible: false
    });
  };

  constructor(props) {
    super(props);
    this.state = {
      curKey: null,
      visible: false,
      delIcon: null,
      curCatid: null,
      add_cat_modal_visible: false,
      change_cat_modal_visible: false,
      del_cat_modal_visible: false,
      curCatdata: {},
      expands: null,
      list: [],
      filter: ''
    };
  }

  handleRequest() {
    this.props.initInterface();
    this.getList();
  }

  async getList() {
    let r = await this.props.fetchInterfaceListMenu(this.props.projectId);
    this.setState({
      list: r.payload.data.data
    });
  }

  componentDidMount() {
    this.handleRequest();
  }

  componentDidUpdate(nextProps) {
    if (this.props.list !== nextProps.list) {
      // console.log('next', nextProps.list)
      this.setState({
        list: nextProps.list
      });
    }
  }

  onSelect = selectedKeys => {
    const { history, match } = this.props;
    let curkey = selectedKeys[0];

    if (!curkey || !selectedKeys) {
      return false;
    }
    let basepath = '/project/' + match.params.id + '/interface/api';
    if (curkey === 'root') {
      history.push(basepath);
    } else {
      history.push(basepath + '/' + curkey);
    }
    this.setState({
      expands: null
    });
  };

  changeExpands = () => {
    this.setState({
      expands: null
    });
  };

  handleAddInterface = (data, cb) => {
    const catidVal = parseInt(data.catid, 10);
    const payload = {
      ...data,
      project_id: this.props.projectId,
      catid: Number.isNaN(catidVal) ? data.catid : catidVal
    };
    axios.post('/api/interface/add', payload).then(res => {
      if (res.data.errcode !== 0) {
        return message.error(res.data.errmsg);
      }
      message.success('接口添加成功');
      let interfaceId = res.data.data._id;
      this.props.history.push('/project/' + this.props.projectId + '/interface/api/' + interfaceId);
      this.getList();
      this.setState({
        visible: false
      });
      if (cb) {
        cb();
      }
    });
  };

  handleAddInterfaceCat = data => {
    const payload = {
      ...data,
      project_id: this.props.projectId,
      parent_id: data.parent_id ? parseInt(data.parent_id, 10) : 0
    };
    axios.post('/api/interface/add_cat', payload).then(res => {
      if (res.data.errcode !== 0) {
        return message.error(res.data.errmsg);
      }
      message.success('接口分类添加成功');
      this.getList();
      this.props.getProject(data.project_id);
      this.setState({
        add_cat_modal_visible: false
      });
    });
  };

  handleChangeInterfaceCat = data => {
    const params = {
      catid: this.state.curCatdata._id,
      name: data.name,
      desc: data.desc,
      parent_id: data.parent_id ? parseInt(data.parent_id, 10) : 0
    };

    axios.post('/api/interface/up_cat', params).then(res => {
      if (res.data.errcode !== 0) {
        return message.error(res.data.errmsg);
      }
      message.success('接口分类更新成功');
      this.getList();
      this.props.getProject(data.project_id);
      this.setState({
        change_cat_modal_visible: false
      });
    });
  };

  showConfirm = data => {
    let that = this;
    let id = data._id;
    let catid = data.catid;
    const ref = confirm({
      title: '您确认删除此接口????',
      content: '温馨提示：接口删除后，无法恢复',
      okText: '确认',
      cancelText: '取消',
      async onOk() {
        await that.props.deleteInterfaceData(id, that.props.projectId);
        await that.getList();
        await that.props.fetchInterfaceCatList({ catid });
        ref.destroy();
        that.props.history.push(
          '/project/' + that.props.match.params.id + '/interface/api/cat_' + catid
        );
      },
      onCancel() {
        ref.destroy();
      }
    });
  };

  showDelCatConfirm = catid => {
    let that = this;
    const ref = confirm({
      title: '确定删除此接口分类吗？',
      content: '温馨提示：该操作会删除该分类下所有接口，接口删除后无法恢复',
      okText: '确认',
      cancelText: '取消',
      async onOk() {
        await that.props.deleteInterfaceCatData(catid, that.props.projectId);
        await that.getList();
        // await that.props.getProject(that.props.projectId)
        await that.props.fetchInterfaceList({ project_id: that.props.projectId });
        that.props.history.push('/project/' + that.props.match.params.id + '/interface/api');
        ref.destroy();
      },
      onCancel() {}
    });
  };

  copyInterface = async id => {
    let interfaceData = await this.props.fetchInterfaceData(id);
    // let data = JSON.parse(JSON.stringify(interfaceData.payload.data.data));
    // data.title = data.title + '_copy';
    // data.path = data.path + '_' + Date.now();
    let data = interfaceData.payload.data.data;
    let newData = produce(data, draftData => {
      draftData.title = draftData.title + '_copy';
      draftData.path = draftData.path + '_' + Date.now();
    });

    axios.post('/api/interface/add', newData).then(async res => {
      if (res.data.errcode !== 0) {
        return message.error(res.data.errmsg);
      }
      message.success('接口添加成功');
      let interfaceId = res.data.data._id;
      await this.getList();
      this.props.history.push('/project/' + this.props.projectId + '/interface/api/' + interfaceId);
      this.setState({
        visible: false
      });
    });
  };

  enterItem = id => {
    this.setState({ delIcon: id });
  };

  leaveItem = () => {
    this.setState({ delIcon: null });
  };

  onFilter = e => {
    this.setState({
      filter: e.target.value,
      list: JSON.parse(JSON.stringify(this.props.list))
    });
  };

  onExpand = e => {
    this.setState({
      expands: e
    });
  };

  findParentMeta = (nodes, targetId, parentId = 0) => {
    for (let i = 0; i < nodes.length; i++) {
      if (nodes[i]._id === targetId) {
        return { parentId, siblings: nodes, nodeIndex: i };
      }
      const childRes = this.findParentMeta(nodes[i].children || [], targetId, nodes[i]._id);
      if (childRes) return childRes;
    }
    return null;
  };

  collectDescendantIds = node => {
    const ids = [];
    (node.children || []).forEach(child => {
      ids.push(child._id);
      ids.push(...this.collectDescendantIds(child));
    });
    return ids;
  };

  handleInterfaceDrop = async (info, dragData, dropData) => {
    const dropToGap = info.dropToGap;
    const sourceCat = findCatById(this.state.list, dragData.catid);
    if (!sourceCat || !Array.isArray(sourceCat.list)) return;
    const targetCatId = dropData.nodeType === 'cat' ? dropData._id : dropData.catid;
    const targetCat = findCatById(this.state.list, targetCatId);
    if (!targetCat) return;
    const sourceList = sourceCat.list;
    const targetList = Array.isArray(targetCat.list) ? targetCat.list : [];

    const dragIndex = sourceList.findIndex(item => item._id === dragData._id);
    if (dragIndex === -1) return;
    let targetIndex = targetList.length;

    if (dropData.nodeType === 'api') {
      const dropIndex = targetList.findIndex(item => item._id === dropData._id);
      targetIndex = dropIndex === -1 ? targetIndex : dropIndex;
      if (dropToGap && info.dropPosition > 0) {
        targetIndex += 1;
      }
    }

    if (dragData.catid === targetCatId) {
      const changes = arrayChangeIndex(
        targetList,
        dragIndex,
        targetIndex > dragIndex ? targetIndex - 1 : targetIndex
      );
      await axios.post('/api/interface/up_index', changes);
    } else {
      const moving = sourceList[dragIndex];
      const reordered = targetList.slice(0);
      reordered.splice(targetIndex, 0, moving);
      const changes = reordered.map((item, index) => ({ id: item._id, index }));
      await axios.post('/api/interface/up', { id: dragData._id, catid: targetCatId });
      await axios.post('/api/interface/up_index', changes);
      const sourceChanges = sourceList
        .filter(item => item._id !== dragData._id)
        .map((item, index) => ({ id: item._id, index }));
      if (sourceChanges.length) {
        await axios.post('/api/interface/up_index', sourceChanges);
      }
    }

    const { projectId, router } = this.props;
    this.props.fetchInterfaceListMenu(projectId);
    this.props.fetchInterfaceList({ project_id: projectId });
    if (router && isNaN(router.params.actionId)) {
      let catid = router.params.actionId.substr(4);
      this.props.fetchInterfaceCatList({ catid });
    }
  };

  handleCatDrop = async (info, dragData, dropData) => {
    const dropToGap = info.dropToGap;
    if (dropData.nodeType === 'cat' && dropData._id === dragData._id) {
      return;
    }
    const tree = cloneTree(this.state.list);
    const dragMeta = this.findParentMeta(tree, dragData._id);
    if (!dragMeta) return;
    const moving = dragMeta.siblings.splice(dragMeta.nodeIndex, 1)[0];
    const descendantIds = this.collectDescendantIds(moving);

    let targetParentId = 0;
    let targetSiblings = tree;
    let insertIndex = 0;

    if (dropData.nodeType === 'root') {
      targetParentId = 0;
      targetSiblings = tree;
      insertIndex = targetSiblings.length;
    } else if (dropData.nodeType === 'cat') {
      if (dropToGap) {
        const dropMeta = this.findParentMeta(tree, dropData._id);
        targetParentId = dropMeta ? dropMeta.parentId : 0;
        targetSiblings = dropMeta ? dropMeta.siblings : tree;
        const dropIndex = targetSiblings.findIndex(node => node._id === dropData._id);
        insertIndex = dropIndex === -1 ? targetSiblings.length : dropIndex;
        if (info.dropPosition > 0) {
          insertIndex += 1;
        }
      } else {
        targetParentId = dropData._id;
        const parentNode = findCatById(tree, targetParentId);
        parentNode.children = parentNode.children || [];
        targetSiblings = parentNode.children;
        insertIndex = targetSiblings.length;
      }
    } else {
      targetParentId = dropData.catid;
      const parentNode = findCatById(tree, targetParentId);
      if (!parentNode) return;
      parentNode.children = parentNode.children || [];
      targetSiblings = parentNode.children;
      insertIndex = targetSiblings.length;
    }

    if (descendantIds.includes(targetParentId)) {
      return message.error('不能将分类移动到自身或子分类下');
    }

    targetSiblings.splice(insertIndex, 0, moving);
    moving.parent_id = targetParentId;

    const payload = [];
    const groups =
      dragMeta.parentId === targetParentId
        ? [{ pid: targetParentId, siblings: targetSiblings }]
        : [
            { pid: dragMeta.parentId, siblings: dragMeta.siblings },
            { pid: targetParentId, siblings: targetSiblings }
          ];
    groups.forEach(group => {
      group.siblings.forEach((node, index) => {
        payload.push({ id: node._id, index, parent_id: group.pid });
      });
    });

    await axios.post('/api/interface/up_cat_index', payload);
    this.props.fetchInterfaceListMenu(this.props.projectId);
  };

  onDrop = async info => {
    const dragData = info.dragNode?.dataRef || {};
    const dropData = info.node?.dataRef || {};
    if (!dragData.nodeType) return;
    if (dragData.nodeType === 'cat') {
      await this.handleCatDrop(info, dragData, dropData);
    } else {
      await this.handleInterfaceDrop(info, dragData, dropData);
    }
  };
  // 数据过滤
  filterList = list => {
    const { tree, expandedKeys } = filterTreeByKeyword(list, this.state.filter);
    return { menuList: tree, arr: expandedKeys };
  };

  buildTreeData = (nodes = []) => {
    const formatCat = cat => ({
      title: (
        <span>
          <FolderOpenOutlined /> {cat.name}
        </span>
      ),
      key: catKey(cat._id),
      dataRef: { ...cat, nodeType: 'cat', catid: cat._id },
      children: [
        ...(cat.children || []).map(child => formatCat(child)),
        ...(cat.list || []).map(api => ({
          title: (
            <span>
              <ApiOutlined /> {api.title}
            </span>
          ),
          key: `${api._id}`,
          isLeaf: true,
          dataRef: { ...api, nodeType: 'api', catid: cat._id }
        }))
      ]
    });

    const treeData = nodes.map(formatCat);
    // prepend root node
    treeData.unshift({
      title: (
        <span>
          <HomeOutlined /> 全部接口
        </span>
      ),
      key: 'root',
      dataRef: { nodeType: 'root' }
    });
    return treeData;
  };

  render() {
    const matchParams = this.props.match.params;
    // let menuList = this.state.list;
    const searchBox = (
      <div className="interface-filter">
        <Input onChange={this.onFilter} value={this.state.filter} placeholder="搜索接口" />
        <Button
          type="primary"
          onClick={() => this.changeModal('add_cat_modal_visible', true)}
          className="btn-filter"
        >
          添加分类
        </Button>
        {this.state.visible ? (
          <Modal
            title="添加接口"
            visible={this.state.visible}
            onCancel={() => this.changeModal('visible', false)}
            footer={null}
            className="addcatmodal"
          >
            <AddInterfaceForm
              catdata={this.state.list}
              catid={this.state.curCatid}
              onCancel={() => this.changeModal('visible', false)}
              onSubmit={this.handleAddInterface}
            />
          </Modal>
        ) : (
          ''
        )}

        {this.state.add_cat_modal_visible ? (
          <Modal
            title="添加分类"
            visible={this.state.add_cat_modal_visible}
            onCancel={() => this.changeModal('add_cat_modal_visible', false)}
            footer={null}
            className="addcatmodal"
          >
            <AddInterfaceCatForm
              onCancel={() => this.changeModal('add_cat_modal_visible', false)}
              onSubmit={this.handleAddInterfaceCat}
              catTree={this.state.list}
            />
          </Modal>
        ) : (
          ''
        )}

        {this.state.change_cat_modal_visible ? (
          <Modal
            title="修改分类"
            visible={this.state.change_cat_modal_visible}
            onCancel={() => this.changeModal('change_cat_modal_visible', false)}
            footer={null}
            className="addcatmodal"
          >
            <AddInterfaceCatForm
              catdata={this.state.curCatdata}
              onCancel={() => this.changeModal('change_cat_modal_visible', false)}
              onSubmit={this.handleChangeInterfaceCat}
              catTree={this.state.list}
            />
          </Modal>
        ) : (
          ''
        )}
      </div>
    );
    const defaultExpandedKeys = () => {
      const { router, inter, list } = this.props;
      const rNull = { expands: [], selects: [] };
      if (!list.length) return rNull;

      if (router) {
        if (!isNaN(router.params.actionId)) {
          if (!inter || !inter._id) {
            return rNull;
          }
          const path = findCatPath(list, inter.catid) || [];
          return {
            expands: this.state.expands ? this.state.expands : path,
            selects: [inter._id + '']
          };
        } else {
          const catid = getCatIdFromKey(router.params.actionId);
          const path = findCatPath(list, catid) || [];
          return {
            expands: this.state.expands ? this.state.expands : path,
            selects: [catKey(catid)]
          };
        }
      }
      const rootPath = findCatPath(list, list[0]._id) || [];
      return {
        expands: this.state.expands ? this.state.expands : rootPath,
        selects: ['root']
      };
    };

    const currentKes = defaultExpandedKeys();
    let menuList = this.state.list;
    if (this.state.filter) {
      const res = this.filterList(this.state.list);
      menuList = res.menuList;
      currentKes.expands = res.arr;
    }
    const treeData = this.buildTreeData(menuList);

    return (
      <div>
        {searchBox}
        {menuList.length > 0 ? (
          <div
            className="tree-wrappper"
            style={{ maxHeight: parseInt(document.body.clientHeight) - headHeight + 'px' }}
          >
            <Tree
              className="interface-list"
              defaultExpandedKeys={currentKes.expands}
              defaultSelectedKeys={currentKes.selects}
              expandedKeys={currentKes.expands}
              selectedKeys={currentKes.selects}
              onSelect={this.onSelect}
              onExpand={this.onExpand}
              draggable
              onDrop={this.onDrop}
              treeData={treeData}
            />
          </div>
        ) : null}
      </div>
    );
  }
}

export default withRouter(InterfaceMenu);
