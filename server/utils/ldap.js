const { Client } = require('ldapts');
const yapi = require('../yapi.js');
const util = require('util');

exports.ldapQuery = (username, password) => {
  // const deferred = Q.defer();

  return new Promise((resolve, reject) => {
    const { ldapLogin } = yapi.WEBCONFIG;

    const client = new Client({ url: ldapLogin.server });

    (async () => {
      try {
        // 绑定管理账户
        if (ldapLogin.bindPassword) {
          await client.bind(ldapLogin.baseDn, ldapLogin.bindPassword);
        }

        const searchDn = ldapLogin.searchDn;
        const searchStandard = ldapLogin.searchStandard;
        const customFilter = /^(&|\|)/gi.test(searchStandard)
          ? searchStandard.replace(/%s/g, username)
          : `${searchStandard}=${username}`;

        const { searchEntries } = await client.search(searchDn, {
          filter: `(${customFilter})`,
          scope: 'sub'
        });

        if (!searchEntries || searchEntries.length === 0) {
          return reject({ type: false, message: '用户名不存在' });
        }

        const user = searchEntries[0];
        try {
          await client.bind(user.dn, password);
        } catch (e) {
          return reject({ type: false, message: `用户名或密码不正确: ${e}` });
        }

        resolve({ type: true, message: '验证成功', info: user });
      } catch (err) {
        reject({ type: false, message: `${err}` });
      } finally {
        try {
          await client.unbind();
        } catch (e) {}
      }
    })();
  });
};
