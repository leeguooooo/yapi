import './index.scss';
import React, { PureComponent as Component } from 'react';
import { connect } from 'react-redux';
import { Route, Switch } from 'react-router-dom';
import List from './List.js';
import PropTypes from 'prop-types';
import Profile from './Profile.js';
import { Row } from 'antd';
@connect(
  state => {
    return {
      curUid: state.user.uid,
      userType: state.user.type,
      role: state.user.role
    };
  },
  {}
)
class User extends Component {
  static propTypes = {
    match: PropTypes.object,
    curUid: PropTypes.number,
    userType: PropTypes.string,
    role: PropTypes.string
  };

  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div>
        <div className="g-doc">
          <Row className="user-box">
            <Switch>
              <Route path="list" component={List} />
              <Route path="profile/:uid" component={Profile} />
            </Switch>
          </Row>
        </div>
      </div>
    );
  }
}

export default User;
