// Bridge CJS implementation for both require() and ESM import
const impl = require('./diff-view.cjs');
module.exports = impl;
module.exports.default = impl;
