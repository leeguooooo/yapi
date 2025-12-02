import './Subnav.scss';
import React, { PureComponent as Component } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { Menu } from 'antd';

class Subnav extends Component {
  constructor(props) {
    super(props);
  }

  static propTypes = {
    data: PropTypes.array,
    default: PropTypes.string
  };

  render() {
    const items = this.props.data.map(item => {
      const name = item.name && item.name.length === 2 ? `${item.name[0]} ${item.name[1]}` : item.name;
      return {
        key: name.replace(' ', ''),
        label: <Link to={item.path}>{name}</Link>,
        className: 'item'
      };
    });
    return (
      <div className="m-subnav">
        <Menu
          selectedKeys={[this.props.default]}
          mode="horizontal"
          className="g-row m-subnav-menu"
          items={items}
        />
      </div>
    );
  }
}

export default Subnav;
