import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { Tabs, Layout } from 'antd';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
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

const mapState = state => ({
  isShowCol: state.interfaceCol.isShowCol
});

const mapDispatch = {
  setColData,
  getProject
};

function Interface(props) {
  const { isShowCol, setColData } = props;
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setColData({
      isShowCol: true
    });
  }, [setColData]);

  const goTab = action => {
    const resolvedAction = action === 'colOrCase' ? (isShowCol ? 'col' : 'case') : action;
    const next = '/project/' + id + '/interface/' + resolvedAction;
    if (navigate) {
      navigate(next);
    } else if (typeof window !== 'undefined') {
      window.location.assign(next);
    }
  };

  const pathname = location?.pathname || '';
  const isColPath = pathname.indexOf('/interface/col') !== -1;
  const isCasePath = pathname.indexOf('/interface/case') !== -1;
  const match = pathname.match(/project\/(\d+)\/interface\/([\w-]+)(?:\/([^/]+))?/);
  const params = {
    id,
    action: isColPath ? 'col' : isCasePath ? 'case' : match ? match[2] : 'api',
    actionId: match ? match[3] : undefined
  };

  const { action, actionId } = params;
  const activeKey = action === 'api' ? 'api' : 'colOrCase';
  const invalidAction = action !== 'api' && action !== 'col' && action !== 'case';

  useEffect(() => {
    if (invalidAction && id) {
      navigate('/project/' + id + '/interface/api', { replace: true });
    }
  }, [invalidAction, id, navigate]);

  let ContentComponent = InterfaceList;
  if (action === 'api' && actionId && !isNaN(actionId)) {
    ContentComponent = InterfaceContent;
  } else if (action === 'col') {
    ContentComponent = InterfaceColContent;
  } else if (action === 'case') {
    ContentComponent = InterfaceCaseContent;
  }

  const router = { navigate, location, params };

  return (
    <Layout
      className="project-interface-layout"
      style={{
        minHeight: 'calc(100vh - 156px)',
        marginLeft: '24px',
        marginTop: '24px',
        background: 'transparent'
      }}
    >
        <Sider
          theme="light"
          className="project-interface-sider"
          style={{ height: '100%', background: '#f5f7fb', paddingRight: '0' }}
          width={300}
        >
        <div className="left-menu">
          <Tabs
            type="card"
            className="tabs-large left-menu-tabs"
            activeKey={activeKey}
            onChange={goTab}
            tabBarStyle={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              marginBottom: 8
            }}
            items={[
              { key: 'api', label: '接口列表' },
              { key: 'colOrCase', label: '测试集合' }
            ]}
          />
          {activeKey === 'api' ? (
            <InterfaceMenu router={router} projectId={params.id} />
          ) : (
            <InterfaceColMenu router={router} projectId={params.id} />
          )}
        </div>
      </Sider>
        <Layout className="project-interface-main">
          <Content
            className="project-interface-content"
            style={{
              height: '100%',
              margin: '0 24px 0 16px',
              overflow: 'initial',
            backgroundColor: '#fff'
          }}
        >
          <div className="right-content">
            <ContentComponent {...props} router={router} actionId={params.actionId} />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}

Interface.propTypes = {
  isShowCol: PropTypes.bool,
  getProject: PropTypes.func,
  setColData: PropTypes.func
};

export default connect(mapState, mapDispatch)(Interface);
