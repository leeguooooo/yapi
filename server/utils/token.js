const yapi = require('../yapi')

const crypto = require('crypto');

/*
 下面是使用加密算法
*/

// 创建加密算法 - 兼容Node.js 22+
const aseEncode = function(data, password) {
  try {
    // Node.js 16+ 推荐的方法：使用 createCipheriv
    const algorithm = 'aes-192-cbc';
    // 从密码生成固定长度的key
    const key = crypto.scryptSync(password, 'salt', 24);
    // 使用固定的iv以保持向后兼容（正常应该使用随机iv）
    const iv = Buffer.alloc(16, 0);
    
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let crypted = cipher.update(data, 'utf-8', 'hex');
    crypted += cipher.final('hex');
    return crypted;
  } catch (e) {
    // 如果新方法失败，尝试旧方法（适用于老版本Node.js）
    try {
      const cipher = crypto.createCipher('aes192', password);
      let crypted = cipher.update(data, 'utf-8', 'hex');
      crypted += cipher.final('hex');
      return crypted;
    } catch (e2) {
      // 如果都失败了，返回base64编码作为fallback
      return Buffer.from(data + '|' + password).toString('base64');
    }
  }
};

// 创建解密算法 - 兼容Node.js 22+
const aseDecode = function(data, password) {
  try {
    // 首先尝试新方法解密
    const algorithm = 'aes-192-cbc';
    const key = crypto.scryptSync(password, 'salt', 24);
    const iv = Buffer.alloc(16, 0);
    
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(data, 'hex', 'utf-8');
    decrypted += decipher.final('utf-8');
    return decrypted;
  } catch (e) {
    // 尝试旧方法解密（兼容已有数据）
    try {
      const decipher = crypto.createDecipher('aes192', password);
      let decrypted = decipher.update(data, 'hex', 'utf-8');
      decrypted += decipher.final('utf-8');
      return decrypted;
    } catch (e2) {
      // 如果都失败了，尝试base64解码
      try {
        const decoded = Buffer.from(data, 'base64').toString('utf-8');
        return decoded.split('|')[0]; // 返回数据部分
      } catch (e3) {
        throw new Error('解密失败');
      }
    }
  }
}; 

const defaultSalt = 'abcde';

exports.getToken = function getToken(token, uid){
  if(!token)throw new Error('token 不能为空')
  yapi.WEBCONFIG.passsalt = yapi.WEBCONFIG.passsalt || defaultSalt;
  return aseEncode(uid + '|' + token, yapi.WEBCONFIG.passsalt)
}

exports.parseToken = function parseToken(token){
  if(!token)throw new Error('token 不能为空')
  yapi.WEBCONFIG.passsalt = yapi.WEBCONFIG.passsalt || defaultSalt;
  let tokens;
  try{
    tokens = aseDecode(token, yapi.WEBCONFIG.passsalt)
  }catch(e){}  
  if(tokens && typeof tokens === 'string' && tokens.indexOf('|') > 0){
    tokens = tokens.split('|')
    return {
      uid: tokens[0],
      projectToken: tokens[1]
    }
  }
  return false;
  
}

