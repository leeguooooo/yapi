import React, { PureComponent as Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
//import constants from '../../../../constants/variable.js'
import { Tooltip, Input, Button, Row, Col, Spin, Modal, message, Select, Switch, Table } from 'antd';
import Icon from 'client/components/Icon';
import {
  fetchInterfaceColList,
  fetchCaseList,
  setColData,
  fetchCaseEnvList
} from '../../../../reducer/modules/interfaceCol';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { getToken, getEnv } from '../../../../reducer/modules/project';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import AceEditor from 'client/components/AceEditor/AceEditor';
import axios from 'axios';
import CaseReport from './CaseReport.js';
import _ from 'underscore';
import { initCrossRequest } from 'client/components/Postman/CheckCrossInstall.js';
import { produce } from 'immer';
import {InsertCodeMap} from 'client/components/Postman/Postman.js'

import plugin from 'client/plugin.js';
import postmanLib from 'common/postmanLib.browser.js';
const {
  handleParams,
  crossRequest,
  handleCurrDomain,
  checkNameIsExistInArray,
  safeArray
} = postmanLib;
import { handleParamsValue, json_parse, ArrayToObject } from 'common/utils.browser.js';
import CaseEnv from 'client/components/CaseEnv';
import Label from '../../../../components/Label/Label.js';
import ImportInterface from './ImportInterface.js';
import { joinBasePath } from '../../../../common.js';

const Option = Select.Option;
import createContext from 'common/createContext';

import copy from 'copy-to-clipboard';

const defaultModalStyle = {
  top: 10
}

const rowDragType = 'col-row';

const DraggableBodyRow = ({ index, moveRow, onDrop, className, style, ...restProps }) => {
  const ref = React.useRef();
  const [{ isOver, dropClassName }, drop] = useDrop({
    accept: rowDragType,
    collect: monitor => {
      const { index: dragIndex } = monitor.getItem() || {};
      if (dragIndex === index) {
        return {};
      }
      return {
        isOver: monitor.isOver(),
        dropClassName: dragIndex < index ? ' drop-over-downward' : ' drop-over-upward'
      };
    },
    drop: item => {
      if (item.index !== index) {
        moveRow(item.index, index);
        onDrop && onDrop();
        item.index = index;
      }
    }
  });

  const [, drag] = useDrag({
    type: rowDragType,
    item: { index }
  });

  drag(drop(ref));

  return (
    <tr
      ref={ref}
      className={`${className || ''}${isOver ? dropClassName : ''}`}
      style={{ cursor: 'move', ...style }}
      {...restProps}
    />
  );
};

function handleReport(json) {
  try {
    return JSON.parse(json);
  } catch (e) {
    return {};
  }
}

@connect(
  state => {
    return {
      interfaceColList: state.interfaceCol.interfaceColList,
      currColId: state.interfaceCol.currColId,
      currCaseId: state.interfaceCol.currCaseId,
      isShowCol: state.interfaceCol.isShowCol,
      isRander: state.interfaceCol.isRander,
      currCaseList: state.interfaceCol.currCaseList,
      currProject: state.project.currProject,
      token: state.project.token,
      envList: state.interfaceCol.envList,
      curProjectRole: state.project.currProject.role,
      projectEnv: state.project.projectEnv,
      curUid: state.user.uid
    };
  },
  {
    fetchInterfaceColList,
    fetchCaseList,
    setColData,
    getToken,
    getEnv,
    fetchCaseEnvList
  }
)
class InterfaceColContent extends Component {
  static propTypes = {
    router: PropTypes.object,
    interfaceColList: PropTypes.array,
    fetchInterfaceColList: PropTypes.func,
    fetchCaseList: PropTypes.func,
    setColData: PropTypes.func,
    currCaseList: PropTypes.array,
    currColId: PropTypes.number,
    currCaseId: PropTypes.number,
    isShowCol: PropTypes.bool,
    isRander: PropTypes.bool,
    currProject: PropTypes.object,
    getToken: PropTypes.func,
    token: PropTypes.string,
    curProjectRole: PropTypes.string,
    getEnv: PropTypes.func,
    projectEnv: PropTypes.object,
    fetchCaseEnvList: PropTypes.func,
    envList: PropTypes.array,
    curUid: PropTypes.number
  };

  constructor(props) {
    super(props);
    this.reports = {};
    this.records = {};
    this.state = {
      rows: [],
      reports: {},
      visible: false,
      curCaseid: null,
      hasPlugin: false,

      advVisible: false,
      curScript: '',
      enableScript: false,
      autoVisible: false,
      mode: 'html',
      email: false,
      download: false,
      currColEnvObj: {},
      collapseKey: '1',
      commonSettingModalVisible: false,
      commonSetting: {
        checkHttpCodeIs200: false,
        checkResponseField: {
          name: 'code',
          value: '0',
          enable: false
        },
        checkResponseSchema: false,
        checkScript:{
          enable: false,
          content: ''
        }
      },
      importInterVisible: false,
      importInterIds: [],
      importColId: null,
      importProjectId: null
    };
  }

  // 拖拽排序占位，当前未实现具体逻辑，避免 undefined.bind 造成崩溃
  onRow = () => ({})

  onMoveRow = () => {}

  async handleColIdChange(newColId){
    this.props.setColData({
      currColId: +newColId,
      isShowCol: true,
      isRander: false
    });

    let result = await this.props.fetchCaseList(newColId);
    const colData = result?.payload?.data?.colData;
    const caseList = result?.payload?.data?.data || [];
    if (result?.payload?.data?.errcode === 0 && colData) {
      this.reports = handleReport(colData.test_report);
      const checkScript = colData.checkScript || {};
      this.setState({
        commonSetting: {
          ...this.state.commonSetting,
          ...colData,
          checkScript: {
            enable: !!checkScript.enable,
            content: checkScript.content || ''
          }
        }
      });
    }
    this.props.setColData({ currCaseList: caseList });
    this.handleColdata(caseList);

    await this.props.fetchCaseEnvList(newColId);
    this.changeCollapseClose();
    this.handleColdata(caseList);
  }

  async componentDidMount() {
    const result = await this.props.fetchInterfaceColList(this.props.router.params.id);
    await this.props.getToken(this.props.router.params.id);
    let { currColId } = this.props;
    const params = this.props.router.params;
    const { actionId } = params;
    this.currColId = currColId = +actionId || result.payload.data.data[0]._id;
    // this.props.history.push('/project/' + params.id + '/interface/col/' + currColId);
    if (currColId && currColId != 0) {
      await this.handleColIdChange(currColId)
    }

    this._crossRequestInterval = initCrossRequest(hasPlugin => {
      this.setState({ hasPlugin: hasPlugin });
    });
  }

  componentWillUnmount() {
    clearInterval(this._crossRequestInterval);
  }

  // 更新分类简介
  handleChangeInterfaceCol = (desc, name) => {
    let params = {
      col_id: this.props.currColId,
      name: name,
      desc: desc
    };

    axios.post('/api/col/up_col', params).then(async res => {
      if (res.data.errcode) {
        return message.error(res.data.errmsg);
      }
      let project_id = this.props.router.params.id;
      await this.props.fetchInterfaceColList(project_id);
      message.success('接口集合简介更新成功');
    });
  };

  // 整合header信息
  handleReqHeader = (project_id, req_header, case_env) => {
    let envItem = _.find(this.props.envList, item => {
      return item._id === project_id;
    });

    let currDomain = handleCurrDomain((envItem && envItem.env) || [], case_env) || { header: [] };
    let header = currDomain.header || [];
    header.forEach(item => {
      if (!checkNameIsExistInArray(item.name, req_header)) {
        // item.abled = true;
        item = {
          ...item,
          abled: true
        };
        req_header.push(item);
      }
    });
    return req_header;
  };

  normalizeRows = (rows, currColEnvObj = {}) => {
    let that = this;
    return produce(rows || [], draftRows => {
      draftRows.map(item => {
        item.id = item._id;
        item._test_status = item.test_status;
        item.project_id = item.project_id || Number(that.props.router.params.id);
        if(currColEnvObj[item.project_id]){
          item.case_env =currColEnvObj[item.project_id];
        }
        item.req_headers = that.handleReqHeader(item.project_id, item.req_headers, item.case_env);
        return item;
      });
    });
  };

  handleColdata = (rows, currColEnvObj = {}) => {
    const newRows = this.normalizeRows(rows, currColEnvObj);
    this.setState({ rows: newRows });
    return newRows;
  };

  executeTests = async () => {
    // 运行前刷新一次用例，避免列表为空
    const currentColId = this.currColId || this.props.currColId;
    console.warn('col executeTests start', currentColId);
    let rowsToRun = [];
    if (currentColId) {
      const res = await this.props.fetchCaseList(currentColId);
      const caseList = res?.payload?.data?.data || [];
      rowsToRun = this.normalizeRows(caseList);
      this.setState({ rows: rowsToRun });
      this.props.setColData({ currCaseList: caseList });
    } else {
      rowsToRun = this.state.rows || [];
    }
    if (!rowsToRun.length) {
      console.warn('col executeTests no cases');
      message.warn('当前集合没有用例可运行');
      return;
    }
    try {
      for (let i = 0, l = rowsToRun.length, newRows, curitem; i < l; i++) {
      let rows = rowsToRun;

      let envItem = _.find(this.props.envList, item => {
        return item._id === rows[i].project_id;
      }) || {};

      curitem = Object.assign(
        {},
        rows[i],
        {
          env: envItem.env,
          pre_script: this.props.currProject.pre_script,
          after_script: this.props.currProject.after_script
        },
        { test_status: 'loading' }
      );
      newRows = [].concat([], rows);
      newRows[i] = curitem;
      rowsToRun = newRows;
      this.setState({ rows: newRows });
      let status = 'error',
        result;
      try {
        result = await this.handleTest(curitem);

        if (result.code === 400) {
          status = 'error';
        } else if (result.code === 0) {
          status = 'ok';
        } else if (result.code === 1) {
          status = 'invalid';
        }
      } catch (e) {
        console.error(e);
        status = 'error';
        result = e;
      }

      //result.body = result.data;
      this.reports[curitem._id] = result;
      this.records[curitem._id] = {
        status: result.status,
        params: result.params,
        body: result.res_body
      };

      curitem = Object.assign({}, rows[i], { test_status: status });
      newRows = [].concat([], rows);
      newRows[i] = curitem;
      rowsToRun = newRows;
      this.setState({ rows: newRows });
    }
    await axios.post('/api/col/up_col', {
      col_id: this.props.currColId,
      test_report: JSON.stringify(this.reports)
    });
    } catch (err) {
      // 任何未捕获错误直接提示，避免静默失败
      // eslint-disable-next-line no-console
      console.error(err);
      message.error(err?.message || '执行测试失败');
    }
  };

  handleTest = async interfaceData => {
    console.warn('col handleTest start', interfaceData && interfaceData._id);
    const projectId = interfaceData.project_id || this.props.router.params.id;
    if (!projectId) {
      throw new Error('项目id不能为空');
    }
    let requestParams = {};
    let options = handleParams(interfaceData, this.handleValue, requestParams);

    let result = {
      code: 400,
      msg: '数据异常',
      validRes: []
    };

    await plugin.emitHook('before_col_request', Object.assign({}, options, {
      type: 'col',
      caseId: options.caseId,
      projectId: interfaceData.project_id,
      interfaceId: interfaceData.interface_id
    }));

    try {
      const context = createContext(
        this.props.curUid,
        projectId,
        interfaceData.interface_id
      );
      let data;
      const envItem = _.find(this.props.envList, item => {
        return item._id === interfaceData.project_id;
      }) || {};
      const currDomain = handleCurrDomain(envItem.env || [], interfaceData.case_env) || {};
      const urlPath = interfaceData.path || '';
      const headers = {};
      safeArray(interfaceData.req_headers).forEach(h => {
        if (h && h.name) headers[h.name] = h.value;
      });

      if (currDomain.domain) {
        try {
          // eslint-disable-next-line no-console
          console.info('col real request', `${currDomain.domain}${urlPath}`);
          const realRes = await axios.request({
            url: `${currDomain.domain}${urlPath}`,
            method: (interfaceData.method || 'GET').toUpperCase(),
            headers,
            params: handleParams(interfaceData.req_query || [], this.handleValue, requestParams),
            data:
              interfaceData.req_body_type === 'json'
                ? json_parse(interfaceData.req_body_other)
                : interfaceData.req_body_type === 'form'
                  ? handleParams(interfaceData.req_body_form || [], this.handleValue, requestParams)
                  : interfaceData.req_body_other
          });
          data = {
            res: {
              body: realRes.data,
              header: realRes.headers,
              status: realRes.status,
              statusText: realRes.statusText
            }
          };
        } catch (err) {
          // eslint-disable-next-line no-console
          console.warn('real request failed, fallback to mock', err);
          data = await this.runMockRequest(interfaceData, requestParams, projectId);
        }
      } else {
        // 无域名配置时兜底走 Mock
        // eslint-disable-next-line no-console
        console.info('col mock request (no domain)', projectId, urlPath);
        data = await this.runMockRequest(interfaceData, requestParams, projectId);
      }
      options.taskId = this.props.curUid;
      let res = (data.res.body = json_parse(data.res.body));
      result = {
        ...options,
        ...result,
        res_header: data.res.header,
        res_body: res,
        status: data.res.status,
        statusText: data.res.statusText
      };

      await plugin.emitHook('after_col_request', result, {
        type: 'col',
        caseId: options.caseId,
        projectId: interfaceData.project_id,
        interfaceId: interfaceData.interface_id
      });

      if (options.data && typeof options.data === 'object') {
        requestParams = {
          ...requestParams,
          ...options.data
        };
      }

      let validRes = [];

      let responseData = Object.assign(
        {},
        {
          status: data.res.status,
          body: res,
          header: data.res.header,
          statusText: data.res.statusText
        }
      );

      // 断言测试
      await this.handleScriptTest(interfaceData, responseData, validRes, requestParams);

      if (validRes.length === 0) {
        result.code = 0;
        result.validRes = [
          {
            message: '验证通过'
          }
        ];
      } else if (validRes.length > 0) {
        result.code = 1;
        result.validRes = validRes;
      }
    } catch (data) {
      result = {
        ...options,
        ...result,
        res_header: data.header,
        res_body: data.body || data.message,
        status: 0,
        statusText: data.message,
        code: 400,
        validRes: [
          {
            message: data.message
          }
        ]
      };
    }

    result.params = requestParams;
    return result;
  };

  runMockRequest = async (interfaceData, requestParams, projectId) => {
    const pid = projectId || interfaceData.project_id || this.props.router.params.id;
    if (!pid) {
      throw new Error('项目id不能为空');
    }
    const headers = {};
    safeArray(interfaceData.req_headers).forEach(h => {
      if (h && h.name) headers[h.name] = h.value;
    });
    const method = (interfaceData.method || 'GET').toUpperCase();
    const basepath = this.props.currProject?.basepath || '';
    const mockPath = joinBasePath(basepath, interfaceData.path || '');
    const url = `${location.protocol}//${location.host}/mock/${pid}${mockPath}`;
    // eslint-disable-next-line no-console
    console.info('col mock request url', url);
    const axiosRes = await axios.request({
      url,
      method,
      headers,
      params: handleParams(interfaceData.req_query || [], this.handleValue, requestParams),
      data:
        interfaceData.req_body_type === 'json'
          ? json_parse(interfaceData.req_body_other)
          : interfaceData.req_body_type === 'form'
            ? handleParams(interfaceData.req_body_form || [], this.handleValue, requestParams)
            : interfaceData.req_body_other
    });
    return {
      res: {
        body: axiosRes.data,
        header: axiosRes.headers,
        status: axiosRes.status,
        statusText: axiosRes.statusText
      }
    };
  };

  //response, validRes
  // 断言测试
  handleScriptTest = async (interfaceData, response, validRes, requestParams) => {
    // 是否启动断言
    try {
      let test = await axios.post('/api/col/run_script', {
        response: response,
        records: this.records,
        script: interfaceData.test_script,
        params: requestParams,
        col_id: this.props.currColId,
        interface_id: interfaceData.interface_id
      });
      if (test.data.errcode !== 0) {
        test.data.data.logs.forEach(item => {
          validRes.push({ message: item });
        });
      }
    } catch (err) {
      validRes.push({
        message: 'Error: ' + err.message
      });
    }
  };

  handleValue = (val, global) => {
    let globalValue = ArrayToObject(global);
    let context = Object.assign({}, { global: globalValue }, this.records);
    return handleParamsValue(val, context);
  };

  arrToObj = (arr, requestParams) => {
    arr = arr || [];
    const obj = {};
    arr.forEach(item => {
      if (item.name && item.enable && item.type !== 'file') {
        obj[item.name] = this.handleValue(item.value);
        if (requestParams) {
          requestParams[item.name] = obj[item.name];
        }
      }
    });
    return obj;
  };

  saveRowOrder = () => {
    const changes = this.state.rows.map((item, index) => ({ id: item._id, index }));
    axios.post('/api/col/up_case_index', changes).then(() => {
      this.props.fetchInterfaceColList(this.props.router.params.id);
    });
  };

  moveRow = (dragIndex, hoverIndex) => {
    const rows = [...this.state.rows];
    const dragRow = rows[dragIndex];
    rows.splice(dragIndex, 1);
    rows.splice(hoverIndex, 0, dragRow);
    this.setState({ rows });
  };

  onChangeTest = d => {
    
    this.setState({
      commonSetting: {
        ...this.state.commonSetting,
        checkScript: {
          ...this.state.commonSetting.checkScript,
          content: d.text
        }
      }
    });
  };

  handleInsertCode = code => {
    this.aceEditor.editor.insertCode(code);
  };

  openImportInterface = () => {
    const projectId = this.props.router.params.id;
    this.setState({
      importInterVisible: true,
      importColId: this.currColId || this.props.currColId || null,
      importProjectId: projectId,
      importInterIds: []
    });
  };

  selectInterface = (importInterIds, selectedProject) => {
    this.setState({ importInterIds, importProjectId: selectedProject || this.state.importProjectId });
  };

  handleImportOk = async () => {
    const project_id = this.state.importProjectId || this.props.router.params.id;
    const colId = this.state.importColId || this.currColId || this.props.currColId;
    const { importInterIds } = this.state;
    if (!colId || !importInterIds || importInterIds.length === 0) {
      message.error('请选择要导入的接口');
      return;
    }
    const res = await axios.post('/api/col/add_case_list', {
      interface_list: importInterIds,
      col_id: colId,
      project_id
    });
    if (!res.data.errcode) {
      this.setState({ importInterVisible: false, importInterIds: [] });
      message.success('导入集合成功');
      await this.props.fetchInterfaceColList(project_id);
      await this.handleColIdChange(colId);
      await this.props.fetchCaseList(colId);
    } else {
      message.error(res.data.errmsg);
    }
  };

  handleImportCancel = () => {
    this.setState({ importInterVisible: false, importInterIds: [] });
  };

  async componentDidUpdate(nextProps) {
    let newColId = !isNaN(nextProps.router.params.actionId)
      ? +nextProps.router.params.actionId
      : 0;

    if (newColId && ((this.currColId && newColId !== this.currColId) || nextProps.isRander)) {
      this.currColId = newColId;
      this.handleColIdChange(newColId)
    }
  }

  // 测试用例环境面板折叠
  changeCollapseClose = key => {
    if (key) {
      this.setState({
        collapseKey: key
      });
    } else {
      this.setState({
        collapseKey: '1',
        currColEnvObj: {}
      });
    }
  };

  openReport = id => {
    if (!this.reports[id]) {
      return message.warn('还没有生成报告');
    }
    this.setState({ visible: true, curCaseid: id });
  };

  openAdv = id => {
    let findCase = _.find(this.props.currCaseList, item => item.id === id);

    this.setState({
      enableScript: findCase.enable_script,
      curScript: findCase.test_script,
      advVisible: true,
      curCaseid: id
    });
  };

  handleScriptChange = d => {
    this.setState({ curScript: d.text });
  };

  handleAdvCancel = () => {
    this.setState({ advVisible: false });
  };

  handleAdvOk = async () => {
    const { curCaseid, enableScript, curScript } = this.state;
    const res = await axios.post('/api/col/up_case', {
      id: curCaseid,
      test_script: curScript,
      enable_script: enableScript
    });
    if (res.data.errcode === 0) {
      message.success('更新成功');
    }
    this.setState({ advVisible: false });
    let currColId = this.currColId;
    this.props.setColData({
      currColId: +currColId,
      isShowCol: true,
      isRander: false
    });
    await this.props.fetchCaseList(currColId);

    this.handleColdata(this.props.currCaseList);
  };

  handleCancel = () => {
    this.setState({ visible: false });
  };

  currProjectEnvChange = (envName, project_id) => {
    let currColEnvObj = {
      ...this.state.currColEnvObj,
      [project_id]: envName
    };
    this.setState({ currColEnvObj });
   // this.handleColdata(this.props.currCaseList, envName, project_id);
   this.handleColdata(this.props.currCaseList,currColEnvObj);
  };

  autoTests = () => {
    this.setState({ autoVisible: true, currColEnvObj: {}, collapseKey: '' });
  };

  handleAuto = () => {
    this.setState({
      autoVisible: false,
      email: false,
      download: false,
      mode: 'html',
      currColEnvObj: {},
      collapseKey: ''
    });
  };

  copyUrl = url => {
    copy(url);
    message.success('已经成功复制到剪切板');
  };

  modeChange = mode => {
    this.setState({ mode });
  };

  emailChange = email => {
    this.setState({ email });
  };

  downloadChange = download => {
    this.setState({ download });
  };

  handleColEnvObj = envObj => {
    let str = '';
    for (let key in envObj) {
      str += envObj[key] ? `&env_${key}=${envObj[key]}` : '';
    }
    return str;
  };

  handleCommonSetting = ()=>{
    let setting = this.state.commonSetting;

    let params = {
      col_id: this.props.currColId,
      ...setting

    };
    console.log(params)

    axios.post('/api/col/up_col', params).then(async res => {
      if (res.data.errcode) {
        return message.error(res.data.errmsg);
      }
      message.success('配置测试集成功');
    });

    this.setState({
      commonSettingModalVisible: false
    })
  }

  cancelCommonSetting = ()=>{
    this.setState({
      commonSettingModalVisible: false
    })
  }

  openCommonSetting = ()=>{
    this.setState({
      commonSettingModalVisible: true
    })
  }

  changeCommonFieldSetting = (key)=>{
    return (e)=>{
      let value = e;
      if(typeof e === 'object' && e){
        value = e.target.value;
      }
      let {checkResponseField} = this.state.commonSetting;
      this.setState({
        commonSetting: {
          ...this.state.commonSetting,
          checkResponseField: {
            ...checkResponseField,
            [key]: value
          }
        }
      })
    }
  }
  
  render() {
    const currProjectId = this.props.currProject._id;
    const columns = [
      {
        title: '用例名称',
        dataIndex: 'casename',
        key: 'casename',
        width: 250,
        render: (text, record) => (
          <Link to={`/project/${currProjectId}/interface/case/${record._id}`}>
            {record.casename && record.casename.length > 23
              ? record.casename.substr(0, 20) + '...'
              : record.casename}
          </Link>
        )
      },
      {
        title: (
          <Tooltip title={
            <span>
              每个用例都有唯一的 key，用于变量参数等功能
            </span>
          }>
            Key
          </Tooltip>
        ),
        dataIndex: '_id',
        key: 'key',
        width: 100,
        render: value => <span>{value}</span>
      },
      {
        title: '状态',
        dataIndex: 'test_status',
        key: 'status',
        width: 100,
        render: (value, record) => {
          const id = record._id;
          const code = this.reports[id] ? this.reports[id].code : 0;
          if (record.test_status === 'loading') {
            return (
              <div>
                <Spin />
              </div>
            );
          }

          switch (code) {
            case 0:
              return (
                <Tooltip title="Pass">
                  <Icon style={{ color: '#00a854' }} name="check-circle" />
                </Tooltip>
              );
            case 400:
              return (
                <Tooltip title="请求异常">
                  <Icon name="info-circle" style={{ color: '#f04134' }} />
                </Tooltip>
              );
            case 1:
              return (
                <Tooltip title="验证失败">
                  <Icon name="exclamation-circle" style={{ color: '#ffbf00' }} />
                </Tooltip>
              );
            default:
              return <Icon style={{ color: '#00a854' }} name="check-circle" />;
          }
        }
      },
      {
        title: '接口路径',
        dataIndex: 'path',
        key: 'path',
        render: (text, record) => (
          <Tooltip title="跳转到对应接口">
            <Link to={`/project/${record.project_id}/interface/api/${record.interface_id}`}>
              {record.path && record.path.length > 23 ? record.path + '...' : record.path}
            </Link>
          </Tooltip>
        )
      },
      {
        title: '测试报告',
        key: 'report',
        width: 200,
        render: (_, record) => (
          <div className="interface-col-table-action">
            {this.reports[record.id] && (
              <Button onClick={() => this.openReport(record.id)}>测试报告</Button>
            )}
          </div>
        )
      }
    ];
    const { rows } = this.state;
    const components = {
      body: {
        row: DraggableBodyRow
      }
    };

    const localUrl =
      location.protocol +
      '//' +
      location.hostname +
      (location.port !== '' ? ':' + location.port : '');
    let currColEnvObj = this.handleColEnvObj(this.state.currColEnvObj);
    const autoTestsUrl = `/api/open/run_auto_test?id=${this.props.currColId}&token=${
      this.props.token
    }${currColEnvObj ? currColEnvObj : ''}&mode=${this.state.mode}&email=${
      this.state.email
    }&download=${this.state.download}`;

    let col_name = '';
    let col_desc = '';

    for (var i = 0; i < this.props.interfaceColList.length; i++) {
      if (this.props.interfaceColList[i]._id === this.props.currColId) {
        col_name = this.props.interfaceColList[i].name;
        col_desc = this.props.interfaceColList[i].desc;
        break;
      }
    }

    return (
      <div className="interface-col">
        <Modal
            title="通用规则配置"
            open={this.state.commonSettingModalVisible}
            onOk={this.handleCommonSetting}
            onCancel={this.cancelCommonSetting}
            width={'1000px'}
            style={defaultModalStyle}
          >
          <div className="common-setting-modal">
            <Row className="setting-item">
              <Col className="col-item" span="4">
                <label>检查HttpCode:&nbsp;<Tooltip title={'检查 http code 是否为 200'}>
                  <Icon name="question-circle-o" style={{ width: '10px' }} />
                </Tooltip></label>
              </Col>
              <Col className="col-item"  span="18">
                <Switch onChange={e=>{
                  let {commonSetting} = this.state;
                  this.setState({
                    commonSetting :{
                      ...commonSetting,
                      checkHttpCodeIs200: e
                    }
                  })
                }} checked={this.state.commonSetting.checkHttpCodeIs200}  checkedChildren="开" unCheckedChildren="关" />
              </Col>
            </Row>

            <Row className="setting-item">
              <Col className="col-item"  span="4">
                <label>检查返回json:&nbsp;<Tooltip title={'检查接口返回数据字段值，比如检查 code 是不是等于 0'}>
                  <Icon name="question-circle-o" style={{ width: '10px' }} />
                </Tooltip></label>
              </Col>
              <Col  className="col-item" span="6">
                <Input value={this.state.commonSetting.checkResponseField.name} onChange={this.changeCommonFieldSetting('name')} placeholder="字段名"  />
              </Col>
              <Col  className="col-item" span="6">
                <Input  onChange={this.changeCommonFieldSetting('value')}  value={this.state.commonSetting.checkResponseField.value}   placeholder="值"  />
              </Col>
              <Col  className="col-item" span="6">
                <Switch  onChange={this.changeCommonFieldSetting('enable')}  checked={this.state.commonSetting.checkResponseField.enable}  checkedChildren="开" unCheckedChildren="关"  />
              </Col>
            </Row>

            <Row className="setting-item">
              <Col className="col-item" span="4">
                <label>检查返回数据结构:&nbsp;<Tooltip title={'只有 response 基于 json-schema 方式定义，该检查才会生效'}>
                  <Icon name="question-circle-o" style={{ width: '10px' }} />
                </Tooltip></label>
              </Col>
              <Col className="col-item"  span="18">
                <Switch onChange={e=>{
                  let {commonSetting} = this.state;
                  this.setState({
                    commonSetting :{
                      ...commonSetting,
                      checkResponseSchema: e
                    }
                  })
                }} checked={this.state.commonSetting.checkResponseSchema}  checkedChildren="开" unCheckedChildren="关" />
              </Col>
            </Row>

            <Row className="setting-item">
              <Col className="col-item  " span="4">
                <label>全局测试脚本:&nbsp;<Tooltip title={'在跑自动化测试时，优先调用全局脚本，只有全局脚本通过测试，才会开始跑case自定义的测试脚本'}>
                  <Icon name="question-circle-o" style={{ width: '10px' }} />
                </Tooltip></label>
              </Col>
              <Col className="col-item"  span="14">
                <div><Switch onChange={e=>{
                  const { commonSetting } = this.state;
                  const currentCheckScript = commonSetting.checkScript || { enable: false, content: '' };
                  this.setState({
                    commonSetting :{
                      ...commonSetting,
                      checkScript: {
                        ...currentCheckScript,
                        enable: e
                      }
                    }
                  })
                }} checked={this.state.commonSetting.checkScript?.enable}  checkedChildren="开" unCheckedChildren="关"  /></div>
                <AceEditor
                  onChange={this.onChangeTest}
                  className="case-script"
                  data={this.state.commonSetting.checkScript?.content || ''}
                  ref={aceEditor => {
                    this.aceEditor = aceEditor;
                  }}
                />
              </Col>
              <Col span="6">
                <div className="insert-code">
                  {InsertCodeMap.map(item => {
                    return (
                      <div
                        style={{ cursor: 'pointer' }}
                        className="code-item"
                        key={item.title}
                        onClick={() => {
                          this.handleInsertCode('\n' + item.code);
                        }}
                      >
                        {item.title}
                      </div>
                    );
                  })}
                </div>
              </Col>
            </Row>


          </div>
        </Modal>
        <Row type="flex" justify="center" align="top">
          <Col span={5}>
            <h2
              className="interface-title"
              style={{
                display: 'inline-block',
                margin: '8px 20px 16px 0px'
              }}
            >
              测试集合&nbsp;<a
                target="_blank"
                rel="noopener noreferrer"
                href="https://leeguooooo.github.io/yapi/documents/case.html"
              >
                <Tooltip title="点击查看文档">
                  <Icon name="question-circle-o" />
                </Tooltip>
              </a>
            </h2>
          </Col>
          <Col span={10}>
            <CaseEnv
              envList={this.props.envList}
              currProjectEnvChange={this.currProjectEnvChange}
              envValue={this.state.currColEnvObj}
              collapseKey={this.state.collapseKey}
              changeClose={this.changeCollapseClose}
            />
          </Col>
          <Col span={9}>
            <div
              style={{
                float: 'right',
                paddingTop: '8px'
              }}
            >
              {this.props.curProjectRole !== 'guest' && (
                <Tooltip title="在 YApi 服务端跑自动化测试，测试环境不能为私有网络，请确保 YApi 服务器可以访问到自动化测试环境 domain">
                  <Button
                    style={{
                      marginRight: '8px'
                    }}
                    onClick={this.autoTests}
                  >
                    服务端测试
                  </Button>
                </Tooltip>
              )}
              <Button
                onClick={this.openCommonSetting}
                style={{
                  marginRight: '8px'
                }}
              >
                通用规则配置
              </Button>
              <Button
                type="primary"
                disabled={!rows || rows.length === 0}
                onClick={this.executeTests}
              >
                开始测试
              </Button>
              <Button style={{ marginLeft: 8 }} onClick={this.openImportInterface}>
                添加用例
              </Button>
            </div>
          </Col>
        </Row>

        <div className="component-label-wrapper">
          <Label onChange={val => this.handleChangeInterfaceCol(val, col_name)} desc={col_desc} />
        </div>

        <DndProvider backend={HTML5Backend}>
          <Table
            components={components}
            columns={columns}
            dataSource={rows}
            rowKey="_id"
            pagination={false}
            onRow={(_, index) => ({
              index,
              moveRow: this.moveRow,
              onDrop: this.saveRowOrder
            })}
          />
        </DndProvider>
        <Modal
          title="测试报告"
          width="900px"
          style={{
            minHeight: '500px'
          }}
          open={this.state.visible}
          onCancel={this.handleCancel}
          footer={null}
        >
          <CaseReport {...this.reports[this.state.curCaseid]} />
        </Modal>

        <Modal
          title="自定义测试脚本"
          width="660px"
          style={{
            minHeight: '500px'
          }}
          open={this.state.advVisible}
          onCancel={this.handleAdvCancel}
          onOk={this.handleAdvOk}
          maskClosable={false}
        >
          <h3>
            是否开启:&nbsp;
            <Switch
              checked={this.state.enableScript}
              onChange={e => this.setState({ enableScript: e })}
            />
          </h3>
          <AceEditor
            className="case-script"
            data={this.state.curScript}
            onChange={this.handleScriptChange}
          />
        </Modal>
        {this.state.autoVisible && (
          <Modal
            title="服务端自动化测试"
            width="780px"
            style={{
              minHeight: '500px'
            }}
            open={this.state.autoVisible}
            onCancel={this.handleAuto}
            className="autoTestsModal"
            footer={null}
            styles={{ body: { paddingTop: 32 } }}
          >
            <Row type="flex" justify="space-around" className="row" align="top">
              <Col span={3} className="label" style={{ paddingTop: '16px' }}>
                选择环境
                <Tooltip title="默认使用测试用例选择的环境">
                  <Icon name="question-circle-o" />
                </Tooltip>
                &nbsp;：
              </Col>
              <Col span={21}>
                <CaseEnv
                  envList={this.props.envList}
                  currProjectEnvChange={this.currProjectEnvChange}
                  envValue={this.state.currColEnvObj}
                  collapseKey={this.state.collapseKey}
                  changeClose={this.changeCollapseClose}
                />
              </Col>
            </Row>
            <Row type="flex" justify="space-around" className="row" align="middle">
              <Col span={3} className="label">
                输出格式：
              </Col>
              <Col span={21}>
                <Select value={this.state.mode} onChange={this.modeChange}>
                  <Option key="html" value="html">
                    html
                  </Option>
                  <Option key="json" value="json">
                    json
                  </Option>
                </Select>
              </Col>
            </Row>
            <Row type="flex" justify="space-around" className="row" align="middle">
              <Col span={3} className="label">
                消息通知
                <Tooltip title={'测试不通过时，会给项目组成员发送消息通知'}>
                  <Icon
                    name="question-circle-o"
                    style={{
                      width: '10px'
                    }}
                  />
                </Tooltip>
                &nbsp;：
              </Col>
              <Col span={21}>
                <Switch
                  checked={this.state.email}
                  checkedChildren="开"
                  unCheckedChildren="关"
                  onChange={this.emailChange}
                />
              </Col>
            </Row>
            <Row type="flex" justify="space-around" className="row" align="middle">
              <Col span={3} className="label">
                下载数据
                <Tooltip title={'开启后，测试数据将被下载到本地'}>
                  <Icon
                    name="question-circle-o"
                    style={{
                      width: '10px'
                    }}
                  />
                </Tooltip>
                &nbsp;：
              </Col>
              <Col span={21}>
                <Switch
                  checked={this.state.download}
                  checkedChildren="开"
                  unCheckedChildren="关"
                  onChange={this.downloadChange}
                />
              </Col>
            </Row>
            <Row type="flex" justify="space-around" className="row" align="middle">
              <Col span={21} className="autoTestUrl">
                <a 
                  target="_blank"
                  rel="noopener noreferrer"
                  href={localUrl + autoTestsUrl} >
                  {autoTestsUrl}
                </a>
              </Col>
              <Col span={3}>
                <Button className="copy-btn" onClick={() => this.copyUrl(localUrl + autoTestsUrl)}>
                  复制
                </Button>
              </Col>
            </Row>
            <div className="autoTestMsg">
              注：访问该URL，可以测试所有用例，请确保YApi服务器可以访问到环境配置的 domain
            </div>
          </Modal>
        )}
        <Modal
          title="添加用例到集合"
          open={this.state.importInterVisible}
          onOk={this.handleImportOk}
          onCancel={this.handleImportCancel}
          okButtonProps={{ disabled: !this.state.importInterIds || this.state.importInterIds.length === 0 }}
          className="import-case-modal"
          width={800}
          styles={{ body: { maxHeight: 800, overflowY: 'auto' } }}
        >
          <ImportInterface
            currProjectId={this.props.router.params.id}
            selectInterface={this.selectInterface}
          />
        </Modal>
      </div>
    );
  }
}

export default InterfaceColContent;
