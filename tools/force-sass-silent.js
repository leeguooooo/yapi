// Preload hook to force Vite/Node to use a silent Sass implementation.
const Module = require('module');

const originalLoad = Module._load;

function withSilentLogger(impl) {
  const logger = impl.Logger && impl.Logger.silent ? impl.Logger.silent : undefined;
  const normalize = options => {
    options = Object.assign({}, options);
    if (logger && !options.logger) options.logger = logger;
    if (options.quietDeps === undefined) options.quietDeps = true;
    const silenced = options.silenceDeprecations || [];
    options.silenceDeprecations = Array.from(
      new Set([].concat(silenced, ['legacy-js-api']))
    );
    return options;
  };

  return Object.assign({}, impl, {
    render: (options, cb) => impl.render(normalize(options), cb),
    renderSync: options => impl.renderSync(normalize(options))
  });
}

function loadSilent(request, parent, isMain) {
  const impl = originalLoad(request, parent, isMain);
  return withSilentLogger(impl);
}

// Drop legacy-js-api deprecation noise printed to stderr by Sass itself.
const originalConsoleError = console.error;
console.error = (...args) => {
  if (args.some(arg => typeof arg === 'string' && arg.includes('legacy-js-api'))) {
    return;
  }
  originalConsoleError(...args);
};

const originalEmitWarning = process.emitWarning;
process.emitWarning = (warning, ...args) => {
  const text = typeof warning === 'string' ? warning : warning && warning.message;
  if (text && text.includes('legacy-js-api')) {
    return;
  }
  return originalEmitWarning.call(process, warning, ...args);
};

const originalStderrWrite = process.stderr.write.bind(process.stderr);
process.stderr.write = (chunk, encoding, cb) => {
  const text = typeof chunk === 'string' ? chunk : chunk.toString();
  if (text && text.includes('legacy-js-api')) {
    if (typeof cb === 'function') cb();
    return true;
  }
  return originalStderrWrite(chunk, encoding, cb);
};

Module._load = function (request, parent, isMain) {
  if (request === 'sass' || request === 'sass-embedded') {
    return loadSilent(request, parent, isMain);
  }
  return originalLoad(request, parent, isMain);
};
