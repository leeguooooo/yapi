import React from 'react';
import ReactDOM from 'react-dom';
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
    children: PropTypes.array,
    onChange: PropTypes.func,
    onDragEnd: PropTypes.func,
    data: PropTypes.func,
    onlyChild: PropTypes.string
  };

  constructor(props) {
    super(props);
    this.itemRefs = {};
  }

  render() {
    const that = this;
    const props = this.props;
    const { onlyChild } = props;
    let container = props.children;
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
          if (React.isValidElement(item)) {
            return React.cloneElement(item, {
              draggable: onlyChild ? false : true,
              ref: (el) => {
                // 获取真实的 DOM 节点，支持组件实例的情况
                let domNode = el;
                if (el) {
                  // 判断是否为真实 DOM 节点
                  const isDOMNode = el.nodeType === 1;
                  // 如果不是 DOM 节点（可能是组件实例），尝试获取真实 DOM
                  if (!isDOMNode && typeof ReactDOM.findDOMNode === 'function') {
                    domNode = ReactDOM.findDOMNode(el);
                  }
                }
                that.itemRefs['x' + index] = domNode;
              },
              'data-ref': 'x' + index,
              onDragStart: function() {
                curDragIndex = index;
              },
              /**
               * 控制 dom 是否可拖动
               * @param {*} e
               */
              onMouseDown(e) {
                if (!onlyChild) {
                  return;
                }
                let el = e.target,
                  target = e.target;
                if (!isDom(el)) {
                  return;
                }
                do {
                  if (el && isDom(el) && el.getAttribute(onlyChild)) {
                    target = el;
                  }
                  if (el && el.tagName == 'DIV' && el.getAttribute('data-ref')) {
                    break;
                  }
                } while ((el = el.parentNode));
                if (!el) {
                  return;
                }
                let refKey = el.getAttribute('data-ref');
                let dom = that.itemRefs[refKey];
                if (dom) {
                  dom.draggable = target.getAttribute(onlyChild) ? true : false;
                }
              },
              onDragEnter: function() {
                onChange(curDragIndex, index);
                curDragIndex = index;
              },
              onDragEnd: function() {
                curDragIndex = null;
                if (typeof props.onDragEnd === 'function') {
                  props.onDragEnd();
                }
              }
            });
          }
          return item;
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
