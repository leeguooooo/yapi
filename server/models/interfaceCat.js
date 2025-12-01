const yapi = require('../yapi.js');
const baseModel = require('./base.js');

/**
 * 接口分类
 */
class interfaceCat extends baseModel {
  getName() {
    return 'interface_cat';
  }

  getSchema() {
    return {
      name: { type: String, required: true },
      uid: { type: Number, required: true },
      project_id: { type: Number, required: true },
      parent_id: { type: Number, default: 0 },
      desc: String,
      add_time: Number,
      up_time: Number,
      index: { type: Number, default: 0 }
    };
  }

  save(data) {
    let m = new this.model(data);
    return m.save();
  }

  get(id) {
    return this.model
      .findOne({
        _id: id
      })
      .exec();
  }

  checkRepeat(name) {
    return this.model.countDocuments({
      name: name
    });
  }

  list(project_id) {
    return this.model
      .find({
        project_id: project_id
      })
      .sort({ parent_id: 1, index: 1, _id: 1 })
      .exec();
  }

  async listWithTree(project_id) {
    const categories = await this.list(project_id);
    const map = new Map();
    const roots = [];
    categories.forEach(item => {
      const obj = item.toObject();
      obj.parent_id = typeof obj.parent_id === 'number' ? obj.parent_id : 0;
      obj.children = [];
      map.set(String(obj._id), obj);
    });
    categories.forEach(item => {
      const obj = map.get(String(item._id));
      const parentId = obj.parent_id || 0;
      if (parentId && map.has(String(parentId))) {
        map.get(String(parentId)).children.push(obj);
      } else {
        roots.push(obj);
      }
    });
    return roots;
  }

  del(id) {
    return this.model.remove({
      _id: id
    });
  }

  delByProjectId(id) {
    return this.model.remove({
      project_id: id
    });
  }

  up(id, data) {
    data.up_time = yapi.commons.time();
    return this.model.updateOne(
      {
        _id: id
      },
      data
    );
  }

  upCatIndex(id, index, parentId) {
    const update = { index: index };
    if (typeof parentId === 'number') {
      update.parent_id = parentId;
    }
    return this.model.updateOne(
      {
        _id: id
      },
      update
    );
  }
}

module.exports = interfaceCat;
