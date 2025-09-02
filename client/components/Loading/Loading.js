import React from 'react';
import PropTypes from 'prop-types';
import './Loading.scss';

export default class Loading extends React.PureComponent {
  static defaultProps = {
    visible: false
  };
  static propTypes = {
    visible: PropTypes.bool
  };
  constructor(props) {
    super(props);
    this.state = { show: props.visible };
  }
  componentDidUpdate(prevProps) {
    if (prevProps.visible !== this.props.visible) {
      this.setState({ show: this.props.visible });
    }
  }
  render() {
    return (
      <div className="loading-box" style={{ display: this.state.show ? 'flex' : 'none' }}>
        <div className="loading-box-bg" />
        <div className="loading-box-inner">
          <div />
          <div />
          <div />
          <div />
          <div />
          <div />
          <div />
          <div />
        </div>
      </div>
    );
  }
}
