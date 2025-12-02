import './Breadcrumb.scss';
import { withRouter } from 'react-router-dom';
import { Breadcrumb } from 'antd';
import PropTypes from 'prop-types';
import React, { PureComponent as Component } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';

@connect(state => {
  return {
    breadcrumb: state.user.breadcrumb
  };
})
@withRouter
export default class BreadcrumbNavigation extends Component {
  constructor(props) {
    super(props);
  }

  static propTypes = {
    breadcrumb: PropTypes.array
  };

  render() {
    const items = this.props.breadcrumb.map((item, index) => {
      return item.href
        ? { title: <Link to={item.href}>{item.name}</Link>, key: index }
        : { title: item.name, key: index };
    });
    return (
      <div className="breadcrumb-container">
        <Breadcrumb items={items} />
      </div>
    );
  }
}
