import './Activity.scss';
import React, { PureComponent as Component } from 'react';
import TimeTree from '../../../components/TimeLine/TimeLine';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Button } from 'antd';
import { useParams } from 'react-router-dom';
@connect(state => {
  return {
    uid: state.user.uid + '',
    curdata: state.inter.curdata,
    currProject: state.project.currProject
  };
})
class Activity extends Component {
  constructor(props) {
    super(props);
  }
  static propTypes = {
    uid: PropTypes.string,
    getMockUrl: PropTypes.func,
    projectId: PropTypes.string,
    curdata: PropTypes.object,
    currProject: PropTypes.object
  };
  render() {
    let { currProject } = this.props;
    return (
      <div className="g-row">
        <section className="news-box m-panel">
          <div style={{ display: 'none' }} className="logHead">
            {/*<Breadcrumb />*/}
            <div className="projectDes">
              <p>高效、易用、可部署的API管理平台</p>
            </div>
            <div className="Mockurl">
              <span>Mock地址：</span>
              <p>
                {location.protocol +
                  '//' +
                  location.hostname +
                  (location.port !== '' ? ':' + location.port : '') +
                  `/mock/${currProject._id}${currProject.basepath}/yourPath`}
              </p>
              <Button type="primary">
                <a href={`/api/project/download?project_id=${this.props.projectId}`}>
                  下载Mock数据
                </a>
              </Button>
            </div>
          </div>
          <TimeTree type={'project'} typeid={+this.props.projectId} />
        </section>
      </div>
    );
  }
}

function ActivityWithParams(props) {
  const { id } = useParams();
  return <Activity {...props} projectId={id} />;
}

export default ActivityWithParams;
