import React, { useEffect, useRef, useState } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Tabs, Modal, Button } from 'antd';
import Edit from './Edit.js';
import View from './View.js';
import { fetchInterfaceData } from '../../../../reducer/modules/interface.js';
import Run from './Run/Run.js';
import { useParams, useNavigate } from 'react-router-dom';
import plugin from 'client/plugin.js';

const Content = props => {
  const params = useParams();
  const navigate = useNavigate();
  const defaultTitleRef = useRef('YApi-高效、易用、功能强大的可视化接口管理平台');
  const prevActionIdRef = useRef();
  const confirmingRef = useRef(false);
  const [curtab, setCurtab] = useState('view');
  const [visible, setVisible] = useState(false);
  const [nextTab, setNextTab] = useState('');

  const actionId = props.actionId || params.actionId;

  useEffect(() => {
    if (!actionId || actionId === prevActionIdRef.current) return;
    const prevId = prevActionIdRef.current;
    if (prevId && curtab === 'edit' && props.editStatus && !confirmingRef.current) {
      confirmingRef.current = true;
      const ref = Modal.confirm({
        title: '你即将离开编辑页面',
        content: '离开页面会丢失当前编辑的内容，确定要离开吗？',
        okText: '确 定',
        cancelText: '取 消',
        onOk() {
          ref.destroy();
          prevActionIdRef.current = actionId;
          props.fetchInterfaceData(actionId);
          setCurtab('view');
          confirmingRef.current = false;
        },
        onCancel() {
          ref.destroy();
          if (params.id && prevId) {
            navigate(`/project/${params.id}/interface/api/${prevId}`, { replace: true });
          }
          confirmingRef.current = false;
        }
      });
      return;
    }
    prevActionIdRef.current = actionId;
    props.fetchInterfaceData(actionId);
    setCurtab('view');
  }, [actionId, props.fetchInterfaceData]);

  useEffect(() => {
    if (props.curdata?.title) {
      document.title = props.curdata.title + '-' + defaultTitleRef.current;
    } else {
      document.title = defaultTitleRef.current;
    }
  }, [props.curdata?.title]);

  useEffect(() => {
    return () => {
      document.title = defaultTitleRef.current;
    };
  }, []);

  // react-router v7 的 useBlocker 仅支持 data router，当前项目使用 BrowserRouter，
  // 这里用 beforeunload 兜底防止误刷新/关闭。
  useEffect(() => {
    if (!(curtab === 'edit' && props.editStatus)) return;
    const handler = e => {
      e.preventDefault();
      e.returnValue = '';
      return '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [curtab, props.editStatus]);

  const switchToView = () => {
    setCurtab('view');
  };

  const onChange = key => {
    if (curtab === 'edit' && props.editStatus) {
      setNextTab(key);
      setVisible(true);
      return;
    }
    setCurtab(key);
    setNextTab(key);
  };

  const handleOk = () => {
    setVisible(false);
    if (nextTab) {
      setCurtab(nextTab);
    }
  };

  const handleCancel = () => {
    setVisible(false);
  };

  let InterfaceTabs = {
    view: {
      component: View,
      name: '预览'
    },
    edit: {
      component: Edit,
      name: '编辑'
    },
    run: {
      component: Run,
      name: '运行'
    }
  };

  plugin.emitHook('interface_tab', InterfaceTabs);

  const tabItems = Object.keys(InterfaceTabs).map(key => ({
    key,
    label: InterfaceTabs[key].name
  }));
  const C = curtab ? InterfaceTabs[curtab].component : null;
  const tabContent = C ? (
    <C switchToView={switchToView} actionId={actionId} projectId={params.id} />
  ) : null;

  return (
    <div className="interface-content">
      <Tabs
        className="tabs-large"
        onChange={onChange}
        activeKey={curtab}
        defaultActiveKey="view"
        items={tabItems}
      />
      {tabContent}
      {visible && (
        <Modal
          title="你即将离开编辑页面"
          open={visible}
          onCancel={handleCancel}
          footer={[
            <Button key="back" onClick={handleCancel}>
              取 消
            </Button>,
            <Button key="submit" onClick={handleOk}>
              确 定
            </Button>
          ]}
        >
          <p>离开页面会丢失当前编辑的内容，确定要离开吗？</p>
        </Modal>
      )}
    </div>
  );
};

Content.propTypes = {
  list: PropTypes.array,
  curdata: PropTypes.object,
  fetchInterfaceData: PropTypes.func,
  editStatus: PropTypes.bool,
  actionId: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
};

export default connect(
  state => ({
    curdata: state.inter.curdata,
    list: state.inter.list,
    editStatus: state.inter.editStatus
  }),
  {
    fetchInterfaceData
  }
)(Content);
