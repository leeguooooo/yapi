import _ from 'underscore';
import axios from 'axios';

// Browser-friendly rewrite of the legacy CJS importer.
async function handle(
  res,
  projectId,
  selectCatid,
  menuList,
  basePath,
  dataSync,
  messageError,
  messageSuccess,
  callback,
  token
) {
  const taskNotice = _.throttle((index, len) => {
    messageSuccess(`正在导入，已执行任务 ${index + 1} 个，共 ${len} 个`);
  }, 3000);

  const handleAddCat = async cats => {
    const catsObj = {};
    if (Array.isArray(cats)) {
      for (let i = 0; i < cats.length; i++) {
        const cat = cats[i];
        const findCat = _.find(menuList, menu => menu.name === cat.name);
        catsObj[cat.name] = cat;
        if (findCat) {
          cat.id = findCat._id;
        } else {
          const data = {
            name: cat.name,
            project_id: projectId,
            desc: cat.desc,
            token
          };
          const result = await axios.post('/api/interface/add_cat', data);
          if (result.data.errcode) {
            messageError(result.data.errmsg);
            callback({ showLoading: false });
            return false;
          }
          cat.id = result.data.data._id;
        }
      }
    }
    return catsObj;
  };

  const handleAddInterface = async info => {
    const cats = await handleAddCat(info.cats);
    if (cats === false) {
      return;
    }

    const apis = info.apis || [];
    const len = apis.length;
    let count = 0;
    let successNum = len;
    let existNum = 0;
    if (len === 0) {
      messageError('解析数据为空');
      callback({ showLoading: false });
      return;
    }

    if (info.basePath) {
      await axios.post('/api/project/up', {
        id: projectId,
        basepath: info.basePath,
        token
      });
    }

    for (let index = 0; index < apis.length; index++) {
      const item = apis[index];
      const data = Object.assign(item, {
        project_id: projectId,
        catid: selectCatid
      });
      if (basePath) {
        data.path =
          data.path.indexOf(basePath) === 0 ? data.path.substr(basePath.length) : data.path;
      }
      if (
        data.catname &&
        cats[data.catname] &&
        typeof cats[data.catname] === 'object' &&
        cats[data.catname].id
      ) {
        data.catid = cats[data.catname].id;
      }
      data.token = token;

      if (dataSync !== 'normal') {
        // 开启同步功能
        count++;
        data.dataSync = dataSync;
        const result = await axios.post('/api/interface/save', data);
        if (result.data.errcode) {
          successNum--;
          callback({ showLoading: false });
          messageError(result.data.errmsg);
        } else {
          existNum = existNum + result.data.data.length;
        }
      } else {
        // 未开启同步功能
        count++;
        const result = await axios.post('/api/interface/add', data);
        if (result.data.errcode) {
          successNum--;
          if (result.data.errcode === 40022) {
            existNum++;
          }
          if (result.data.errcode === 40033) {
            callback({ showLoading: false });
            messageError('没有权限');
            break;
          }
        }
      }
      if (count === len) {
        callback({ showLoading: false });
        messageSuccess(`成功导入接口 ${successNum} 个, 已存在的接口 ${existNum} 个`);
        return;
      }

      taskNotice(index, apis.length);
    }
  };

  return await handleAddInterface(res);
}

export default handle;
