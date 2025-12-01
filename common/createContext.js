export default function createContext(uid, projectId, interfaceId) {
  if (!uid || !projectId || !interfaceId) {
    console.error('uid projectId interfaceId 不能为空', uid, projectId, interfaceId);
  }
  return {
    uid: +uid,
    projectId: +projectId,
    interfaceId: +interfaceId
  };
}

// CJS compatibility
if (typeof module !== 'undefined') {
  module.exports = createContext;
  module.exports.default = createContext;
}
