import './Breadcrumb.scss';
import { Breadcrumb } from 'antd';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { Link, useLocation } from 'react-router-dom';

const BreadcrumbNavigation = props => {
  useLocation();
  const items = props.breadcrumb.map((item, index) =>
    item.href
      ? { title: <Link to={item.href}>{item.name}</Link>, key: index }
      : { title: item.name, key: index }
  );
  return (
    <div className="breadcrumb-container">
      <Breadcrumb className="yapi-breadcrumb" items={items} />
    </div>
  );
};

BreadcrumbNavigation.propTypes = {
  breadcrumb: PropTypes.array
};

export default connect(state => ({
  breadcrumb: state.user.breadcrumb
}))(BreadcrumbNavigation);
