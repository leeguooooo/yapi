import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { Navigate, useLocation } from 'react-router-dom';
import { changeMenuItem } from '../reducer/modules/menu';

export function requireAuthentication(WrappedComponent) {
  function AuthenticatedComponent(props) {
    const location = useLocation();
    if (!props.isAuthenticated) {
      const from = location?.pathname || '';
      return <Navigate to="/login" replace state={{ from }} />;
    }
    return <WrappedComponent {...props} />;
  }

  AuthenticatedComponent.propTypes = {
    isAuthenticated: PropTypes.bool,
    changeMenuItem: PropTypes.func
  };
  
  const ConnectedComponent = connect(
    state => {
      return {
        isAuthenticated: state.user.isLogin
      };
    },
    {
      changeMenuItem
    }
  )(AuthenticatedComponent);
  
  // Ensure the component has a displayName for better debugging
  const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component';
  ConnectedComponent.displayName = `AuthenticatedComponent(${displayName})`;
  
  return ConnectedComponent;
}
