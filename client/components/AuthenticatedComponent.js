import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { changeMenuItem } from '../reducer/modules/menu';

export function requireAuthentication(Component) {
  class AuthenticatedComponent extends React.PureComponent {
    constructor(props) {
      super(props);
    }
    static propTypes = {
      isAuthenticated: PropTypes.bool,
      location: PropTypes.object,
      dispatch: PropTypes.func,
      history: PropTypes.object,
      changeMenuItem: PropTypes.func
    };
    componentDidMount() {
      this.checkAuth();
    }
    componentDidUpdate() {
      this.checkAuth();
    }
    checkAuth() {
      if (!this.props.isAuthenticated) {
        this.props.history.push('/');
        this.props.changeMenuItem('/');
      }
    }
    render() {
      // eslint-disable-next-line no-console
      console.log('Auth render', { isAuthenticated: this.props.isAuthenticated, path: this.props.location?.pathname });
      return <div>{this.props.isAuthenticated ? <Component {...this.props} /> : null}</div>;
    }
  }
  
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
  ConnectedComponent.displayName = `AuthenticatedComponent(${Component.displayName || Component.name || 'Component'})`;
  
  return ConnectedComponent;
}
