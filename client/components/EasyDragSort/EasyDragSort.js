import React from 'react';
import PropTypes from 'prop-types';

/**
 * @author suxiaoxin
 * @demo
 * <EasyDragSort data={()=>this.state.list} onChange={this.handleChange} >
 * {list}
 * </EasyDragSot>
 */
let curDragIndex = null;

function isDom(obj) {
  return (
    obj &&
    typeof obj === 'object' &&
    obj.nodeType === 1 &&
    typeof obj.nodeName === 'string' &&
    typeof obj.getAttribute === 'function'
  );
}

export default class EasyDragSort extends React.Component {
  static propTypes = {
    children: PropTypes.node,
    onChange: PropTypes.func,
    onDragEnd: PropTypes.func,
    data: PropTypes.func,
    onlyChild: PropTypes.string
  };

  constructor(props) {
    super(props);
    this.itemRefs = {};
  }

  handleMouseDown = (e, onlyChild) => {
    let el = e.target,
      target = e.target;
    if (!onlyChild || !isDom(el)) {
      return;
    }
    do {
      if (el && isDom(el) && el.getAttribute(onlyChild)) {
        target = el;
      }
      if (el && el.tagName === 'DIV' && el.getAttribute('data-ref')) {
        break;
      }
    } while ((el = el.parentNode));
    if (!el) {
      return;
    }
    let refKey = el.getAttribute('data-ref');
    let dom = this.itemRefs[refKey];
    if (dom) {
      dom.draggable = target.getAttribute(onlyChild) ? true : false;
    }
  };

  render() {
    const props = this.props;
    const { onlyChild } = props;
    const container = React.Children.toArray(props.children);
    const onChange = (from, to) => {
      if (from === to) {
        return;
      }
      let curValue;

      curValue = props.data();

      let newValue = arrMove(curValue, from, to);
      if (typeof props.onChange === 'function') {
        return props.onChange(newValue, from, to);
      }
    };
    return (
      <div>
        {container.map((item, index) => {
          const refKey = 'x' + index;
          return (
            <div
              key={refKey}
              draggable={onlyChild ? false : true}
              ref={el => {
                this.itemRefs[refKey] = el;
              }}
              data-ref={refKey}
              onDragStart={() => {
                curDragIndex = index;
              }}
              onMouseDown={e => this.handleMouseDown(e, onlyChild)}
              onDragEnter={() => {
                onChange(curDragIndex, index);
                curDragIndex = index;
              }}
              onDragEnd={() => {
                curDragIndex = null;
                if (typeof props.onDragEnd === 'function') {
                  props.onDragEnd();
                }
              }}
            >
              {item}
            </div>
          );
        })}
      </div>
    );
  }
}

function arrMove(arr, fromIndex, toIndex) {
  arr = [].concat(arr);
  let item = arr.splice(fromIndex, 1)[0];
  arr.splice(toIndex, 0, item);
  return arr;
}
