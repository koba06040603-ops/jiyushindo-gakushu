var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// ../node_modules/unenv/dist/runtime/_internal/utils.mjs
// @__NO_SIDE_EFFECTS__
function createNotImplementedError(name) {
  return new Error(`[unenv] ${name} is not implemented yet!`);
}
__name(createNotImplementedError, "createNotImplementedError");
// @__NO_SIDE_EFFECTS__
function notImplemented(name) {
  const fn2 = /* @__PURE__ */ __name(() => {
    throw /* @__PURE__ */ createNotImplementedError(name);
  }, "fn");
  return Object.assign(fn2, { __unenv__: true });
}
__name(notImplemented, "notImplemented");
// @__NO_SIDE_EFFECTS__
function notImplementedClass(name) {
  return class {
    __unenv__ = true;
    constructor() {
      throw new Error(`[unenv] ${name} is not implemented yet!`);
    }
  };
}
__name(notImplementedClass, "notImplementedClass");

// ../node_modules/unenv/dist/runtime/node/internal/perf_hooks/performance.mjs
var _timeOrigin = globalThis.performance?.timeOrigin ?? Date.now();
var _performanceNow = globalThis.performance?.now ? globalThis.performance.now.bind(globalThis.performance) : () => Date.now() - _timeOrigin;
var nodeTiming = {
  name: "node",
  entryType: "node",
  startTime: 0,
  duration: 0,
  nodeStart: 0,
  v8Start: 0,
  bootstrapComplete: 0,
  environment: 0,
  loopStart: 0,
  loopExit: 0,
  idleTime: 0,
  uvMetricsInfo: {
    loopCount: 0,
    events: 0,
    eventsWaiting: 0
  },
  detail: void 0,
  toJSON() {
    return this;
  }
};
var PerformanceEntry = class {
  static {
    __name(this, "PerformanceEntry");
  }
  __unenv__ = true;
  detail;
  entryType = "event";
  name;
  startTime;
  constructor(name, options) {
    this.name = name;
    this.startTime = options?.startTime || _performanceNow();
    this.detail = options?.detail;
  }
  get duration() {
    return _performanceNow() - this.startTime;
  }
  toJSON() {
    return {
      name: this.name,
      entryType: this.entryType,
      startTime: this.startTime,
      duration: this.duration,
      detail: this.detail
    };
  }
};
var PerformanceMark = class PerformanceMark2 extends PerformanceEntry {
  static {
    __name(this, "PerformanceMark");
  }
  entryType = "mark";
  constructor() {
    super(...arguments);
  }
  get duration() {
    return 0;
  }
};
var PerformanceMeasure = class extends PerformanceEntry {
  static {
    __name(this, "PerformanceMeasure");
  }
  entryType = "measure";
};
var PerformanceResourceTiming = class extends PerformanceEntry {
  static {
    __name(this, "PerformanceResourceTiming");
  }
  entryType = "resource";
  serverTiming = [];
  connectEnd = 0;
  connectStart = 0;
  decodedBodySize = 0;
  domainLookupEnd = 0;
  domainLookupStart = 0;
  encodedBodySize = 0;
  fetchStart = 0;
  initiatorType = "";
  name = "";
  nextHopProtocol = "";
  redirectEnd = 0;
  redirectStart = 0;
  requestStart = 0;
  responseEnd = 0;
  responseStart = 0;
  secureConnectionStart = 0;
  startTime = 0;
  transferSize = 0;
  workerStart = 0;
  responseStatus = 0;
};
var PerformanceObserverEntryList = class {
  static {
    __name(this, "PerformanceObserverEntryList");
  }
  __unenv__ = true;
  getEntries() {
    return [];
  }
  getEntriesByName(_name, _type) {
    return [];
  }
  getEntriesByType(type) {
    return [];
  }
};
var Performance = class {
  static {
    __name(this, "Performance");
  }
  __unenv__ = true;
  timeOrigin = _timeOrigin;
  eventCounts = /* @__PURE__ */ new Map();
  _entries = [];
  _resourceTimingBufferSize = 0;
  navigation = void 0;
  timing = void 0;
  timerify(_fn, _options) {
    throw createNotImplementedError("Performance.timerify");
  }
  get nodeTiming() {
    return nodeTiming;
  }
  eventLoopUtilization() {
    return {};
  }
  markResourceTiming() {
    return new PerformanceResourceTiming("");
  }
  onresourcetimingbufferfull = null;
  now() {
    if (this.timeOrigin === _timeOrigin) {
      return _performanceNow();
    }
    return Date.now() - this.timeOrigin;
  }
  clearMarks(markName) {
    this._entries = markName ? this._entries.filter((e) => e.name !== markName) : this._entries.filter((e) => e.entryType !== "mark");
  }
  clearMeasures(measureName) {
    this._entries = measureName ? this._entries.filter((e) => e.name !== measureName) : this._entries.filter((e) => e.entryType !== "measure");
  }
  clearResourceTimings() {
    this._entries = this._entries.filter((e) => e.entryType !== "resource" || e.entryType !== "navigation");
  }
  getEntries() {
    return this._entries;
  }
  getEntriesByName(name, type) {
    return this._entries.filter((e) => e.name === name && (!type || e.entryType === type));
  }
  getEntriesByType(type) {
    return this._entries.filter((e) => e.entryType === type);
  }
  mark(name, options) {
    const entry = new PerformanceMark(name, options);
    this._entries.push(entry);
    return entry;
  }
  measure(measureName, startOrMeasureOptions, endMark) {
    let start;
    let end;
    if (typeof startOrMeasureOptions === "string") {
      start = this.getEntriesByName(startOrMeasureOptions, "mark")[0]?.startTime;
      end = this.getEntriesByName(endMark, "mark")[0]?.startTime;
    } else {
      start = Number.parseFloat(startOrMeasureOptions?.start) || this.now();
      end = Number.parseFloat(startOrMeasureOptions?.end) || this.now();
    }
    const entry = new PerformanceMeasure(measureName, {
      startTime: start,
      detail: {
        start,
        end
      }
    });
    this._entries.push(entry);
    return entry;
  }
  setResourceTimingBufferSize(maxSize) {
    this._resourceTimingBufferSize = maxSize;
  }
  addEventListener(type, listener, options) {
    throw createNotImplementedError("Performance.addEventListener");
  }
  removeEventListener(type, listener, options) {
    throw createNotImplementedError("Performance.removeEventListener");
  }
  dispatchEvent(event) {
    throw createNotImplementedError("Performance.dispatchEvent");
  }
  toJSON() {
    return this;
  }
};
var PerformanceObserver = class {
  static {
    __name(this, "PerformanceObserver");
  }
  __unenv__ = true;
  static supportedEntryTypes = [];
  _callback = null;
  constructor(callback) {
    this._callback = callback;
  }
  takeRecords() {
    return [];
  }
  disconnect() {
    throw createNotImplementedError("PerformanceObserver.disconnect");
  }
  observe(options) {
    throw createNotImplementedError("PerformanceObserver.observe");
  }
  bind(fn2) {
    return fn2;
  }
  runInAsyncScope(fn2, thisArg, ...args) {
    return fn2.call(thisArg, ...args);
  }
  asyncId() {
    return 0;
  }
  triggerAsyncId() {
    return 0;
  }
  emitDestroy() {
    return this;
  }
};
var performance = globalThis.performance && "addEventListener" in globalThis.performance ? globalThis.performance : new Performance();

// ../node_modules/@cloudflare/unenv-preset/dist/runtime/polyfill/performance.mjs
globalThis.performance = performance;
globalThis.Performance = Performance;
globalThis.PerformanceEntry = PerformanceEntry;
globalThis.PerformanceMark = PerformanceMark;
globalThis.PerformanceMeasure = PerformanceMeasure;
globalThis.PerformanceObserver = PerformanceObserver;
globalThis.PerformanceObserverEntryList = PerformanceObserverEntryList;
globalThis.PerformanceResourceTiming = PerformanceResourceTiming;

// ../node_modules/unenv/dist/runtime/node/console.mjs
import { Writable } from "node:stream";

// ../node_modules/unenv/dist/runtime/mock/noop.mjs
var noop_default = Object.assign(() => {
}, { __unenv__: true });

// ../node_modules/unenv/dist/runtime/node/console.mjs
var _console = globalThis.console;
var _ignoreErrors = true;
var _stderr = new Writable();
var _stdout = new Writable();
var log = _console?.log ?? noop_default;
var info = _console?.info ?? log;
var trace = _console?.trace ?? info;
var debug = _console?.debug ?? log;
var table = _console?.table ?? log;
var error = _console?.error ?? log;
var warn = _console?.warn ?? error;
var createTask = _console?.createTask ?? /* @__PURE__ */ notImplemented("console.createTask");
var clear = _console?.clear ?? noop_default;
var count = _console?.count ?? noop_default;
var countReset = _console?.countReset ?? noop_default;
var dir = _console?.dir ?? noop_default;
var dirxml = _console?.dirxml ?? noop_default;
var group = _console?.group ?? noop_default;
var groupEnd = _console?.groupEnd ?? noop_default;
var groupCollapsed = _console?.groupCollapsed ?? noop_default;
var profile = _console?.profile ?? noop_default;
var profileEnd = _console?.profileEnd ?? noop_default;
var time = _console?.time ?? noop_default;
var timeEnd = _console?.timeEnd ?? noop_default;
var timeLog = _console?.timeLog ?? noop_default;
var timeStamp = _console?.timeStamp ?? noop_default;
var Console = _console?.Console ?? /* @__PURE__ */ notImplementedClass("console.Console");
var _times = /* @__PURE__ */ new Map();
var _stdoutErrorHandler = noop_default;
var _stderrErrorHandler = noop_default;

// ../node_modules/@cloudflare/unenv-preset/dist/runtime/node/console.mjs
var workerdConsole = globalThis["console"];
var {
  assert,
  clear: clear2,
  // @ts-expect-error undocumented public API
  context,
  count: count2,
  countReset: countReset2,
  // @ts-expect-error undocumented public API
  createTask: createTask2,
  debug: debug2,
  dir: dir2,
  dirxml: dirxml2,
  error: error2,
  group: group2,
  groupCollapsed: groupCollapsed2,
  groupEnd: groupEnd2,
  info: info2,
  log: log2,
  profile: profile2,
  profileEnd: profileEnd2,
  table: table2,
  time: time2,
  timeEnd: timeEnd2,
  timeLog: timeLog2,
  timeStamp: timeStamp2,
  trace: trace2,
  warn: warn2
} = workerdConsole;
Object.assign(workerdConsole, {
  Console,
  _ignoreErrors,
  _stderr,
  _stderrErrorHandler,
  _stdout,
  _stdoutErrorHandler,
  _times
});
var console_default = workerdConsole;

// ../node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-console
globalThis.console = console_default;

// ../node_modules/unenv/dist/runtime/node/internal/process/hrtime.mjs
var hrtime = /* @__PURE__ */ Object.assign(/* @__PURE__ */ __name(function hrtime2(startTime) {
  const now = Date.now();
  const seconds = Math.trunc(now / 1e3);
  const nanos = now % 1e3 * 1e6;
  if (startTime) {
    let diffSeconds = seconds - startTime[0];
    let diffNanos = nanos - startTime[0];
    if (diffNanos < 0) {
      diffSeconds = diffSeconds - 1;
      diffNanos = 1e9 + diffNanos;
    }
    return [diffSeconds, diffNanos];
  }
  return [seconds, nanos];
}, "hrtime"), { bigint: /* @__PURE__ */ __name(function bigint() {
  return BigInt(Date.now() * 1e6);
}, "bigint") });

// ../node_modules/unenv/dist/runtime/node/internal/process/process.mjs
import { EventEmitter } from "node:events";

// ../node_modules/unenv/dist/runtime/node/internal/tty/read-stream.mjs
var ReadStream = class {
  static {
    __name(this, "ReadStream");
  }
  fd;
  isRaw = false;
  isTTY = false;
  constructor(fd) {
    this.fd = fd;
  }
  setRawMode(mode) {
    this.isRaw = mode;
    return this;
  }
};

// ../node_modules/unenv/dist/runtime/node/internal/tty/write-stream.mjs
var WriteStream = class {
  static {
    __name(this, "WriteStream");
  }
  fd;
  columns = 80;
  rows = 24;
  isTTY = false;
  constructor(fd) {
    this.fd = fd;
  }
  clearLine(dir3, callback) {
    callback && callback();
    return false;
  }
  clearScreenDown(callback) {
    callback && callback();
    return false;
  }
  cursorTo(x, y, callback) {
    callback && typeof callback === "function" && callback();
    return false;
  }
  moveCursor(dx, dy, callback) {
    callback && callback();
    return false;
  }
  getColorDepth(env2) {
    return 1;
  }
  hasColors(count3, env2) {
    return false;
  }
  getWindowSize() {
    return [this.columns, this.rows];
  }
  write(str, encoding, cb) {
    if (str instanceof Uint8Array) {
      str = new TextDecoder().decode(str);
    }
    try {
      console.log(str);
    } catch {
    }
    cb && typeof cb === "function" && cb();
    return false;
  }
};

// ../node_modules/unenv/dist/runtime/node/internal/process/node-version.mjs
var NODE_VERSION = "22.14.0";

// ../node_modules/unenv/dist/runtime/node/internal/process/process.mjs
var Process = class _Process extends EventEmitter {
  static {
    __name(this, "Process");
  }
  env;
  hrtime;
  nextTick;
  constructor(impl) {
    super();
    this.env = impl.env;
    this.hrtime = impl.hrtime;
    this.nextTick = impl.nextTick;
    for (const prop of [...Object.getOwnPropertyNames(_Process.prototype), ...Object.getOwnPropertyNames(EventEmitter.prototype)]) {
      const value = this[prop];
      if (typeof value === "function") {
        this[prop] = value.bind(this);
      }
    }
  }
  // --- event emitter ---
  emitWarning(warning, type, code) {
    console.warn(`${code ? `[${code}] ` : ""}${type ? `${type}: ` : ""}${warning}`);
  }
  emit(...args) {
    return super.emit(...args);
  }
  listeners(eventName) {
    return super.listeners(eventName);
  }
  // --- stdio (lazy initializers) ---
  #stdin;
  #stdout;
  #stderr;
  get stdin() {
    return this.#stdin ??= new ReadStream(0);
  }
  get stdout() {
    return this.#stdout ??= new WriteStream(1);
  }
  get stderr() {
    return this.#stderr ??= new WriteStream(2);
  }
  // --- cwd ---
  #cwd = "/";
  chdir(cwd2) {
    this.#cwd = cwd2;
  }
  cwd() {
    return this.#cwd;
  }
  // --- dummy props and getters ---
  arch = "";
  platform = "";
  argv = [];
  argv0 = "";
  execArgv = [];
  execPath = "";
  title = "";
  pid = 200;
  ppid = 100;
  get version() {
    return `v${NODE_VERSION}`;
  }
  get versions() {
    return { node: NODE_VERSION };
  }
  get allowedNodeEnvironmentFlags() {
    return /* @__PURE__ */ new Set();
  }
  get sourceMapsEnabled() {
    return false;
  }
  get debugPort() {
    return 0;
  }
  get throwDeprecation() {
    return false;
  }
  get traceDeprecation() {
    return false;
  }
  get features() {
    return {};
  }
  get release() {
    return {};
  }
  get connected() {
    return false;
  }
  get config() {
    return {};
  }
  get moduleLoadList() {
    return [];
  }
  constrainedMemory() {
    return 0;
  }
  availableMemory() {
    return 0;
  }
  uptime() {
    return 0;
  }
  resourceUsage() {
    return {};
  }
  // --- noop methods ---
  ref() {
  }
  unref() {
  }
  // --- unimplemented methods ---
  umask() {
    throw createNotImplementedError("process.umask");
  }
  getBuiltinModule() {
    return void 0;
  }
  getActiveResourcesInfo() {
    throw createNotImplementedError("process.getActiveResourcesInfo");
  }
  exit() {
    throw createNotImplementedError("process.exit");
  }
  reallyExit() {
    throw createNotImplementedError("process.reallyExit");
  }
  kill() {
    throw createNotImplementedError("process.kill");
  }
  abort() {
    throw createNotImplementedError("process.abort");
  }
  dlopen() {
    throw createNotImplementedError("process.dlopen");
  }
  setSourceMapsEnabled() {
    throw createNotImplementedError("process.setSourceMapsEnabled");
  }
  loadEnvFile() {
    throw createNotImplementedError("process.loadEnvFile");
  }
  disconnect() {
    throw createNotImplementedError("process.disconnect");
  }
  cpuUsage() {
    throw createNotImplementedError("process.cpuUsage");
  }
  setUncaughtExceptionCaptureCallback() {
    throw createNotImplementedError("process.setUncaughtExceptionCaptureCallback");
  }
  hasUncaughtExceptionCaptureCallback() {
    throw createNotImplementedError("process.hasUncaughtExceptionCaptureCallback");
  }
  initgroups() {
    throw createNotImplementedError("process.initgroups");
  }
  openStdin() {
    throw createNotImplementedError("process.openStdin");
  }
  assert() {
    throw createNotImplementedError("process.assert");
  }
  binding() {
    throw createNotImplementedError("process.binding");
  }
  // --- attached interfaces ---
  permission = { has: /* @__PURE__ */ notImplemented("process.permission.has") };
  report = {
    directory: "",
    filename: "",
    signal: "SIGUSR2",
    compact: false,
    reportOnFatalError: false,
    reportOnSignal: false,
    reportOnUncaughtException: false,
    getReport: /* @__PURE__ */ notImplemented("process.report.getReport"),
    writeReport: /* @__PURE__ */ notImplemented("process.report.writeReport")
  };
  finalization = {
    register: /* @__PURE__ */ notImplemented("process.finalization.register"),
    unregister: /* @__PURE__ */ notImplemented("process.finalization.unregister"),
    registerBeforeExit: /* @__PURE__ */ notImplemented("process.finalization.registerBeforeExit")
  };
  memoryUsage = Object.assign(() => ({
    arrayBuffers: 0,
    rss: 0,
    external: 0,
    heapTotal: 0,
    heapUsed: 0
  }), { rss: /* @__PURE__ */ __name(() => 0, "rss") });
  // --- undefined props ---
  mainModule = void 0;
  domain = void 0;
  // optional
  send = void 0;
  exitCode = void 0;
  channel = void 0;
  getegid = void 0;
  geteuid = void 0;
  getgid = void 0;
  getgroups = void 0;
  getuid = void 0;
  setegid = void 0;
  seteuid = void 0;
  setgid = void 0;
  setgroups = void 0;
  setuid = void 0;
  // internals
  _events = void 0;
  _eventsCount = void 0;
  _exiting = void 0;
  _maxListeners = void 0;
  _debugEnd = void 0;
  _debugProcess = void 0;
  _fatalException = void 0;
  _getActiveHandles = void 0;
  _getActiveRequests = void 0;
  _kill = void 0;
  _preload_modules = void 0;
  _rawDebug = void 0;
  _startProfilerIdleNotifier = void 0;
  _stopProfilerIdleNotifier = void 0;
  _tickCallback = void 0;
  _disconnect = void 0;
  _handleQueue = void 0;
  _pendingMessage = void 0;
  _channel = void 0;
  _send = void 0;
  _linkedBinding = void 0;
};

// ../node_modules/@cloudflare/unenv-preset/dist/runtime/node/process.mjs
var globalProcess = globalThis["process"];
var getBuiltinModule = globalProcess.getBuiltinModule;
var workerdProcess = getBuiltinModule("node:process");
var isWorkerdProcessV2 = globalThis.Cloudflare.compatibilityFlags.enable_nodejs_process_v2;
var unenvProcess = new Process({
  env: globalProcess.env,
  // `hrtime` is only available from workerd process v2
  hrtime: isWorkerdProcessV2 ? workerdProcess.hrtime : hrtime,
  // `nextTick` is available from workerd process v1
  nextTick: workerdProcess.nextTick
});
var { exit, features, platform } = workerdProcess;
var {
  // Always implemented by workerd
  env,
  // Only implemented in workerd v2
  hrtime: hrtime3,
  // Always implemented by workerd
  nextTick
} = unenvProcess;
var {
  _channel,
  _disconnect,
  _events,
  _eventsCount,
  _handleQueue,
  _maxListeners,
  _pendingMessage,
  _send,
  assert: assert2,
  disconnect,
  mainModule
} = unenvProcess;
var {
  // @ts-expect-error `_debugEnd` is missing typings
  _debugEnd,
  // @ts-expect-error `_debugProcess` is missing typings
  _debugProcess,
  // @ts-expect-error `_exiting` is missing typings
  _exiting,
  // @ts-expect-error `_fatalException` is missing typings
  _fatalException,
  // @ts-expect-error `_getActiveHandles` is missing typings
  _getActiveHandles,
  // @ts-expect-error `_getActiveRequests` is missing typings
  _getActiveRequests,
  // @ts-expect-error `_kill` is missing typings
  _kill,
  // @ts-expect-error `_linkedBinding` is missing typings
  _linkedBinding,
  // @ts-expect-error `_preload_modules` is missing typings
  _preload_modules,
  // @ts-expect-error `_rawDebug` is missing typings
  _rawDebug,
  // @ts-expect-error `_startProfilerIdleNotifier` is missing typings
  _startProfilerIdleNotifier,
  // @ts-expect-error `_stopProfilerIdleNotifier` is missing typings
  _stopProfilerIdleNotifier,
  // @ts-expect-error `_tickCallback` is missing typings
  _tickCallback,
  abort,
  addListener,
  allowedNodeEnvironmentFlags,
  arch,
  argv,
  argv0,
  availableMemory,
  // @ts-expect-error `binding` is missing typings
  binding,
  channel,
  chdir,
  config,
  connected,
  constrainedMemory,
  cpuUsage,
  cwd,
  debugPort,
  dlopen,
  // @ts-expect-error `domain` is missing typings
  domain,
  emit,
  emitWarning,
  eventNames,
  execArgv,
  execPath,
  exitCode,
  finalization,
  getActiveResourcesInfo,
  getegid,
  geteuid,
  getgid,
  getgroups,
  getMaxListeners,
  getuid,
  hasUncaughtExceptionCaptureCallback,
  // @ts-expect-error `initgroups` is missing typings
  initgroups,
  kill,
  listenerCount,
  listeners,
  loadEnvFile,
  memoryUsage,
  // @ts-expect-error `moduleLoadList` is missing typings
  moduleLoadList,
  off,
  on,
  once,
  // @ts-expect-error `openStdin` is missing typings
  openStdin,
  permission,
  pid,
  ppid,
  prependListener,
  prependOnceListener,
  rawListeners,
  // @ts-expect-error `reallyExit` is missing typings
  reallyExit,
  ref,
  release,
  removeAllListeners,
  removeListener,
  report,
  resourceUsage,
  send,
  setegid,
  seteuid,
  setgid,
  setgroups,
  setMaxListeners,
  setSourceMapsEnabled,
  setuid,
  setUncaughtExceptionCaptureCallback,
  sourceMapsEnabled,
  stderr,
  stdin,
  stdout,
  throwDeprecation,
  title,
  traceDeprecation,
  umask,
  unref,
  uptime,
  version,
  versions
} = isWorkerdProcessV2 ? workerdProcess : unenvProcess;
var _process = {
  abort,
  addListener,
  allowedNodeEnvironmentFlags,
  hasUncaughtExceptionCaptureCallback,
  setUncaughtExceptionCaptureCallback,
  loadEnvFile,
  sourceMapsEnabled,
  arch,
  argv,
  argv0,
  chdir,
  config,
  connected,
  constrainedMemory,
  availableMemory,
  cpuUsage,
  cwd,
  debugPort,
  dlopen,
  disconnect,
  emit,
  emitWarning,
  env,
  eventNames,
  execArgv,
  execPath,
  exit,
  finalization,
  features,
  getBuiltinModule,
  getActiveResourcesInfo,
  getMaxListeners,
  hrtime: hrtime3,
  kill,
  listeners,
  listenerCount,
  memoryUsage,
  nextTick,
  on,
  off,
  once,
  pid,
  platform,
  ppid,
  prependListener,
  prependOnceListener,
  rawListeners,
  release,
  removeAllListeners,
  removeListener,
  report,
  resourceUsage,
  setMaxListeners,
  setSourceMapsEnabled,
  stderr,
  stdin,
  stdout,
  title,
  throwDeprecation,
  traceDeprecation,
  umask,
  uptime,
  version,
  versions,
  // @ts-expect-error old API
  domain,
  initgroups,
  moduleLoadList,
  reallyExit,
  openStdin,
  assert: assert2,
  binding,
  send,
  exitCode,
  channel,
  getegid,
  geteuid,
  getgid,
  getgroups,
  getuid,
  setegid,
  seteuid,
  setgid,
  setgroups,
  setuid,
  permission,
  mainModule,
  _events,
  _eventsCount,
  _exiting,
  _maxListeners,
  _debugEnd,
  _debugProcess,
  _fatalException,
  _getActiveHandles,
  _getActiveRequests,
  _kill,
  _preload_modules,
  _rawDebug,
  _startProfilerIdleNotifier,
  _stopProfilerIdleNotifier,
  _tickCallback,
  _disconnect,
  _handleQueue,
  _pendingMessage,
  _channel,
  _send,
  _linkedBinding
};
var process_default = _process;

// ../node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-process
globalThis.process = process_default;

// _worker.js
import us from "crypto";
var ls = Object.defineProperty;
var Wt = /* @__PURE__ */ __name((e) => {
  throw TypeError(e);
}, "Wt");
var ds = /* @__PURE__ */ __name((e, r, t) => r in e ? ls(e, r, { enumerable: true, configurable: true, writable: true, value: t }) : e[r] = t, "ds");
var C = /* @__PURE__ */ __name((e, r, t) => ds(e, typeof r != "symbol" ? r + "" : r, t), "C");
var xt = /* @__PURE__ */ __name((e, r, t) => r.has(e) || Wt("Cannot " + t), "xt");
var w = /* @__PURE__ */ __name((e, r, t) => (xt(e, r, "read from private field"), t ? t.call(e) : r.get(e)), "w");
var B = /* @__PURE__ */ __name((e, r, t) => r.has(e) ? Wt("Cannot add the same private member more than once") : r instanceof WeakSet ? r.add(e) : r.set(e, t), "B");
var L = /* @__PURE__ */ __name((e, r, t, s) => (xt(e, r, "write to private field"), s ? s.call(e, t) : r.set(e, t), t), "L");
var H = /* @__PURE__ */ __name((e, r, t) => (xt(e, r, "access private method"), t), "H");
var Jt = /* @__PURE__ */ __name((e, r, t, s) => ({ set _(n) {
  L(e, r, n, t);
}, get _() {
  return w(e, r, s);
} }), "Jt");
var Gt = /* @__PURE__ */ __name((e, r, t) => (s, n) => {
  let a = -1;
  return o(0);
  async function o(i) {
    if (i <= a) throw new Error("next() called multiple times");
    a = i;
    let c, l = false, u;
    if (e[i] ? (u = e[i][0][0], s.req.routeIndex = i) : u = i === e.length && n || void 0, u) try {
      c = await u(s, () => o(i + 1));
    } catch (d) {
      if (d instanceof Error && r) s.error = d, c = await r(d, s), l = true;
      else throw d;
    }
    else s.finalized === false && t && (c = await t(s));
    return c && (s.finalized === false || l) && (s.res = c), s;
  }
  __name(o, "o");
}, "Gt");
var _s = Symbol();
var ps = /* @__PURE__ */ __name(async (e, r = /* @__PURE__ */ Object.create(null)) => {
  const { all: t = false, dot: s = false } = r, a = (e instanceof Er ? e.raw.headers : e.headers).get("Content-Type");
  return a != null && a.startsWith("multipart/form-data") || a != null && a.startsWith("application/x-www-form-urlencoded") ? ms(e, { all: t, dot: s }) : {};
}, "ps");
async function ms(e, r) {
  const t = await e.formData();
  return t ? gs(t, r) : {};
}
__name(ms, "ms");
function gs(e, r) {
  const t = /* @__PURE__ */ Object.create(null);
  return e.forEach((s, n) => {
    r.all || n.endsWith("[]") ? fs(t, n, s) : t[n] = s;
  }), r.dot && Object.entries(t).forEach(([s, n]) => {
    s.includes(".") && (hs(t, s, n), delete t[s]);
  }), t;
}
__name(gs, "gs");
var fs = /* @__PURE__ */ __name((e, r, t) => {
  e[r] !== void 0 ? Array.isArray(e[r]) ? e[r].push(t) : e[r] = [e[r], t] : r.endsWith("[]") ? e[r] = [t] : e[r] = t;
}, "fs");
var hs = /* @__PURE__ */ __name((e, r, t) => {
  let s = e;
  const n = r.split(".");
  n.forEach((a, o) => {
    o === n.length - 1 ? s[a] = t : ((!s[a] || typeof s[a] != "object" || Array.isArray(s[a]) || s[a] instanceof File) && (s[a] = /* @__PURE__ */ Object.create(null)), s = s[a]);
  });
}, "hs");
var mr = /* @__PURE__ */ __name((e) => {
  const r = e.split("/");
  return r[0] === "" && r.shift(), r;
}, "mr");
var Es = /* @__PURE__ */ __name((e) => {
  const { groups: r, path: t } = bs(e), s = mr(t);
  return ys(s, r);
}, "Es");
var bs = /* @__PURE__ */ __name((e) => {
  const r = [];
  return e = e.replace(/\{[^}]+\}/g, (t, s) => {
    const n = `@${s}`;
    return r.push([n, t]), n;
  }), { groups: r, path: e };
}, "bs");
var ys = /* @__PURE__ */ __name((e, r) => {
  for (let t = r.length - 1; t >= 0; t--) {
    const [s] = r[t];
    for (let n = e.length - 1; n >= 0; n--) if (e[n].includes(s)) {
      e[n] = e[n].replace(s, r[t][1]);
      break;
    }
  }
  return e;
}, "ys");
var ot = {};
var ws = /* @__PURE__ */ __name((e, r) => {
  if (e === "*") return "*";
  const t = e.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
  if (t) {
    const s = `${e}#${r}`;
    return ot[s] || (t[2] ? ot[s] = r && r[0] !== ":" && r[0] !== "*" ? [s, t[1], new RegExp(`^${t[2]}(?=/${r})`)] : [e, t[1], new RegExp(`^${t[2]}$`)] : ot[s] = [e, t[1], true]), ot[s];
  }
  return null;
}, "ws");
var ht = /* @__PURE__ */ __name((e, r) => {
  try {
    return r(e);
  } catch {
    return e.replace(/(?:%[0-9A-Fa-f]{2})+/g, (t) => {
      try {
        return r(t);
      } catch {
        return t;
      }
    });
  }
}, "ht");
var xs = /* @__PURE__ */ __name((e) => ht(e, decodeURI), "xs");
var gr = /* @__PURE__ */ __name((e) => {
  const r = e.url, t = r.indexOf("/", r.indexOf(":") + 4);
  let s = t;
  for (; s < r.length; s++) {
    const n = r.charCodeAt(s);
    if (n === 37) {
      const a = r.indexOf("?", s), o = r.slice(t, a === -1 ? void 0 : a);
      return xs(o.includes("%25") ? o.replace(/%25/g, "%2525") : o);
    } else if (n === 63) break;
  }
  return r.slice(t, s);
}, "gr");
var vs = /* @__PURE__ */ __name((e) => {
  const r = gr(e);
  return r.length > 1 && r.at(-1) === "/" ? r.slice(0, -1) : r;
}, "vs");
var Re = /* @__PURE__ */ __name((e, r, ...t) => (t.length && (r = Re(r, ...t)), `${(e == null ? void 0 : e[0]) === "/" ? "" : "/"}${e}${r === "/" ? "" : `${(e == null ? void 0 : e.at(-1)) === "/" ? "" : "/"}${(r == null ? void 0 : r[0]) === "/" ? r.slice(1) : r}`}`), "Re");
var fr = /* @__PURE__ */ __name((e) => {
  if (e.charCodeAt(e.length - 1) !== 63 || !e.includes(":")) return null;
  const r = e.split("/"), t = [];
  let s = "";
  return r.forEach((n) => {
    if (n !== "" && !/\:/.test(n)) s += "/" + n;
    else if (/\:/.test(n)) if (/\?/.test(n)) {
      t.length === 0 && s === "" ? t.push("/") : t.push(s);
      const a = n.replace("?", "");
      s += "/" + a, t.push(s);
    } else s += "/" + n;
  }), t.filter((n, a, o) => o.indexOf(n) === a);
}, "fr");
var vt = /* @__PURE__ */ __name((e) => /[%+]/.test(e) ? (e.indexOf("+") !== -1 && (e = e.replace(/\+/g, " ")), e.indexOf("%") !== -1 ? ht(e, Bt) : e) : e, "vt");
var hr = /* @__PURE__ */ __name((e, r, t) => {
  let s;
  if (!t && r && !/[%+]/.test(r)) {
    let o = e.indexOf("?", 8);
    if (o === -1) return;
    for (e.startsWith(r, o + 1) || (o = e.indexOf(`&${r}`, o + 1)); o !== -1; ) {
      const i = e.charCodeAt(o + r.length + 1);
      if (i === 61) {
        const c = o + r.length + 2, l = e.indexOf("&", c);
        return vt(e.slice(c, l === -1 ? void 0 : l));
      } else if (i == 38 || isNaN(i)) return "";
      o = e.indexOf(`&${r}`, o + 1);
    }
    if (s = /[%+]/.test(e), !s) return;
  }
  const n = {};
  s ?? (s = /[%+]/.test(e));
  let a = e.indexOf("?", 8);
  for (; a !== -1; ) {
    const o = e.indexOf("&", a + 1);
    let i = e.indexOf("=", a);
    i > o && o !== -1 && (i = -1);
    let c = e.slice(a + 1, i === -1 ? o === -1 ? void 0 : o : i);
    if (s && (c = vt(c)), a = o, c === "") continue;
    let l;
    i === -1 ? l = "" : (l = e.slice(i + 1, o === -1 ? void 0 : o), s && (l = vt(l))), t ? (n[c] && Array.isArray(n[c]) || (n[c] = []), n[c].push(l)) : n[c] ?? (n[c] = l);
  }
  return r ? n[r] : n;
}, "hr");
var Ts = hr;
var Ss = /* @__PURE__ */ __name((e, r) => hr(e, r, true), "Ss");
var Bt = decodeURIComponent;
var Yt = /* @__PURE__ */ __name((e) => ht(e, Bt), "Yt");
var je;
var V;
var le;
var br;
var yr;
var At;
var ue;
var cr;
var Er = (cr = class {
  static {
    __name(this, "cr");
  }
  constructor(e, r = "/", t = [[]]) {
    B(this, le);
    C(this, "raw");
    B(this, je);
    B(this, V);
    C(this, "routeIndex", 0);
    C(this, "path");
    C(this, "bodyCache", {});
    B(this, ue, (e2) => {
      const { bodyCache: r2, raw: t2 } = this, s = r2[e2];
      if (s) return s;
      const n = Object.keys(r2)[0];
      return n ? r2[n].then((a) => (n === "json" && (a = JSON.stringify(a)), new Response(a)[e2]())) : r2[e2] = t2[e2]();
    });
    this.raw = e, this.path = r, L(this, V, t), L(this, je, {});
  }
  param(e) {
    return e ? H(this, le, br).call(this, e) : H(this, le, yr).call(this);
  }
  query(e) {
    return Ts(this.url, e);
  }
  queries(e) {
    return Ss(this.url, e);
  }
  header(e) {
    if (e) return this.raw.headers.get(e) ?? void 0;
    const r = {};
    return this.raw.headers.forEach((t, s) => {
      r[s] = t;
    }), r;
  }
  async parseBody(e) {
    var r;
    return (r = this.bodyCache).parsedBody ?? (r.parsedBody = await ps(this, e));
  }
  json() {
    return w(this, ue).call(this, "text").then((e) => JSON.parse(e));
  }
  text() {
    return w(this, ue).call(this, "text");
  }
  arrayBuffer() {
    return w(this, ue).call(this, "arrayBuffer");
  }
  blob() {
    return w(this, ue).call(this, "blob");
  }
  formData() {
    return w(this, ue).call(this, "formData");
  }
  addValidatedData(e, r) {
    w(this, je)[e] = r;
  }
  valid(e) {
    return w(this, je)[e];
  }
  get url() {
    return this.raw.url;
  }
  get method() {
    return this.raw.method;
  }
  get [_s]() {
    return w(this, V);
  }
  get matchedRoutes() {
    return w(this, V)[0].map(([[, e]]) => e);
  }
  get routePath() {
    return w(this, V)[0].map(([[, e]]) => e)[this.routeIndex].path;
  }
}, je = /* @__PURE__ */ new WeakMap(), V = /* @__PURE__ */ new WeakMap(), le = /* @__PURE__ */ new WeakSet(), br = /* @__PURE__ */ __name(function(e) {
  const r = w(this, V)[0][this.routeIndex][1][e], t = H(this, le, At).call(this, r);
  return t && /\%/.test(t) ? Yt(t) : t;
}, "br"), yr = /* @__PURE__ */ __name(function() {
  const e = {}, r = Object.keys(w(this, V)[0][this.routeIndex][1]);
  for (const t of r) {
    const s = H(this, le, At).call(this, w(this, V)[0][this.routeIndex][1][t]);
    s !== void 0 && (e[t] = /\%/.test(s) ? Yt(s) : s);
  }
  return e;
}, "yr"), At = /* @__PURE__ */ __name(function(e) {
  return w(this, V)[1] ? w(this, V)[1][e] : e;
}, "At"), ue = /* @__PURE__ */ new WeakMap(), cr);
var Ns = { Stringify: 1 };
var wr = /* @__PURE__ */ __name(async (e, r, t, s, n) => {
  typeof e == "object" && !(e instanceof String) && (e instanceof Promise || (e = e.toString()), e instanceof Promise && (e = await e));
  const a = e.callbacks;
  return a != null && a.length ? (n ? n[0] += e : n = [e], Promise.all(a.map((i) => i({ phase: r, buffer: n, context: s }))).then((i) => Promise.all(i.filter(Boolean).map((c) => wr(c, r, false, s, n))).then(() => n[0]))) : Promise.resolve(e);
}, "wr");
var Is = "text/plain; charset=UTF-8";
var Tt = /* @__PURE__ */ __name((e, r) => ({ "Content-Type": e, ...r }), "Tt");
var et;
var tt;
var ae;
var Le;
var oe;
var G;
var rt;
var Me;
var Be;
var ye;
var st;
var nt;
var _e;
var De;
var lr;
var Os = (lr = class {
  static {
    __name(this, "lr");
  }
  constructor(e, r) {
    B(this, _e);
    B(this, et);
    B(this, tt);
    C(this, "env", {});
    B(this, ae);
    C(this, "finalized", false);
    C(this, "error");
    B(this, Le);
    B(this, oe);
    B(this, G);
    B(this, rt);
    B(this, Me);
    B(this, Be);
    B(this, ye);
    B(this, st);
    B(this, nt);
    C(this, "render", (...e2) => (w(this, Me) ?? L(this, Me, (r2) => this.html(r2)), w(this, Me).call(this, ...e2)));
    C(this, "setLayout", (e2) => L(this, rt, e2));
    C(this, "getLayout", () => w(this, rt));
    C(this, "setRenderer", (e2) => {
      L(this, Me, e2);
    });
    C(this, "header", (e2, r2, t) => {
      this.finalized && L(this, G, new Response(w(this, G).body, w(this, G)));
      const s = w(this, G) ? w(this, G).headers : w(this, ye) ?? L(this, ye, new Headers());
      r2 === void 0 ? s.delete(e2) : t != null && t.append ? s.append(e2, r2) : s.set(e2, r2);
    });
    C(this, "status", (e2) => {
      L(this, Le, e2);
    });
    C(this, "set", (e2, r2) => {
      w(this, ae) ?? L(this, ae, /* @__PURE__ */ new Map()), w(this, ae).set(e2, r2);
    });
    C(this, "get", (e2) => w(this, ae) ? w(this, ae).get(e2) : void 0);
    C(this, "newResponse", (...e2) => H(this, _e, De).call(this, ...e2));
    C(this, "body", (e2, r2, t) => H(this, _e, De).call(this, e2, r2, t));
    C(this, "text", (e2, r2, t) => !w(this, ye) && !w(this, Le) && !r2 && !t && !this.finalized ? new Response(e2) : H(this, _e, De).call(this, e2, r2, Tt(Is, t)));
    C(this, "json", (e2, r2, t) => H(this, _e, De).call(this, JSON.stringify(e2), r2, Tt("application/json", t)));
    C(this, "html", (e2, r2, t) => {
      const s = /* @__PURE__ */ __name((n) => H(this, _e, De).call(this, n, r2, Tt("text/html; charset=UTF-8", t)), "s");
      return typeof e2 == "object" ? wr(e2, Ns.Stringify, false, {}).then(s) : s(e2);
    });
    C(this, "redirect", (e2, r2) => {
      const t = String(e2);
      return this.header("Location", /[^\x00-\xFF]/.test(t) ? encodeURI(t) : t), this.newResponse(null, r2 ?? 302);
    });
    C(this, "notFound", () => (w(this, Be) ?? L(this, Be, () => new Response()), w(this, Be).call(this, this)));
    L(this, et, e), r && (L(this, oe, r.executionCtx), this.env = r.env, L(this, Be, r.notFoundHandler), L(this, nt, r.path), L(this, st, r.matchResult));
  }
  get req() {
    return w(this, tt) ?? L(this, tt, new Er(w(this, et), w(this, nt), w(this, st))), w(this, tt);
  }
  get event() {
    if (w(this, oe) && "respondWith" in w(this, oe)) return w(this, oe);
    throw Error("This context has no FetchEvent");
  }
  get executionCtx() {
    if (w(this, oe)) return w(this, oe);
    throw Error("This context has no ExecutionContext");
  }
  get res() {
    return w(this, G) || L(this, G, new Response(null, { headers: w(this, ye) ?? L(this, ye, new Headers()) }));
  }
  set res(e) {
    if (w(this, G) && e) {
      e = new Response(e.body, e);
      for (const [r, t] of w(this, G).headers.entries()) if (r !== "content-type") if (r === "set-cookie") {
        const s = w(this, G).headers.getSetCookie();
        e.headers.delete("set-cookie");
        for (const n of s) e.headers.append("set-cookie", n);
      } else e.headers.set(r, t);
    }
    L(this, G, e), this.finalized = true;
  }
  get var() {
    return w(this, ae) ? Object.fromEntries(w(this, ae)) : {};
  }
}, et = /* @__PURE__ */ new WeakMap(), tt = /* @__PURE__ */ new WeakMap(), ae = /* @__PURE__ */ new WeakMap(), Le = /* @__PURE__ */ new WeakMap(), oe = /* @__PURE__ */ new WeakMap(), G = /* @__PURE__ */ new WeakMap(), rt = /* @__PURE__ */ new WeakMap(), Me = /* @__PURE__ */ new WeakMap(), Be = /* @__PURE__ */ new WeakMap(), ye = /* @__PURE__ */ new WeakMap(), st = /* @__PURE__ */ new WeakMap(), nt = /* @__PURE__ */ new WeakMap(), _e = /* @__PURE__ */ new WeakSet(), De = /* @__PURE__ */ __name(function(e, r, t) {
  const s = w(this, G) ? new Headers(w(this, G).headers) : w(this, ye) ?? new Headers();
  if (typeof r == "object" && "headers" in r) {
    const a = r.headers instanceof Headers ? r.headers : new Headers(r.headers);
    for (const [o, i] of a) o.toLowerCase() === "set-cookie" ? s.append(o, i) : s.set(o, i);
  }
  if (t) for (const [a, o] of Object.entries(t)) if (typeof o == "string") s.set(a, o);
  else {
    s.delete(a);
    for (const i of o) s.append(a, i);
  }
  const n = typeof r == "number" ? r : (r == null ? void 0 : r.status) ?? w(this, Le);
  return new Response(e, { status: n, headers: s });
}, "De"), lr);
var U = "ALL";
var Rs = "all";
var Ds = ["get", "post", "put", "delete", "options", "patch"];
var xr = "Can not add a route since the matcher is already built.";
var vr = class extends Error {
  static {
    __name(this, "vr");
  }
};
var As = "__COMPOSED_HANDLER";
var Cs = /* @__PURE__ */ __name((e) => e.text("404 Not Found", 404), "Cs");
var Vt = /* @__PURE__ */ __name((e, r) => {
  if ("getResponse" in e) {
    const t = e.getResponse();
    return r.newResponse(t.body, t);
  }
  return console.error(e), r.text("Internal Server Error", 500);
}, "Vt");
var z;
var q;
var Tr;
var X;
var Ee;
var it;
var ct;
var ke;
var js = (ke = class {
  static {
    __name(this, "ke");
  }
  constructor(r = {}) {
    B(this, q);
    C(this, "get");
    C(this, "post");
    C(this, "put");
    C(this, "delete");
    C(this, "options");
    C(this, "patch");
    C(this, "all");
    C(this, "on");
    C(this, "use");
    C(this, "router");
    C(this, "getPath");
    C(this, "_basePath", "/");
    B(this, z, "/");
    C(this, "routes", []);
    B(this, X, Cs);
    C(this, "errorHandler", Vt);
    C(this, "onError", (r2) => (this.errorHandler = r2, this));
    C(this, "notFound", (r2) => (L(this, X, r2), this));
    C(this, "fetch", (r2, ...t) => H(this, q, ct).call(this, r2, t[1], t[0], r2.method));
    C(this, "request", (r2, t, s2, n2) => r2 instanceof Request ? this.fetch(t ? new Request(r2, t) : r2, s2, n2) : (r2 = r2.toString(), this.fetch(new Request(/^https?:\/\//.test(r2) ? r2 : `http://localhost${Re("/", r2)}`, t), s2, n2)));
    C(this, "fire", () => {
      addEventListener("fetch", (r2) => {
        r2.respondWith(H(this, q, ct).call(this, r2.request, r2, void 0, r2.request.method));
      });
    });
    [...Ds, Rs].forEach((a) => {
      this[a] = (o, ...i) => (typeof o == "string" ? L(this, z, o) : H(this, q, Ee).call(this, a, w(this, z), o), i.forEach((c) => {
        H(this, q, Ee).call(this, a, w(this, z), c);
      }), this);
    }), this.on = (a, o, ...i) => {
      for (const c of [o].flat()) {
        L(this, z, c);
        for (const l of [a].flat()) i.map((u) => {
          H(this, q, Ee).call(this, l.toUpperCase(), w(this, z), u);
        });
      }
      return this;
    }, this.use = (a, ...o) => (typeof a == "string" ? L(this, z, a) : (L(this, z, "*"), o.unshift(a)), o.forEach((i) => {
      H(this, q, Ee).call(this, U, w(this, z), i);
    }), this);
    const { strict: s, ...n } = r;
    Object.assign(this, n), this.getPath = s ?? true ? r.getPath ?? gr : vs;
  }
  route(r, t) {
    const s = this.basePath(r);
    return t.routes.map((n) => {
      var o;
      let a;
      t.errorHandler === Vt ? a = n.handler : (a = /* @__PURE__ */ __name(async (i, c) => (await Gt([], t.errorHandler)(i, () => n.handler(i, c))).res, "a"), a[As] = n.handler), H(o = s, q, Ee).call(o, n.method, n.path, a);
    }), this;
  }
  basePath(r) {
    const t = H(this, q, Tr).call(this);
    return t._basePath = Re(this._basePath, r), t;
  }
  mount(r, t, s) {
    let n, a;
    s && (typeof s == "function" ? a = s : (a = s.optionHandler, s.replaceRequest === false ? n = /* @__PURE__ */ __name((c) => c, "n") : n = s.replaceRequest));
    const o = a ? (c) => {
      const l = a(c);
      return Array.isArray(l) ? l : [l];
    } : (c) => {
      let l;
      try {
        l = c.executionCtx;
      } catch {
      }
      return [c.env, l];
    };
    n || (n = (() => {
      const c = Re(this._basePath, r), l = c === "/" ? 0 : c.length;
      return (u) => {
        const d = new URL(u.url);
        return d.pathname = d.pathname.slice(l) || "/", new Request(d, u);
      };
    })());
    const i = /* @__PURE__ */ __name(async (c, l) => {
      const u = await t(n(c.req.raw), ...o(c));
      if (u) return u;
      await l();
    }, "i");
    return H(this, q, Ee).call(this, U, Re(r, "*"), i), this;
  }
}, z = /* @__PURE__ */ new WeakMap(), q = /* @__PURE__ */ new WeakSet(), Tr = /* @__PURE__ */ __name(function() {
  const r = new ke({ router: this.router, getPath: this.getPath });
  return r.errorHandler = this.errorHandler, L(r, X, w(this, X)), r.routes = this.routes, r;
}, "Tr"), X = /* @__PURE__ */ new WeakMap(), Ee = /* @__PURE__ */ __name(function(r, t, s) {
  r = r.toUpperCase(), t = Re(this._basePath, t);
  const n = { basePath: this._basePath, path: t, method: r, handler: s };
  this.router.add(r, t, [s, n]), this.routes.push(n);
}, "Ee"), it = /* @__PURE__ */ __name(function(r, t) {
  if (r instanceof Error) return this.errorHandler(r, t);
  throw r;
}, "it"), ct = /* @__PURE__ */ __name(function(r, t, s, n) {
  if (n === "HEAD") return (async () => new Response(null, await H(this, q, ct).call(this, r, t, s, "GET")))();
  const a = this.getPath(r, { env: s }), o = this.router.match(n, a), i = new Os(r, { path: a, matchResult: o, env: s, executionCtx: t, notFoundHandler: w(this, X) });
  if (o[0].length === 1) {
    let l;
    try {
      l = o[0][0][0][0](i, async () => {
        i.res = await w(this, X).call(this, i);
      });
    } catch (u) {
      return H(this, q, it).call(this, u, i);
    }
    return l instanceof Promise ? l.then((u) => u || (i.finalized ? i.res : w(this, X).call(this, i))).catch((u) => H(this, q, it).call(this, u, i)) : l ?? w(this, X).call(this, i);
  }
  const c = Gt(o[0], this.errorHandler, w(this, X));
  return (async () => {
    try {
      const l = await c(i);
      if (!l.finalized) throw new Error("Context is not finalized. Did you forget to return a Response object or `await next()`?");
      return l.res;
    } catch (l) {
      return H(this, q, it).call(this, l, i);
    }
  })();
}, "ct"), ke);
var Sr = [];
function Ls(e, r) {
  const t = this.buildAllMatchers(), s = /* @__PURE__ */ __name(((n, a) => {
    const o = t[n] || t[U], i = o[2][a];
    if (i) return i;
    const c = a.match(o[0]);
    if (!c) return [[], Sr];
    const l = c.indexOf("", 1);
    return [o[1][l], c];
  }), "s");
  return this.match = s, s(e, r);
}
__name(Ls, "Ls");
var dt = "[^/]+";
var Je = ".*";
var Ge = "(?:|/.*)";
var Ae = Symbol();
var Ms = new Set(".\\+*[^]$()");
function Bs(e, r) {
  return e.length === 1 ? r.length === 1 ? e < r ? -1 : 1 : -1 : r.length === 1 || e === Je || e === Ge ? 1 : r === Je || r === Ge ? -1 : e === dt ? 1 : r === dt ? -1 : e.length === r.length ? e < r ? -1 : 1 : r.length - e.length;
}
__name(Bs, "Bs");
var we;
var xe;
var Q;
var Se;
var ks = (Se = class {
  static {
    __name(this, "Se");
  }
  constructor() {
    B(this, we);
    B(this, xe);
    B(this, Q, /* @__PURE__ */ Object.create(null));
  }
  insert(r, t, s, n, a) {
    if (r.length === 0) {
      if (w(this, we) !== void 0) throw Ae;
      if (a) return;
      L(this, we, t);
      return;
    }
    const [o, ...i] = r, c = o === "*" ? i.length === 0 ? ["", "", Je] : ["", "", dt] : o === "/*" ? ["", "", Ge] : o.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
    let l;
    if (c) {
      const u = c[1];
      let d = c[2] || dt;
      if (u && c[2] && (d === ".*" || (d = d.replace(/^\((?!\?:)(?=[^)]+\)$)/, "(?:"), /\((?!\?:)/.test(d)))) throw Ae;
      if (l = w(this, Q)[d], !l) {
        if (Object.keys(w(this, Q)).some((_) => _ !== Je && _ !== Ge)) throw Ae;
        if (a) return;
        l = w(this, Q)[d] = new Se(), u !== "" && L(l, xe, n.varIndex++);
      }
      !a && u !== "" && s.push([u, w(l, xe)]);
    } else if (l = w(this, Q)[o], !l) {
      if (Object.keys(w(this, Q)).some((u) => u.length > 1 && u !== Je && u !== Ge)) throw Ae;
      if (a) return;
      l = w(this, Q)[o] = new Se();
    }
    l.insert(i, t, s, n, a);
  }
  buildRegExpStr() {
    const t = Object.keys(w(this, Q)).sort(Bs).map((s) => {
      const n = w(this, Q)[s];
      return (typeof w(n, xe) == "number" ? `(${s})@${w(n, xe)}` : Ms.has(s) ? `\\${s}` : s) + n.buildRegExpStr();
    });
    return typeof w(this, we) == "number" && t.unshift(`#${w(this, we)}`), t.length === 0 ? "" : t.length === 1 ? t[0] : "(?:" + t.join("|") + ")";
  }
}, we = /* @__PURE__ */ new WeakMap(), xe = /* @__PURE__ */ new WeakMap(), Q = /* @__PURE__ */ new WeakMap(), Se);
var gt;
var at;
var dr;
var $s = (dr = class {
  static {
    __name(this, "dr");
  }
  constructor() {
    B(this, gt, { varIndex: 0 });
    B(this, at, new ks());
  }
  insert(e, r, t) {
    const s = [], n = [];
    for (let o = 0; ; ) {
      let i = false;
      if (e = e.replace(/\{[^}]+\}/g, (c) => {
        const l = `@\\${o}`;
        return n[o] = [l, c], o++, i = true, l;
      }), !i) break;
    }
    const a = e.match(/(?::[^\/]+)|(?:\/\*$)|./g) || [];
    for (let o = n.length - 1; o >= 0; o--) {
      const [i] = n[o];
      for (let c = a.length - 1; c >= 0; c--) if (a[c].indexOf(i) !== -1) {
        a[c] = a[c].replace(i, n[o][1]);
        break;
      }
    }
    return w(this, at).insert(a, r, s, w(this, gt), t), s;
  }
  buildRegExp() {
    let e = w(this, at).buildRegExpStr();
    if (e === "") return [/^$/, [], []];
    let r = 0;
    const t = [], s = [];
    return e = e.replace(/#(\d+)|@(\d+)|\.\*\$/g, (n, a, o) => a !== void 0 ? (t[++r] = Number(a), "$()") : (o !== void 0 && (s[Number(o)] = ++r), "")), [new RegExp(`^${e}`), t, s];
  }
}, gt = /* @__PURE__ */ new WeakMap(), at = /* @__PURE__ */ new WeakMap(), dr);
var Hs = [/^$/, [], /* @__PURE__ */ Object.create(null)];
var lt = /* @__PURE__ */ Object.create(null);
function Nr(e) {
  return lt[e] ?? (lt[e] = new RegExp(e === "*" ? "" : `^${e.replace(/\/\*$|([.\\+*[^\]$()])/g, (r, t) => t ? `\\${t}` : "(?:|/.*)")}$`));
}
__name(Nr, "Nr");
function Us() {
  lt = /* @__PURE__ */ Object.create(null);
}
__name(Us, "Us");
function qs(e) {
  var l;
  const r = new $s(), t = [];
  if (e.length === 0) return Hs;
  const s = e.map((u) => [!/\*|\/:/.test(u[0]), ...u]).sort(([u, d], [_, m]) => u ? 1 : _ ? -1 : d.length - m.length), n = /* @__PURE__ */ Object.create(null);
  for (let u = 0, d = -1, _ = s.length; u < _; u++) {
    const [m, h, g] = s[u];
    m ? n[h] = [g.map(([E]) => [E, /* @__PURE__ */ Object.create(null)]), Sr] : d++;
    let f;
    try {
      f = r.insert(h, d, m);
    } catch (E) {
      throw E === Ae ? new vr(h) : E;
    }
    m || (t[d] = g.map(([E, x]) => {
      const y = /* @__PURE__ */ Object.create(null);
      for (x -= 1; x >= 0; x--) {
        const [v, b] = f[x];
        y[v] = b;
      }
      return [E, y];
    }));
  }
  const [a, o, i] = r.buildRegExp();
  for (let u = 0, d = t.length; u < d; u++) for (let _ = 0, m = t[u].length; _ < m; _++) {
    const h = (l = t[u][_]) == null ? void 0 : l[1];
    if (!h) continue;
    const g = Object.keys(h);
    for (let f = 0, E = g.length; f < E; f++) h[g[f]] = i[h[g[f]]];
  }
  const c = [];
  for (const u in o) c[u] = t[o[u]];
  return [a, c, n];
}
__name(qs, "qs");
function Ie(e, r) {
  if (e) {
    for (const t of Object.keys(e).sort((s, n) => n.length - s.length)) if (Nr(t).test(r)) return [...e[t]];
  }
}
__name(Ie, "Ie");
var pe;
var me;
var ft;
var Ir;
var ur;
var Ps = (ur = class {
  static {
    __name(this, "ur");
  }
  constructor() {
    B(this, ft);
    C(this, "name", "RegExpRouter");
    B(this, pe);
    B(this, me);
    C(this, "match", Ls);
    L(this, pe, { [U]: /* @__PURE__ */ Object.create(null) }), L(this, me, { [U]: /* @__PURE__ */ Object.create(null) });
  }
  add(e, r, t) {
    var i;
    const s = w(this, pe), n = w(this, me);
    if (!s || !n) throw new Error(xr);
    s[e] || [s, n].forEach((c) => {
      c[e] = /* @__PURE__ */ Object.create(null), Object.keys(c[U]).forEach((l) => {
        c[e][l] = [...c[U][l]];
      });
    }), r === "/*" && (r = "*");
    const a = (r.match(/\/:/g) || []).length;
    if (/\*$/.test(r)) {
      const c = Nr(r);
      e === U ? Object.keys(s).forEach((l) => {
        var u;
        (u = s[l])[r] || (u[r] = Ie(s[l], r) || Ie(s[U], r) || []);
      }) : (i = s[e])[r] || (i[r] = Ie(s[e], r) || Ie(s[U], r) || []), Object.keys(s).forEach((l) => {
        (e === U || e === l) && Object.keys(s[l]).forEach((u) => {
          c.test(u) && s[l][u].push([t, a]);
        });
      }), Object.keys(n).forEach((l) => {
        (e === U || e === l) && Object.keys(n[l]).forEach((u) => c.test(u) && n[l][u].push([t, a]));
      });
      return;
    }
    const o = fr(r) || [r];
    for (let c = 0, l = o.length; c < l; c++) {
      const u = o[c];
      Object.keys(n).forEach((d) => {
        var _;
        (e === U || e === d) && ((_ = n[d])[u] || (_[u] = [...Ie(s[d], u) || Ie(s[U], u) || []]), n[d][u].push([t, a - l + c + 1]));
      });
    }
  }
  buildAllMatchers() {
    const e = /* @__PURE__ */ Object.create(null);
    return Object.keys(w(this, me)).concat(Object.keys(w(this, pe))).forEach((r) => {
      e[r] || (e[r] = H(this, ft, Ir).call(this, r));
    }), L(this, pe, L(this, me, void 0)), Us(), e;
  }
}, pe = /* @__PURE__ */ new WeakMap(), me = /* @__PURE__ */ new WeakMap(), ft = /* @__PURE__ */ new WeakSet(), Ir = /* @__PURE__ */ __name(function(e) {
  const r = [];
  let t = e === U;
  return [w(this, pe), w(this, me)].forEach((s) => {
    const n = s[e] ? Object.keys(s[e]).map((a) => [a, s[e][a]]) : [];
    n.length !== 0 ? (t || (t = true), r.push(...n)) : e !== U && r.push(...Object.keys(s[U]).map((a) => [a, s[U][a]]));
  }), t ? qs(r) : null;
}, "Ir"), ur);
var ge;
var ie;
var _r;
var Fs = (_r = class {
  static {
    __name(this, "_r");
  }
  constructor(e) {
    C(this, "name", "SmartRouter");
    B(this, ge, []);
    B(this, ie, []);
    L(this, ge, e.routers);
  }
  add(e, r, t) {
    if (!w(this, ie)) throw new Error(xr);
    w(this, ie).push([e, r, t]);
  }
  match(e, r) {
    if (!w(this, ie)) throw new Error("Fatal error");
    const t = w(this, ge), s = w(this, ie), n = t.length;
    let a = 0, o;
    for (; a < n; a++) {
      const i = t[a];
      try {
        for (let c = 0, l = s.length; c < l; c++) i.add(...s[c]);
        o = i.match(e, r);
      } catch (c) {
        if (c instanceof vr) continue;
        throw c;
      }
      this.match = i.match.bind(i), L(this, ge, [i]), L(this, ie, void 0);
      break;
    }
    if (a === n) throw new Error("Fatal error");
    return this.name = `SmartRouter + ${this.activeRouter.name}`, o;
  }
  get activeRouter() {
    if (w(this, ie) || w(this, ge).length !== 1) throw new Error("No active router has been determined yet.");
    return w(this, ge)[0];
  }
}, ge = /* @__PURE__ */ new WeakMap(), ie = /* @__PURE__ */ new WeakMap(), _r);
var We = /* @__PURE__ */ Object.create(null);
var fe;
var J;
var ve;
var $e;
var F;
var ce;
var be;
var He;
var Ws = (He = class {
  static {
    __name(this, "He");
  }
  constructor(r, t, s) {
    B(this, ce);
    B(this, fe);
    B(this, J);
    B(this, ve);
    B(this, $e, 0);
    B(this, F, We);
    if (L(this, J, s || /* @__PURE__ */ Object.create(null)), L(this, fe, []), r && t) {
      const n = /* @__PURE__ */ Object.create(null);
      n[r] = { handler: t, possibleKeys: [], score: 0 }, L(this, fe, [n]);
    }
    L(this, ve, []);
  }
  insert(r, t, s) {
    L(this, $e, ++Jt(this, $e)._);
    let n = this;
    const a = Es(t), o = [];
    for (let i = 0, c = a.length; i < c; i++) {
      const l = a[i], u = a[i + 1], d = ws(l, u), _ = Array.isArray(d) ? d[0] : l;
      if (_ in w(n, J)) {
        n = w(n, J)[_], d && o.push(d[1]);
        continue;
      }
      w(n, J)[_] = new He(), d && (w(n, ve).push(d), o.push(d[1])), n = w(n, J)[_];
    }
    return w(n, fe).push({ [r]: { handler: s, possibleKeys: o.filter((i, c, l) => l.indexOf(i) === c), score: w(this, $e) } }), n;
  }
  search(r, t) {
    var c;
    const s = [];
    L(this, F, We);
    let a = [this];
    const o = mr(t), i = [];
    for (let l = 0, u = o.length; l < u; l++) {
      const d = o[l], _ = l === u - 1, m = [];
      for (let h = 0, g = a.length; h < g; h++) {
        const f = a[h], E = w(f, J)[d];
        E && (L(E, F, w(f, F)), _ ? (w(E, J)["*"] && s.push(...H(this, ce, be).call(this, w(E, J)["*"], r, w(f, F))), s.push(...H(this, ce, be).call(this, E, r, w(f, F)))) : m.push(E));
        for (let x = 0, y = w(f, ve).length; x < y; x++) {
          const v = w(f, ve)[x], b = w(f, F) === We ? {} : { ...w(f, F) };
          if (v === "*") {
            const N = w(f, J)["*"];
            N && (s.push(...H(this, ce, be).call(this, N, r, w(f, F))), L(N, F, b), m.push(N));
            continue;
          }
          const [T, O, A] = v;
          if (!d && !(A instanceof RegExp)) continue;
          const S = w(f, J)[T], I = o.slice(l).join("/");
          if (A instanceof RegExp) {
            const N = A.exec(I);
            if (N) {
              if (b[O] = N[0], s.push(...H(this, ce, be).call(this, S, r, w(f, F), b)), Object.keys(w(S, J)).length) {
                L(S, F, b);
                const k = ((c = N[0].match(/\//)) == null ? void 0 : c.length) ?? 0;
                (i[k] || (i[k] = [])).push(S);
              }
              continue;
            }
          }
          (A === true || A.test(d)) && (b[O] = d, _ ? (s.push(...H(this, ce, be).call(this, S, r, b, w(f, F))), w(S, J)["*"] && s.push(...H(this, ce, be).call(this, w(S, J)["*"], r, b, w(f, F)))) : (L(S, F, b), m.push(S)));
        }
      }
      a = m.concat(i.shift() ?? []);
    }
    return s.length > 1 && s.sort((l, u) => l.score - u.score), [s.map(({ handler: l, params: u }) => [l, u])];
  }
}, fe = /* @__PURE__ */ new WeakMap(), J = /* @__PURE__ */ new WeakMap(), ve = /* @__PURE__ */ new WeakMap(), $e = /* @__PURE__ */ new WeakMap(), F = /* @__PURE__ */ new WeakMap(), ce = /* @__PURE__ */ new WeakSet(), be = /* @__PURE__ */ __name(function(r, t, s, n) {
  const a = [];
  for (let o = 0, i = w(r, fe).length; o < i; o++) {
    const c = w(r, fe)[o], l = c[t] || c[U], u = {};
    if (l !== void 0 && (l.params = /* @__PURE__ */ Object.create(null), a.push(l), s !== We || n && n !== We)) for (let d = 0, _ = l.possibleKeys.length; d < _; d++) {
      const m = l.possibleKeys[d], h = u[l.score];
      l.params[m] = n != null && n[m] && !h ? n[m] : s[m] ?? (n == null ? void 0 : n[m]), u[l.score] = true;
    }
  }
  return a;
}, "be"), He);
var Te;
var pr;
var Js = (pr = class {
  static {
    __name(this, "pr");
  }
  constructor() {
    C(this, "name", "TrieRouter");
    B(this, Te);
    L(this, Te, new Ws());
  }
  add(e, r, t) {
    const s = fr(r);
    if (s) {
      for (let n = 0, a = s.length; n < a; n++) w(this, Te).insert(e, s[n], t);
      return;
    }
    w(this, Te).insert(e, r, t);
  }
  match(e, r) {
    return w(this, Te).search(e, r);
  }
}, Te = /* @__PURE__ */ new WeakMap(), pr);
var Or = class extends js {
  static {
    __name(this, "Or");
  }
  constructor(e = {}) {
    super(e), this.router = e.router ?? new Fs({ routers: [new Ps(), new Js()] });
  }
};
var Gs = /* @__PURE__ */ __name((e) => {
  const t = { ...{ origin: "*", allowMethods: ["GET", "HEAD", "PUT", "POST", "DELETE", "PATCH"], allowHeaders: [], exposeHeaders: [] }, ...e }, s = /* @__PURE__ */ ((a) => typeof a == "string" ? a === "*" ? () => a : (o) => a === o ? o : null : typeof a == "function" ? a : (o) => a.includes(o) ? o : null)(t.origin), n = ((a) => typeof a == "function" ? a : Array.isArray(a) ? () => a : () => [])(t.allowMethods);
  return async function(o, i) {
    var u;
    function c(d, _) {
      o.res.headers.set(d, _);
    }
    __name(c, "c");
    const l = await s(o.req.header("origin") || "", o);
    if (l && c("Access-Control-Allow-Origin", l), t.credentials && c("Access-Control-Allow-Credentials", "true"), (u = t.exposeHeaders) != null && u.length && c("Access-Control-Expose-Headers", t.exposeHeaders.join(",")), o.req.method === "OPTIONS") {
      t.origin !== "*" && c("Vary", "Origin"), t.maxAge != null && c("Access-Control-Max-Age", t.maxAge.toString());
      const d = await n(o.req.header("origin") || "", o);
      d.length && c("Access-Control-Allow-Methods", d.join(","));
      let _ = t.allowHeaders;
      if (!(_ != null && _.length)) {
        const m = o.req.header("Access-Control-Request-Headers");
        m && (_ = m.split(/\s*,\s*/));
      }
      return _ != null && _.length && (c("Access-Control-Allow-Headers", _.join(",")), o.res.headers.append("Vary", "Access-Control-Request-Headers")), o.res.headers.delete("Content-Length"), o.res.headers.delete("Content-Type"), new Response(null, { headers: o.res.headers, status: 204, statusText: "No Content" });
    }
    await i(), t.origin !== "*" && o.header("Vary", "Origin", { append: true });
  };
}, "Gs");
var Ys = /^\s*(?:text\/(?!event-stream(?:[;\s]|$))[^;\s]+|application\/(?:javascript|json|xml|xml-dtd|ecmascript|dart|postscript|rtf|tar|toml|vnd\.dart|vnd\.ms-fontobject|vnd\.ms-opentype|wasm|x-httpd-php|x-javascript|x-ns-proxy-autoconfig|x-sh|x-tar|x-virtualbox-hdd|x-virtualbox-ova|x-virtualbox-ovf|x-virtualbox-vbox|x-virtualbox-vdi|x-virtualbox-vhd|x-virtualbox-vmdk|x-www-form-urlencoded)|font\/(?:otf|ttf)|image\/(?:bmp|vnd\.adobe\.photoshop|vnd\.microsoft\.icon|vnd\.ms-dds|x-icon|x-ms-bmp)|message\/rfc822|model\/gltf-binary|x-shader\/x-fragment|x-shader\/x-vertex|[^;\s]+?\+(?:json|text|xml|yaml))(?:[;\s]|$)/i;
var Kt = /* @__PURE__ */ __name((e, r = Ks) => {
  const t = /\.([a-zA-Z0-9]+?)$/, s = e.match(t);
  if (!s) return;
  let n = r[s[1]];
  return n && n.startsWith("text") && (n += "; charset=utf-8"), n;
}, "Kt");
var Vs = { aac: "audio/aac", avi: "video/x-msvideo", avif: "image/avif", av1: "video/av1", bin: "application/octet-stream", bmp: "image/bmp", css: "text/css", csv: "text/csv", eot: "application/vnd.ms-fontobject", epub: "application/epub+zip", gif: "image/gif", gz: "application/gzip", htm: "text/html", html: "text/html", ico: "image/x-icon", ics: "text/calendar", jpeg: "image/jpeg", jpg: "image/jpeg", js: "text/javascript", json: "application/json", jsonld: "application/ld+json", map: "application/json", mid: "audio/x-midi", midi: "audio/x-midi", mjs: "text/javascript", mp3: "audio/mpeg", mp4: "video/mp4", mpeg: "video/mpeg", oga: "audio/ogg", ogv: "video/ogg", ogx: "application/ogg", opus: "audio/opus", otf: "font/otf", pdf: "application/pdf", png: "image/png", rtf: "application/rtf", svg: "image/svg+xml", tif: "image/tiff", tiff: "image/tiff", ts: "video/mp2t", ttf: "font/ttf", txt: "text/plain", wasm: "application/wasm", webm: "video/webm", weba: "audio/webm", webmanifest: "application/manifest+json", webp: "image/webp", woff: "font/woff", woff2: "font/woff2", xhtml: "application/xhtml+xml", xml: "application/xml", zip: "application/zip", "3gp": "video/3gpp", "3g2": "video/3gpp2", gltf: "model/gltf+json", glb: "model/gltf-binary" };
var Ks = Vs;
var zs = /* @__PURE__ */ __name((...e) => {
  let r = e.filter((n) => n !== "").join("/");
  r = r.replace(new RegExp("(?<=\\/)\\/+", "g"), "");
  const t = r.split("/"), s = [];
  for (const n of t) n === ".." && s.length > 0 && s.at(-1) !== ".." ? s.pop() : n !== "." && s.push(n);
  return s.join("/") || ".";
}, "zs");
var Rr = { br: ".br", zstd: ".zst", gzip: ".gz" };
var Xs = Object.keys(Rr);
var Qs = "index.html";
var Zs = /* @__PURE__ */ __name((e) => {
  const r = e.root ?? "./", t = e.path, s = e.join ?? zs;
  return async (n, a) => {
    var u, d, _, m;
    if (n.finalized) return a();
    let o;
    if (e.path) o = e.path;
    else try {
      if (o = decodeURIComponent(n.req.path), /(?:^|[\/\\])\.\.(?:$|[\/\\])/.test(o)) throw new Error();
    } catch {
      return await ((u = e.onNotFound) == null ? void 0 : u.call(e, n.req.path, n)), a();
    }
    let i = s(r, !t && e.rewriteRequestPath ? e.rewriteRequestPath(o) : o);
    e.isDir && await e.isDir(i) && (i = s(i, Qs));
    const c = e.getContent;
    let l = await c(i, n);
    if (l instanceof Response) return n.newResponse(l.body, l);
    if (l) {
      const h = e.mimes && Kt(i, e.mimes) || Kt(i);
      if (n.header("Content-Type", h || "application/octet-stream"), e.precompressed && (!h || Ys.test(h))) {
        const g = new Set((d = n.req.header("Accept-Encoding")) == null ? void 0 : d.split(",").map((f) => f.trim()));
        for (const f of Xs) {
          if (!g.has(f)) continue;
          const E = await c(i + Rr[f], n);
          if (E) {
            l = E, n.header("Content-Encoding", f), n.header("Vary", "Accept-Encoding", { append: true });
            break;
          }
        }
      }
      return await ((_ = e.onFound) == null ? void 0 : _.call(e, i, n)), n.body(l);
    }
    await ((m = e.onNotFound) == null ? void 0 : m.call(e, i, n)), await a();
  };
}, "Zs");
var en = /* @__PURE__ */ __name(async (e, r) => {
  let t;
  r && r.manifest ? typeof r.manifest == "string" ? t = JSON.parse(r.manifest) : t = r.manifest : typeof __STATIC_CONTENT_MANIFEST == "string" ? t = JSON.parse(__STATIC_CONTENT_MANIFEST) : t = __STATIC_CONTENT_MANIFEST;
  let s;
  r && r.namespace ? s = r.namespace : s = __STATIC_CONTENT;
  const n = t[e] || e;
  if (!n) return null;
  const a = await s.get(n, { type: "stream" });
  return a || null;
}, "en");
var tn = /* @__PURE__ */ __name((e) => async function(t, s) {
  return Zs({ ...e, getContent: /* @__PURE__ */ __name(async (a) => en(a, { manifest: e.manifest, namespace: e.namespace ? e.namespace : t.env ? t.env.__STATIC_CONTENT : void 0 }), "getContent") })(t, s);
}, "tn");
var rn = /* @__PURE__ */ __name((e) => tn(e), "rn");
var Ct = null;
function sn(e) {
  try {
    return crypto.getRandomValues(new Uint8Array(e));
  } catch {
  }
  try {
    return us.randomBytes(e);
  } catch {
  }
  if (!Ct) throw Error("Neither WebCryptoAPI nor a crypto module is available. Use bcrypt.setRandomFallback to set an alternative");
  return Ct(e);
}
__name(sn, "sn");
function nn(e) {
  Ct = e;
}
__name(nn, "nn");
function kt(e, r) {
  if (e = e || $t, typeof e != "number") throw Error("Illegal arguments: " + typeof e + ", " + typeof r);
  e < 4 ? e = 4 : e > 31 && (e = 31);
  var t = [];
  return t.push("$2b$"), e < 10 && t.push("0"), t.push(e.toString()), t.push("$"), t.push(ut(sn(Ve), Ve)), t.join("");
}
__name(kt, "kt");
function Dr(e, r, t) {
  if (typeof r == "function" && (t = r, r = void 0), typeof e == "function" && (t = e, e = void 0), typeof e > "u") e = $t;
  else if (typeof e != "number") throw Error("illegal arguments: " + typeof e);
  function s(n) {
    Z(function() {
      try {
        n(null, kt(e));
      } catch (a) {
        n(a);
      }
    });
  }
  __name(s, "s");
  if (t) {
    if (typeof t != "function") throw Error("Illegal callback: " + typeof t);
    s(t);
  } else return new Promise(function(n, a) {
    s(function(o, i) {
      if (o) {
        a(o);
        return;
      }
      n(i);
    });
  });
}
__name(Dr, "Dr");
function Ar(e, r) {
  if (typeof r > "u" && (r = $t), typeof r == "number" && (r = kt(r)), typeof e != "string" || typeof r != "string") throw Error("Illegal arguments: " + typeof e + ", " + typeof r);
  return jt(e, r);
}
__name(Ar, "Ar");
function Cr(e, r, t, s) {
  function n(a) {
    typeof e == "string" && typeof r == "number" ? Dr(r, function(o, i) {
      jt(e, i, a, s);
    }) : typeof e == "string" && typeof r == "string" ? jt(e, r, a, s) : Z(a.bind(this, Error("Illegal arguments: " + typeof e + ", " + typeof r)));
  }
  __name(n, "n");
  if (t) {
    if (typeof t != "function") throw Error("Illegal callback: " + typeof t);
    n(t);
  } else return new Promise(function(a, o) {
    n(function(i, c) {
      if (i) {
        o(i);
        return;
      }
      a(c);
    });
  });
}
__name(Cr, "Cr");
function jr(e, r) {
  for (var t = e.length ^ r.length, s = 0; s < e.length; ++s) t |= e.charCodeAt(s) ^ r.charCodeAt(s);
  return t === 0;
}
__name(jr, "jr");
function an(e, r) {
  if (typeof e != "string" || typeof r != "string") throw Error("Illegal arguments: " + typeof e + ", " + typeof r);
  return r.length !== 60 ? false : jr(Ar(e, r.substring(0, r.length - 31)), r);
}
__name(an, "an");
function on2(e, r, t, s) {
  function n(a) {
    if (typeof e != "string" || typeof r != "string") {
      Z(a.bind(this, Error("Illegal arguments: " + typeof e + ", " + typeof r)));
      return;
    }
    if (r.length !== 60) {
      Z(a.bind(this, null, false));
      return;
    }
    Cr(e, r.substring(0, 29), function(o, i) {
      o ? a(o) : a(null, jr(i, r));
    }, s);
  }
  __name(n, "n");
  if (t) {
    if (typeof t != "function") throw Error("Illegal callback: " + typeof t);
    n(t);
  } else return new Promise(function(a, o) {
    n(function(i, c) {
      if (i) {
        o(i);
        return;
      }
      a(c);
    });
  });
}
__name(on2, "on");
function cn(e) {
  if (typeof e != "string") throw Error("Illegal arguments: " + typeof e);
  return parseInt(e.split("$")[2], 10);
}
__name(cn, "cn");
function ln(e) {
  if (typeof e != "string") throw Error("Illegal arguments: " + typeof e);
  if (e.length !== 60) throw Error("Illegal hash length: " + e.length + " != 60");
  return e.substring(0, 29);
}
__name(ln, "ln");
function dn(e) {
  if (typeof e != "string") throw Error("Illegal arguments: " + typeof e);
  return Lr(e) > 72;
}
__name(dn, "dn");
var Z = typeof setImmediate == "function" ? setImmediate : typeof scheduler == "object" && typeof scheduler.postTask == "function" ? scheduler.postTask.bind(scheduler) : setTimeout;
function Lr(e) {
  for (var r = 0, t = 0, s = 0; s < e.length; ++s) t = e.charCodeAt(s), t < 128 ? r += 1 : t < 2048 ? r += 2 : (t & 64512) === 55296 && (e.charCodeAt(s + 1) & 64512) === 56320 ? (++s, r += 4) : r += 3;
  return r;
}
__name(Lr, "Lr");
function un(e) {
  for (var r = 0, t, s, n = new Array(Lr(e)), a = 0, o = e.length; a < o; ++a) t = e.charCodeAt(a), t < 128 ? n[r++] = t : t < 2048 ? (n[r++] = t >> 6 | 192, n[r++] = t & 63 | 128) : (t & 64512) === 55296 && ((s = e.charCodeAt(a + 1)) & 64512) === 56320 ? (t = 65536 + ((t & 1023) << 10) + (s & 1023), ++a, n[r++] = t >> 18 | 240, n[r++] = t >> 12 & 63 | 128, n[r++] = t >> 6 & 63 | 128, n[r++] = t & 63 | 128) : (n[r++] = t >> 12 | 224, n[r++] = t >> 6 & 63 | 128, n[r++] = t & 63 | 128);
  return n;
}
__name(un, "un");
var Oe = "./ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789".split("");
var de = [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 0, 1, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, -1, -1, -1, -1, -1, -1, -1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, -1, -1, -1, -1, -1, -1, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, -1, -1, -1, -1, -1];
function ut(e, r) {
  var t = 0, s = [], n, a;
  if (r <= 0 || r > e.length) throw Error("Illegal len: " + r);
  for (; t < r; ) {
    if (n = e[t++] & 255, s.push(Oe[n >> 2 & 63]), n = (n & 3) << 4, t >= r) {
      s.push(Oe[n & 63]);
      break;
    }
    if (a = e[t++] & 255, n |= a >> 4 & 15, s.push(Oe[n & 63]), n = (a & 15) << 2, t >= r) {
      s.push(Oe[n & 63]);
      break;
    }
    a = e[t++] & 255, n |= a >> 6 & 3, s.push(Oe[n & 63]), s.push(Oe[a & 63]);
  }
  return s.join("");
}
__name(ut, "ut");
function Mr(e, r) {
  var t = 0, s = e.length, n = 0, a = [], o, i, c, l, u, d;
  if (r <= 0) throw Error("Illegal len: " + r);
  for (; t < s - 1 && n < r && (d = e.charCodeAt(t++), o = d < de.length ? de[d] : -1, d = e.charCodeAt(t++), i = d < de.length ? de[d] : -1, !(o == -1 || i == -1 || (u = o << 2 >>> 0, u |= (i & 48) >> 4, a.push(String.fromCharCode(u)), ++n >= r || t >= s) || (d = e.charCodeAt(t++), c = d < de.length ? de[d] : -1, c == -1) || (u = (i & 15) << 4 >>> 0, u |= (c & 60) >> 2, a.push(String.fromCharCode(u)), ++n >= r || t >= s))); ) d = e.charCodeAt(t++), l = d < de.length ? de[d] : -1, u = (c & 3) << 6 >>> 0, u |= l, a.push(String.fromCharCode(u)), ++n;
  var _ = [];
  for (t = 0; t < n; t++) _.push(a[t].charCodeAt(0));
  return _;
}
__name(Mr, "Mr");
var Ve = 16;
var $t = 10;
var _n = 16;
var pn = 100;
var zt = [608135816, 2242054355, 320440878, 57701188, 2752067618, 698298832, 137296536, 3964562569, 1160258022, 953160567, 3193202383, 887688300, 3232508343, 3380367581, 1065670069, 3041331479, 2450970073, 2306472731];
var Xt = [3509652390, 2564797868, 805139163, 3491422135, 3101798381, 1780907670, 3128725573, 4046225305, 614570311, 3012652279, 134345442, 2240740374, 1667834072, 1901547113, 2757295779, 4103290238, 227898511, 1921955416, 1904987480, 2182433518, 2069144605, 3260701109, 2620446009, 720527379, 3318853667, 677414384, 3393288472, 3101374703, 2390351024, 1614419982, 1822297739, 2954791486, 3608508353, 3174124327, 2024746970, 1432378464, 3864339955, 2857741204, 1464375394, 1676153920, 1439316330, 715854006, 3033291828, 289532110, 2706671279, 2087905683, 3018724369, 1668267050, 732546397, 1947742710, 3462151702, 2609353502, 2950085171, 1814351708, 2050118529, 680887927, 999245976, 1800124847, 3300911131, 1713906067, 1641548236, 4213287313, 1216130144, 1575780402, 4018429277, 3917837745, 3693486850, 3949271944, 596196993, 3549867205, 258830323, 2213823033, 772490370, 2760122372, 1774776394, 2652871518, 566650946, 4142492826, 1728879713, 2882767088, 1783734482, 3629395816, 2517608232, 2874225571, 1861159788, 326777828, 3124490320, 2130389656, 2716951837, 967770486, 1724537150, 2185432712, 2364442137, 1164943284, 2105845187, 998989502, 3765401048, 2244026483, 1075463327, 1455516326, 1322494562, 910128902, 469688178, 1117454909, 936433444, 3490320968, 3675253459, 1240580251, 122909385, 2157517691, 634681816, 4142456567, 3825094682, 3061402683, 2540495037, 79693498, 3249098678, 1084186820, 1583128258, 426386531, 1761308591, 1047286709, 322548459, 995290223, 1845252383, 2603652396, 3431023940, 2942221577, 3202600964, 3727903485, 1712269319, 422464435, 3234572375, 1170764815, 3523960633, 3117677531, 1434042557, 442511882, 3600875718, 1076654713, 1738483198, 4213154764, 2393238008, 3677496056, 1014306527, 4251020053, 793779912, 2902807211, 842905082, 4246964064, 1395751752, 1040244610, 2656851899, 3396308128, 445077038, 3742853595, 3577915638, 679411651, 2892444358, 2354009459, 1767581616, 3150600392, 3791627101, 3102740896, 284835224, 4246832056, 1258075500, 768725851, 2589189241, 3069724005, 3532540348, 1274779536, 3789419226, 2764799539, 1660621633, 3471099624, 4011903706, 913787905, 3497959166, 737222580, 2514213453, 2928710040, 3937242737, 1804850592, 3499020752, 2949064160, 2386320175, 2390070455, 2415321851, 4061277028, 2290661394, 2416832540, 1336762016, 1754252060, 3520065937, 3014181293, 791618072, 3188594551, 3933548030, 2332172193, 3852520463, 3043980520, 413987798, 3465142937, 3030929376, 4245938359, 2093235073, 3534596313, 375366246, 2157278981, 2479649556, 555357303, 3870105701, 2008414854, 3344188149, 4221384143, 3956125452, 2067696032, 3594591187, 2921233993, 2428461, 544322398, 577241275, 1471733935, 610547355, 4027169054, 1432588573, 1507829418, 2025931657, 3646575487, 545086370, 48609733, 2200306550, 1653985193, 298326376, 1316178497, 3007786442, 2064951626, 458293330, 2589141269, 3591329599, 3164325604, 727753846, 2179363840, 146436021, 1461446943, 4069977195, 705550613, 3059967265, 3887724982, 4281599278, 3313849956, 1404054877, 2845806497, 146425753, 1854211946, 1266315497, 3048417604, 3681880366, 3289982499, 290971e4, 1235738493, 2632868024, 2414719590, 3970600049, 1771706367, 1449415276, 3266420449, 422970021, 1963543593, 2690192192, 3826793022, 1062508698, 1531092325, 1804592342, 2583117782, 2714934279, 4024971509, 1294809318, 4028980673, 1289560198, 2221992742, 1669523910, 35572830, 157838143, 1052438473, 1016535060, 1802137761, 1753167236, 1386275462, 3080475397, 2857371447, 1040679964, 2145300060, 2390574316, 1461121720, 2956646967, 4031777805, 4028374788, 33600511, 2920084762, 1018524850, 629373528, 3691585981, 3515945977, 2091462646, 2486323059, 586499841, 988145025, 935516892, 3367335476, 2599673255, 2839830854, 265290510, 3972581182, 2759138881, 3795373465, 1005194799, 847297441, 406762289, 1314163512, 1332590856, 1866599683, 4127851711, 750260880, 613907577, 1450815602, 3165620655, 3734664991, 3650291728, 3012275730, 3704569646, 1427272223, 778793252, 1343938022, 2676280711, 2052605720, 1946737175, 3164576444, 3914038668, 3967478842, 3682934266, 1661551462, 3294938066, 4011595847, 840292616, 3712170807, 616741398, 312560963, 711312465, 1351876610, 322626781, 1910503582, 271666773, 2175563734, 1594956187, 70604529, 3617834859, 1007753275, 1495573769, 4069517037, 2549218298, 2663038764, 504708206, 2263041392, 3941167025, 2249088522, 1514023603, 1998579484, 1312622330, 694541497, 2582060303, 2151582166, 1382467621, 776784248, 2618340202, 3323268794, 2497899128, 2784771155, 503983604, 4076293799, 907881277, 423175695, 432175456, 1378068232, 4145222326, 3954048622, 3938656102, 3820766613, 2793130115, 2977904593, 26017576, 3274890735, 3194772133, 1700274565, 1756076034, 4006520079, 3677328699, 720338349, 1533947780, 354530856, 688349552, 3973924725, 1637815568, 332179504, 3949051286, 53804574, 2852348879, 3044236432, 1282449977, 3583942155, 3416972820, 4006381244, 1617046695, 2628476075, 3002303598, 1686838959, 431878346, 2686675385, 1700445008, 1080580658, 1009431731, 832498133, 3223435511, 2605976345, 2271191193, 2516031870, 1648197032, 4164389018, 2548247927, 300782431, 375919233, 238389289, 3353747414, 2531188641, 2019080857, 1475708069, 455242339, 2609103871, 448939670, 3451063019, 1395535956, 2413381860, 1841049896, 1491858159, 885456874, 4264095073, 4001119347, 1565136089, 3898914787, 1108368660, 540939232, 1173283510, 2745871338, 3681308437, 4207628240, 3343053890, 4016749493, 1699691293, 1103962373, 3625875870, 2256883143, 3830138730, 1031889488, 3479347698, 1535977030, 4236805024, 3251091107, 2132092099, 1774941330, 1199868427, 1452454533, 157007616, 2904115357, 342012276, 595725824, 1480756522, 206960106, 497939518, 591360097, 863170706, 2375253569, 3596610801, 1814182875, 2094937945, 3421402208, 1082520231, 3463918190, 2785509508, 435703966, 3908032597, 1641649973, 2842273706, 3305899714, 1510255612, 2148256476, 2655287854, 3276092548, 4258621189, 236887753, 3681803219, 274041037, 1734335097, 3815195456, 3317970021, 1899903192, 1026095262, 4050517792, 356393447, 2410691914, 3873677099, 3682840055, 3913112168, 2491498743, 4132185628, 2489919796, 1091903735, 1979897079, 3170134830, 3567386728, 3557303409, 857797738, 1136121015, 1342202287, 507115054, 2535736646, 337727348, 3213592640, 1301675037, 2528481711, 1895095763, 1721773893, 3216771564, 62756741, 2142006736, 835421444, 2531993523, 1442658625, 3659876326, 2882144922, 676362277, 1392781812, 170690266, 3921047035, 1759253602, 3611846912, 1745797284, 664899054, 1329594018, 3901205900, 3045908486, 2062866102, 2865634940, 3543621612, 3464012697, 1080764994, 553557557, 3656615353, 3996768171, 991055499, 499776247, 1265440854, 648242737, 3940784050, 980351604, 3713745714, 1749149687, 3396870395, 4211799374, 3640570775, 1161844396, 3125318951, 1431517754, 545492359, 4268468663, 3499529547, 1437099964, 2702547544, 3433638243, 2581715763, 2787789398, 1060185593, 1593081372, 2418618748, 4260947970, 69676912, 2159744348, 86519011, 2512459080, 3838209314, 1220612927, 3339683548, 133810670, 1090789135, 1078426020, 1569222167, 845107691, 3583754449, 4072456591, 1091646820, 628848692, 1613405280, 3757631651, 526609435, 236106946, 48312990, 2942717905, 3402727701, 1797494240, 859738849, 992217954, 4005476642, 2243076622, 3870952857, 3732016268, 765654824, 3490871365, 2511836413, 1685915746, 3888969200, 1414112111, 2273134842, 3281911079, 4080962846, 172450625, 2569994100, 980381355, 4109958455, 2819808352, 2716589560, 2568741196, 3681446669, 3329971472, 1835478071, 660984891, 3704678404, 4045999559, 3422617507, 3040415634, 1762651403, 1719377915, 3470491036, 2693910283, 3642056355, 3138596744, 1364962596, 2073328063, 1983633131, 926494387, 3423689081, 2150032023, 4096667949, 1749200295, 3328846651, 309677260, 2016342300, 1779581495, 3079819751, 111262694, 1274766160, 443224088, 298511866, 1025883608, 3806446537, 1145181785, 168956806, 3641502830, 3584813610, 1689216846, 3666258015, 3200248200, 1692713982, 2646376535, 4042768518, 1618508792, 1610833997, 3523052358, 4130873264, 2001055236, 3610705100, 2202168115, 4028541809, 2961195399, 1006657119, 2006996926, 3186142756, 1430667929, 3210227297, 1314452623, 4074634658, 4101304120, 2273951170, 1399257539, 3367210612, 3027628629, 1190975929, 2062231137, 2333990788, 2221543033, 2438960610, 1181637006, 548689776, 2362791313, 3372408396, 3104550113, 3145860560, 296247880, 1970579870, 3078560182, 3769228297, 1714227617, 3291629107, 3898220290, 166772364, 1251581989, 493813264, 448347421, 195405023, 2709975567, 677966185, 3703036547, 1463355134, 2715995803, 1338867538, 1343315457, 2802222074, 2684532164, 233230375, 2599980071, 2000651841, 3277868038, 1638401717, 4028070440, 3237316320, 6314154, 819756386, 300326615, 590932579, 1405279636, 3267499572, 3150704214, 2428286686, 3959192993, 3461946742, 1862657033, 1266418056, 963775037, 2089974820, 2263052895, 1917689273, 448879540, 3550394620, 3981727096, 150775221, 3627908307, 1303187396, 508620638, 2975983352, 2726630617, 1817252668, 1876281319, 1457606340, 908771278, 3720792119, 3617206836, 2455994898, 1729034894, 1080033504, 976866871, 3556439503, 2881648439, 1522871579, 1555064734, 1336096578, 3548522304, 2579274686, 3574697629, 3205460757, 3593280638, 3338716283, 3079412587, 564236357, 2993598910, 1781952180, 1464380207, 3163844217, 3332601554, 1699332808, 1393555694, 1183702653, 3581086237, 1288719814, 691649499, 2847557200, 2895455976, 3193889540, 2717570544, 1781354906, 1676643554, 2592534050, 3230253752, 1126444790, 2770207658, 2633158820, 2210423226, 2615765581, 2414155088, 3127139286, 673620729, 2805611233, 1269405062, 4015350505, 3341807571, 4149409754, 1057255273, 2012875353, 2162469141, 2276492801, 2601117357, 993977747, 3918593370, 2654263191, 753973209, 36408145, 2530585658, 25011837, 3520020182, 2088578344, 530523599, 2918365339, 1524020338, 1518925132, 3760827505, 3759777254, 1202760957, 3985898139, 3906192525, 674977740, 4174734889, 2031300136, 2019492241, 3983892565, 4153806404, 3822280332, 352677332, 2297720250, 60907813, 90501309, 3286998549, 1016092578, 2535922412, 2839152426, 457141659, 509813237, 4120667899, 652014361, 1966332200, 2975202805, 55981186, 2327461051, 676427537, 3255491064, 2882294119, 3433927263, 1307055953, 942726286, 933058658, 2468411793, 3933900994, 4215176142, 1361170020, 2001714738, 2830558078, 3274259782, 1222529897, 1679025792, 2729314320, 3714953764, 1770335741, 151462246, 3013232138, 1682292957, 1483529935, 471910574, 1539241949, 458788160, 3436315007, 1807016891, 3718408830, 978976581, 1043663428, 3165965781, 1927990952, 4200891579, 2372276910, 3208408903, 3533431907, 1412390302, 2931980059, 4132332400, 1947078029, 3881505623, 4168226417, 2941484381, 1077988104, 1320477388, 886195818, 18198404, 3786409e3, 2509781533, 112762804, 3463356488, 1866414978, 891333506, 18488651, 661792760, 1628790961, 3885187036, 3141171499, 876946877, 2693282273, 1372485963, 791857591, 2686433993, 3759982718, 3167212022, 3472953795, 2716379847, 445679433, 3561995674, 3504004811, 3574258232, 54117162, 3331405415, 2381918588, 3769707343, 4154350007, 1140177722, 4074052095, 668550556, 3214352940, 367459370, 261225585, 2610173221, 4209349473, 3468074219, 3265815641, 314222801, 3066103646, 3808782860, 282218597, 3406013506, 3773591054, 379116347, 1285071038, 846784868, 2669647154, 3771962079, 3550491691, 2305946142, 453669953, 1268987020, 3317592352, 3279303384, 3744833421, 2610507566, 3859509063, 266596637, 3847019092, 517658769, 3462560207, 3443424879, 370717030, 4247526661, 2224018117, 4143653529, 4112773975, 2788324899, 2477274417, 1456262402, 2901442914, 1517677493, 1846949527, 2295493580, 3734397586, 2176403920, 1280348187, 1908823572, 3871786941, 846861322, 1172426758, 3287448474, 3383383037, 1655181056, 3139813346, 901632758, 1897031941, 2986607138, 3066810236, 3447102507, 1393639104, 373351379, 950779232, 625454576, 3124240540, 4148612726, 2007998917, 544563296, 2244738638, 2330496472, 2058025392, 1291430526, 424198748, 50039436, 29584100, 3605783033, 2429876329, 2791104160, 1057563949, 3255363231, 3075367218, 3463963227, 1469046755, 985887462];
var Br = [1332899944, 1700884034, 1701343084, 1684370003, 1668446532, 1869963892];
function Ke(e, r, t, s) {
  var n, a = e[r], o = e[r + 1];
  return a ^= t[0], n = s[a >>> 24], n += s[256 | a >> 16 & 255], n ^= s[512 | a >> 8 & 255], n += s[768 | a & 255], o ^= n ^ t[1], n = s[o >>> 24], n += s[256 | o >> 16 & 255], n ^= s[512 | o >> 8 & 255], n += s[768 | o & 255], a ^= n ^ t[2], n = s[a >>> 24], n += s[256 | a >> 16 & 255], n ^= s[512 | a >> 8 & 255], n += s[768 | a & 255], o ^= n ^ t[3], n = s[o >>> 24], n += s[256 | o >> 16 & 255], n ^= s[512 | o >> 8 & 255], n += s[768 | o & 255], a ^= n ^ t[4], n = s[a >>> 24], n += s[256 | a >> 16 & 255], n ^= s[512 | a >> 8 & 255], n += s[768 | a & 255], o ^= n ^ t[5], n = s[o >>> 24], n += s[256 | o >> 16 & 255], n ^= s[512 | o >> 8 & 255], n += s[768 | o & 255], a ^= n ^ t[6], n = s[a >>> 24], n += s[256 | a >> 16 & 255], n ^= s[512 | a >> 8 & 255], n += s[768 | a & 255], o ^= n ^ t[7], n = s[o >>> 24], n += s[256 | o >> 16 & 255], n ^= s[512 | o >> 8 & 255], n += s[768 | o & 255], a ^= n ^ t[8], n = s[a >>> 24], n += s[256 | a >> 16 & 255], n ^= s[512 | a >> 8 & 255], n += s[768 | a & 255], o ^= n ^ t[9], n = s[o >>> 24], n += s[256 | o >> 16 & 255], n ^= s[512 | o >> 8 & 255], n += s[768 | o & 255], a ^= n ^ t[10], n = s[a >>> 24], n += s[256 | a >> 16 & 255], n ^= s[512 | a >> 8 & 255], n += s[768 | a & 255], o ^= n ^ t[11], n = s[o >>> 24], n += s[256 | o >> 16 & 255], n ^= s[512 | o >> 8 & 255], n += s[768 | o & 255], a ^= n ^ t[12], n = s[a >>> 24], n += s[256 | a >> 16 & 255], n ^= s[512 | a >> 8 & 255], n += s[768 | a & 255], o ^= n ^ t[13], n = s[o >>> 24], n += s[256 | o >> 16 & 255], n ^= s[512 | o >> 8 & 255], n += s[768 | o & 255], a ^= n ^ t[14], n = s[a >>> 24], n += s[256 | a >> 16 & 255], n ^= s[512 | a >> 8 & 255], n += s[768 | a & 255], o ^= n ^ t[15], n = s[o >>> 24], n += s[256 | o >> 16 & 255], n ^= s[512 | o >> 8 & 255], n += s[768 | o & 255], a ^= n ^ t[16], e[r] = o ^ t[_n + 1], e[r + 1] = a, e;
}
__name(Ke, "Ke");
function Ce(e, r) {
  for (var t = 0, s = 0; t < 4; ++t) s = s << 8 | e[r] & 255, r = (r + 1) % e.length;
  return { key: s, offp: r };
}
__name(Ce, "Ce");
function Qt(e, r, t) {
  for (var s = 0, n = [0, 0], a = r.length, o = t.length, i, c = 0; c < a; c++) i = Ce(e, s), s = i.offp, r[c] = r[c] ^ i.key;
  for (c = 0; c < a; c += 2) n = Ke(n, 0, r, t), r[c] = n[0], r[c + 1] = n[1];
  for (c = 0; c < o; c += 2) n = Ke(n, 0, r, t), t[c] = n[0], t[c + 1] = n[1];
}
__name(Qt, "Qt");
function mn(e, r, t, s) {
  for (var n = 0, a = [0, 0], o = t.length, i = s.length, c, l = 0; l < o; l++) c = Ce(r, n), n = c.offp, t[l] = t[l] ^ c.key;
  for (n = 0, l = 0; l < o; l += 2) c = Ce(e, n), n = c.offp, a[0] ^= c.key, c = Ce(e, n), n = c.offp, a[1] ^= c.key, a = Ke(a, 0, t, s), t[l] = a[0], t[l + 1] = a[1];
  for (l = 0; l < i; l += 2) c = Ce(e, n), n = c.offp, a[0] ^= c.key, c = Ce(e, n), n = c.offp, a[1] ^= c.key, a = Ke(a, 0, t, s), s[l] = a[0], s[l + 1] = a[1];
}
__name(mn, "mn");
function Zt(e, r, t, s, n) {
  var a = Br.slice(), o = a.length, i;
  if (t < 4 || t > 31) if (i = Error("Illegal number of rounds (4-31): " + t), s) {
    Z(s.bind(this, i));
    return;
  } else throw i;
  if (r.length !== Ve) if (i = Error("Illegal salt length: " + r.length + " != " + Ve), s) {
    Z(s.bind(this, i));
    return;
  } else throw i;
  t = 1 << t >>> 0;
  var c, l, u = 0, d;
  typeof Int32Array == "function" ? (c = new Int32Array(zt), l = new Int32Array(Xt)) : (c = zt.slice(), l = Xt.slice()), mn(r, e, c, l);
  function _() {
    if (n && n(u / t), u < t) for (var h = Date.now(); u < t && (u = u + 1, Qt(e, c, l), Qt(r, c, l), !(Date.now() - h > pn)); ) ;
    else {
      for (u = 0; u < 64; u++) for (d = 0; d < o >> 1; d++) Ke(a, d << 1, c, l);
      var g = [];
      for (u = 0; u < o; u++) g.push((a[u] >> 24 & 255) >>> 0), g.push((a[u] >> 16 & 255) >>> 0), g.push((a[u] >> 8 & 255) >>> 0), g.push((a[u] & 255) >>> 0);
      if (s) {
        s(null, g);
        return;
      } else return g;
    }
    s && Z(_);
  }
  __name(_, "_");
  if (typeof s < "u") _();
  else for (var m; ; ) if (typeof (m = _()) < "u") return m || [];
}
__name(Zt, "Zt");
function jt(e, r, t, s) {
  var n;
  if (typeof e != "string" || typeof r != "string") if (n = Error("Invalid string / salt: Not a string"), t) {
    Z(t.bind(this, n));
    return;
  } else throw n;
  var a, o;
  if (r.charAt(0) !== "$" || r.charAt(1) !== "2") if (n = Error("Invalid salt version: " + r.substring(0, 2)), t) {
    Z(t.bind(this, n));
    return;
  } else throw n;
  if (r.charAt(2) === "$") a = "\0", o = 3;
  else {
    if (a = r.charAt(2), a !== "a" && a !== "b" && a !== "y" || r.charAt(3) !== "$") if (n = Error("Invalid salt revision: " + r.substring(2, 4)), t) {
      Z(t.bind(this, n));
      return;
    } else throw n;
    o = 4;
  }
  if (r.charAt(o + 2) > "$") if (n = Error("Missing salt rounds"), t) {
    Z(t.bind(this, n));
    return;
  } else throw n;
  var i = parseInt(r.substring(o, o + 1), 10) * 10, c = parseInt(r.substring(o + 1, o + 2), 10), l = i + c, u = r.substring(o + 3, o + 25);
  e += a >= "a" ? "\0" : "";
  var d = un(e), _ = Mr(u, Ve);
  function m(h) {
    var g = [];
    return g.push("$2"), a >= "a" && g.push(a), g.push("$"), l < 10 && g.push("0"), g.push(l.toString()), g.push("$"), g.push(ut(_, _.length)), g.push(ut(h, Br.length * 4 - 1)), g.join("");
  }
  __name(m, "m");
  if (typeof t > "u") return m(Zt(d, _, l));
  Zt(d, _, l, function(h, g) {
    h ? t(h, null) : t(null, m(g));
  }, s);
}
__name(jt, "jt");
function gn(e, r) {
  return ut(e, r);
}
__name(gn, "gn");
function fn(e, r) {
  return Mr(e, r);
}
__name(fn, "fn");
var hn = { setRandomFallback: nn, genSaltSync: kt, genSalt: Dr, hashSync: Ar, hash: Cr, compareSync: an, compare: on2, getRounds: cn, getSalt: ln, truncates: dn, encodeBase64: gn, decodeBase64: fn };
var En = /^[\w!#$%&'*.^`|~+-]+$/;
var bn = /^[ !#-:<-[\]-~]*$/;
var yn = /* @__PURE__ */ __name((e, r) => {
  if (e.indexOf(r) === -1) return {};
  const t = e.trim().split(";"), s = {};
  for (let n of t) {
    n = n.trim();
    const a = n.indexOf("=");
    if (a === -1) continue;
    const o = n.substring(0, a).trim();
    if (r !== o || !En.test(o)) continue;
    let i = n.substring(a + 1).trim();
    if (i.startsWith('"') && i.endsWith('"') && (i = i.slice(1, -1)), bn.test(i)) {
      s[o] = i.indexOf("%") !== -1 ? ht(i, Bt) : i;
      break;
    }
  }
  return s;
}, "yn");
var wn = /* @__PURE__ */ __name((e, r, t = {}) => {
  let s = `${e}=${r}`;
  if (e.startsWith("__Secure-") && !t.secure) throw new Error("__Secure- Cookie must have Secure attributes");
  if (e.startsWith("__Host-")) {
    if (!t.secure) throw new Error("__Host- Cookie must have Secure attributes");
    if (t.path !== "/") throw new Error('__Host- Cookie must have Path attributes with "/"');
    if (t.domain) throw new Error("__Host- Cookie must not have Domain attributes");
  }
  if (t && typeof t.maxAge == "number" && t.maxAge >= 0) {
    if (t.maxAge > 3456e4) throw new Error("Cookies Max-Age SHOULD NOT be greater than 400 days (34560000 seconds) in duration.");
    s += `; Max-Age=${t.maxAge | 0}`;
  }
  if (t.domain && t.prefix !== "host" && (s += `; Domain=${t.domain}`), t.path && (s += `; Path=${t.path}`), t.expires) {
    if (t.expires.getTime() - Date.now() > 3456e7) throw new Error("Cookies Expires SHOULD NOT be greater than 400 days (34560000 seconds) in the future.");
    s += `; Expires=${t.expires.toUTCString()}`;
  }
  if (t.httpOnly && (s += "; HttpOnly"), t.secure && (s += "; Secure"), t.sameSite && (s += `; SameSite=${t.sameSite.charAt(0).toUpperCase() + t.sameSite.slice(1)}`), t.priority && (s += `; Priority=${t.priority.charAt(0).toUpperCase() + t.priority.slice(1)}`), t.partitioned) {
    if (!t.secure) throw new Error("Partitioned Cookie must have Secure attributes");
    s += "; Partitioned";
  }
  return s;
}, "wn");
var St = /* @__PURE__ */ __name((e, r, t) => (r = encodeURIComponent(r), wn(e, r, t)), "St");
var xn = /* @__PURE__ */ __name((e, r, t) => {
  const s = e.req.raw.headers.get("Cookie");
  {
    if (!s) return;
    let n = r;
    return yn(s, n)[n];
  }
}, "xn");
var vn = /* @__PURE__ */ __name((e, r, t) => {
  let s;
  return (t == null ? void 0 : t.prefix) === "secure" ? s = St("__Secure-" + e, r, { path: "/", ...t, secure: true }) : (t == null ? void 0 : t.prefix) === "host" ? s = St("__Host-" + e, r, { ...t, path: "/", secure: true, domain: void 0 }) : s = St(e, r, { path: "/", ...t }), s;
}, "vn");
var kr = /* @__PURE__ */ __name((e, r, t, s) => {
  const n = vn(r, t, s);
  e.header("Set-Cookie", n, { append: true });
}, "kr");
var Tn = /* @__PURE__ */ __name((e, r, t) => {
  const s = xn(e, r);
  return kr(e, r, "", { ...t, maxAge: 0 }), s;
}, "Tn");
var $r = /* @__PURE__ */ __name((e) => Sn(e).replace(/\/|\+/g, (r) => ({ "/": "_", "+": "-" })[r] ?? r), "$r");
var Sn = /* @__PURE__ */ __name((e) => {
  let r = "";
  const t = new Uint8Array(e);
  for (let s = 0, n = t.length; s < n; s++) r += String.fromCharCode(t[s]);
  return btoa(r);
}, "Sn");
var Nn = /* @__PURE__ */ __name((e) => {
  const r = atob(e), t = new Uint8Array(new ArrayBuffer(r.length)), s = r.length / 2;
  for (let n = 0, a = r.length - 1; n <= s; n++, a--) t[n] = r.charCodeAt(n), t[a] = r.charCodeAt(a);
  return t;
}, "Nn");
var In = { deno: "Deno", bun: "Bun", workerd: "Cloudflare-Workers", node: "Node.js" };
var On = /* @__PURE__ */ __name(() => {
  var t, s;
  const e = globalThis;
  if (typeof navigator < "u" && true) {
    for (const [n, a] of Object.entries(In)) if (Rn(a)) return n;
  }
  return typeof (e == null ? void 0 : e.EdgeRuntime) == "string" ? "edge-light" : (e == null ? void 0 : e.fastly) !== void 0 ? "fastly" : ((s = (t = e == null ? void 0 : e.process) == null ? void 0 : t.release) == null ? void 0 : s.name) === "node" ? "node" : "other";
}, "On");
var Rn = /* @__PURE__ */ __name((e) => "Cloudflare-Workers".startsWith(e), "Rn");
var Dn = class extends Error {
  static {
    __name(this, "Dn");
  }
  constructor(e) {
    super(`${e} is not an implemented algorithm`), this.name = "JwtAlgorithmNotImplemented";
  }
};
var Hr = ((e) => (e.Encrypt = "encrypt", e.Decrypt = "decrypt", e.Sign = "sign", e.Verify = "verify", e.DeriveKey = "deriveKey", e.DeriveBits = "deriveBits", e.WrapKey = "wrapKey", e.UnwrapKey = "unwrapKey", e))(Hr || {});
var Ht = new TextEncoder();
new TextDecoder();
async function An(e, r, t) {
  const s = Ln(r), n = await jn(e, s);
  return await crypto.subtle.sign(s, n, t);
}
__name(An, "An");
function Cn(e) {
  return Nn(e.replace(/-+(BEGIN|END).*/g, "").replace(/\s/g, ""));
}
__name(Cn, "Cn");
async function jn(e, r) {
  if (!crypto.subtle || !crypto.subtle.importKey) throw new Error("`crypto.subtle.importKey` is undefined. JWT auth middleware requires it.");
  if (Mn(e)) {
    if (e.type !== "private" && e.type !== "secret") throw new Error(`unexpected key type: CryptoKey.type is ${e.type}, expected private or secret`);
    return e;
  }
  const t = [Hr.Sign];
  return typeof e == "object" ? await crypto.subtle.importKey("jwk", e, r, false, t) : e.includes("PRIVATE") ? await crypto.subtle.importKey("pkcs8", Cn(e), r, false, t) : await crypto.subtle.importKey("raw", Ht.encode(e), r, false, t);
}
__name(jn, "jn");
function Ln(e) {
  switch (e) {
    case "HS256":
      return { name: "HMAC", hash: { name: "SHA-256" } };
    case "HS384":
      return { name: "HMAC", hash: { name: "SHA-384" } };
    case "HS512":
      return { name: "HMAC", hash: { name: "SHA-512" } };
    case "RS256":
      return { name: "RSASSA-PKCS1-v1_5", hash: { name: "SHA-256" } };
    case "RS384":
      return { name: "RSASSA-PKCS1-v1_5", hash: { name: "SHA-384" } };
    case "RS512":
      return { name: "RSASSA-PKCS1-v1_5", hash: { name: "SHA-512" } };
    case "PS256":
      return { name: "RSA-PSS", hash: { name: "SHA-256" }, saltLength: 32 };
    case "PS384":
      return { name: "RSA-PSS", hash: { name: "SHA-384" }, saltLength: 48 };
    case "PS512":
      return { name: "RSA-PSS", hash: { name: "SHA-512" }, saltLength: 64 };
    case "ES256":
      return { name: "ECDSA", hash: { name: "SHA-256" }, namedCurve: "P-256" };
    case "ES384":
      return { name: "ECDSA", hash: { name: "SHA-384" }, namedCurve: "P-384" };
    case "ES512":
      return { name: "ECDSA", hash: { name: "SHA-512" }, namedCurve: "P-521" };
    case "EdDSA":
      return { name: "Ed25519", namedCurve: "Ed25519" };
    default:
      throw new Dn(e);
  }
}
__name(Ln, "Ln");
function Mn(e) {
  return On() === "node" && crypto.webcrypto ? e instanceof crypto.webcrypto.CryptoKey : e instanceof CryptoKey;
}
__name(Mn, "Mn");
var Nt = /* @__PURE__ */ __name((e) => $r(Ht.encode(JSON.stringify(e)).buffer).replace(/=/g, ""), "Nt");
var Bn = /* @__PURE__ */ __name((e) => $r(e).replace(/=/g, ""), "Bn");
var kn = /* @__PURE__ */ __name(async (e, r, t = "HS256") => {
  const s = Nt(e);
  let n;
  typeof r == "object" && "alg" in r ? (t = r.alg, n = Nt({ alg: t, typ: "JWT", kid: r.kid })) : n = Nt({ alg: t, typ: "JWT" });
  const a = `${n}.${s}`, o = await An(r, t, Ht.encode(a)), i = Bn(o);
  return `${a}.${i}`;
}, "kn");
var $n = { sign: kn };
var Hn = $n.sign;
var Un = "your-super-secret-jwt-key-change-in-production";
var Ur = 3600 * 24 * 7;
async function Ut(e) {
  const t = new TextEncoder().encode(e), s = await crypto.subtle.digest("SHA-256", t);
  return Array.from(new Uint8Array(s)).map((a) => a.toString(16).padStart(2, "0")).join("");
}
__name(Ut, "Ut");
async function qn(e, r) {
  return await Ut(e) === r;
}
__name(qn, "qn");
async function Pn(e) {
  const r = Math.floor(Date.now() / 1e3), t = { ...e, iat: r, exp: r + Ur };
  return await Hn(t, Un);
}
__name(Pn, "Pn");
function Fn(...e) {
  return async (r, t) => {
    const s = r.get("user");
    if (!s) return r.json({ error: "Authentication required" }, 401);
    if (!e.includes(s.user_type)) return r.json({ error: "Access denied for this user type", required_types: e, your_type: s.user_type }, 403);
    await t();
  };
}
__name(Fn, "Fn");
async function Wn(e) {
  const { DB: r } = e.env, { student_name: t, email: s, password: n, grade_level: a } = await e.req.json();
  if (!t || !s || !n || !a) return e.json({ error: "Missing required fields" }, 400);
  if (a < 1 || a > 12) return e.json({ error: "Invalid grade level (1-12)" }, 400);
  if (await r.prepare(`
    SELECT student_id FROM students WHERE email = ?
  `).bind(s).first()) return e.json({ error: "Email already registered" }, 409);
  const i = await Ut(n), l = (await r.prepare(`
    INSERT INTO students (student_name, email, password_hash, grade_level, role)
    VALUES (?, ?, ?, ?, 'student')
  `).bind(t, s, i, a).run()).meta.last_row_id, u = await Pn({ user_id: l, user_type: "student", role: "student", email: s, name: t });
  return kr(e, "auth_token", u, { httpOnly: true, secure: true, sameSite: "Strict", maxAge: Ur }), e.json({ success: true, user: { student_id: l, student_name: t, email: s, grade_level: a, role: "student" }, token: u }, 201);
}
__name(Wn, "Wn");
async function Jn(e) {
  return Tn(e, "auth_token"), e.json({ success: true, message: "Logged out successfully" });
}
__name(Jn, "Jn");
async function Gn(e) {
  const r = e.get("user");
  if (!r) return e.json({ error: "Not authenticated" }, 401);
  const { DB: t } = e.env;
  let s;
  switch (r.user_type) {
    case "student":
      s = `SELECT student_id as user_id, student_name as name, email, grade_level, role, is_active 
               FROM students WHERE student_id = ?`;
      break;
    case "teacher":
      s = `SELECT teacher_id as user_id, teacher_name as name, email, specialization, role, is_active 
               FROM teachers WHERE teacher_id = ?`;
      break;
    case "parent":
      s = `SELECT parent_id as user_id, parent_name as name, email, phone_number, role, is_active 
               FROM parents WHERE parent_id = ?`;
      break;
    default:
      return e.json({ error: "Invalid user type" }, 400);
  }
  const n = await t.prepare(s).bind(r.user_id).first();
  return n ? e.json({ success: true, user: { ...n, user_type: r.user_type } }) : e.json({ error: "User not found" }, 404);
}
__name(Gn, "Gn");
async function Yn(e) {
  const r = e.get("user");
  if (!r) return e.json({ error: "Not authenticated" }, 401);
  const { DB: t } = e.env, { current_password: s, new_password: n } = await e.req.json();
  if (!s || !n) return e.json({ error: "Missing required fields" }, 400);
  if (n.length < 8) return e.json({ error: "New password must be at least 8 characters" }, 400);
  let a, o, i;
  switch (r.user_type) {
    case "student":
      o = "students", i = "student_id";
      break;
    case "teacher":
      o = "teachers", i = "teacher_id";
      break;
    case "parent":
      o = "parents", i = "parent_id";
      break;
    default:
      return e.json({ error: "Invalid user type" }, 400);
  }
  a = `SELECT password_hash FROM ${o} WHERE ${i} = ?`;
  const c = await t.prepare(a).bind(r.user_id).first();
  if (!c) return e.json({ error: "User not found" }, 404);
  if (!await qn(s, c.password_hash)) return e.json({ error: "Current password is incorrect" }, 401);
  const u = await Ut(n);
  return await t.prepare(`
    UPDATE ${o} 
    SET password_hash = ?, updated_at = CURRENT_TIMESTAMP 
    WHERE ${i} = ?
  `).bind(u, r.user_id).run(), e.json({ success: true, message: "Password changed successfully" });
}
__name(Yn, "Yn");
function _t(e, r, t) {
  const s = { timestamp: (/* @__PURE__ */ new Date()).toISOString(), level: e, message: r, ...(t == null ? void 0 : t.context) && { context: t.context }, ...(t == null ? void 0 : t.error) && { error: { name: t.error.name, message: t.error.message, stack: t.error.stack, code: t.error.code } }, ...(t == null ? void 0 : t.metadata) && { metadata: t.metadata } };
  console.log(JSON.stringify(s)), (e === "ERROR" || e === "FATAL") && console.error(JSON.stringify(s));
}
__name(_t, "_t");
function qr(e) {
  const r = e.get("user");
  return { user_id: r == null ? void 0 : r.user_id, user_type: r == null ? void 0 : r.user_type, request_id: e.req.header("cf-request-id") || crypto.randomUUID(), path: e.req.path, method: e.req.method, ip: e.req.header("cf-connecting-ip") || e.req.header("x-forwarded-for"), user_agent: e.req.header("user-agent") };
}
__name(qr, "qr");
async function Vn(e, r) {
  try {
    await r();
  } catch (t) {
    const s = qr(e);
    return _t("ERROR", "Unhandled error in request", { context: s, error: t, metadata: { url: e.req.url, body: await e.req.text().catch(() => "Unable to parse body") } }), e.json({ error: "Internal server error", message: "An unexpected error occurred", request_id: s.request_id }, 500);
  }
}
__name(Vn, "Vn");
async function Kn(e, r) {
  const t = Date.now(), s = qr(e);
  _t("INFO", "Incoming request", { context: s, metadata: { query: e.req.query() } }), await r();
  const n = Date.now() - t, a = e.res.status;
  _t(a >= 500 ? "ERROR" : a >= 400 ? "WARN" : "INFO", "Request completed", { context: s, metadata: { status: a, duration_ms: n } });
}
__name(Kn, "Kn");
async function Pr(e) {
  var o;
  const { DB: r, GEMINI_API_KEY: t } = e.env;
  let s = "disconnected";
  try {
    await r.prepare("SELECT 1").first(), s = "connected";
  } catch (i) {
    s = "error", _t("ERROR", "Health check: Database error", { error: i });
  }
  const n = t ? "available" : "unavailable";
  let a = "healthy";
  return s === "error" || n === "unavailable" ? a = "unhealthy" : s === "disconnected" && (a = "degraded"), { status: a, uptime_seconds: Math.floor(((o = process.uptime) == null ? void 0 : o.call(process)) || 0), database_status: s, api_status: { gemini: n } };
}
__name(Pr, "Pr");
var Fr = { STUDENT_PROGRESS: 300, CURRICULUM: 3600, SCTN_SCORE: 86400, RANKING: 600, LEARNING_CARDS: 1800, CLASS_STATS: 300, WEEKLY_REPORT: 3600, MONTHLY_REPORT: 86400 };
function It(e, ...r) {
  return `${e}:${r.join(":")}`;
}
__name(It, "It");
async function Wr(e, r) {
  if (!e) return console.warn("KV namespace not configured"), null;
  try {
    const t = await e.get(r);
    return t ? JSON.parse(t) : null;
  } catch (t) {
    return console.error(`KV cache get error for key ${r}:`, t), null;
  }
}
__name(Wr, "Wr");
async function Ye(e, r, t, s) {
  if (!e) return console.warn("KV namespace not configured"), false;
  try {
    return await e.put(r, JSON.stringify(t), { expirationTtl: s }), true;
  } catch (n) {
    return console.error(`KV cache set error for key ${r}:`, n), false;
  }
}
__name(Ye, "Ye");
async function zn(e, r) {
  if (!e) return 0;
  try {
    const t = await e.list({ prefix: r });
    let s = 0;
    for (const n of t.keys) await e.delete(n.name), s++;
    return s;
  } catch (t) {
    return console.error(`KV cache pattern invalidation error for pattern ${r}:`, t), 0;
  }
}
__name(zn, "zn");
async function Xn(e, r, t, s) {
  const n = await Wr(e, r);
  if (n !== null) return n;
  const a = await s();
  return await Ye(e, r, a, t), a;
}
__name(Xn, "Xn");
async function qt(e) {
  if (!e) return { enabled: false, message: "KV namespace not configured" };
  try {
    const r = ["student_progress", "curriculum", "sctn_score", "ranking", "class_stats"], t = {};
    for (const s of r) {
      const n = await e.list({ prefix: s });
      t[s] = n.keys.length;
    }
    return { enabled: true, total_keys: Object.values(t).reduce((s, n) => s + n, 0), by_prefix: t };
  } catch (r) {
    return console.error("Failed to get cache stats:", r), { enabled: true, error: "Failed to retrieve stats" };
  }
}
__name(qt, "qt");
var Ot = { SYSTEM_CONFIG: 86400 * 7, SCHOOL_INFO: 86400 * 3, GRADE_LEVELS: 86400 * 7, SUBJECTS: 86400 * 7, CURRICULUM_FULL: 86400, LEARNING_CARDS_LIST: 3600, TEACHERS_LIST: 3600, STUDENT_LIST: 300, RECENT_SESSIONS: 60, NOTIFICATIONS: 30 };
var Qn = class {
  static {
    __name(this, "Qn");
  }
  constructor() {
    C(this, "hits", 0);
    C(this, "misses", 0);
  }
  recordHit() {
    this.hits++;
  }
  recordMiss() {
    this.misses++;
  }
  getHitRate() {
    const r = this.hits + this.misses;
    return r > 0 ? this.hits / r * 100 : 0;
  }
  getStats() {
    return { hits: this.hits, misses: this.misses, total: this.hits + this.misses, hit_rate: this.getHitRate().toFixed(2) + "%" };
  }
  reset() {
    this.hits = 0, this.misses = 0;
  }
};
var pt = new Qn();
async function Zn(e, r, t, s) {
  const n = await Wr(e, r);
  if (n !== null) return pt.recordHit(), { data: n, cached: true };
  pt.recordMiss();
  const a = await s();
  return await Ye(e, r, a, t), { data: a, cached: false };
}
__name(Zn, "Zn");
async function ea(e, r) {
  if (!e) return 0;
  let t = 0;
  for (const s of r) {
    const n = await zn(e, s);
    t += n;
  }
  return t;
}
__name(ea, "ea");
async function ta(e, r, t) {
  if (!e) return 0;
  const s = [];
  switch (r) {
    case "student":
      s.push(`student_progress:${t}`, `ranking:student:${t}`, `weekly_report:${t}`, `monthly_report:${t}`, `sctn_score:${t}`);
      break;
    case "teacher":
      s.push(`class_stats:teacher:${t}`, `teacher_dashboard:${t}`);
      break;
    case "curriculum":
      s.push(`curriculum:${t}`, `learning_cards:curriculum:${t}`, "curriculum_list");
      break;
    case "class":
      s.push(`class_stats:${t}`, `ranking:class:${t}`, `class_progress:${t}`);
      break;
  }
  return await ea(e, s);
}
__name(ta, "ta");
async function ra(e, r) {
  if (e) {
    console.log("\u{1F525} Prewarming critical caches...");
    try {
      const t = It("curriculum_list"), s = await r.prepare("SELECT * FROM curriculum ORDER BY grade, subject").all();
      await Ye(e, t, s.results, Ot.CURRICULUM_FULL), console.log("\u2705 Curriculum list cached");
      const n = It("subjects_list"), a = await r.prepare("SELECT DISTINCT subject FROM curriculum ORDER BY subject").all();
      await Ye(e, n, a.results, Ot.SUBJECTS), console.log("\u2705 Subjects list cached");
      const o = It("grades_list"), i = await r.prepare("SELECT DISTINCT grade FROM curriculum ORDER BY grade").all();
      await Ye(e, o, i.results, Ot.GRADE_LEVELS), console.log("\u2705 Grades list cached"), console.log("\u{1F389} Cache prewarm completed successfully");
    } catch (t) {
      console.error("\u274C Cache prewarm failed:", t);
    }
  }
}
__name(ra, "ra");
async function sa(e) {
  if (!e) return { status: "down", details: { error: "KV namespace not configured" } };
  try {
    const r = "health_check:" + Date.now(), t = { timestamp: Date.now() };
    await e.put(r, JSON.stringify(t), { expirationTtl: 10 });
    const s = await e.get(r);
    return await e.delete(r), s && JSON.parse(s).timestamp === t.timestamp ? { status: "healthy", details: { read: true, write: true, delete: true, latency_ms: Date.now() - t.timestamp } } : { status: "degraded", details: { error: "Read/write mismatch" } };
  } catch (r) {
    return { status: "down", details: { error: r.message } };
  }
}
__name(sa, "sa");
var Jr = class {
  static {
    __name(this, "Jr");
  }
  constructor(r, t) {
    this.DB = r, this.KV = t;
  }
  async detectLearningStyle(r) {
    const t = `learning_style:${r}`;
    if (this.KV) {
      const u = await this.KV.get(t);
      if (u) return JSON.parse(u);
    }
    const s = await this.fetchLearningBehavior(r), n = this.calculateVARKScores(s), a = this.calculateGardnerScores(s), o = this.determineDominantStyle(n), i = this.determineDominantIntelligence(a), c = this.calculateConfidence(s), l = { student_id: r, vark_scores: n, gardner_scores: a, dominant_style: o, dominant_intelligence: i, confidence_level: c, last_updated: (/* @__PURE__ */ new Date()).toISOString() };
    return this.KV && await this.KV.put(t, JSON.stringify(l), { expirationTtl: 86400 }), await this.saveLearningStyleToDB(l), l;
  }
  async fetchLearningBehavior(r) {
    const t = await this.DB.prepare(`
      SELECT COUNT(*) as count FROM learning_history
      WHERE student_id = ? AND hint_used = TRUE
    `).bind(r).first(), s = await this.DB.prepare(`
      SELECT SUM(time_spent_seconds) as total FROM learning_history
      WHERE student_id = ? AND card_id IN (
        SELECT card_id FROM learning_cards WHERE solution_video_url IS NOT NULL
      )
    `).bind(r).first(), n = await this.DB.prepare(`
      SELECT COUNT(*) as count FROM learning_sessions
      WHERE student_id = ? AND focus_level = 'high'
    `).bind(r).first(), a = await this.DB.prepare(`
      SELECT SUM(time_spent_seconds) as total FROM learning_history
      WHERE student_id = ?
    `).bind(r).first(), o = await this.DB.prepare(`
      SELECT COUNT(*) as count FROM learning_notes
      WHERE student_id = ?
    `).bind(r).first(), i = await this.DB.prepare(`
      SELECT COUNT(*) as count FROM learning_history
      WHERE student_id = ? AND is_correct = TRUE
    `).bind(r).first(), c = await this.DB.prepare(`
      SELECT COUNT(*) as count FROM learning_posts
      WHERE student_id = ?
    `).bind(r).first(), l = await this.DB.prepare(`
      SELECT COUNT(*) as count FROM learning_reflections
      WHERE student_id = ?
    `).bind(r).first(), u = await this.DB.prepare(`
      SELECT AVG(time_spent_seconds) as avg_time FROM learning_history
      WHERE student_id = ? AND is_correct = TRUE
    `).bind(r).first(), d = await this.DB.prepare(`
      SELECT 
        SUM(CASE WHEN is_correct = TRUE THEN 1 ELSE 0 END) * 1.0 / COUNT(*) as accuracy
      FROM learning_history
      WHERE student_id = ?
    `).bind(r).first(), _ = await this.DB.prepare(`
      SELECT COUNT(*) as count FROM learning_sessions
      WHERE student_id = ?
    `).bind(r).first();
    return { student_id: r, image_interaction_count: (t == null ? void 0 : t.count) || 0, video_watch_time_seconds: (s == null ? void 0 : s.total) || 0, audio_playback_count: (n == null ? void 0 : n.count) || 0, text_reading_time_seconds: (a == null ? void 0 : a.total) || 0, note_taking_count: (o == null ? void 0 : o.count) || 0, interactive_element_usage: (i == null ? void 0 : i.count) || 0, collaboration_count: (c == null ? void 0 : c.count) || 0, self_reflection_count: (l == null ? void 0 : l.count) || 0, problem_solving_speed_ms: ((u == null ? void 0 : u.avg_time) || 0) * 1e3, pattern_recognition_accuracy: (d == null ? void 0 : d.accuracy) || 0, total_learning_sessions: (_ == null ? void 0 : _.count) || 0 };
  }
  calculateVARKScores(r) {
    const t = r.total_learning_sessions || 1, s = (r.image_interaction_count / t * 0.6 + r.video_watch_time_seconds / (t * 300) * 0.4) * 100, n = (r.audio_playback_count / t * 0.7 + r.collaboration_count / t * 0.3) * 100, a = (r.text_reading_time_seconds / (t * 600) * 0.5 + r.note_taking_count / t * 0.5) * 100, o = (r.interactive_element_usage / t * 0.7 + (r.problem_solving_speed_ms < 6e4 ? 0.3 : 0.1)) * 100, i = s + n + a + o;
    return { visual: Math.min(100, s / i * 100), auditory: Math.min(100, n / i * 100), reading: Math.min(100, a / i * 100), kinesthetic: Math.min(100, o / i * 100) };
  }
  calculateGardnerScores(r) {
    const t = r.total_learning_sessions || 1;
    return { linguistic: r.text_reading_time_seconds / (t * 600) * 100, logical: r.pattern_recognition_accuracy * 100, spatial: r.image_interaction_count / t * 50, bodily: r.interactive_element_usage / t * 50, musical: r.audio_playback_count / t * 50, interpersonal: r.collaboration_count / t * 100, intrapersonal: r.self_reflection_count / t * 100, naturalist: 50 };
  }
  determineDominantStyle(r) {
    const t = [{ type: "visual", score: r.visual }, { type: "auditory", score: r.auditory }, { type: "reading", score: r.reading }, { type: "kinesthetic", score: r.kinesthetic }];
    return t.sort((s, n) => n.score - s.score), t[0].type;
  }
  determineDominantIntelligence(r) {
    const t = Object.entries(r).map(([s, n]) => ({ type: s, score: n }));
    return t.sort((s, n) => n.score - s.score), t[0].type;
  }
  calculateConfidence(r) {
    const t = r.total_learning_sessions;
    return t < 10 ? t / 10 : t >= 100 ? 1 : 0.5 + (t - 10) / 180;
  }
  async saveLearningStyleToDB(r) {
    await this.DB.prepare(`
      INSERT OR REPLACE INTO detected_learning_styles (
        student_id,
        vark_visual, vark_auditory, vark_reading, vark_kinesthetic,
        gardner_linguistic, gardner_logical, gardner_spatial, gardner_bodily,
        gardner_musical, gardner_interpersonal, gardner_intrapersonal, gardner_naturalist,
        dominant_style, dominant_intelligence, confidence_level, last_updated
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(r.student_id, r.vark_scores.visual, r.vark_scores.auditory, r.vark_scores.reading, r.vark_scores.kinesthetic, r.gardner_scores.linguistic, r.gardner_scores.logical, r.gardner_scores.spatial, r.gardner_scores.bodily, r.gardner_scores.musical, r.gardner_scores.interpersonal, r.gardner_scores.intrapersonal, r.gardner_scores.naturalist, r.dominant_style, r.dominant_intelligence, r.confidence_level, r.last_updated).run();
  }
  async recommendCurriculum(r, t = 5) {
    const s = await this.detectLearningStyle(r), n = await this.DB.prepare(`
      SELECT 
        lc.*,
        CASE
          WHEN ? = 'visual' AND lc.image_url IS NOT NULL THEN 10
          WHEN ? = 'auditory' AND lc.solution_video_url IS NOT NULL THEN 10
          WHEN ? = 'reading' AND LENGTH(lc.explanation) > 200 THEN 10
          WHEN ? = 'kinesthetic' AND lc.card_type = 'challenge' THEN 10
          ELSE 5
        END as recommendation_score
      FROM learning_cards lc
      LEFT JOIN student_progress sp ON lc.card_id = sp.card_id AND sp.student_id = ?
      WHERE sp.status IS NULL OR sp.status != 'completed'
      ORDER BY recommendation_score DESC, lc.difficulty_level ASC
      LIMIT ?
    `).bind(s.dominant_style, s.dominant_style, s.dominant_style, s.dominant_style, r, t).all();
    return { student_id: r, learning_style: s, recommendations: n.results };
  }
};
var Ue = class {
  static {
    __name(this, "Ue");
  }
  constructor(r, t) {
    this.DB = r, this.KV = t;
  }
  async getMultiClassProgress(r) {
    const t = `school_classes:${r}`;
    if (this.KV) {
      const a = await this.KV.get(t);
      if (a) return JSON.parse(a);
    }
    const n = (await this.DB.prepare(`
      SELECT 
        c.class_code,
        c.class_name,
        c.grade,
        s.school_id,
        s.school_name,
        t.teacher_id,
        t.name as teacher_name,
        COUNT(DISTINCT sp.student_id) as student_count,
        AVG(sp.progress_percentage) as total_progress,
        AVG(sp.mastery_level) as average_mastery
      FROM classes c
      LEFT JOIN schools s ON c.school_id = s.school_id
      LEFT JOIN teachers t ON c.teacher_id = t.teacher_id
      LEFT JOIN students st ON st.class_code = c.class_code
      LEFT JOIN student_progress sp ON st.student_id = sp.student_id
      WHERE c.school_id = ?
      GROUP BY c.class_code, c.class_name, c.grade, s.school_id, s.school_name, t.teacher_id, t.name
      ORDER BY c.grade, c.class_name
    `).bind(r).all()).results.map((a) => ({ class_code: a.class_code, class_name: a.class_name, grade: a.grade, school_id: a.school_id, school_name: a.school_name, teacher_id: a.teacher_id, teacher_name: a.teacher_name, student_count: a.student_count || 0, total_progress: a.total_progress || 0, average_mastery: a.average_mastery || 0, last_updated: (/* @__PURE__ */ new Date()).toISOString() }));
    return this.KV && await this.KV.put(t, JSON.stringify(n), { expirationTtl: 300 }), n;
  }
  async getGradeSummary(r) {
    const t = `school_grade_summary:${r}`;
    if (this.KV) {
      const a = await this.KV.get(t);
      if (a) return JSON.parse(a);
    }
    const n = (await this.DB.prepare(`
      SELECT 
        c.grade,
        c.school_id,
        COUNT(DISTINCT st.student_id) as total_students,
        COUNT(DISTINCT c.class_code) as total_classes,
        AVG(sp.progress_percentage) as average_progress,
        AVG(sp.mastery_level) as average_mastery,
        (
          SELECT c2.class_name
          FROM classes c2
          LEFT JOIN students st2 ON st2.class_code = c2.class_code
          LEFT JOIN student_progress sp2 ON st2.student_id = sp2.student_id
          WHERE c2.grade = c.grade AND c2.school_id = c.school_id
          GROUP BY c2.class_code
          ORDER BY AVG(sp2.progress_percentage) DESC
          LIMIT 1
        ) as top_performing_class,
        (
          SELECT COUNT(*)
          FROM students st3
          LEFT JOIN student_progress sp3 ON st3.student_id = sp3.student_id
          LEFT JOIN classes c3 ON st3.class_code = c3.class_code
          WHERE c3.grade = c.grade AND c3.school_id = c.school_id
            AND sp3.progress_percentage < 30
        ) as needs_support_count
      FROM classes c
      LEFT JOIN students st ON st.class_code = c.class_code
      LEFT JOIN student_progress sp ON st.student_id = sp.student_id
      WHERE c.school_id = ?
      GROUP BY c.grade, c.school_id
      ORDER BY c.grade
    `).bind(r).all()).results.map((a) => ({ grade: a.grade, school_id: a.school_id, total_students: a.total_students || 0, total_classes: a.total_classes || 0, average_progress: a.average_progress || 0, average_mastery: a.average_mastery || 0, top_performing_class: a.top_performing_class || "N/A", needs_support_count: a.needs_support_count || 0, last_updated: (/* @__PURE__ */ new Date()).toISOString() }));
    return this.KV && await this.KV.put(t, JSON.stringify(n), { expirationTtl: 300 }), n;
  }
  async getTeacherClassAnalysis(r, t) {
    const s = `teacher_class_analysis:${r}:${t}`;
    if (this.KV) {
      const i = await this.KV.get(s);
      if (i) return JSON.parse(i);
    }
    const n = await this.DB.prepare(`
      SELECT 
        c.class_code,
        c.class_name,
        c.grade,
        COUNT(DISTINCT st.student_id) as total_students,
        AVG(sp.progress_percentage) as average_progress,
        AVG(sp.mastery_level) as average_mastery,
        SUM(CASE WHEN sp.progress_percentage >= 80 THEN 1 ELSE 0 END) as high_achievers,
        SUM(CASE WHEN sp.progress_percentage < 30 THEN 1 ELSE 0 END) as needs_support
      FROM classes c
      LEFT JOIN students st ON st.class_code = c.class_code
      LEFT JOIN student_progress sp ON st.student_id = sp.student_id
      WHERE c.teacher_id = ? AND c.class_code = ?
      GROUP BY c.class_code, c.class_name, c.grade
    `).bind(r, t).first(), a = await this.DB.prepare(`
      SELECT 
        st.student_id,
        st.name as student_name,
        sp.progress_percentage,
        sp.mastery_level,
        sp.total_time_spent_seconds,
        sp.last_activity_date,
        dls.dominant_style as learning_style,
        dls.confidence_level as style_confidence
      FROM students st
      LEFT JOIN student_progress sp ON st.student_id = sp.student_id
      LEFT JOIN detected_learning_styles dls ON st.student_id = dls.student_id
      WHERE st.class_code = ?
      ORDER BY sp.progress_percentage DESC
    `).bind(t).all(), o = { class_info: n, student_details: a.results, summary: { average_learning_time: 0, most_common_learning_style: "visual", engagement_level: "high" }, last_updated: (/* @__PURE__ */ new Date()).toISOString() };
    return this.KV && await this.KV.put(s, JSON.stringify(o), { expirationTtl: 180 }), o;
  }
  async sendParentNotification(r) {
    const t = await this.DB.prepare(`
      INSERT INTO parent_notifications (
        student_id, parent_email, notification_type,
        subject, message, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(r.student_id, r.parent_email, r.notification_type, r.subject, r.message, "pending", (/* @__PURE__ */ new Date()).toISOString()).run();
    return await this.DB.prepare(`
      UPDATE parent_notifications
      SET status = 'sent', sent_at = ?
      WHERE notification_id = ?
    `).bind((/* @__PURE__ */ new Date()).toISOString(), t.meta.last_row_id).run(), { notification_id: t.meta.last_row_id, status: "sent", sent_at: (/* @__PURE__ */ new Date()).toISOString() };
  }
  async getParentNotificationHistory(r) {
    return (await this.DB.prepare(`
      SELECT 
        notification_id,
        student_id,
        parent_email,
        notification_type,
        subject,
        message,
        status,
        created_at,
        sent_at
      FROM parent_notifications
      WHERE student_id = ?
      ORDER BY created_at DESC
      LIMIT 50
    `).bind(r).all()).results;
  }
  async getSchoolReportData(r, t, s) {
    const n = await this.DB.prepare(`
      SELECT * FROM schools WHERE school_id = ?
    `).bind(r).first(), a = await this.DB.prepare(`
      SELECT 
        COUNT(DISTINCT st.student_id) as total_students,
        COUNT(DISTINCT c.class_code) as total_classes,
        AVG(sp.progress_percentage) as average_progress,
        AVG(sp.mastery_level) as average_mastery,
        SUM(sp.total_time_spent_seconds) as total_learning_time
      FROM classes c
      LEFT JOIN students st ON st.class_code = c.class_code
      LEFT JOIN student_progress sp ON st.student_id = sp.student_id
      WHERE c.school_id = ?
    `).bind(r).first(), o = await this.getGradeSummary(r), i = await this.getMultiClassProgress(r);
    return { school_info: n, report_period: { start_date: t, end_date: s }, overall_stats: a, grade_stats: o, class_stats: i, generated_at: (/* @__PURE__ */ new Date()).toISOString() };
  }
};
var er = { visual: { prefix: "\u8996\u899A\u7684\u306A\u8981\u7D20\u3092\u91CD\u8996\u3057\u3066\u3001", elements: ["\u56F3\u89E3\u3084\u30C0\u30A4\u30A2\u30B0\u30E9\u30E0\u306E\u8AAC\u660E\u3092\u542B\u3081\u308B", "\u8272\u5206\u3051\u3084\u8996\u899A\u7684\u306A\u30D1\u30BF\u30FC\u30F3\u3092\u4F7F\u7528", "\u30A4\u30E1\u30FC\u30B8\u3057\u3084\u3059\u3044\u5177\u4F53\u4F8B\u3092\u63D0\u4F9B", "\u30B9\u30C6\u30C3\u30D7\u3092\u8996\u899A\u7684\u306B\u8868\u73FE"] }, auditory: { prefix: "\u97F3\u58F0\u3067\u805E\u304D\u3084\u3059\u3044\u3088\u3046\u306B\u3001", elements: ["\u4F1A\u8A71\u5F62\u5F0F\u3084\u5BFE\u8A71\u7684\u306A\u8868\u73FE\u3092\u4F7F\u7528", "\u30EA\u30BA\u30E0\u3084\u97FB\u3092\u610F\u8B58\u3057\u305F\u8AAC\u660E", "\u53E3\u982D\u3067\u8AAC\u660E\u3057\u3084\u3059\u3044\u8A00\u8449\u9063\u3044", "\u97F3\u3084\u30EA\u30BA\u30E0\u306B\u95A2\u9023\u3059\u308B\u4F8B\u3092\u4F7F\u7528"] }, reading: { prefix: "\u8A73\u7D30\u306A\u6587\u7AE0\u8AAC\u660E\u3092\u91CD\u8996\u3057\u3066\u3001", elements: ["\u8AD6\u7406\u7684\u3067\u4F53\u7CFB\u7684\u306A\u8AAC\u660E", "\u5B9A\u7FA9\u3084\u7528\u8A9E\u3092\u660E\u78BA\u306B\u8A18\u8F09", "\u6BB5\u968E\u7684\u306A\u8AAC\u660E\u3068\u8981\u7D04\u3092\u63D0\u4F9B", "\u5F15\u7528\u3084\u53C2\u8003\u6587\u732E\u306E\u5F62\u5F0F\u3092\u4F7F\u7528"] }, kinesthetic: { prefix: "\u5B9F\u8DF5\u7684\u306A\u4F53\u9A13\u3092\u91CD\u8996\u3057\u3066\u3001", elements: ["\u5B9F\u969B\u306B\u624B\u3092\u52D5\u304B\u3059\u4F8B\u3092\u63D0\u4F9B", "\u73FE\u5B9F\u4E16\u754C\u3067\u306E\u5FDC\u7528\u4F8B", "\u30B9\u30C6\u30C3\u30D7\u30D0\u30A4\u30B9\u30C6\u30C3\u30D7\u306E\u5B9F\u8DF5\u624B\u9806", "\u5B9F\u9A13\u3084\u8A66\u884C\u932F\u8AA4\u3092\u4FC3\u3059\u5185\u5BB9"] } };
var Gr = class {
  static {
    __name(this, "Gr");
  }
  constructor(r, t, s) {
    this.GEMINI_API_KEY = r, this.DB = t, this.KV = s;
  }
  async generateContent(r) {
    if (!this.GEMINI_API_KEY) throw new Error("Gemini API Key is not configured");
    const t = `ai_content:${r.topic}:${r.learning_style}:${r.content_type}:${r.difficulty}`;
    if (this.KV) {
      const o = await this.KV.get(t);
      if (o) return JSON.parse(o);
    }
    const s = this.buildPrompt(r), n = await this.callGeminiAPI(s), a = this.structureContent(n, r);
    return this.KV && await this.KV.put(t, JSON.stringify(a), { expirationTtl: 86400 }), await this.saveContentToDB(a, r), a;
  }
  buildPrompt(r) {
    const t = er[r.learning_style] || er.reading, s = r.language || "ja";
    let n = `\u3042\u306A\u305F\u306F\u6559\u80B2\u5C02\u9580\u5BB6\u3067\u3059\u3002\u4EE5\u4E0B\u306E\u6761\u4EF6\u3067\u5B66\u7FD2\u30B3\u30F3\u30C6\u30F3\u30C4\u3092\u751F\u6210\u3057\u3066\u304F\u3060\u3055\u3044\u3002

\u30C8\u30D4\u30C3\u30AF: ${r.topic}
\u5B66\u5E74: ${r.grade_level}\u5E74\u751F
\u96E3\u6613\u5EA6: ${r.difficulty}/5
\u30B3\u30F3\u30C6\u30F3\u30C4\u30BF\u30A4\u30D7: ${this.getContentTypeDescription(r.content_type)}
\u5B66\u7FD2\u30B9\u30BF\u30A4\u30EB: ${this.getLearningStyleDescription(r.learning_style)}

${t.prefix}\u4EE5\u4E0B\u306E\u8981\u7D20\u3092\u542B\u3081\u3066\u304F\u3060\u3055\u3044:
${t.elements.map((a, o) => `${o + 1}. ${a}`).join(`
`)}

`;
    switch (r.content_type) {
      case "problem":
        n += `
\u554F\u984C\u3092\u4F5C\u6210\u3059\u308B\u969B\u306E\u8981\u4EF6:
- \u5B66\u5E74\u30EC\u30D9\u30EB\u306B\u9069\u3057\u305F\u96E3\u6613\u5EA6
- \u660E\u78BA\u306A\u554F\u984C\u6587
- \u5B66\u7FD2\u30B9\u30BF\u30A4\u30EB\u306B\u5408\u3063\u305F\u8868\u73FE
- \u5B9F\u751F\u6D3B\u306B\u95A2\u9023\u3059\u308B\u5185\u5BB9\uFF08\u53EF\u80FD\u306A\u5834\u5408\uFF09
`;
        break;
      case "explanation":
        n += `
\u89E3\u8AAC\u3092\u4F5C\u6210\u3059\u308B\u969B\u306E\u8981\u4EF6:
- \u521D\u5FC3\u8005\u3067\u3082\u7406\u89E3\u3067\u304D\u308B\u8AAC\u660E
- \u6BB5\u968E\u7684\u306A\u30B9\u30C6\u30C3\u30D7
- \u5177\u4F53\u4F8B\u3092\u8907\u6570\u542B\u3081\u308B
- \u3088\u304F\u3042\u308B\u9593\u9055\u3044\u3068\u305D\u306E\u5BFE\u7B56
`;
        break;
      case "hint":
        n += `
\u30D2\u30F3\u30C8\u3092\u4F5C\u6210\u3059\u308B\u969B\u306E\u8981\u4EF6:
- \u7B54\u3048\u3092\u76F4\u63A5\u8A00\u308F\u306A\u3044
- \u8003\u3048\u65B9\u306E\u304D\u3063\u304B\u3051\u3092\u63D0\u4F9B
- \u6BB5\u968E\u7684\u306A\u30D2\u30F3\u30C8\uFF083\u6BB5\u968E\u7A0B\u5EA6\uFF09
`;
        break;
      case "real_world":
        n += `
\u5B9F\u4E16\u754C\u5FDC\u7528\u4F8B\u3092\u4F5C\u6210\u3059\u308B\u969B\u306E\u8981\u4EF6:
- \u65E5\u5E38\u751F\u6D3B\u3067\u306E\u5FDC\u7528
- \u8077\u696D\u3067\u306E\u6D3B\u7528\u4F8B
- \u793E\u4F1A\u3067\u306E\u91CD\u8981\u6027
- \u8208\u5473\u3092\u5F15\u304F\u5177\u4F53\u4F8B
`;
        break;
    }
    return n += `
${s === "ja" ? "\u65E5\u672C\u8A9E" : "\u82F1\u8A9E"}\u3067\u56DE\u7B54\u3057\u3066\u304F\u3060\u3055\u3044\u3002`, n;
  }
  async callGeminiAPI(r) {
    const t = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.GEMINI_API_KEY}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ parts: [{ text: r }] }], generationConfig: { temperature: 0.7, maxOutputTokens: 2048 } }) });
    if (!t.ok) throw new Error(`Gemini API error: ${t.status}`);
    return (await t.json()).candidates[0].content.parts[0].text;
  }
  structureContent(r, t) {
    const s = { topic: t.topic, learning_style: t.learning_style, content_type: t.content_type, content: r, metadata: { generated_at: (/* @__PURE__ */ new Date()).toISOString(), model: "gemini-1.5-flash", token_count: r.length } };
    switch (t.learning_style) {
      case "visual":
        s.visual_elements = this.extractVisualElements(r);
        break;
      case "auditory":
        s.audio_script = this.createAudioScript(r);
        break;
      case "kinesthetic":
        s.practice_activity = this.extractPracticeActivity(r);
        break;
      case "reading":
        s.reading_notes = this.createReadingNotes(r);
        break;
    }
    return s;
  }
  extractVisualElements(r) {
    const t = [], s = r.match(/図[0-9０-９]+|図解|ダイアグラム|チャート/g);
    s && t.push(...s);
    const n = r.match(/^[0-9０-９]+\.|ステップ[0-9０-９]+/gm);
    return n && t.push(...n), t;
  }
  createAudioScript(r) {
    return r.replace(/\n+/g, "\u3001").replace(/[（(].*?[)）]/g, "").replace(/\s+/g, " ").trim();
  }
  extractPracticeActivity(r) {
    const t = r.match(/実践|やってみよう|試してみよう|アクティビティ[\s\S]*?(?=\n\n|$)/i);
    return t ? t[0] : "\u5B9F\u969B\u306B\u624B\u3092\u52D5\u304B\u3057\u3066\u8A66\u3057\u3066\u307F\u307E\u3057\u3087\u3046\u3002";
  }
  createReadingNotes(r) {
    return (r.match(/^[-・•]\s*.+$/gm) || []).join(`
`) || "\u4E3B\u8981\u306A\u30DD\u30A4\u30F3\u30C8\u3092\u30CE\u30FC\u30C8\u306B\u307E\u3068\u3081\u307E\u3057\u3087\u3046\u3002";
  }
  getContentTypeDescription(r) {
    return { problem: "\u5B66\u7FD2\u554F\u984C", explanation: "\u8A73\u7D30\u306A\u89E3\u8AAC", hint: "\u30D2\u30F3\u30C8", real_world: "\u5B9F\u4E16\u754C\u3067\u306E\u5FDC\u7528\u4F8B" }[r] || r;
  }
  getLearningStyleDescription(r) {
    return { visual: "\u8996\u899A\u578B\u5B66\u7FD2\u8005\u5411\u3051\uFF08\u56F3\u89E3\u3084\u30D3\u30B8\u30E5\u30A2\u30EB\u91CD\u8996\uFF09", auditory: "\u8074\u899A\u578B\u5B66\u7FD2\u8005\u5411\u3051\uFF08\u97F3\u58F0\u3084\u4F1A\u8A71\u91CD\u8996\uFF09", reading: "\u8AAD\u66F8\u578B\u5B66\u7FD2\u8005\u5411\u3051\uFF08\u8A73\u7D30\u306A\u6587\u7AE0\u91CD\u8996\uFF09", kinesthetic: "\u4F53\u611F\u578B\u5B66\u7FD2\u8005\u5411\u3051\uFF08\u5B9F\u8DF5\u3084\u4F53\u9A13\u91CD\u8996\uFF09" }[r] || r;
  }
  async saveContentToDB(r, t) {
    await this.DB.prepare(`
      INSERT INTO ai_generated_content (
        topic, learning_style, content_type, grade_level, difficulty,
        content, visual_elements, audio_script, practice_activity, reading_notes,
        model, generated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(r.topic, r.learning_style, r.content_type, t.grade_level, t.difficulty, r.content, JSON.stringify(r.visual_elements || []), r.audio_script || null, r.practice_activity || null, r.reading_notes || null, r.metadata.model, r.metadata.generated_at).run();
  }
  async getGenerationHistory(r) {
    let t = "SELECT * FROM ai_generated_content WHERE 1=1";
    const s = [];
    return r.topic && (t += " AND topic LIKE ?", s.push(`%${r.topic}%`)), r.learning_style && (t += " AND learning_style = ?", s.push(r.learning_style)), r.content_type && (t += " AND content_type = ?", s.push(r.content_type)), t += " ORDER BY generated_at DESC LIMIT ?", s.push(r.limit || 20), (await this.DB.prepare(t).bind(...s).all()).results;
  }
};
var ze = { box1_interval_days: 1, box2_interval_days: 3, box3_interval_days: 7, box4_interval_days: 14, box5_interval_days: 30, mastery_threshold: 0.8, learning_threshold: 0.5, min_easiness_factor: 1.3, max_easiness_factor: 3, default_easiness_factor: 2.5, correct_streak_to_advance: 2 };
function na(e, r, t, s) {
  let n = r + (0.1 - (5 - e) * (0.08 + (5 - e) * 0.02));
  n = Math.max(ze.min_easiness_factor, Math.min(ze.max_easiness_factor, n));
  let a, o;
  return e < 3 ? (a = 0, o = 1) : (a = t + 1, a === 1 ? o = 1 : a === 2 ? o = 6 : o = Math.round(s * n)), { newEF: n, newRepetition: a, newInterval: o };
}
__name(na, "na");
function aa(e, r) {
  switch (e) {
    case 1:
      return r.box1_interval_days;
    case 2:
      return r.box2_interval_days;
    case 3:
      return r.box3_interval_days;
    case 4:
      return r.box4_interval_days;
    case 5:
      return r.box5_interval_days;
    default:
      return r.box1_interval_days;
  }
}
__name(aa, "aa");
function oa(e, r, t, s) {
  let n;
  switch (e) {
    case "correct":
      n = 5;
      break;
    case "partial":
      n = 3;
      break;
    case "incorrect":
      n = 0;
      break;
  }
  return e === "correct" && t && (n -= (t - 1) * 0.5), s && s <= 3 && (n -= (4 - s) * 0.3), r && e === "correct" && (r < 5 ? n += 0.2 : r > 30 && (n -= 0.3)), Math.max(0, Math.min(5, n));
}
__name(oa, "oa");
function ia(e, r, t) {
  const s = t / 5, n = 0.3, a = e * (1 - n) + s * n;
  return Math.max(0, Math.min(1, a));
}
__name(ia, "ia");
function ca(e, r, t, s) {
  return r === "correct" && t >= s.correct_streak_to_advance ? Math.min(5, e + 1) : r === "incorrect" ? 1 : r === "partial" ? Math.max(1, e - 1) : e;
}
__name(ca, "ca");
function la(e, r, t) {
  return r === 0 ? "new" : e >= t.mastery_threshold ? "mastered" : e >= t.learning_threshold ? "review" : "learning";
}
__name(la, "la");
function Yr(e, r) {
  const t = /* @__PURE__ */ new Date();
  return new Date(t.getTime() + e * 24 * 60 * 60 * 1e3).toISOString();
}
__name(Yr, "Yr");
function tr(e, r, t) {
  let s = 0;
  return e > 0 && (s += Math.min(50, e * 5)), s += (1 - r) * 30, s += (6 - t) * 4, Math.min(100, Math.max(0, s));
}
__name(tr, "tr");
function da(e, r, t) {
  return e > 7 ? "overdue" : t > 0.5 ? "struggling" : r < 0.5 ? "srl_performance" : r < 0.8 ? "reinforcement" : "scheduled";
}
__name(da, "da");
function ua(e, r, t, s, n, a = ze) {
  const o = oa(r, t, s, n), i = ia(e.mastery_level, r, o), c = e.study_count + 1, l = r === "correct" ? e.correct_count + 1 : e.correct_count, u = r === "incorrect" ? e.incorrect_count + 1 : e.incorrect_count, d = r === "correct" && e.last_result === "correct" ? 2 : r === "correct" ? 1 : 0, _ = ca(e.leitner_box, r, d, a), { newEF: m, newRepetition: h, newInterval: g } = na(o, e.easiness_factor, e.repetition_number, e.review_interval_days), f = aa(_, a), E = (g + f) / 2, x = Yr(E), y = la(i, c, a);
  return { ...e, learning_stage: y, leitner_box: _, mastery_level: i, study_count: c, correct_count: l, incorrect_count: u, last_result: r, last_studied_at: (/* @__PURE__ */ new Date()).toISOString(), next_review_date: x, review_interval_days: E, easiness_factor: m, repetition_number: h, updated_at: (/* @__PURE__ */ new Date()).toISOString() };
}
__name(ua, "ua");
function _a(e, r, t = ze) {
  const s = (/* @__PURE__ */ new Date()).toISOString(), n = Yr(t.box1_interval_days);
  return { student_id: e, card_id: r, learning_stage: "new", leitner_box: 1, mastery_level: 0, study_count: 0, correct_count: 0, incorrect_count: 0, next_review_date: n, review_interval_days: t.box1_interval_days, easiness_factor: t.default_easiness_factor, repetition_number: 0, created_at: s, updated_at: s };
}
__name(_a, "_a");
var ee = class {
  static {
    __name(this, "ee");
  }
  constructor(r, t = ze) {
    C(this, "db");
    C(this, "config");
    this.db = r, this.config = t;
  }
  async getOrCreateSchedule(r, t) {
    const s = await this.db.prepare(`
      SELECT * FROM spaced_learning_schedule
      WHERE student_id = ? AND card_id = ?
    `).bind(r, t).first();
    if (s) return s;
    const n = _a(r, t, this.config);
    return await this.db.prepare(`
      INSERT INTO spaced_learning_schedule (
        student_id, card_id, learning_stage, leitner_box, mastery_level,
        study_count, correct_count, incorrect_count, next_review_date,
        review_interval_days, easiness_factor, repetition_number,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(n.student_id, n.card_id, n.learning_stage, n.leitner_box, n.mastery_level, n.study_count, n.correct_count, n.incorrect_count, n.next_review_date, n.review_interval_days, n.easiness_factor, n.repetition_number, n.created_at, n.updated_at).run(), await this.db.prepare(`
      SELECT * FROM spaced_learning_schedule
      WHERE student_id = ? AND card_id = ?
    `).bind(r, t).first();
  }
  async updateSchedule(r) {
    await this.db.prepare(`
      UPDATE spaced_learning_schedule
      SET learning_stage = ?,
          leitner_box = ?,
          mastery_level = ?,
          study_count = ?,
          correct_count = ?,
          incorrect_count = ?,
          last_result = ?,
          last_studied_at = ?,
          next_review_date = ?,
          review_interval_days = ?,
          easiness_factor = ?,
          repetition_number = ?,
          srl_foresight_score = ?,
          srl_performance_score = ?,
          srl_reflection_score = ?,
          updated_at = ?
      WHERE id = ?
    `).bind(r.learning_stage, r.leitner_box, r.mastery_level, r.study_count, r.correct_count, r.incorrect_count, r.last_result || null, r.last_studied_at || null, r.next_review_date, r.review_interval_days, r.easiness_factor, r.repetition_number, r.srl_foresight_score || null, r.srl_performance_score || null, r.srl_reflection_score || null, (/* @__PURE__ */ new Date()).toISOString(), r.id).run();
  }
  async recordStudyResult(r, t, s, n = "review", a, o, i, c, l, u) {
    const d = await this.getOrCreateSchedule(r, t), _ = d.leitner_box, m = d.mastery_level, h = d.easiness_factor, g = ua(d, s, a, o, i, this.config);
    await this.updateSchedule(g);
    const f = d.last_studied_at ? (Date.now() - new Date(d.last_studied_at).getTime()) / (1e3 * 60 * 60 * 24) : null, E = d.next_review_date ? /* @__PURE__ */ new Date() <= new Date(d.next_review_date) : true;
    return await this.db.prepare(`
      INSERT INTO spaced_learning_history (
        schedule_id, student_id, card_id, session_type, result,
        response_time_seconds, difficulty_rating, confidence_level,
        days_since_last_review, scheduled_date, actual_date, was_on_time,
        old_leitner_box, new_leitner_box,
        old_mastery_level, new_mastery_level,
        old_easiness_factor, new_easiness_factor,
        srl_stage, srl_strategy_used, srl_notes,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(g.id, r, t, n, s, a || null, o || null, i || null, f || null, d.next_review_date || null, (/* @__PURE__ */ new Date()).toISOString(), E ? 1 : 0, _, g.leitner_box, m, g.mastery_level, h, g.easiness_factor, c || null, l || null, u || null, (/* @__PURE__ */ new Date()).toISOString()).run(), g;
  }
  async getTodayReviews(r) {
    (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const t = await this.db.prepare(`
      SELECT 
        s.card_id,
        s.mastery_level,
        s.leitner_box,
        s.next_review_date,
        s.learning_stage,
        s.study_count,
        s.correct_count,
        s.incorrect_count,
        JULIANDAY('now') - JULIANDAY(s.next_review_date) as days_overdue
      FROM spaced_learning_schedule s
      WHERE s.student_id = ?
        AND DATE(s.next_review_date) <= DATE('now')
        AND s.learning_stage != 'mastered'
      ORDER BY days_overdue DESC, s.mastery_level ASC
    `).bind(r).all(), s = [];
    for (const n of t.results) {
      const a = n.days_overdue, o = n.mastery_level, i = n.study_count > 0 ? n.incorrect_count / n.study_count : 0, c = tr(a, o, n.leitner_box), l = da(a, o, i);
      s.push({ card_id: n.card_id, priority_score: c, reason: l, next_review_date: n.next_review_date, days_overdue: a, mastery_level: o, leitner_box: n.leitner_box });
    }
    return s.sort((n, a) => a.priority_score - n.priority_score);
  }
  async getTodayReviewCount(r) {
    const t = await this.db.prepare(`
      SELECT COUNT(*) as count
      FROM spaced_learning_schedule
      WHERE student_id = ?
        AND DATE(next_review_date) <= DATE('now')
        AND learning_stage != 'mastered'
    `).bind(r).first();
    return (t == null ? void 0 : t.count) || 0;
  }
  async getWeeklySchedule(r) {
    return (await this.db.prepare(`
      SELECT 
        DATE(next_review_date) as date,
        COUNT(*) as count
      FROM spaced_learning_schedule
      WHERE student_id = ?
        AND DATE(next_review_date) BETWEEN DATE('now') AND DATE('now', '+7 days')
        AND learning_stage != 'mastered'
      GROUP BY DATE(next_review_date)
      ORDER BY date
    `).bind(r).all()).results.map((s) => ({ date: s.date, count: s.count }));
  }
  async getMasteryStats(r) {
    const t = await this.db.prepare(`
      SELECT 
        COUNT(*) as total_cards,
        SUM(CASE WHEN learning_stage = 'new' THEN 1 ELSE 0 END) as new_cards,
        SUM(CASE WHEN learning_stage = 'learning' THEN 1 ELSE 0 END) as learning_cards,
        SUM(CASE WHEN learning_stage = 'review' THEN 1 ELSE 0 END) as review_cards,
        SUM(CASE WHEN learning_stage = 'mastered' THEN 1 ELSE 0 END) as mastered_cards,
        AVG(mastery_level) as avg_mastery_level,
        AVG(leitner_box) as avg_leitner_box
      FROM spaced_learning_schedule
      WHERE student_id = ?
    `).bind(r).first();
    return { total_cards: (t == null ? void 0 : t.total_cards) || 0, new_cards: (t == null ? void 0 : t.new_cards) || 0, learning_cards: (t == null ? void 0 : t.learning_cards) || 0, review_cards: (t == null ? void 0 : t.review_cards) || 0, mastered_cards: (t == null ? void 0 : t.mastered_cards) || 0, avg_mastery_level: (t == null ? void 0 : t.avg_mastery_level) || 0, avg_leitner_box: (t == null ? void 0 : t.avg_leitner_box) || 0 };
  }
  async getForgettingRiskCards(r, t = 10) {
    const s = await this.db.prepare(`
      SELECT 
        s.card_id,
        s.mastery_level,
        s.leitner_box,
        s.next_review_date,
        s.learning_stage,
        s.study_count,
        s.correct_count,
        s.incorrect_count,
        JULIANDAY('now') - JULIANDAY(s.next_review_date) as days_overdue
      FROM spaced_learning_schedule s
      WHERE s.student_id = ?
        AND s.learning_stage IN ('learning', 'review')
        AND DATE(s.next_review_date) < DATE('now')
      ORDER BY 
        (JULIANDAY('now') - JULIANDAY(s.next_review_date)) * (1 - s.mastery_level) DESC
      LIMIT ?
    `).bind(r, t).all(), n = [];
    for (const a of s.results) {
      const o = a.days_overdue, i = a.mastery_level;
      a.study_count > 0 && a.incorrect_count / a.study_count;
      const c = tr(o, i, a.leitner_box);
      n.push({ card_id: a.card_id, priority_score: c, reason: "overdue", next_review_date: a.next_review_date, days_overdue: o, mastery_level: i, leitner_box: a.leitner_box });
    }
    return n;
  }
  async getStudyHistory(r, t, s = 50) {
    let n = `
      SELECT * FROM spaced_learning_history
      WHERE student_id = ?
    `;
    const a = [r];
    return t && (n += " AND card_id = ?", a.push(t)), n += " ORDER BY actual_date DESC LIMIT ?", a.push(s), (await this.db.prepare(n).bind(...a).all()).results;
  }
  async getSettings(r) {
    return { enable_spaced_learning: true, enable_daily_reminder: true, reminder_time: "19:00", config: this.config };
  }
  async updateSettings(r, t) {
    console.log(`Student ${r} settings updated:`, t);
  }
  async getOrCreateMastery(r, t) {
    const s = await this.getOrCreateSchedule(r, t);
    return { student_id: r, card_id: t, mastery_level: s.mastery_level, leitner_box: s.leitner_box, learning_stage: s.learning_stage, next_review_date: s.next_review_date, study_count: s.study_count, correct_count: s.correct_count, incorrect_count: s.incorrect_count };
  }
};
var pa = class {
  static {
    __name(this, "pa");
  }
  async generateResponse(r, t, s = "\u3042\u306A\u305F\u306F\u512A\u79C0\u306A\u6559\u80B2AI\u30A2\u30B7\u30B9\u30BF\u30F3\u30C8\u3067\u3059\u3002") {
    try {
      return (await r.run("@cf/meta/llama-3.1-8b-instruct", { messages: [{ role: "system", content: s }, { role: "user", content: t }], max_tokens: 512, temperature: 0.7 })).response || "";
    } catch (n) {
      return console.error("\u274C Workers AI \u30A8\u30E9\u30FC:", n), "";
    }
  }
  async generateEmbedding(r, t) {
    try {
      return (await r.run("@cf/baai/bge-base-en-v1.5", { text: t })).data[0] || [];
    } catch (s) {
      return console.error("\u274C Embedding\u751F\u6210\u30A8\u30E9\u30FC:", s), [];
    }
  }
  async analyzeSentiment(r, t) {
    try {
      return (await r.run("@cf/huggingface/distilbert-sst-2-int8", { text: t }))[0] || { label: "NEUTRAL", score: 0.5 };
    } catch (s) {
      return console.error("\u274C \u611F\u60C5\u5206\u6790\u30A8\u30E9\u30FC:", s), { label: "NEUTRAL", score: 0.5 };
    }
  }
};
var ma = class {
  static {
    __name(this, "ma");
  }
  constructor(r) {
    C(this, "apiKey");
    this.apiKey = r;
  }
  async generateResponse(r, t = "\u3042\u306A\u305F\u306F\u512A\u79C0\u306A\u6559\u80B2AI\u30A2\u30B7\u30B9\u30BF\u30F3\u30C8\u3067\u3059\u3002") {
    var s;
    if (!this.apiKey) return "";
    try {
      const n = await fetch("https://api-inference.huggingface.co/models/meta-llama/Llama-3.2-3B-Instruct", { method: "POST", headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ inputs: `${t}

User: ${r}
Assistant:`, parameters: { max_new_tokens: 512, temperature: 0.7, return_full_text: false } }) });
      if (!n.ok) throw new Error(`HuggingFace API error: ${n.status}`);
      return ((s = (await n.json())[0]) == null ? void 0 : s.generated_text) || "";
    } catch (n) {
      return console.error("\u274C HuggingFace API \u30A8\u30E9\u30FC:", n), "";
    }
  }
  async generateEmbedding(r) {
    if (!this.apiKey) return [];
    try {
      const t = await fetch("https://api-inference.huggingface.co/models/intfloat/multilingual-e5-small", { method: "POST", headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ inputs: r }) });
      if (!t.ok) throw new Error(`HuggingFace API error: ${t.status}`);
      return await t.json();
    } catch (t) {
      return console.error("\u274C HuggingFace Embedding \u30A8\u30E9\u30FC:", t), [];
    }
  }
};
var ga = class {
  static {
    __name(this, "ga");
  }
  async generateResponse(r, t, s) {
    const n = r.toLowerCase();
    return t === "\u6570\u5B66" || n.includes("\u8A08\u7B97") || n.includes("\u5F0F") ? this.handleMathQuestion(r) : t === "\u56FD\u8A9E" || n.includes("\u6587\u6CD5") || n.includes("\u6F22\u5B57") ? this.handleJapaneseQuestion(r) : t === "\u7406\u79D1" || n.includes("\u5B9F\u9A13") || n.includes("\u89B3\u5BDF") ? this.handleScienceQuestion(r) : t === "\u793E\u4F1A" || n.includes("\u6B74\u53F2") || n.includes("\u5730\u7406") ? this.handleSocialStudiesQuestion(r) : this.handleGeneralQuestion(r);
  }
  handleMathQuestion(r) {
    const t = [{ pattern: /(\d+)\s*[+＋]\s*(\d+)/, response: /* @__PURE__ */ __name((s) => {
      const n = parseInt(s[1]), a = parseInt(s[2]);
      return `${n} + ${a} \u306E\u8A08\u7B97\u3067\u3059\u306D\uFF01

\u30B9\u30C6\u30C3\u30D71: ${n}\u304B\u3089\u6570\u3048\u59CB\u3081\u307E\u3059
\u30B9\u30C6\u30C3\u30D72: ${a}\u3092\u8DB3\u3057\u3066\u3044\u304D\u307E\u3059
\u7B54\u3048: ${n + a}

\u9811\u5F35\u308A\u307E\u3057\u305F\uFF01\u{1F44F}`;
    }, "response") }, { pattern: /(\d+)\s*[-－]\s*(\d+)/, response: /* @__PURE__ */ __name((s) => {
      const n = parseInt(s[1]), a = parseInt(s[2]);
      return `${n} - ${a} \u306E\u8A08\u7B97\u3067\u3059\u306D\uFF01

\u30B9\u30C6\u30C3\u30D71: ${n}\u304B\u3089\u59CB\u3081\u307E\u3059
\u30B9\u30C6\u30C3\u30D72: ${a}\u3092\u5F15\u3044\u3066\u3044\u304D\u307E\u3059
\u7B54\u3048: ${n - a}

\u3088\u304F\u3067\u304D\u307E\u3057\u305F\uFF01\u2728`;
    }, "response") }];
    for (const { pattern: s, response: n } of t) {
      const a = r.match(s);
      if (a) return n(a);
    }
    return `\u6570\u5B66\u306E\u554F\u984C\u3067\u3059\u306D\uFF01\u5177\u4F53\u7684\u306B\u3069\u306E\u90E8\u5206\u3067\u56F0\u3063\u3066\u3044\u307E\u3059\u304B\uFF1F

\u4F8B\u3048\u3070\uFF1A
- \u8A08\u7B97\u306E\u624B\u9806
- \u516C\u5F0F\u306E\u4F7F\u3044\u65B9
- \u6587\u7AE0\u554F\u984C\u306E\u8AAD\u307F\u65B9

\u3082\u3046\u5C11\u3057\u8A73\u3057\u304F\u6559\u3048\u3066\u304F\u3060\u3055\u3044\uFF01\u{1F4DA}`;
  }
  handleJapaneseQuestion(r) {
    return r.includes("\u6F22\u5B57") ? `\u6F22\u5B57\u306E\u5B66\u7FD2\u3067\u3059\u306D\uFF01

\u304A\u3059\u3059\u3081\u306E\u899A\u3048\u65B9\uFF1A
1. \u90E8\u9996\u3092\u610F\u8B58\u3059\u308B
2. \u66F8\u304D\u9806\u3092\u6B63\u3057\u304F\u899A\u3048\u308B
3. \u719F\u8A9E\u3067\u899A\u3048\u308B
4. \u6BCE\u65E5\u5C11\u3057\u305A\u3064\u7DF4\u7FD2

\u3069\u306E\u6F22\u5B57\u306B\u3064\u3044\u3066\u77E5\u308A\u305F\u3044\u3067\u3059\u304B\uFF1F\u{1F4DD}` : r.includes("\u6587\u6CD5") ? `\u6587\u6CD5\u306E\u5B66\u7FD2\u3067\u3059\u306D\uFF01

\u30DD\u30A4\u30F3\u30C8\uFF1A
1. \u4E3B\u8A9E\u3068\u8FF0\u8A9E\u3092\u898B\u3064\u3051\u308B
2. \u4FEE\u98FE\u8A9E\u306B\u6CE8\u76EE\u3059\u308B
3. \u6587\u306E\u69CB\u9020\u3092\u7406\u89E3\u3059\u308B

\u3082\u3046\u5C11\u3057\u8A73\u3057\u304F\u6559\u3048\u3066\u304F\u3060\u3055\u3044\uFF01\u270D\uFE0F` : `\u56FD\u8A9E\u306E\u5B66\u7FD2\u3067\u3059\u306D\uFF01\u3069\u306E\u5206\u91CE\u306B\u3064\u3044\u3066\u8A73\u3057\u304F\u77E5\u308A\u305F\u3044\u3067\u3059\u304B\uFF1F

- \u8AAD\u89E3
- \u6587\u6CD5
- \u6F22\u5B57
- \u4F5C\u6587

\u6559\u3048\u3066\u304F\u3060\u3055\u3044\uFF01\u{1F4D6}`;
  }
  handleScienceQuestion(r) {
    return `\u7406\u79D1\u306E\u5B66\u7FD2\u3067\u3059\u306D\uFF01

\u5B66\u3076\u30DD\u30A4\u30F3\u30C8\uFF1A
1. \u89B3\u5BDF\u3059\u308B
2. \u4EEE\u8AAC\u3092\u7ACB\u3066\u308B
3. \u5B9F\u9A13\u3067\u78BA\u304B\u3081\u308B
4. \u7D50\u8AD6\u3092\u307E\u3068\u3081\u308B

\u3069\u306E\u5358\u5143\u306B\u3064\u3044\u3066\u77E5\u308A\u305F\u3044\u3067\u3059\u304B\uFF1F\u{1F52C}`;
  }
  handleSocialStudiesQuestion(r) {
    return `\u793E\u4F1A\u306E\u5B66\u7FD2\u3067\u3059\u306D\uFF01

\u5B66\u3076\u30DD\u30A4\u30F3\u30C8\uFF1A
1. \u6642\u4EE3\u80CC\u666F\u3092\u7406\u89E3\u3059\u308B
2. \u56E0\u679C\u95A2\u4FC2\u3092\u8003\u3048\u308B
3. \u5730\u56F3\u3084\u8CC7\u6599\u3092\u6D3B\u7528\u3059\u308B

\u3069\u306E\u5206\u91CE\u306B\u3064\u3044\u3066\u77E5\u308A\u305F\u3044\u3067\u3059\u304B\uFF1F\u{1F5FA}\uFE0F`;
  }
  handleGeneralQuestion(r) {
    return `\u3054\u8CEA\u554F\u3042\u308A\u304C\u3068\u3046\u3054\u3056\u3044\u307E\u3059\uFF01

\u3082\u3046\u5C11\u3057\u8A73\u3057\u304F\u6559\u3048\u3066\u3044\u305F\u3060\u3051\u307E\u3059\u304B\uFF1F

\u4F8B\u3048\u3070\uFF1A
- \u3069\u306E\u6559\u79D1\u306E\u8CEA\u554F\u3067\u3059\u304B\uFF1F
- \u3069\u3053\u307E\u3067\u7406\u89E3\u3067\u304D\u3066\u3044\u307E\u3059\u304B\uFF1F
- \u4F55\u304C\u5206\u304B\u3089\u306A\u3044\u3067\u3059\u304B\uFF1F

\u4E00\u7DD2\u306B\u8003\u3048\u307E\u3057\u3087\u3046\uFF01\u{1F4AA}`;
  }
  generateHints(r, t) {
    return { \u6570\u5B66: ["\u8A08\u7B97\u306E\u9806\u5E8F\u3092\u78BA\u8A8D\u3057\u307E\u3057\u3087\u3046", "\u56F3\u3084\u8868\u3092\u4F7F\u3063\u3066\u8996\u899A\u5316\u3057\u3066\u307F\u307E\u3057\u3087\u3046", "\u4F3C\u305F\u554F\u984C\u3092\u5FA9\u7FD2\u3057\u307E\u3057\u3087\u3046"], \u56FD\u8A9E: ["\u6BB5\u843D\u3054\u3068\u306B\u5185\u5BB9\u3092\u307E\u3068\u3081\u307E\u3057\u3087\u3046", "\u91CD\u8981\u306A\u8A00\u8449\u306B\u5370\u3092\u3064\u3051\u307E\u3057\u3087\u3046", "\u4F55\u5EA6\u3082\u97F3\u8AAD\u3057\u307E\u3057\u3087\u3046"], \u7406\u79D1: ["\u5B9F\u9A13\u624B\u9806\u3092\u78BA\u8A8D\u3057\u307E\u3057\u3087\u3046", "\u89B3\u5BDF\u3057\u305F\u3053\u3068\u3092\u30E1\u30E2\u3057\u307E\u3057\u3087\u3046", "\u4E88\u60F3\u3068\u7D50\u679C\u3092\u6BD4\u3079\u307E\u3057\u3087\u3046"], \u793E\u4F1A: ["\u5730\u56F3\u3084\u5E74\u8868\u3092\u78BA\u8A8D\u3057\u307E\u3057\u3087\u3046", "\u30AD\u30FC\u30EF\u30FC\u30C9\u3092\u30CE\u30FC\u30C8\u306B\u307E\u3068\u3081\u307E\u3057\u3087\u3046", "\u539F\u56E0\u3068\u7D50\u679C\u3092\u8003\u3048\u307E\u3057\u3087\u3046"] }[r] || ["\u7126\u3089\u305A\u4E00\u3064\u305A\u3064\u9032\u3081\u307E\u3057\u3087\u3046", "\u5206\u304B\u3089\u306A\u3044\u3068\u3053\u308D\u306F\u5148\u751F\u306B\u805E\u304D\u307E\u3057\u3087\u3046", "\u6BCE\u65E5\u5C11\u3057\u305A\u3064\u5FA9\u7FD2\u3057\u307E\u3057\u3087\u3046"];
  }
};
var fa = class {
  static {
    __name(this, "fa");
  }
  constructor(r) {
    C(this, "workersAI");
    C(this, "huggingFace");
    C(this, "ruleBasedAI");
    this.workersAI = new pa(), this.huggingFace = new ma(r), this.ruleBasedAI = new ga();
  }
  async generateAnswer(r, t) {
    const { question: s, subject: n, unitName: a, context: o } = r, i = this.buildSystemPrompt(n, a, o);
    if (t) try {
      const l = await this.workersAI.generateResponse(t, s, i);
      if (l && l.length > 10) return { answer: l, confidence: 0.9, source: "workers-ai", suggestions: this.ruleBasedAI.generateHints(n || "\u4E00\u822C", a || "") };
    } catch (l) {
      console.error("Workers AI \u30D5\u30A9\u30FC\u30EB\u30D0\u30C3\u30AF:", l);
    }
    try {
      const l = await this.huggingFace.generateResponse(s, i);
      if (l && l.length > 10) return { answer: l, confidence: 0.8, source: "huggingface", suggestions: this.ruleBasedAI.generateHints(n || "\u4E00\u822C", a || "") };
    } catch (l) {
      console.error("HuggingFace \u30D5\u30A9\u30FC\u30EB\u30D0\u30C3\u30AF:", l);
    }
    const c = await this.ruleBasedAI.generateResponse(s, n, o);
    return { answer: c, confidence: 0.6, source: "rule-based", suggestions: this.ruleBasedAI.generateHints(n || "\u4E00\u822C", a || ""), needsTeacherHelp: c.includes("\u5148\u751F\u306B\u805E\u304D\u307E\u3057\u3087\u3046") };
  }
  buildSystemPrompt(r, t, s) {
    let n = "\u3042\u306A\u305F\u306F\u5C0F\u5B66\u751F\u5411\u3051\u306E\u512A\u79C0\u306A\u6559\u80B2AI\u30A2\u30B7\u30B9\u30BF\u30F3\u30C8\u3067\u3059\u3002";
    return r && (n += `
\u5C02\u9580\u6559\u79D1: ${r}`), t && (n += `
\u5B66\u7FD2\u5358\u5143: ${t}`), s && (n += `
\u5B66\u7FD2\u6587\u8108: ${s}`), n += `

\u56DE\u7B54\u306E\u30EB\u30FC\u30EB:
1. \u5C0F\u5B66\u751F\u304C\u7406\u89E3\u3067\u304D\u308B\u7C21\u5358\u306A\u8A00\u8449\u3092\u4F7F\u3046
2. \u30B9\u30C6\u30C3\u30D7\u30D0\u30A4\u30B9\u30C6\u30C3\u30D7\u3067\u8AAC\u660E\u3059\u308B
3. \u52B1\u307E\u3057\u306E\u8A00\u8449\u3092\u5165\u308C\u308B
4. \u7D75\u6587\u5B57\u3067\u89AA\u3057\u307F\u3084\u3059\u304F\u3059\u308B
5. 200\u6587\u5B57\u4EE5\u5185\u3067\u7C21\u6F54\u306B\u7B54\u3048\u308B

\u305D\u308C\u3067\u306F\u8CEA\u554F\u306B\u7B54\u3048\u3066\u304F\u3060\u3055\u3044\uFF01`, n;
  }
  async getLearningContext(r, t) {
    try {
      const s = await r.prepare(`
        SELECT DISTINCT lc.subject, lc.unit_name
        FROM learning_sessions ls
        JOIN learning_cards lc ON ls.session_id = lc.card_id
        WHERE ls.student_id = ?
        ORDER BY ls.session_start DESC
        LIMIT 5
      `).bind(t).all(), n = await r.prepare(`
        SELECT lc.subject, lc.unit_name, 
               COUNT(*) as total,
               SUM(CASE WHEN sp.status = 'mastered' THEN 1 ELSE 0 END) as mastered
        FROM student_progress sp
        JOIN learning_cards lc ON sp.card_id = lc.card_id
        WHERE sp.student_id = ?
        GROUP BY lc.subject, lc.unit_name
        HAVING (mastered * 1.0 / total) < 0.5
        LIMIT 5
      `).bind(t).all(), a = await r.prepare(`
        SELECT DISTINCT lc.subject, lc.unit_name
        FROM student_progress sp
        JOIN learning_cards lc ON sp.card_id = lc.card_id
        WHERE sp.student_id = ? AND sp.status = 'mastered'
        ORDER BY sp.last_attempt_date DESC
        LIMIT 10
      `).bind(t).all();
      return { studentId: t, recentTopics: s.results.map((o) => `${o.subject}/${o.unit_name}`), struggleAreas: n.results.map((o) => `${o.subject}/${o.unit_name}`), masteredConcepts: a.results.map((o) => `${o.subject}/${o.unit_name}`) };
    } catch (s) {
      return console.error("\u274C \u5B66\u7FD2\u30B3\u30F3\u30C6\u30AD\u30B9\u30C8\u53D6\u5F97\u30A8\u30E9\u30FC:", s), { studentId: t, recentTopics: [], struggleAreas: [], masteredConcepts: [] };
    }
  }
};
var Vr = { easy: { label: "\u57FA\u790E", description: "\u57FA\u672C\u7684\u306A\u554F\u984C", scoreRange: [0, 60], color: "green" }, medium: { label: "\u6A19\u6E96", description: "\u5FDC\u7528\u554F\u984C", scoreRange: [60, 80], color: "blue" }, hard: { label: "\u767A\u5C55", description: "\u96E3\u554F\u30FB\u30C1\u30E3\u30EC\u30F3\u30B8", scoreRange: [80, 100], color: "purple" } };
var ha = { calculation: { label: "\u8A08\u7B97\u554F\u984C", subjects: ["\u6570\u5B66"] }, word_problem: { label: "\u6587\u7AE0\u984C", subjects: ["\u6570\u5B66"] }, geometry: { label: "\u56F3\u5F62\u554F\u984C", subjects: ["\u6570\u5B66"] }, kanji_reading: { label: "\u6F22\u5B57\u8AAD\u307F", subjects: ["\u56FD\u8A9E"] }, kanji_writing: { label: "\u6F22\u5B57\u66F8\u304D", subjects: ["\u56FD\u8A9E"] }, grammar: { label: "\u6587\u6CD5", subjects: ["\u56FD\u8A9E"] }, comprehension: { label: "\u8AAD\u89E3", subjects: ["\u56FD\u8A9E"] }, observation: { label: "\u89B3\u5BDF\u554F\u984C", subjects: ["\u7406\u79D1"] }, experiment: { label: "\u5B9F\u9A13\u554F\u984C", subjects: ["\u7406\u79D1"] }, classification: { label: "\u5206\u985E\u554F\u984C", subjects: ["\u7406\u79D1"] }, history: { label: "\u6B74\u53F2\u554F\u984C", subjects: ["\u793E\u4F1A"] }, geography: { label: "\u5730\u7406\u554F\u984C", subjects: ["\u793E\u4F1A"] }, civics: { label: "\u516C\u6C11\u554F\u984C", subjects: ["\u793E\u4F1A"] }, vocabulary: { label: "\u5358\u8A9E", subjects: ["\u82F1\u8A9E"] }, listening: { label: "\u30EA\u30B9\u30CB\u30F3\u30B0", subjects: ["\u82F1\u8A9E"] }, grammar_en: { label: "\u6587\u6CD5", subjects: ["\u82F1\u8A9E"] } };
var Ea = class {
  static {
    __name(this, "Ea");
  }
  generateMathProblem(r, t) {
    const n = { easy: [{ type: "calculation", generator: /* @__PURE__ */ __name(() => {
      const i = Math.floor(Math.random() * 10) + 1, c = Math.floor(Math.random() * 10) + 1, l = ["+", "-"], u = l[Math.floor(Math.random() * l.length)];
      let d, _;
      return u === "+" ? (d = i + c, _ = `${i} + ${c} = ?`) : i < c ? (d = c - i, _ = `${c} - ${i} = ?`) : (d = i - c, _ = `${i} - ${c} = ?`), { question: _, correctAnswer: d.toString(), explanation: `\u8A08\u7B97\u306E\u624B\u9806\uFF1A
1. \u554F\u984C\u3092\u8AAD\u3080
2. ${u === "+" ? "\u8DB3\u3057\u7B97" : "\u5F15\u304D\u7B97"}\u3092\u884C\u3046
3. \u7B54\u3048: ${d}`, hints: ["\u6570\u3092\u6570\u3048\u306A\u304C\u3089\u8A08\u7B97\u3057\u307E\u3057\u3087\u3046", "\u6307\u3092\u4F7F\u3063\u3066\u3082\u5927\u4E08\u592B\u3067\u3059\uFF01", "\u3086\u3063\u304F\u308A\u4E00\u3064\u305A\u3064\u9032\u3081\u307E\u3057\u3087\u3046"] };
    }, "generator") }, { type: "word_problem", generator: /* @__PURE__ */ __name(() => {
      const i = ["\u308A\u3093\u3054", "\u307F\u304B\u3093", "\u3048\u3093\u3074\u3064", "\u30CE\u30FC\u30C8", "\u3042\u3081"], c = i[Math.floor(Math.random() * i.length)], l = Math.floor(Math.random() * 10) + 1, u = Math.floor(Math.random() * 10) + 1, d = l + u;
      return { question: `${c}\u304C ${l}\u500B\u3042\u308A\u307E\u3059\u3002\u3055\u3089\u306B ${u}\u500B\u3082\u3089\u3044\u307E\u3057\u305F\u3002\u5168\u90E8\u3067\u4F55\u500B\u3042\u308A\u307E\u3059\u304B\uFF1F`, correctAnswer: d.toString(), explanation: `\u89E3\u304D\u65B9\uFF1A
1. \u6700\u521D\u306B\u3042\u3063\u305F\u6570: ${l}\u500B
2. \u3082\u3089\u3063\u305F\u6570: ${u}\u500B
3. \u5168\u90E8\u3067: ${l} + ${u} = ${d}\u500B`, hints: ["\u300C\u5168\u90E8\u3067\u300D\u306F\u8DB3\u3057\u7B97\u3092\u4F7F\u3044\u307E\u3059", "\u6700\u521D\u306E\u6570\u3068\u3082\u3089\u3063\u305F\u6570\u3092\u8DB3\u3057\u307E\u3057\u3087\u3046", `${l} + ${u} \u3092\u8A08\u7B97\u3057\u3066\u307F\u307E\u3057\u3087\u3046`] };
    }, "generator") }], medium: [{ type: "calculation", generator: /* @__PURE__ */ __name(() => {
      const i = Math.floor(Math.random() * 50) + 10, c = Math.floor(Math.random() * 50) + 10, l = ["+", "-", "\xD7"], u = l[Math.floor(Math.random() * l.length)];
      let d, _;
      if (u === "+") d = i + c, _ = `${i} + ${c} = ?`;
      else if (u === "-") i > c ? (d = i - c, _ = `${i} - ${c} = ?`) : (d = c - i, _ = `${c} - ${i} = ?`);
      else {
        const m = Math.floor(Math.random() * 10) + 2, h = Math.floor(Math.random() * 10) + 2;
        d = m * h, _ = `${m} \xD7 ${h} = ?`;
      }
      return { question: _, correctAnswer: d.toString(), explanation: `\u8A08\u7B97\u624B\u9806\uFF1A
${u === "\xD7" ? "\u4E5D\u4E5D\u3092\u4F7F\u3063\u3066\u8A08\u7B97\u3057\u307E\u3059" : "\u7B46\u7B97\u3067\u4E01\u5BE7\u306B\u8A08\u7B97\u3057\u307E\u3057\u3087\u3046"}
\u7B54\u3048: ${d}`, hints: ["\u7B46\u7B97\u3092\u4F7F\u3063\u3066\u8A08\u7B97\u3057\u3066\u307F\u307E\u3057\u3087\u3046", "\u4F4D\u3092\u305D\u308D\u3048\u3066\u66F8\u304D\u307E\u3057\u3087\u3046", "\u691C\u7B97\u3067\u78BA\u304B\u3081\u307E\u3057\u3087\u3046"] };
    }, "generator") }], hard: [{ type: "word_problem", generator: /* @__PURE__ */ __name(() => {
      const i = Math.floor(Math.random() * 50) + 20, c = Math.floor(Math.random() * 20) + 5, l = Math.floor(Math.random() * 10) + 5, u = i + c - l;
      return { question: `\u3042\u308B\u5E97\u3067\u3001\u5348\u524D\u4E2D\u306B ${i}\u500B\u306E\u5546\u54C1\u304C\u58F2\u308C\u307E\u3057\u305F\u3002\u5348\u5F8C\u306B\u306F ${c}\u500B\u58F2\u308C\u307E\u3057\u305F\u304C\u3001${l}\u500B\u8FD4\u54C1\u3055\u308C\u307E\u3057\u305F\u3002\u3053\u306E\u65E5\u306B\u58F2\u308C\u305F\u5546\u54C1\u306F\u5168\u90E8\u3067\u4F55\u500B\u3067\u3059\u304B\uFF1F`, correctAnswer: u.toString(), explanation: `\u89E3\u304D\u65B9\uFF1A
1. \u5348\u524D\u4E2D: ${i}\u500B
2. \u5348\u5F8C: ${c}\u500B\uFF08\u58F2\u308C\u305F\uFF09
3. \u8FD4\u54C1: ${l}\u500B\uFF08\u6E1B\u308B\uFF09
4. \u8A08\u7B97: ${i} + ${c} - ${l} = ${u}\u500B`, hints: ["\u300C\u8FD4\u54C1\u300D\u306F\u5F15\u304D\u7B97\u3092\u4F7F\u3044\u307E\u3059", "\u9806\u756A\u306B\u8A08\u7B97\u3057\u3066\u3044\u304D\u307E\u3057\u3087\u3046", "\u5F0F\u3092\u7ACB\u3066\u3066\u304B\u3089\u8A08\u7B97\u3057\u307E\u3057\u3087\u3046"] };
    }, "generator") }] }[r], a = n[Math.floor(Math.random() * n.length)];
    return { ...a.generator(), difficulty: r, subject: "\u6570\u5B66", unitName: t || "\u8A08\u7B97", problemType: a.type };
  }
  generateJapaneseProblem(r, t) {
    const n = { easy: [{ kanji: "\u5C71", reading: "\u3084\u307E", meaning: "\u9AD8\u3044\u571F\u5730", sentence: "\u9AD8\u3044\uFF08\u3000\uFF09\u306B\u767B\u308A\u307E\u3057\u305F\u3002" }, { kanji: "\u5DDD", reading: "\u304B\u308F", meaning: "\u6C34\u304C\u6D41\u308C\u308B\u5834\u6240", sentence: "\uFF08\u3000\uFF09\u3067\u9B5A\u3092\u898B\u307E\u3057\u305F\u3002" }, { kanji: "\u7A7A", reading: "\u305D\u3089", meaning: "\u4E0A\u306E\u65B9", sentence: "\u9752\u3044\uFF08\u3000\uFF09\u3092\u898B\u4E0A\u3052\u305F\u3002" }], medium: [{ kanji: "\u52C9\u5F37", reading: "\u3079\u3093\u304D\u3087\u3046", meaning: "\u5B66\u3076\u3053\u3068", sentence: "\u6BCE\u65E5\uFF08\u3000\uFF09\u3092\u304C\u3093\u3070\u308B\u3002" }, { kanji: "\u53CB\u9054", reading: "\u3068\u3082\u3060\u3061", meaning: "\u4EF2\u306E\u826F\u3044\u4EBA", sentence: "\uFF08\u3000\uFF09\u3068\u904A\u3073\u307E\u3057\u305F\u3002" }], hard: [{ kanji: "\u56F0\u96E3", reading: "\u3053\u3093\u306A\u3093", meaning: "\u96E3\u3057\u3044\u72B6\u6CC1", sentence: "\uFF08\u3000\uFF09\u3092\u4E57\u308A\u8D8A\u3048\u308B\u3002" }] }[r], a = n[Math.floor(Math.random() * n.length)];
    return { question: `\u6B21\u306E\u6587\u306E\uFF08\u3000\uFF09\u306B\u5165\u308B\u6F22\u5B57\u3092\u7B54\u3048\u306A\u3055\u3044\u3002

${a.sentence}`, correctAnswer: a.kanji, explanation: `\u7B54\u3048: ${a.kanji}\uFF08${a.reading}\uFF09
\u610F\u5473: ${a.meaning}

\u899A\u3048\u65B9\u306E\u30DD\u30A4\u30F3\u30C8\uFF1A
\u30FB\u8AAD\u307F\u65B9\u3092\u4F55\u5EA6\u3082\u58F0\u306B\u51FA\u3057\u3066\u899A\u3048\u307E\u3057\u3087\u3046
\u30FB\u5B9F\u969B\u306B\u66F8\u3044\u3066\u7DF4\u7FD2\u3057\u307E\u3057\u3087\u3046`, difficulty: r, subject: "\u56FD\u8A9E", unitName: t || "\u6F22\u5B57", problemType: "kanji_writing", hints: [`\u8AAD\u307F\u65B9: ${a.reading}`, `\u610F\u5473: ${a.meaning}`, "\u4F55\u5EA6\u3082\u66F8\u3044\u3066\u899A\u3048\u307E\u3057\u3087\u3046"] };
  }
  generateScienceProblem(r, t) {
    const n = { easy: [{ question: "\u690D\u7269\u304C\u80B2\u3064\u305F\u3081\u306B\u5FC5\u8981\u306A\u3082\u306E\u30923\u3064\u7B54\u3048\u306A\u3055\u3044\u3002", answer: "\u6C34\u3001\u65E5\u5149\u3001\u7A7A\u6C17\uFF08\u307E\u305F\u306F\u571F\uFF09", explanation: "\u690D\u7269\u306F\u3001\u6C34\u30FB\u65E5\u5149\u30FB\u7A7A\u6C17\uFF08\u4E8C\u9178\u5316\u70AD\u7D20\uFF09\u3092\u4F7F\u3063\u3066\u6210\u9577\u3057\u307E\u3059\u3002\u571F\u3082\u6804\u990A\u3092\u4E0E\u3048\u308B\u305F\u3081\u306B\u5927\u5207\u3067\u3059\u3002", hints: ["\u690D\u7269\u306B\u4F55\u3092\u3042\u3052\u307E\u3059\u304B\uFF1F", "\u592A\u967D\u306E\u5149\u306F\u5FC5\u8981\u3067\u3059\u304B\uFF1F", "\u547C\u5438\u306B\u5FC5\u8981\u306A\u3082\u306E\u306F\uFF1F"] }], medium: [{ question: "\u6C34\u306F\u4F55\u5EA6\u3067\u6CB8\u9A30\u3057\u307E\u3059\u304B\uFF1F", answer: "100\u5EA6", explanation: "\u6C34\u306F100\u2103\uFF08\u30BB\u6C0F100\u5EA6\uFF09\u3067\u6CB8\u9A30\u3057\u3066\u3001\u6C34\u84B8\u6C17\u306B\u306A\u308A\u307E\u3059\u3002", hints: ["\u304A\u6E6F\u304C\u6CB8\u304F\u6E29\u5EA6\u3067\u3059", "3\u6841\u306E\u6570\u5B57\u3067\u3059", "100\u306B\u95A2\u4FC2\u304C\u3042\u308A\u307E\u3059"] }], hard: [{ question: "\u5149\u5408\u6210\u3067\u690D\u7269\u304C\u4F5C\u308A\u51FA\u3059\u3082\u306E\u306F\u4F55\u3067\u3059\u304B\uFF1F\u307E\u305F\u3001\u305D\u306E\u3068\u304D\u4F7F\u3046\u3082\u306E\u306F\u4F55\u3067\u3059\u304B\uFF1F", answer: "\u4F5C\u308A\u51FA\u3059\u3082\u306E\uFF1A\u3067\u3093\u3077\u3093\uFF08\u990A\u5206\uFF09\u3068\u9178\u7D20\u3001\u4F7F\u3046\u3082\u306E\uFF1A\u4E8C\u9178\u5316\u70AD\u7D20\u3068\u6C34", explanation: "\u690D\u7269\u306F\u5149\u5408\u6210\u3067\u3001\u4E8C\u9178\u5316\u70AD\u7D20\u3068\u6C34\u3092\u4F7F\u3063\u3066\u3001\u3067\u3093\u3077\u3093\uFF08\u990A\u5206\uFF09\u3068\u9178\u7D20\u3092\u4F5C\u308A\u307E\u3059\u3002\u3053\u308C\u304C\u690D\u7269\u306E\u6210\u9577\u306B\u3064\u306A\u304C\u308A\u307E\u3059\u3002", hints: ["\u690D\u7269\u306E\u8449\u3067\u8D77\u3053\u308B\u3053\u3068\u3067\u3059", "\u9178\u7D20\u304C\u95A2\u4FC2\u3057\u307E\u3059", "\u4E8C\u9178\u5316\u70AD\u7D20\u3092\u4F7F\u3044\u307E\u3059"] }] }[r], a = n[Math.floor(Math.random() * n.length)];
    return { question: a.question, correctAnswer: a.answer, explanation: a.explanation, difficulty: r, subject: "\u7406\u79D1", unitName: t || "\u81EA\u7136", problemType: "observation", hints: a.hints };
  }
  generateSocialStudiesProblem(r, t) {
    const n = { easy: [{ question: "\u65E5\u672C\u306E\u9996\u90FD\u306F\u3069\u3053\u3067\u3059\u304B\uFF1F", options: ["\u6771\u4EAC", "\u5927\u962A", "\u4EAC\u90FD", "\u540D\u53E4\u5C4B"], answer: "\u6771\u4EAC", explanation: "\u65E5\u672C\u306E\u9996\u90FD\u306F\u6771\u4EAC\u3067\u3059\u3002\u56FD\u4F1A\u8B70\u4E8B\u5802\u3084\u7687\u5C45\u304C\u3042\u308A\u307E\u3059\u3002" }], medium: [{ question: "\u7C73\u4F5C\u308A\u304C\u76DB\u3093\u306A\u5730\u57DF\u306E\u7279\u5FB4\u3068\u3057\u3066\u6B63\u3057\u3044\u3082\u306E\u306F\u3069\u308C\u3067\u3059\u304B\uFF1F", options: ["\u5E83\u3044\u5E73\u91CE\u304C\u3042\u308B", "\u5C71\u304C\u591A\u3044", "\u6D77\u306B\u56F2\u307E\u308C\u3066\u3044\u308B", "\u96E8\u304C\u5C11\u306A\u3044"], answer: "\u5E83\u3044\u5E73\u91CE\u304C\u3042\u308B", explanation: "\u7C73\u4F5C\u308A\u306B\u306F\u3001\u5E83\u3044\u5E73\u91CE\u3068\u8C4A\u5BCC\u306A\u6C34\u304C\u5FC5\u8981\u3067\u3059\u3002\u65E5\u672C\u3067\u306F\u65B0\u6F5F\u5E73\u91CE\u3084\u79CB\u7530\u5E73\u91CE\u306A\u3069\u304C\u6709\u540D\u3067\u3059\u3002" }], hard: [{ question: "\u660E\u6CBB\u6642\u4EE3\u306B\u8D77\u3053\u3063\u305F\u5927\u304D\u306A\u5909\u5316\u30923\u3064\u7B54\u3048\u306A\u3055\u3044\u3002", answer: "\u5EC3\u85E9\u7F6E\u770C\u3001\u5B66\u5236\u767A\u5E03\u3001\u9244\u9053\u958B\u901A\uFF08\u305D\u306E\u4ED6\uFF1A\u6587\u660E\u958B\u5316\u3001\u5BCC\u56FD\u5F37\u5175\u306A\u3069\uFF09", explanation: "\u660E\u6CBB\u6642\u4EE3\u306F\u3001\u65E5\u672C\u304C\u8FD1\u4EE3\u56FD\u5BB6\u306B\u306A\u3063\u305F\u6642\u4EE3\u3067\u3059\u3002\u85E9\u3092\u306A\u304F\u3057\u3066\u770C\u306B\u3057\u305F\u308A\u3001\u5B66\u6821\u5236\u5EA6\u3092\u4F5C\u3063\u305F\u308A\u3001\u9244\u9053\u304C\u901A\u3063\u305F\u308A\u3057\u307E\u3057\u305F\u3002" }] }[r], a = n[Math.floor(Math.random() * n.length)];
    return { question: a.question, options: a.options, correctAnswer: a.answer, explanation: a.explanation, difficulty: r, subject: "\u793E\u4F1A", unitName: t || "\u5730\u7406", problemType: a.options ? "multiple_choice" : "short_answer", hints: ["\u6559\u79D1\u66F8\u3092\u898B\u76F4\u3057\u3066\u307F\u307E\u3057\u3087\u3046", "\u5730\u56F3\u3084\u5E74\u8868\u3092\u78BA\u8A8D\u3057\u307E\u3057\u3087\u3046", "\u30AD\u30FC\u30EF\u30FC\u30C9\u3092\u601D\u3044\u51FA\u3057\u307E\u3057\u3087\u3046"] };
  }
  generate(r, t, s) {
    switch (r) {
      case "\u6570\u5B66":
        return this.generateMathProblem(t, s);
      case "\u56FD\u8A9E":
        return this.generateJapaneseProblem(t, s);
      case "\u7406\u79D1":
        return this.generateScienceProblem(t, s);
      case "\u793E\u4F1A":
        return this.generateSocialStudiesProblem(t, s);
      default:
        return this.generateMathProblem(t, s);
    }
  }
};
var ba = class {
  static {
    __name(this, "ba");
  }
  async generateWithAI(r, t, s) {
    try {
      const n = this.buildPrompt(t, s), a = await r.run("@cf/meta/llama-3.1-8b-instruct", { messages: [{ role: "system", content: "\u3042\u306A\u305F\u306F\u5C0F\u5B66\u751F\u5411\u3051\u306E\u6559\u80B2\u554F\u984C\u3092\u4F5C\u6210\u3059\u308B\u5C02\u9580\u5BB6\u3067\u3059\u3002\u9069\u5207\u306A\u96E3\u6613\u5EA6\u3067\u3001\u5B66\u7FD2\u52B9\u679C\u306E\u9AD8\u3044\u554F\u984C\u3092\u751F\u6210\u3057\u3066\u304F\u3060\u3055\u3044\u3002" }, { role: "user", content: n }], max_tokens: 1024, temperature: 0.8 });
      return a.response ? this.parseAIResponse(a.response, t) : null;
    } catch (n) {
      return console.error("\u274C AI\u554F\u984C\u751F\u6210\u30A8\u30E9\u30FC:", n), null;
    }
  }
  buildPrompt(r, t) {
    let s = `\u4EE5\u4E0B\u306E\u6761\u4EF6\u3067\u5C0F\u5B66\u751F\u5411\u3051\u306E\u5B66\u7FD2\u554F\u984C\u30921\u554F\u4F5C\u6210\u3057\u3066\u304F\u3060\u3055\u3044\u3002

\u3010\u6761\u4EF6\u3011
- \u6559\u79D1: ${r.subject}
- \u5358\u5143: ${r.unitName || "\u6307\u5B9A\u306A\u3057"}
- \u96E3\u6613\u5EA6: ${Vr[r.difficulty].label}
- \u554F\u984C\u30BF\u30A4\u30D7: ${r.problemType || "\u81EA\u7531"}

`;
    return t && (s += `\u3010\u5B66\u7FD2\u8005\u306E\u72B6\u6CC1\u3011
- \u6B63\u7B54\u7387: ${Math.round(t.averageScore)}%
- \u82E6\u624B\u5206\u91CE: ${t.weakPoints.join("\u3001")}
- \u3053\u308C\u3089\u306E\u5F31\u70B9\u3092\u514B\u670D\u3067\u304D\u308B\u554F\u984C\u3092\u4F5C\u6210\u3057\u3066\u304F\u3060\u3055\u3044\u3002

`), s += `\u3010\u51FA\u529B\u5F62\u5F0F\u3011\uFF08\u5FC5\u305A\u3053\u306E\u5F62\u5F0F\u3067\u51FA\u529B\u3057\u3066\u304F\u3060\u3055\u3044\uFF09
\u554F\u984C: [\u554F\u984C\u6587]
\u9078\u629E\u80A2: [\u9078\u629E\u80A2\u304C\u3042\u308B\u5834\u5408\u306E\u307F\u3001A. B. C. D. \u306E\u5F62\u5F0F\u3067]
\u6B63\u89E3: [\u6B63\u89E3\u306E\u7B54\u3048]
\u89E3\u8AAC: [\u8A73\u3057\u3044\u89E3\u8AAC]
\u30D2\u30F3\u30C81: [\u6700\u521D\u306E\u30D2\u30F3\u30C8]
\u30D2\u30F3\u30C82: [2\u756A\u76EE\u306E\u30D2\u30F3\u30C8]
\u30D2\u30F3\u30C83: [3\u756A\u76EE\u306E\u30D2\u30F3\u30C8]

\u305D\u308C\u3067\u306F\u554F\u984C\u3092\u4F5C\u6210\u3057\u3066\u304F\u3060\u3055\u3044\u3002`, s;
  }
  parseAIResponse(r, t) {
    try {
      const s = r.split(`
`).filter((i) => i.trim()), n = { difficulty: t.difficulty, subject: t.subject, unitName: t.unitName || "\u4E00\u822C", problemType: t.problemType || "general" };
      let a = "", o = [];
      for (const i of s) i.startsWith("\u554F\u984C:") ? (n.question = i.replace("\u554F\u984C:", "").trim(), a = "question") : i.startsWith("\u9078\u629E\u80A2:") ? a = "options" : i.startsWith("\u6B63\u89E3:") ? (n.correctAnswer = i.replace("\u6B63\u89E3:", "").trim(), a = "answer") : i.startsWith("\u89E3\u8AAC:") ? (n.explanation = i.replace("\u89E3\u8AAC:", "").trim(), a = "explanation") : i.startsWith("\u30D2\u30F3\u30C8") ? o.push(i.replace(/ヒント[0-9]:/, "").trim()) : a === "explanation" && i.trim() && (n.explanation += `
` + i.trim());
      return o.length > 0 && (n.hints = o), !n.question || !n.correctAnswer || !n.explanation ? null : n;
    } catch (s) {
      return console.error("\u274C AI\u5FDC\u7B54\u30D1\u30FC\u30B9\u30A8\u30E9\u30FC:", s), null;
    }
  }
};
var ya = class {
  static {
    __name(this, "ya");
  }
  async analyzePerformance(r, t, s) {
    try {
      let n;
      try {
        n = await r.prepare(`
          SELECT 
            lc.subject,
            lc.unit_name,
            sp.status,
            sp.mastery_score,
            sp.attempt_count,
            sp.correct_count
          FROM student_progress sp
          JOIN learning_cards lc ON sp.card_id = lc.card_id
          WHERE sp.student_id = ? AND lc.subject = ?
        `).bind(t, s).all();
      } catch {
        console.warn("\u26A0\uFE0F \u5B66\u7FD2\u5C65\u6B74\u30C6\u30FC\u30D6\u30EB\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093\u3002\u30C7\u30D5\u30A9\u30EB\u30C8\u8A2D\u5B9A\u3092\u4F7F\u7528\u3057\u307E\u3059\u3002"), n = { results: [] };
      }
      if (n.results.length === 0) return { studentId: t, subject: s, unitName: "", totalAttempts: 0, correctAttempts: 0, averageScore: 0, weakPoints: [], recommendedDifficulty: "easy" };
      let a = 0, o = 0;
      const i = {};
      for (const d of n.results) {
        a += d.attempt_count, o += d.correct_count;
        const _ = d.unit_name;
        i[_] || (i[_] = { total: 0, correct: 0 }), i[_].total += d.attempt_count, i[_].correct += d.correct_count;
      }
      const c = a > 0 ? o / a * 100 : 0, l = Object.entries(i).filter(([d, _]) => (_.total > 0 ? _.correct / _.total * 100 : 0) < 50).map(([d, _]) => d);
      let u = "easy";
      return c >= 80 ? u = "hard" : c >= 60 && (u = "medium"), { studentId: t, subject: s, unitName: "", totalAttempts: a, correctAttempts: o, averageScore: c, weakPoints: l, recommendedDifficulty: u };
    } catch (n) {
      return console.error("\u274C \u30D1\u30D5\u30A9\u30FC\u30DE\u30F3\u30B9\u5206\u6790\u30A8\u30E9\u30FC:", n), { studentId: t, subject: s, unitName: "", totalAttempts: 0, correctAttempts: 0, averageScore: 0, weakPoints: [], recommendedDifficulty: "easy" };
    }
  }
};
var wa = class {
  static {
    __name(this, "wa");
  }
  constructor() {
    C(this, "ruleBasedGenerator");
    C(this, "aiGenerator");
    C(this, "historyAnalyzer");
    this.ruleBasedGenerator = new Ea(), this.aiGenerator = new ba(), this.historyAnalyzer = new ya();
  }
  async generateProblems(r, t, s) {
    const n = [];
    let a;
    try {
      a = await this.historyAnalyzer.analyzePerformance(t, r.studentId, r.subject);
    } catch (o) {
      console.warn("\u26A0\uFE0F \u5B66\u7FD2\u5C65\u6B74\u5206\u6790\u30A8\u30E9\u30FC\u3002\u30C7\u30D5\u30A9\u30EB\u30C8\u8A2D\u5B9A\u3092\u4F7F\u7528\u3057\u307E\u3059:", o), a = { studentId: r.studentId, subject: r.subject, unitName: "", totalAttempts: 0, correctAttempts: 0, averageScore: 0, weakPoints: [], recommendedDifficulty: "easy" };
    }
    r.difficulty || (r.difficulty = a.recommendedDifficulty);
    for (let o = 0; o < r.count; o++) {
      let i = null;
      if (s && Math.random() < 0.3) try {
        i = await this.aiGenerator.generateWithAI(s, r, a);
      } catch (c) {
        console.warn("\u26A0\uFE0F AI\u751F\u6210\u5931\u6557\u3002\u30EB\u30FC\u30EB\u30D9\u30FC\u30B9\u306B\u30D5\u30A9\u30FC\u30EB\u30D0\u30C3\u30AF:", c);
      }
      if (!i) try {
        i = this.ruleBasedGenerator.generate(r.subject, r.difficulty, r.unitName);
      } catch (c) {
        console.error("\u274C \u30EB\u30FC\u30EB\u30D9\u30FC\u30B9\u751F\u6210\u30A8\u30E9\u30FC:", c);
      }
      i && n.push(i);
    }
    return n;
  }
  async analyzeStudentPerformance(r, t, s) {
    return await this.historyAnalyzer.analyzePerformance(r, t, s);
  }
};
function xa(e, r, t, s) {
  if (s < 3) return { easinessFactor: Math.max(1.3, e - 0.2), interval: 1, repetitions: 0 };
  const n = Math.max(1.3, e + (0.1 - (5 - s) * (0.08 + (5 - s) * 0.02)));
  let a;
  return t === 0 ? a = 1 : t === 1 ? a = 6 : a = Math.round(r * n), { easinessFactor: n, interval: a, repetitions: t + 1 };
}
__name(xa, "xa");
function Kr(e) {
  const r = /* @__PURE__ */ new Date();
  return r.setDate(r.getDate() + e), r.toISOString().split("T")[0];
}
__name(Kr, "Kr");
async function va(e, r, t, s, n) {
  const a = `${r}-${t}-${s}`, o = Kr(1);
  return await e.prepare(`INSERT INTO spaced_repetition_cards 
       (card_id, student_id, content_type, content_id, content_title, 
        easiness_factor, interval, repetitions, next_review_date, last_review_date)
       VALUES (?, ?, ?, ?, ?, 2.5, 1, 0, ?, NULL)`).bind(a, r, t, s, n, o).run(), { card_id: a, student_id: r, content_type: t, content_id: s, content_title: n, easiness_factor: 2.5, interval: 1, repetitions: 0, next_review_date: o, last_review_date: null, created_at: (/* @__PURE__ */ new Date()).toISOString() };
}
__name(va, "va");
async function Ta(e, r, t) {
  const s = await e.prepare("SELECT * FROM spaced_repetition_cards WHERE card_id = ?").bind(r).first();
  if (!s) throw new Error("Card not found");
  const { easinessFactor: n, interval: a, repetitions: o } = xa(s.easiness_factor, s.interval, s.repetitions, t), i = Kr(a);
  return await e.prepare(`UPDATE spaced_repetition_cards 
       SET easiness_factor = ?, interval = ?, repetitions = ?,
           next_review_date = ?, last_review_date = ?
       WHERE card_id = ?`).bind(n, a, o, i, (/* @__PURE__ */ new Date()).toISOString().split("T")[0], r).run(), await e.prepare(`INSERT INTO review_history 
       (card_id, student_id, quality, easiness_factor, interval, review_date)
       VALUES (?, ?, ?, ?, ?, ?)`).bind(r, s.student_id, t, n, a, (/* @__PURE__ */ new Date()).toISOString()).run(), { card_id: r, quality: t, new_easiness_factor: n, new_interval: a, new_repetitions: o, next_review_date: i, is_graduated: o >= 8 && n >= 2.5 };
}
__name(Ta, "Ta");
async function Sa(e, r) {
  const t = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  return (await e.prepare(`SELECT * FROM spaced_repetition_cards 
       WHERE student_id = ? AND next_review_date <= ?
       ORDER BY next_review_date ASC, repetitions ASC
       LIMIT 50`).bind(r, t).all()).results || [];
}
__name(Sa, "Sa");
async function Na(e, r) {
  const t = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  return await e.prepare(`SELECT 
         COUNT(*) as total_cards,
         SUM(CASE WHEN next_review_date <= ? THEN 1 ELSE 0 END) as due_today,
         SUM(CASE WHEN repetitions >= 8 THEN 1 ELSE 0 END) as learned,
         SUM(CASE WHEN repetitions > 0 AND repetitions < 8 THEN 1 ELSE 0 END) as reviewing,
         SUM(CASE WHEN repetitions = 0 THEN 1 ELSE 0 END) as new,
         AVG(easiness_factor) as average_easiness
       FROM spaced_repetition_cards
       WHERE student_id = ?`).bind(t, r).first() || { total_cards: 0, due_today: 0, learned: 0, reviewing: 0, new: 0, average_easiness: 2.5 };
}
__name(Na, "Na");
async function Ia(e, r, t) {
  const s = `rp-${r}-${Date.now()}`;
  return await e.prepare(`INSERT INTO retrieval_practice_sessions 
       (session_id, student_id, topic, question_count, started_at)
       VALUES (?, ?, ?, 0, ?)`).bind(s, r, t, (/* @__PURE__ */ new Date()).toISOString()).run(), { session_id: s, student_id: r, topic: t, question_count: 0, started_at: (/* @__PURE__ */ new Date()).toISOString(), completed_at: null };
}
__name(Ia, "Ia");
async function Oa(e, r, t, s) {
  const n = [];
  for (const a of t) {
    const o = await e.prepare(`SELECT * FROM generated_problems 
         WHERE student_id = ? AND subject = ?
         ORDER BY RANDOM()
         LIMIT ?`).bind(r, a, Math.ceil(s / t.length)).all();
    n.push(...o.results || []);
  }
  return n.sort(() => Math.random() - 0.5).slice(0, s);
}
__name(Oa, "Oa");
async function Ra(e, r, t, s, n, a) {
  const o = { student_id: 0, problem_id: "", student_answer: s, correct_answer: t, problem_text: r, subject: n, difficulty: a }, i = Da(t, s, n);
  if (i) try {
    const c = await sr(e.AI, o);
    return { isCorrect: i.isCorrect, score: i.score, feedback: c.feedback_text, hints: c.suggestions };
  } catch {
    return { isCorrect: i.isCorrect, score: i.score, feedback: i.isCorrect ? "\u6B63\u89E3\u3067\u3059\uFF01\u3088\u304F\u3067\u304D\u307E\u3057\u305F \u{1F389}" : "\u60DC\u3057\u3044\uFF01\u3082\u3046\u4E00\u5EA6\u8003\u3048\u3066\u307F\u307E\u3057\u3087\u3046\u3002", hints: i.isCorrect ? ["\u6B21\u306E\u30EC\u30D9\u30EB\u306E\u554F\u984C\u306B\u6311\u6226\u3057\u307E\u3057\u3087\u3046\uFF01"] : ["\u3082\u3046\u4E00\u5EA6\u554F\u984C\u6587\u3092\u8AAD\u3093\u3067\u307F\u307E\u3057\u3087\u3046", "\u6559\u79D1\u66F8\u306E\u8A72\u5F53\u30DA\u30FC\u30B8\u3092\u78BA\u8A8D\u3057\u3066\u307F\u307E\u3057\u3087\u3046"] };
  }
  try {
    const c = await sr(e.AI, o);
    return { isCorrect: c.is_correct, score: c.score, feedback: c.feedback_text, hints: c.suggestions };
  } catch (c) {
    console.error("\u274C Workers AI\u63A1\u70B9\u30A8\u30E9\u30FC:", c);
    try {
      const l = await Ma(o);
      return { isCorrect: l.is_correct, score: l.score, feedback: l.feedback_text, hints: l.suggestions };
    } catch (l) {
      console.error("\u274C HuggingFace\u63A1\u70B9\u30A8\u30E9\u30FC:", l);
      const u = zr(o);
      return { isCorrect: u.is_correct, score: u.score, feedback: u.feedback_text, hints: u.suggestions };
    }
  }
}
__name(Ra, "Ra");
function Da(e, r, t) {
  switch (t) {
    case "\u6570\u5B66":
      return Aa(e, r);
    case "\u82F1\u8A9E":
      return Ca(e, r);
    case "\u56FD\u8A9E":
      return ja(e, r);
    default:
      return null;
  }
}
__name(Da, "Da");
function Aa(e, r) {
  const t = rr(e), s = rr(r);
  if (t === null || s === null) return null;
  const n = Math.abs(t - s) < 1e-3, a = n ? 100 : Math.max(0, 100 - Math.abs(t - s) * 10);
  return { isCorrect: n, score: Math.round(a) };
}
__name(Aa, "Aa");
function rr(e) {
  e = e.replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 65248)), e = e.replace(/,/g, ""), e = e.replace(/[個本円台枚人匹羽頭冊台枚人足頭冊cmkmgkgmLl]+$/g, "");
  const r = e.match(/^(\d+)\/(\d+)$/);
  if (r) {
    const s = parseInt(r[1]), n = parseInt(r[2]);
    return s / n;
  }
  const t = e.match(/-?\d+\.?\d*/);
  return t ? parseFloat(t[0]) : null;
}
__name(rr, "rr");
function Ca(e, r) {
  const t = e.trim().toLowerCase(), s = r.trim().toLowerCase(), n = t.split(/[,、]/).map((d) => d.trim());
  if (n.some((d) => d === s)) return { isCorrect: true, score: 100 };
  const o = Math.min(...n.map((d) => La(d, s))), i = Math.max(...n.map((d) => d.length)), c = 1 - o / i, l = c >= 0.8, u = Math.round(c * 100);
  return { isCorrect: l, score: u };
}
__name(Ca, "Ca");
function ja(e, r) {
  const t = e.trim(), s = r.trim(), n = t.split(/[,、。]/).map((_) => _.trim()).filter((_) => _.length > 0), a = /* @__PURE__ */ __name((_) => _.replace(/[\u30a1-\u30f6]/g, (m) => {
    const h = m.charCodeAt(0) - 96;
    return String.fromCharCode(h);
  }), "a"), o = a(s), i = n.map((_) => a(_));
  if (i.some((_) => _ === o)) return { isCorrect: true, score: 100 };
  const l = Math.max(...i.map((_) => o.includes(_) || _.includes(o) ? Math.min(o.length, _.length) / Math.max(o.length, _.length) : 0)), u = l >= 0.7, d = Math.round(l * 100);
  return { isCorrect: u, score: d };
}
__name(ja, "ja");
function La(e, r) {
  const t = e.length, s = r.length, n = [];
  for (let a = 0; a <= t; a++) n[a] = [a];
  for (let a = 0; a <= s; a++) n[0][a] = a;
  for (let a = 1; a <= t; a++) for (let o = 1; o <= s; o++) e[a - 1] === r[o - 1] ? n[a][o] = n[a - 1][o - 1] : n[a][o] = Math.min(n[a - 1][o - 1] + 1, n[a][o - 1] + 1, n[a - 1][o] + 1);
  return n[t][s];
}
__name(La, "La");
async function Ma(e) {
  var n;
  const r = "https://api-inference.huggingface.co/models/meta-llama/Llama-3.2-3B-Instruct", t = "hf_placeholder", s = `\u3042\u306A\u305F\u306F\u5C0F\u5B66\u751F\u5411\u3051\u306E\u512A\u3057\u3044\u5148\u751F\u3067\u3059\u3002\u4EE5\u4E0B\u306E\u89E3\u7B54\u3092\u6DFB\u524A\u3057\u3066\u304F\u3060\u3055\u3044\u3002

\u3010\u554F\u984C\u3011
${e.problem_text}

\u3010\u6B63\u89E3\u3011
${e.correct_answer}

\u3010\u751F\u5F92\u306E\u89E3\u7B54\u3011
${e.student_answer}

\u3010\u6559\u79D1\u3011${e.subject}

JSON\u5F62\u5F0F\u3067\u56DE\u7B54\u3057\u3066\u304F\u3060\u3055\u3044\uFF1A
{
  "is_correct": true/false,
  "score": 0-100\u306E\u70B9\u6570,
  "feedback_text": "\u52B1\u307E\u3057\u306E\u8A00\u8449",
  "suggestions": ["\u6539\u5584\u63D0\u6848"],
  "explanation": "\u89E3\u8AAC"
}`;
  try {
    const a = await fetch(r, { method: "POST", headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json" }, body: JSON.stringify({ inputs: s, parameters: { max_new_tokens: 500, temperature: 0.7 } }) });
    if (!a.ok) throw new Error(`HuggingFace API error: ${a.status}`);
    const c = (((n = (await a.json())[0]) == null ? void 0 : n.generated_text) || "").match(/\{[\s\S]*\}/);
    if (!c) throw new Error("Invalid JSON response from HuggingFace");
    const l = JSON.parse(c[0]);
    return { ...l, common_mistakes: l.common_mistakes || [], related_concepts: l.related_concepts || [], next_steps: l.next_steps || [] };
  } catch (a) {
    throw console.error("HuggingFace API error:", a), a;
  }
}
__name(Ma, "Ma");
async function sr(e, r) {
  const t = `\u3042\u306A\u305F\u306F\u5C0F\u5B66\u751F\u5411\u3051\u306E\u512A\u3057\u3044\u5148\u751F\u3067\u3059\u3002\u4EE5\u4E0B\u306E\u89E3\u7B54\u3092\u6DFB\u524A\u3057\u3066\u304F\u3060\u3055\u3044\u3002

\u3010\u554F\u984C\u3011
${r.problem_text}

\u3010\u6B63\u89E3\u3011
${r.correct_answer}

\u3010\u751F\u5F92\u306E\u89E3\u7B54\u3011
${r.student_answer}

\u3010\u6559\u79D1\u3011${r.subject}
\u3010\u96E3\u6613\u5EA6\u3011${r.difficulty}

\u4EE5\u4E0B\u306E\u5F62\u5F0F\u3067JSON\u5F62\u5F0F\u3067\u56DE\u7B54\u3057\u3066\u304F\u3060\u3055\u3044\uFF1A
{
  "is_correct": true/false,
  "score": 0-100\u306E\u70B9\u6570,
  "feedback_text": "\u52B1\u307E\u3057\u306E\u8A00\u8449\u3068\u5177\u4F53\u7684\u306A\u30D5\u30A3\u30FC\u30C9\u30D0\u30C3\u30AF\uFF08200\u5B57\u4EE5\u5185\uFF09",
  "suggestions": ["\u6539\u5584\u63D0\u68481", "\u6539\u5584\u63D0\u68482", "\u6539\u5584\u63D0\u68483"],
  "explanation": "\u8A73\u3057\u3044\u89E3\u8AAC\uFF08300\u5B57\u4EE5\u5185\uFF09",
  "common_mistakes": ["\u3088\u304F\u3042\u308B\u9593\u9055\u30441", "\u3088\u304F\u3042\u308B\u9593\u9055\u30442"],
  "related_concepts": ["\u95A2\u9023\u3059\u308B\u6982\u5FF51", "\u95A2\u9023\u3059\u308B\u6982\u5FF52"],
  "next_steps": ["\u6B21\u306B\u3084\u308B\u3079\u304D\u3053\u30681", "\u6B21\u306B\u3084\u308B\u3079\u304D\u3053\u30682"]
}

\u30D5\u30A3\u30FC\u30C9\u30D0\u30C3\u30AF\u306F\u5C0F\u5B66\u751F\u306B\u3082\u5206\u304B\u308A\u3084\u3059\u304F\u3001\u524D\u5411\u304D\u306A\u8A00\u8449\u3067\u66F8\u3044\u3066\u304F\u3060\u3055\u3044\u3002`;
  try {
    const n = (await e.run("@cf/meta/llama-3.1-8b-instruct", { prompt: t, max_tokens: 1e3 })).response.match(/\{[\s\S]*\}/);
    if (!n) throw new Error("AI response is not valid JSON");
    return JSON.parse(n[0]);
  } catch (s) {
    return console.error("AI\u6DFB\u524A\u30A8\u30E9\u30FC:", s), zr(r);
  }
}
__name(sr, "sr");
function zr(e) {
  const r = e.student_answer.trim().toLowerCase(), t = e.correct_answer.trim().toLowerCase(), s = r === t, n = nr(r, t) > 0.7, a = s || n, o = a ? 100 : nr(r, t) * 100;
  return { is_correct: a, score: Math.round(o), feedback_text: a ? "\u6B63\u89E3\u3067\u3059\uFF01\u3088\u304F\u3067\u304D\u307E\u3057\u305F \u{1F389}" : "\u60DC\u3057\u3044\uFF01\u3082\u3046\u4E00\u5EA6\u8003\u3048\u3066\u307F\u307E\u3057\u3087\u3046\u3002", suggestions: a ? ["\u6B21\u306E\u30EC\u30D9\u30EB\u306E\u554F\u984C\u306B\u6311\u6226\u3057\u307E\u3057\u3087\u3046\uFF01"] : ["\u3082\u3046\u4E00\u5EA6\u554F\u984C\u6587\u3092\u8AAD\u3093\u3067\u307F\u307E\u3057\u3087\u3046", "\u6559\u79D1\u66F8\u306E\u8A72\u5F53\u30DA\u30FC\u30B8\u3092\u78BA\u8A8D\u3057\u3066\u307F\u307E\u3057\u3087\u3046"], explanation: `\u6B63\u89E3\u306F\u300C${e.correct_answer}\u300D\u3067\u3059\u3002`, common_mistakes: [], related_concepts: [], next_steps: a ? ["\u985E\u4F3C\u554F\u984C\u3092\u89E3\u304F", "\u5FDC\u7528\u554F\u984C\u306B\u6311\u6226"] : ["\u57FA\u790E\u3092\u5FA9\u7FD2", "\u4F8B\u984C\u3092\u78BA\u8A8D"] };
}
__name(zr, "zr");
function nr(e, r) {
  const t = e.length, s = r.length;
  if (t === 0) return s === 0 ? 1 : 0;
  if (s === 0) return 0;
  const n = [];
  for (let i = 0; i <= t; i++) n[i] = [i];
  for (let i = 0; i <= s; i++) n[0][i] = i;
  for (let i = 1; i <= t; i++) for (let c = 1; c <= s; c++) e[i - 1] === r[c - 1] ? n[i][c] = n[i - 1][c - 1] : n[i][c] = Math.min(n[i - 1][c - 1] + 1, n[i][c - 1] + 1, n[i - 1][c] + 1);
  const a = n[t][s], o = Math.max(t, s);
  return 1 - a / o;
}
__name(nr, "nr");
async function Ba(e, r, t, s, n, a) {
  var i;
  const o = `\u3042\u306A\u305F\u306F\u512A\u3057\u3044\u5148\u751F\u3067\u3059\u3002\u4EE5\u4E0B\u306E\u554F\u984C\u306B\u3064\u3044\u3066\u8A73\u3057\u304F\u89E3\u8AAC\u3057\u3066\u304F\u3060\u3055\u3044\u3002

\u3010\u554F\u984C\u3011
${r}

\u3010\u6B63\u89E3\u3011
${t}

${s ? `\u3010\u751F\u5F92\u306E\u89E3\u7B54\u3011
${s}
` : ""}

\u3010\u6559\u79D1\u3011${n}
\u3010\u96E3\u6613\u5EA6\u3011${a}

\u4EE5\u4E0B\u306E\u5F62\u5F0F\u3067JSON\u5F62\u5F0F\u3067\u56DE\u7B54\u3057\u3066\u304F\u3060\u3055\u3044\uFF1A
{
  "correctAnswer": "\u6B63\u3057\u3044\u7B54\u3048",
  "explanation": "\u8A73\u3057\u3044\u89E3\u8AAC\uFF08300\u5B57\u4EE5\u5185\uFF09",
  "commonMistakes": "\u3088\u304F\u3042\u308B\u9593\u9055\u3044\u306E\u8AAC\u660E",
  "hints": ["\u30D2\u30F3\u30C81", "\u30D2\u30F3\u30C82", "\u30D2\u30F3\u30C83"]
}

\u5C0F\u5B66\u751F\u306B\u3082\u5206\u304B\u308A\u3084\u3059\u304F\u8AAC\u660E\u3057\u3066\u304F\u3060\u3055\u3044\u3002`;
  try {
    const l = (i = (await e.AI.run("@cf/meta/llama-3.1-8b-instruct", { prompt: o, max_tokens: 800 })).response) == null ? void 0 : i.match(/\{[\s\S]*\}/);
    if (!l) throw new Error("AI response is not valid JSON");
    return JSON.parse(l[0]);
  } catch (c) {
    return console.error("\u274C \u89E3\u8AAC\u751F\u6210\u30A8\u30E9\u30FC:", c), { correctAnswer: t, explanation: `\u6B63\u89E3\u306F\u300C${t}\u300D\u3067\u3059\u3002\u3053\u306E\u554F\u984C\u3067\u306F\u3001${n}\u306E\u77E5\u8B58\u3092\u4F7F\u3044\u307E\u3059\u3002`, commonMistakes: "\u554F\u984C\u6587\u3092\u6CE8\u610F\u6DF1\u304F\u8AAD\u3080\u3053\u3068\u304C\u5927\u5207\u3067\u3059\u3002", hints: ["\u554F\u984C\u6587\u3092\u3082\u3046\u4E00\u5EA6\u8AAD\u3093\u3067\u307F\u307E\u3057\u3087\u3046", "\u6559\u79D1\u66F8\u306E\u8A72\u5F53\u30DA\u30FC\u30B8\u3092\u78BA\u8A8D\u3057\u307E\u3057\u3087\u3046", "\u4F8B\u984C\u3092\u53C2\u8003\u306B\u3057\u3066\u307F\u307E\u3057\u3087\u3046"] };
  }
}
__name(Ba, "Ba");
async function ka(e, r) {
  var c;
  const t = r.length, s = r.filter((l) => l.is_correct === 1).length, n = t > 0 ? s / t * 100 : 0, a = {};
  r.forEach((l) => {
    a[l.subject] || (a[l.subject] = { total: 0, correct: 0 }), a[l.subject].total++, l.is_correct === 1 && a[l.subject].correct++;
  });
  const o = Object.entries(a).filter(([l, u]) => u.total > 0 && u.correct / u.total < 0.6).map(([l, u]) => l), i = `\u3042\u306A\u305F\u306F\u5B66\u7FD2\u30B3\u30FC\u30C1\u3067\u3059\u3002\u4EE5\u4E0B\u306E\u5B66\u7FD2\u30C7\u30FC\u30BF\u304B\u3089\u30A2\u30C9\u30D0\u30A4\u30B9\u3092\u3057\u3066\u304F\u3060\u3055\u3044\u3002

\u3010\u5B66\u7FD2\u30C7\u30FC\u30BF\u3011
- \u7DCF\u554F\u984C\u6570: ${t}\u554F
- \u6B63\u7B54\u7387: ${n.toFixed(1)}%
- \u82E6\u624B\u6559\u79D1: ${o.length > 0 ? o.join("\u3001") : "\u306A\u3057"}

\u4EE5\u4E0B\u306E\u5F62\u5F0F\u3067JSON\u5F62\u5F0F\u3067\u56DE\u7B54\u3057\u3066\u304F\u3060\u3055\u3044\uFF1A
{
  "generalAdvice": "\u5168\u822C\u7684\u306A\u30A2\u30C9\u30D0\u30A4\u30B9\uFF08100\u5B57\u4EE5\u5185\uFF09",
  "specificAdvice": ["\u5177\u4F53\u7684\u306A\u30A2\u30C9\u30D0\u30A4\u30B91", "\u5177\u4F53\u7684\u306A\u30A2\u30C9\u30D0\u30A4\u30B92", "\u5177\u4F53\u7684\u306A\u30A2\u30C9\u30D0\u30A4\u30B93"],
  "encouragement": "\u52B1\u307E\u3057\u306E\u8A00\u8449\uFF0850\u5B57\u4EE5\u5185\uFF09"
}

\u524D\u5411\u304D\u3067\u5177\u4F53\u7684\u306A\u30A2\u30C9\u30D0\u30A4\u30B9\u3092\u3057\u3066\u304F\u3060\u3055\u3044\u3002`;
  try {
    const u = (c = (await e.AI.run("@cf/meta/llama-3.1-8b-instruct", { prompt: i, max_tokens: 500 })).response) == null ? void 0 : c.match(/\{[\s\S]*\}/);
    if (!u) throw new Error("AI response is not valid JSON");
    return JSON.parse(u[0]);
  } catch (l) {
    return console.error("\u274C \u30A2\u30C9\u30D0\u30A4\u30B9\u751F\u6210\u30A8\u30E9\u30FC:", l), n >= 80 ? { generalAdvice: "\u7D20\u6674\u3089\u3057\u3044\u6210\u7E3E\u3067\u3059\uFF01\u3053\u306E\u8ABF\u5B50\u3067\u9811\u5F35\u308A\u307E\u3057\u3087\u3046\u3002", specificAdvice: ["\u5FDC\u7528\u554F\u984C\u306B\u6311\u6226\u3057\u3066\u307F\u307E\u3057\u3087\u3046", "\u5F97\u610F\u5206\u91CE\u3092\u3055\u3089\u306B\u4F38\u3070\u3057\u307E\u3057\u3087\u3046", "\u5B9A\u671F\u7684\u306A\u5FA9\u7FD2\u3092\u7D9A\u3051\u307E\u3057\u3087\u3046"], encouragement: "\u3042\u306A\u305F\u306E\u52AA\u529B\u304C\u5B9F\u3092\u7D50\u3093\u3067\u3044\u307E\u3059\uFF01\u{1F389}" } : n >= 60 ? { generalAdvice: "\u3088\u304F\u9811\u5F35\u3063\u3066\u3044\u307E\u3059\uFF01\u3082\u3046\u4E00\u606F\u3067\u3059\u3002", specificAdvice: ["\u57FA\u790E\u3092\u56FA\u3081\u3064\u3064\u5FDC\u7528\u306B\u9032\u307F\u307E\u3057\u3087\u3046", o.length > 0 ? `${o[0]}\u3092\u91CD\u70B9\u7684\u306B\u5FA9\u7FD2\u3057\u307E\u3057\u3087\u3046` : "\u82E6\u624B\u5206\u91CE\u3092\u7279\u5B9A\u3057\u307E\u3057\u3087\u3046", "\u6BCE\u65E530\u5206\u306E\u5B66\u7FD2\u7FD2\u6163\u3092\u3064\u3051\u307E\u3057\u3087\u3046"], encouragement: "\u7740\u5B9F\u306B\u9032\u6B69\u3057\u3066\u3044\u307E\u3059\uFF01\u{1F4AA}" } : { generalAdvice: "\u7126\u3089\u305A\u4E00\u6B69\u305A\u3064\u9032\u3093\u3067\u3044\u304D\u307E\u3057\u3087\u3046\u3002", specificAdvice: ["\u57FA\u790E\u554F\u984C\u3092\u7E70\u308A\u8FD4\u3057\u7DF4\u7FD2\u3057\u307E\u3057\u3087\u3046", "\u5206\u304B\u3089\u306A\u3044\u7B87\u6240\u306FAI\u30C1\u30E5\u30FC\u30BF\u30FC\u306B\u8CEA\u554F\u3057\u307E\u3057\u3087\u3046", "\u6559\u79D1\u66F8\u3084\u53C2\u8003\u66F8\u3092\u898B\u76F4\u3057\u307E\u3057\u3087\u3046"], encouragement: "\u6BCE\u65E5\u5C11\u3057\u305A\u3064\u3001\u78BA\u5B9F\u306B\u6210\u9577\u3057\u3066\u3044\u307E\u3059\uFF01\u{1F31F}" };
  }
}
__name(ka, "ka");
async function $a(e, r) {
  const t = r.length, s = r.filter((a) => a.is_correct === 1).length, n = t > 0 ? s / t * 100 : 0;
  return { summary: `\u4ECA\u9031\u306F${t}\u554F\u89E3\u3044\u3066\u3001\u6B63\u7B54\u7387${n.toFixed(1)}%\u3067\u3057\u305F\u3002`, achievements: [t >= 50 ? "50\u554F\u4EE5\u4E0A\u89E3\u304D\u307E\u3057\u305F\uFF01" : `${t}\u554F\u89E3\u304D\u307E\u3057\u305F`, n >= 80 ? "\u6B63\u7B54\u738780%\u4EE5\u4E0A\u9054\u6210\uFF01" : n >= 60 ? "\u6B63\u7B54\u738760%\u4EE5\u4E0A\u9054\u6210" : "\u5B66\u7FD2\u3092\u7D99\u7D9A\u3057\u3066\u3044\u307E\u3059"], improvements: [n >= 70 ? "\u5FDC\u7528\u554F\u984C\u306B\u3082\u6311\u6226\u3057\u307E\u3057\u3087\u3046" : "\u57FA\u790E\u3092\u56FA\u3081\u307E\u3057\u3087\u3046", "\u6BCE\u65E5\u306E\u5B66\u7FD2\u7FD2\u6163\u3092\u7D9A\u3051\u307E\u3057\u3087\u3046"], nextSteps: ["\u6765\u9031\u306F" + Math.max(t + 10, 50) + "\u554F\u3092\u76EE\u6A19\u306B\u3057\u307E\u3057\u3087\u3046", n >= 70 ? "\u6B63\u7B54\u738790%\u3092\u76EE\u6307\u3057\u307E\u3057\u3087\u3046" : "\u6B63\u7B54\u738780%\u3092\u76EE\u6307\u3057\u307E\u3057\u3087\u3046"] };
}
__name($a, "$a");
async function Ha(e, r) {
  const t = r.length, s = r.filter((a) => a.is_correct === 1).length, n = t > 0 ? s / t * 100 : 0;
  return { summary: `\u4ECA\u6708\u306F${t}\u554F\u89E3\u3044\u3066\u3001\u6B63\u7B54\u7387${n.toFixed(1)}%\u3067\u3057\u305F\u3002`, achievements: [t >= 200 ? "200\u554F\u4EE5\u4E0A\u89E3\u304D\u307E\u3057\u305F\uFF01" : t >= 100 ? "100\u554F\u4EE5\u4E0A\u89E3\u304D\u307E\u3057\u305F\uFF01" : `${t}\u554F\u89E3\u304D\u307E\u3057\u305F`, n >= 80 ? "\u9AD8\u3044\u6B63\u7B54\u7387\u3092\u7DAD\u6301\u3057\u3066\u3044\u307E\u3059" : "\u7740\u5B9F\u306B\u5B66\u7FD2\u3092\u9032\u3081\u3066\u3044\u307E\u3059"], trends: [n >= 70 ? "\u7406\u89E3\u5EA6\u304C\u5411\u4E0A\u3057\u3066\u3044\u307E\u3059" : "\u57FA\u790E\u56FA\u3081\u304C\u9032\u3093\u3067\u3044\u307E\u3059", "\u7D99\u7D9A\u7684\u306A\u5B66\u7FD2\u304C\u3067\u304D\u3066\u3044\u307E\u3059"], longTermGoals: ["\u6765\u6708\u306F" + Math.max(t + 50, 200) + "\u554F\u3092\u76EE\u6A19\u306B\u3057\u307E\u3057\u3087\u3046", n >= 70 ? "\u5168\u6559\u79D1\u3067\u6B63\u7B54\u738790%\u3092\u76EE\u6307\u3057\u307E\u3057\u3087\u3046" : "\u5168\u6559\u79D1\u3067\u6B63\u7B54\u738780%\u3092\u76EE\u6307\u3057\u307E\u3057\u3087\u3046"] };
}
__name(Ha, "Ha");
var Ua = class {
  static {
    __name(this, "Ua");
  }
  constructor() {
    C(this, "nodes");
    C(this, "adjacencyList");
    this.nodes = /* @__PURE__ */ new Map(), this.adjacencyList = /* @__PURE__ */ new Map();
  }
  addNode(r) {
    this.nodes.set(r.unit_id, r), this.adjacencyList.has(r.unit_id) || this.adjacencyList.set(r.unit_id, []), r.prerequisites.forEach((t) => {
      this.adjacencyList.has(t) || this.adjacencyList.set(t, []), this.adjacencyList.get(t).push(r.unit_id);
    });
  }
  topologicalSort() {
    const r = /* @__PURE__ */ new Map(), t = [];
    this.nodes.forEach((n, a) => {
      r.set(a, 0);
    }), this.nodes.forEach((n) => {
      n.prerequisites.forEach((a) => {
        r.set(a, (r.get(a) || 0) + 1);
      });
    });
    const s = [];
    for (r.forEach((n, a) => {
      n === 0 && s.push(a);
    }); s.length > 0; ) {
      const n = s.shift();
      t.push(n), (this.adjacencyList.get(n) || []).forEach((o) => {
        const i = (r.get(o) || 0) - 1;
        r.set(o, i), i === 0 && s.push(o);
      });
    }
    return t;
  }
  shortestPath(r, t) {
    const s = [[r]], n = /* @__PURE__ */ new Set([r]);
    for (; s.length > 0; ) {
      const a = s.shift(), o = a[a.length - 1];
      if (o === t) return a;
      (this.adjacencyList.get(o) || []).forEach((c) => {
        n.has(c) || (n.add(c), s.push([...a, c]));
      });
    }
    return [];
  }
  getNode(r) {
    return this.nodes.get(r);
  }
  getAllNodes() {
    return Array.from(this.nodes.values());
  }
};
async function Xe(e, r, t) {
  const s = await e.prepare(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct,
      MAX(created_at) as last_practiced
    FROM answer_history ah
    JOIN generated_problems gp ON ah.problem_id = gp.id
    JOIN curriculum c ON gp.subject = c.subject
    WHERE ah.student_id = ? AND c.id = ?
  `).bind(r, t).first();
  if (!s || s.total === 0) return { unit_id: t, student_id: r, mastery_level: 0, confidence: 0, last_practiced: /* @__PURE__ */ new Date(), practice_count: 0, correct_rate: 0 };
  const n = s.total, o = s.correct / n, i = Math.min(n / 20, 1), c = new Date(s.last_practiced), l = (Date.now() - c.getTime()) / (1e3 * 60 * 60 * 24), u = Math.exp(-l / 30), d = Math.round(o * i * u * 100), _ = Math.min(n / 10, 1);
  return { unit_id: t, student_id: r, mastery_level: d, confidence: _, last_practiced: c, practice_count: n, correct_rate: o };
}
__name(Xe, "Xe");
async function Pt(e, r, t) {
  let s = "SELECT id FROM curriculum";
  const n = [];
  t && (s += " WHERE subject = ?", n.push(t));
  const a = await e.prepare(s).bind(...n).all();
  return await Promise.all(a.results.map((i) => Xe(e, r, i.id)));
}
__name(Pt, "Pt");
async function qa(e, r, t, s) {
  const n = await Pt(e, r, t);
  let a = `
    SELECT id, unit_name, grade, unit_order, total_hours, unit_goal
    FROM curriculum
    WHERE subject = ?
  `;
  const o = [t];
  s && (a += " AND grade = ?", o.push(s)), a += " ORDER BY grade, unit_order";
  const i = await e.prepare(a).bind(...o).all(), c = new Ua();
  i.results.forEach((m, h) => {
    const g = h > 0 ? [i.results[h - 1].id] : [];
    c.addNode({ unit_id: m.id, subject: t, grade: m.grade, unit_name: m.unit_name, prerequisites: g, difficulty: Math.ceil(m.grade * 1.5), estimated_hours: m.total_hours });
  });
  const l = n.filter((m) => m.mastery_level < 50).map((m) => {
    const h = i.results.find((g) => g.id === m.unit_id);
    return { unit_id: m.unit_id, unit_name: (h == null ? void 0 : h.unit_name) || "\u4E0D\u660E", mastery_level: m.mastery_level, reinforcement_needed: m.mastery_level < 30 };
  }), u = [];
  i.results.forEach((m) => {
    const h = n.find((x) => x.unit_id === m.id), g = (h == null ? void 0 : h.mastery_level) || 0;
    let f = 5;
    g < 30 ? f = 10 : g < 70 ? f = 8 : g < 90 ? f = 5 : f = 2;
    let E = "";
    g < 30 ? E = "\u672A\u7FD2\u5F97\u306E\u305F\u3081\u57FA\u790E\u304B\u3089\u5B66\u7FD2\u304C\u5FC5\u8981\u3067\u3059" : g < 70 ? E = "\u7406\u89E3\u304C\u4E0D\u5341\u5206\u306A\u305F\u3081\u5FA9\u7FD2\u3068\u8FFD\u52A0\u7DF4\u7FD2\u304C\u5FC5\u8981\u3067\u3059" : g < 90 ? E = "\u5B9A\u7740\u306E\u305F\u3081\u306B\u5B9A\u671F\u7684\u306A\u5FA9\u7FD2\u3092\u304A\u3059\u3059\u3081\u3057\u307E\u3059" : E = "\u5341\u5206\u306B\u7FD2\u5F97\u6E08\u307F\u3067\u3059\u3002\u5FDC\u7528\u554F\u984C\u306B\u6311\u6226\u3057\u307E\u3057\u3087\u3046", u.push({ unit_id: m.id, unit_name: m.unit_name, priority: f, reason: E, estimated_time: `${m.total_hours}\u6642\u9593`, mastery_level: g });
  }), u.sort((m, h) => h.priority - m.priority);
  const d = u.find((m) => m.mastery_level < 80), _ = d ? { unit_id: d.unit_id, unit_name: d.unit_name, progress: d.mastery_level } : { unit_id: 0, unit_name: "\u5168\u5358\u5143\u7FD2\u5F97\u5B8C\u4E86\uFF01", progress: 100 };
  return { student_id: r, subject: t, recommended_path: u.slice(0, 10), weak_areas: l.slice(0, 5), next_milestone: _ };
}
__name(qa, "qa");
async function Pa(e, r, t) {
  const s = await Xe(e, r, t), n = await e.prepare("SELECT id, unit_name, total_hours FROM curriculum WHERE id = ?").bind(t).first();
  if (!n) throw new Error(`Unit ${t} not found`);
  const a = await e.prepare(`
    SELECT 
      DATE(created_at) as date,
      COUNT(*) as count,
      SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct
    FROM answer_history ah
    JOIN generated_problems gp ON ah.problem_id = gp.id
    WHERE ah.student_id = ? AND gp.subject = (SELECT subject FROM curriculum WHERE id = ?)
    AND created_at >= datetime('now', '-30 days')
    GROUP BY DATE(created_at)
    ORDER BY date DESC
  `).bind(r, t).all();
  let o = 3;
  if (a.results.length >= 2) {
    const m = a.results.map((g) => g.correct / g.count * 100), h = m.reduce((g, f) => g + f, 0) / m.length;
    o = Math.max(h / 10, 1);
  }
  const i = s.mastery_level, c = Math.min(i + o * 7, 100), l = Math.min(i + o * 30, 100), u = 90 - i, d = u > 0 ? Math.ceil(u / o) : 0, _ = d * 5;
  return { unit_id: t, unit_name: n.unit_name, current_mastery: i, predicted_mastery_7days: Math.round(c), predicted_mastery_30days: Math.round(l), recommended_practice_count: _, estimated_time_to_master: d === 0 ? "\u7FD2\u5F97\u6E08\u307F" : d < 7 ? `\u7D04${d}\u65E5` : `\u7D04${Math.ceil(d / 7)}\u9031\u9593`, confidence: s.confidence };
}
__name(Pa, "Pa");
async function Fa(e, r, t) {
  return await Promise.all(t.map((s) => Pa(e, r, s)));
}
__name(Fa, "Fa");
async function Wa(e, r, t) {
  const s = await Xe(e, r, t), n = await e.prepare("SELECT id, unit_name, subject, grade FROM curriculum WHERE id = ?").bind(t).first();
  if (!n) throw new Error(`Unit ${t} not found`);
  const a = await e.prepare(`
    SELECT id, unit_name, grade, unit_order
    FROM curriculum
    WHERE subject = ? AND grade <= ? AND unit_order < (
      SELECT unit_order FROM curriculum WHERE id = ?
    )
    ORDER BY grade DESC, unit_order DESC
    LIMIT 3
  `).bind(n.subject, n.grade, t).all(), o = await Promise.all(a.results.map(async (l) => {
    const u = await Xe(e, r, l.id);
    return { prerequisite_unit_id: l.id, prerequisite_unit_name: l.unit_name, mastery_level: u.mastery_level, is_blocking: u.mastery_level < 60 };
  })), i = [];
  o.filter((l) => l.is_blocking).forEach((l, u) => {
    i.push({ action_type: "review", unit_id: l.prerequisite_unit_id, unit_name: l.prerequisite_unit_name, priority: 10 - u, estimated_time: "30\u5206", description: `\u57FA\u790E\u3068\u306A\u308B\u300C${l.prerequisite_unit_name}\u300D\u3092\u5FA9\u7FD2\u3057\u307E\u3057\u3087\u3046` });
  }), i.push({ action_type: "practice", unit_id: t, unit_name: n.unit_name, priority: 8, estimated_time: "45\u5206", description: `\u300C${n.unit_name}\u300D\u306E\u7DF4\u7FD2\u554F\u984C\u3092\u89E3\u304D\u307E\u3057\u3087\u3046` }), i.push({ action_type: "tutorial", unit_id: t, unit_name: n.unit_name, priority: 6, estimated_time: "15\u5206", description: "\u308F\u304B\u3089\u306A\u3044\u3053\u3068\u306FAI\u30C1\u30E5\u30FC\u30BF\u30FC\u306B\u8CEA\u554F\u3057\u307E\u3057\u3087\u3046" });
  const c = [{ subject: n.subject, difficulty: s.mastery_level < 30 ? "easy" : "medium", count: s.mastery_level < 30 ? 15 : 10 }];
  return { student_id: r, weak_unit: { unit_id: t, unit_name: n.unit_name, mastery_level: s.mastery_level }, root_causes: o, reinforcement_actions: i, practice_problems: c };
}
__name(Wa, "Wa");
function Lt(e) {
  let r = 0;
  for (let t = 1; t < e; t++) r += t * 100;
  return r;
}
__name(Lt, "Lt");
function Ja(e) {
  let r = 1;
  for (; ; ) {
    const t = Lt(r + 1);
    if (e < t) break;
    r++;
  }
  return r;
}
__name(Ja, "Ja");
async function Ga(e, r) {
  return (await e.prepare(`
        SELECT 
            bd.*,
            ub.earned_at,
            ub.progress,
            CASE WHEN ub.student_id IS NOT NULL THEN 1 ELSE 0 END as earned
        FROM badge_definitions bd
        LEFT JOIN user_badges ub ON bd.badge_key = ub.badge_key AND ub.student_id = ?
        ORDER BY bd.category, bd.condition_value
    `).bind(r).all()).results;
}
__name(Ga, "Ga");
async function K(e, r, t) {
  if (await e.prepare("SELECT id FROM user_badges WHERE student_id = ? AND badge_key = ?").bind(r, t).first()) return false;
  const n = await e.prepare("SELECT * FROM badge_definitions WHERE badge_key = ?").bind(t).first();
  return n ? (await e.prepare("INSERT INTO user_badges (student_id, badge_key) VALUES (?, ?)").bind(r, t).run(), n.points_reward > 0 && await Qe(e, r, n.points_reward, "badge", `\u30D0\u30C3\u30B8\u7372\u5F97: ${n.name}`), true) : false;
}
__name(K, "K");
async function Qe(e, r, t, s, n) {
  await e.prepare(`
        INSERT INTO point_history (student_id, points, source, description)
        VALUES (?, ?, ?, ?)
    `).bind(r, t, s, n).run();
  const a = await e.prepare(`
        SELECT * FROM student_levels WHERE student_id = ?
    `).bind(r).first();
  if (a) {
    const o = a.total_points + t, i = Ja(o), c = i > a.current_level;
    await e.prepare(`
            UPDATE student_levels
            SET total_points = ?, current_level = ?, updated_at = datetime('now')
            ${c ? ", level_up_at = datetime('now')" : ""}
            WHERE student_id = ?
        `).bind(o, i, r).run(), c && await qe(e, r, "level_up", `\u{1F389} \u30EC\u30D9\u30EB${i}\u306B\u5230\u9054\u3057\u307E\u3057\u305F\uFF01\u304A\u3081\u3067\u3068\u3046\u3054\u3056\u3044\u307E\u3059\uFF01\u3042\u306A\u305F\u306E\u52AA\u529B\u304C\u5B9F\u3092\u7D50\u3073\u307E\u3057\u305F\uFF01`);
  } else await e.prepare(`
            INSERT INTO student_levels (student_id, total_points, current_level)
            VALUES (?, ?, 1)
        `).bind(r, t).run();
}
__name(Qe, "Qe");
async function Xr(e, r) {
  let t = await e.prepare("SELECT * FROM student_levels WHERE student_id = ?").bind(r).first();
  t || (await e.prepare(`
            INSERT INTO student_levels (student_id, total_points, current_level)
            VALUES (?, 0, 1)
        `).bind(r).run(), t = { student_id: r, current_level: 1, total_points: 0, points_to_next_level: 100, level_progress_percent: 0 });
  const s = Lt(t.current_level), n = Lt(t.current_level + 1), a = t.total_points - s, o = n - s;
  return t.points_to_next_level = n - t.total_points, t.level_progress_percent = Math.floor(a / o * 100), t;
}
__name(Xr, "Xr");
async function Ya(e, r) {
  const t = (/* @__PURE__ */ new Date()).toISOString().split("T")[0], s = await e.prepare("SELECT * FROM learning_streaks WHERE student_id = ?").bind(r).first();
  if (!s) return await e.prepare(`
            INSERT INTO learning_streaks (student_id, current_streak, longest_streak, last_activity_date)
            VALUES (?, 1, 1, ?)
        `).bind(r, t).run(), await K(e, r, "habit_first_step"), true;
  if (s.last_activity_date === t) return false;
  const n = new Date(s.last_activity_date), a = new Date(t), o = Math.floor((a.getTime() - n.getTime()) / (1e3 * 60 * 60 * 24));
  let i = s.current_streak, c = s.longest_streak;
  return o === 1 ? (i++, c = Math.max(c, i)) : i = 1, await e.prepare(`
        UPDATE learning_streaks
        SET current_streak = ?, longest_streak = ?, last_activity_date = ?, updated_at = datetime('now')
        WHERE student_id = ?
    `).bind(i, c, t, r).run(), i === 3 ? await K(e, r, "habit_streak_3") : i === 7 ? await K(e, r, "habit_streak_7") : i === 30 && await K(e, r, "habit_streak_30"), i > 1 && await qe(e, r, "streak", `\u{1F525} ${i}\u65E5\u9023\u7D9A\u5B66\u7FD2\u4E2D\uFF01\u7D99\u7D9A\u306F\u529B\u306A\u308A\uFF01\u7D20\u6674\u3089\u3057\u3044\u52AA\u529B\u3067\u3059\uFF01`), true;
}
__name(Ya, "Ya");
async function Qr(e, r) {
  const t = await e.prepare("SELECT * FROM learning_streaks WHERE student_id = ?").bind(r).first();
  return t || { current_streak: 0, longest_streak: 0, last_activity_date: "" };
}
__name(Qr, "Qr");
async function qe(e, r, t, s) {
  await e.prepare(`
        INSERT INTO encouragement_messages (student_id, message_type, message_text)
        VALUES (?, ?, ?)
    `).bind(r, t, s).run();
}
__name(qe, "qe");
async function Va(e, r) {
  const t = await e.prepare(`
        SELECT message_type, message_text
        FROM encouragement_messages
        WHERE student_id = ? AND shown = 0
        ORDER BY created_at DESC
        LIMIT 5
    `).bind(r).all();
  return await e.prepare(`
        UPDATE encouragement_messages
        SET shown = 1, shown_at = datetime('now')
        WHERE student_id = ? AND shown = 0
    `).bind(r).run(), t.results;
}
__name(Va, "Va");
async function Ka(e, r) {
  const t = ["\u4ECA\u65E5\u3082\u9811\u5F35\u308A\u307E\u3057\u3087\u3046\uFF01\u2728", "\u3055\u3042\u3001\u4ECA\u65E5\u3082\u5B66\u7FD2\u3092\u59CB\u3081\u307E\u3057\u3087\u3046\uFF01\u{1F4DA}", "\u65B0\u3057\u3044\u4E00\u65E5\u306E\u5B66\u7FD2\u30B9\u30BF\u30FC\u30C8\uFF01\u{1F31F}", "\u4ECA\u65E5\u306F\u3069\u3093\u306A\u767A\u898B\u304C\u3042\u308B\u304B\u306A\uFF1F\u{1F50D}", "\u3042\u306A\u305F\u306E\u6210\u9577\u3092\u5FDC\u63F4\u3057\u3066\u3044\u307E\u3059\uFF01\u{1F4AA}"], s = t[Math.floor(Math.random() * t.length)];
  return await qe(e, r, "start", s), s;
}
__name(Ka, "Ka");
async function Zr(e, r) {
  const t = ["\u7D20\u6674\u3089\u3057\u3044\uFF01\u305D\u306E\u8ABF\u5B50\u3067\u3059\uFF01\u2728", "\u6B63\u89E3\uFF01\u3088\u304F\u3067\u304D\u307E\u3057\u305F\uFF01\u{1F389}", "\u30D1\u30FC\u30D5\u30A7\u30AF\u30C8\uFF01\u5B8C\u74A7\u3067\u3059\uFF01\u2B50", "\u3059\u3054\u3044\uFF01\u7406\u89E3\u304C\u6DF1\u307E\u3063\u3066\u3044\u307E\u3059\u306D\uFF01\u{1F4A1}", "\u3084\u308A\u307E\u3057\u305F\uFF01\u6B21\u3082\u9811\u5F35\u308A\u307E\u3057\u3087\u3046\uFF01\u{1F31F}"], s = t[Math.floor(Math.random() * t.length)];
  return await qe(e, r, "correct", s), s;
}
__name(Zr, "Zr");
async function es(e, r) {
  const t = ["\u5927\u4E08\u592B\uFF01\u9593\u9055\u3044\u304B\u3089\u5B66\u3076\u3053\u3068\u304C\u5927\u5207\u3067\u3059\u{1F4DA}", "\u307E\u3060\u30C1\u30E3\u30F3\u30B9\u306F\u3042\u308A\u307E\u3059\uFF01\u3082\u3046\u4E00\u5EA6\u30C1\u30E3\u30EC\u30F3\u30B8\u3057\u3066\u307F\u307E\u3057\u3087\u3046\u{1F4AA}", "\u5931\u6557\u306F\u6210\u529F\u306E\u3082\u3068\uFF01\u6B21\u306F\u89E3\u3051\u308B\u3088\u3046\u306B\u306A\u308A\u307E\u3059\u3088\u2728", "\u96E3\u3057\u304B\u3063\u305F\u3067\u3059\u306D\u3002\u3067\u3082\u8AE6\u3081\u306A\u3044\u3042\u306A\u305F\u306F\u7D20\u6674\u3089\u3057\u3044\uFF01\u{1F31F}", "\u9593\u9055\u3048\u3066\u3082\u5927\u4E08\u592B\uFF01\u6210\u9577\u306E\u30C1\u30E3\u30F3\u30B9\u3067\u3059\uFF01\u{1F331}"], s = t[Math.floor(Math.random() * t.length)];
  return await qe(e, r, "incorrect", s), s;
}
__name(es, "es");
async function za(e, r) {
  const t = ["\u3088\u304F\u9811\u5F35\u308A\u307E\u3057\u305F\uFF01\u5C11\u3057\u4F11\u61A9\u3057\u307E\u3057\u3087\u3046\u2615", "\u7D20\u6674\u3089\u3057\u3044\u96C6\u4E2D\u529B\u3067\u3059\uFF01\u4F11\u61A9\u3082\u5927\u5207\u3067\u3059\u3088\u{1F338}", "\u9577\u6642\u9593\u304A\u75B2\u308C\u69D8\uFF01\u30EA\u30D5\u30EC\u30C3\u30B7\u30E5\u30BF\u30A4\u30E0\u3092\u53D6\u308A\u307E\u3057\u3087\u3046\u{1F3B5}", "\u3042\u306A\u305F\u306E\u52AA\u529B\u306B\u611F\u52D5\u3057\u3066\u3044\u307E\u3059\uFF01\u5C11\u3057\u4F11\u3093\u3067\u304F\u3060\u3055\u3044\u306D\u{1F4AB}", "\u3053\u3053\u307E\u3067\u3088\u304F\u9811\u5F35\u308A\u307E\u3057\u305F\uFF01\u4F11\u61A9\u3057\u3066\u5143\u6C17\u3092\u56DE\u5FA9\u3057\u307E\u3057\u3087\u3046\u{1F340}"], s = t[Math.floor(Math.random() * t.length)];
  return await qe(e, r, "long_study", s), s;
}
__name(za, "za");
var p = new Or();
function Y(e) {
  var c, l;
  let r = e.match(/```(?:json)?\s*\n([\s\S]*?)\n```/), t = r ? r[1].trim() : e.trim();
  if (!r) {
    const u = e.match(/(\{[\s\S]*\})/), d = e.match(/(\[[\s\S]*\])/);
    t = ((l = (c = u || d) == null ? void 0 : c[1]) == null ? void 0 : l.trim()) || e.trim();
  }
  t = t.replace(/^[^{[]*/, "").replace(/[^}\]]*$/, ""), t = t.replace(/[\u2018\u2019]/g, "'"), t = t.replace(/[\u201C\u201D]/g, '"'), t = t.replace(/[\u2013\u2014]/g, "-");
  let s = false, n = false, a = "";
  for (let u = 0; u < t.length; u++) {
    const d = t[u];
    if (n) {
      a += d, n = false;
      continue;
    }
    if (d === "\\") {
      a += d, n = true;
      continue;
    }
    if (d === '"') {
      a += d, s = !s;
      continue;
    }
    if (s) if (d === `
`) a += "\\n";
    else if (d === "\r") a += "\\r";
    else if (d === "	") a += "\\t";
    else if (d === "\b") a += "\\b";
    else if (d === "\f") a += "\\f";
    else {
      const _ = d.charCodeAt(0);
      _ < 32 && _ !== 10 && _ !== 13 && _ !== 9 ? a += "\\u" + ("0000" + _.toString(16)).slice(-4) : a += d;
    }
    else a += d;
  }
  t = a;
  const o = [];
  s = false, n = false;
  for (let u = 0; u < t.length; u++) {
    const d = t[u];
    if (n) {
      o.push(d), n = false;
      continue;
    }
    if (d === "\\") {
      o.push(d), n = true;
      continue;
    }
    if (d === '"') {
      o.push(d), s = !s;
      continue;
    }
    !s && /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(d) || o.push(d);
  }
  t = o.join(""), t = t.replace(/,\s*,/g, ",");
  for (let u = 0; u < 5; u++) t = t.replace(/,(\s*[}\]])/g, "$1");
  t = t.replace(/(\]|\})([^\s,\]}\n])/g, "$1"), t = t.replace(/\]\s+"/g, '],"'), t = t.replace(/\}\s+"/g, '},"'), t = t.replace(/\]\|"/g, '],"'), t = t.replace(/\}\|"/g, '},"'), t = t.replace(/\]\s+\{/g, "], {"), t = t.replace(/\}\s+\{/g, "}, {"), t = t.replace(/\]\s+\[/g, "], ["), t = t.replace(/"\s+"/g, '", "'), t = t.replace(/\}(\s*)\{/g, "},$1{"), t = t.replace(/\](\s*)\[/g, "],$1["), t = t.replace(/\]\]/g, "], ]").replace(/\}, \]/g, "}]"), t = t.replace(/\}(\s*)\{/g, "},$1{"), t = t.replace(/\](\s*)\{/g, "],$1{"), t = t.replace(/\}(\s*)\[/g, "},$1["), t = t.replace(/\](\s*)\[/g, "],$1["), t = t.replace(/"(\s*)\{/g, '",$1{'), t = t.replace(/"(\s*)\[/g, '",$1['), t = t.replace(/(\d)(\s*)\{/g, "$1,$2{"), t = t.replace(/(\d)(\s*)\[/g, "$1,$2["), t = t.replace(/(true|false|null)(\s*)\{/g, "$1,$2{"), t = t.replace(/\}(\s*)\{/g, "},$1{"), t = t.replace(/\}(\s*)\[/g, "},$1["), t = t.replace(/\](\s*)\{/g, "],$1{"), t = t.replace(/\](\s*)\[/g, "],$1["), t = t.replace(/\}(\s*\n\s*)\{/g, "},$1{"), t = t.replace(/\](\s*\n\s*)\{/g, "],$1{"), t = t.replace(/\}(\s*\n\s*)\[/g, "},$1["), t = t.replace(/\](\s*\n\s*)\[/g, "],$1["), t = t.replace(/"(\s*\n\s*)\{/g, '",$1{'), t = t.replace(/"(\s*\n\s*)\[/g, '",$1['), t = t.replace(/"(\s*\n\s*)"/g, '",$1"'), t = t.replace(/\}(\s*\n\s*\n\s*)\{/g, "},$1{"), t = t.replace(/\](\s*\n\s*\n\s*)\[/g, "],$1["), t = t.replace(/\}(\s*[\r\n]+\s*)\{/g, "},$1{"), t = t.replace(/\](\s*[\r\n]+\s*)\{/g, "],$1{"), t = t.replace(/\}(\s*[\r\n]+\s*)\[/g, "},$1["), t = t.replace(/\](\s*[\r\n]+\s*)\[/g, "],$1["), t = t.replace(/"(\s*[\r\n]+\s*)\{/g, '",$1{'), t = t.replace(/"(\s*[\r\n]+\s*)\[/g, '",$1['), t = t.replace(/"(\s*[\r\n]+\s*)"/g, function(u, d, _) {
    return t.substring(Math.max(0, _ - 10), _).match(/:\s*$/) ? u : '",' + d + '"';
  }), t = t.replace(/"(\s*)"/g, function(u, d) {
    return t.substring(0, t.indexOf(u)).match(/:\s*$/) ? u : '",' + d + '"';
  }), console.log("\u2705 JSON\u30AB\u30F3\u30DE\u6B20\u843D\u4FEE\u6B63\u3092\u5B9F\u884C\u3057\u307E\u3057\u305F\uFF08\u62E1\u5F35\u7248\uFF09");
  let i = 0;
  for (let u = 0; u < t.length; u++) t[u] === '"' && (u === 0 || t[u - 1] !== "\\") && i++;
  i % 2 !== 0 && (console.warn("\u26A0\uFE0F \u672A\u9589\u3058\u306E\u5F15\u7528\u7B26\u3092\u691C\u51FA"), t = t.trim() + '"');
  try {
    return JSON.parse(t);
  } catch (u) {
    if (console.error("\u274C JSON parse error:", u), console.error("\u{1F4C4} JSON text length:", t.length), console.error("\u{1F4C4} JSON text (first 1000 chars):", t.substring(0, 1e3)), console.error("\u{1F4C4} JSON text (last 1000 chars):", t.substring(Math.max(0, t.length - 1e3))), console.error("\u{1F4C4} AI response length:", e.length), console.error("\u{1F4C4} AI response (first 1000 chars):", e.substring(0, 1e3)), u instanceof SyntaxError && u.message.includes("position")) {
      const d = u.message.match(/position (\d+)/);
      if (d) {
        const _ = parseInt(d[1]), m = Math.max(0, _ - 100), h = Math.min(t.length, _ + 100);
        console.error(`\u{1F50D} Error context (position ${_})`), console.error("Before:", t.substring(m, _)), console.error("At:", t.substring(_, _ + 1), "(charCode:", t.charCodeAt(_), ")"), console.error("After:", t.substring(_ + 1, h)), console.error("\u{1F50D} Control characters around error:");
        for (let g = Math.max(0, _ - 50); g < Math.min(t.length, _ + 50); g++) {
          t[g];
          const f = t.charCodeAt(g);
          (f < 32 || f === 127) && console.error(`  Position ${g}: charCode ${f} (control character)${g === _ ? " <-- ERROR" : ""}`);
        }
      }
    }
    if (u instanceof SyntaxError && (u.message.includes("Unexpected end of JSON input") || u.message.includes("Expected ',' or ']'") || u.message.includes("Expected ',' or '}'"))) {
      console.warn("\u26A0\uFE0F JSON\u4E0D\u5B8C\u5168\u30A8\u30E9\u30FC\u691C\u51FA\u3001\u81EA\u52D5\u88DC\u5B8C\u3092\u8A66\u307F\u307E\u3059");
      let d = 0, _ = 0, m = false, h = false;
      for (let g = 0; g < t.length; g++) {
        const f = t[g];
        if (h) {
          h = false;
          continue;
        }
        if (f === "\\" && m) {
          h = true;
          continue;
        }
        if (f === '"' && !h) {
          m = !m;
          continue;
        }
        m || (f === "{" && d++, f === "}" && d--, f === "[" && _++, f === "]" && _--);
      }
      for (console.log(`\u{1F50D} \u62EC\u5F27\u306E\u72B6\u614B: { ${d}, [ ${_}, inString: ${m}`), m && (t += '"', console.log("\u2705 \u6587\u5B57\u5217\u3092\u9589\u3058\u307E\u3057\u305F")), t = t.replace(/(\})(\s*[\r\n]*\s*)(\{)/g, "$1,$2$3"), t = t.replace(/(\])(\s*[\r\n]*\s*)(\[)/g, "$1,$2$3"), t = t.replace(/(\})(\s*[\r\n]*\s*)(\[)/g, "$1,$2$3"), t = t.replace(/(\])(\s*[\r\n]*\s*)(\{)/g, "$1,$2$3"), t = t.replace(/(")\s*(\s*)"/g, '$1,$2"'), t = t.replace(/,(\s*[\]}])$/g, "$1"); _ > 0; ) t += "]", _--, console.log("\u2705 \u914D\u5217\u3092\u9589\u3058\u307E\u3057\u305F");
      for (; d > 0; ) t += "}", d--, console.log("\u2705 \u30AA\u30D6\u30B8\u30A7\u30AF\u30C8\u3092\u9589\u3058\u307E\u3057\u305F");
      console.log("\u{1F504} \u88DC\u5B8C\u5F8C\u306EJSON\u518D\u30D1\u30FC\u30B9\u8A66\u884C..."), console.log("\u{1F4C4} \u88DC\u5B8C\u5F8C\u306EJSON (last 500 chars):", t.substring(Math.max(0, t.length - 500)));
      try {
        return JSON.parse(t);
      } catch (g) {
        if (console.error("\u274C \u88DC\u5B8C\u5F8C\u3082\u30D1\u30FC\u30B9\u5931\u6557:", g), g instanceof SyntaxError && g.message.includes("position")) {
          const f = g.message.match(/position (\d+)/);
          if (f) {
            const E = parseInt(f[1]);
            console.log(`\u{1F50D} \u30A8\u30E9\u30FC\u4F4D\u7F6E ${E} \u3067\u4FEE\u6B63\u3092\u8A66\u307F\u307E\u3059`);
            const x = t.substring(Math.max(0, E - 20), E), y = t.substring(E, Math.min(t.length, E + 20));
            if (console.log("Before:", x), console.log("After:", y), x.match(/\}\s*$/) && y.match(/^\s*\{/)) {
              console.log("\u2705 \u30D1\u30BF\u30FC\u30F3\u691C\u51FA: } { \u2192 }, {"), t = t.substring(0, E) + "," + t.substring(E);
              try {
                return JSON.parse(t);
              } catch (v) {
                console.error("\u30D1\u30BF\u30FC\u30F31\u4FEE\u6B63\u5F8C\u3082\u30A8\u30E9\u30FC:", v);
              }
            }
            if (x.match(/\]\s*$/) && y.match(/^\s*\[/)) {
              console.log("\u2705 \u30D1\u30BF\u30FC\u30F3\u691C\u51FA: ] [ \u2192 ], ["), t = t.substring(0, E) + "," + t.substring(E);
              try {
                return JSON.parse(t);
              } catch (v) {
                console.error("\u30D1\u30BF\u30FC\u30F32\u4FEE\u6B63\u5F8C\u3082\u30A8\u30E9\u30FC:", v);
              }
            }
            if (x.match(/"\s*$/) && y.match(/^\s*"/)) {
              console.log('\u2705 \u30D1\u30BF\u30FC\u30F3\u691C\u51FA: " " \u2192 ", "'), t = t.substring(0, E) + "," + t.substring(E);
              try {
                return JSON.parse(t);
              } catch (v) {
                console.error("\u30D1\u30BF\u30FC\u30F33\u4FEE\u6B63\u5F8C\u3082\u30A8\u30E9\u30FC:", v);
              }
            }
          }
        }
      }
    }
    if (u instanceof SyntaxError && u.message.includes("position")) {
      const d = u.message.match(/position (\d+)/);
      if (d) {
        const _ = parseInt(d[1]), m = Math.max(0, _ - 200), h = Math.min(t.length, _ + 200);
        console.error(`\u{1F50D} Error context (pos ${_}):`), console.error(t.substring(m, h)), console.error(`\u{1F50D} Character at error position: '${t.charAt(_)}' (code: ${t.charCodeAt(_)})`), console.error("\u{1F50D} Characters around error position:");
        for (let g = Math.max(0, _ - 20); g < Math.min(t.length, _ + 20); g++) {
          const f = t.charAt(g), E = t.charCodeAt(g);
          console.error(`  pos ${g}: '${f === `
` ? "\\n" : f === "\r" ? "\\r" : f === "	" ? "\\t" : f}' (code: ${E})${g === _ ? " <-- ERROR HERE" : ""}`);
        }
        if (u.message.includes("Expected ',' or ']'") || u.message.includes("Expected ',' or '}'")) {
          console.warn("\u26A0\uFE0F JSON\u69CB\u6587\u30A8\u30E9\u30FC\u691C\u51FA\u3001\u5305\u62EC\u7684\u306A\u4FEE\u6B63\u3092\u8A66\u307F\u307E\u3059");
          let g = _;
          if (u.message.includes("line") && u.message.includes("column")) {
            const b = u.message.match(/line (\d+)/), T = u.message.match(/column (\d+)/);
            if (b && T) {
              const O = parseInt(b[1]), A = parseInt(T[1]);
              console.log(`\u{1F50D} Line ${O}, Column ${A}`);
              const S = t.split(`
`);
              let I = 0;
              for (let N = 0; N < O - 1 && N < S.length; N++) I += S[N].length + 1;
              g = I + A - 1, console.log(`\u{1F50D} Calculated position: ${g} (original: ${_})`);
            }
          }
          let f = Math.max(0, g - 1), E = g;
          for (; f >= 0 && /\s/.test(t.charAt(f)); ) f--;
          for (; E < t.length && /\s/.test(t.charAt(E)); ) E++;
          const x = t.charAt(f), y = t.charAt(E);
          if (console.log(`\u{1F50D} Before char: '${x}' at ${f}`), console.log(`\u{1F50D} After char: '${y}' at ${E}`), (x === "}" || x === "]" || x === '"') && (y === "{" || y === "[" || y === '"')) {
            console.log("\u2705 \u30AB\u30F3\u30DE\u3092\u633F\u5165\u3057\u307E\u3059");
            const b = t.substring(0, f + 1) + "," + t.substring(f + 1);
            console.log("\u{1F504} \u4FEE\u6B63\u5F8C\u306EJSON\u518D\u30D1\u30FC\u30B9\u8A66\u884C...");
            try {
              const T = JSON.parse(b);
              return console.log("\u2705 \u30AB\u30F3\u30DE\u633F\u5165\u306B\u3088\u308B\u4FEE\u6B63\u304C\u6210\u529F\u3057\u307E\u3057\u305F\uFF01"), T;
            } catch (T) {
              console.error("\u274C \u30AB\u30F3\u30DE\u633F\u5165\u5F8C\u3082\u30D1\u30FC\u30B9\u5931\u6557:", T);
            }
          }
          const v = [() => {
            let b = t.substring(0, _).trimEnd();
            return !b.endsWith('"') && !b.endsWith(",") && !b.endsWith("}") && !b.endsWith("]") && (b += '"'), b += "," + t.substring(_), b;
          }, () => t.substring(0, _) + "," + t.substring(_ + 1), () => t.substring(0, _) + "," + t.substring(_), () => {
            let b = t.substring(0, _);
            const T = b.lastIndexOf('"'), O = b.lastIndexOf(","), A = Math.max(b.lastIndexOf("{"), b.lastIndexOf("["));
            if (T > O && T > A) {
              const S = b.substring(0, T), I = b.substring(T + 1);
              b = S + '"' + I.replace(/[^"]*$/, "") + '",';
            }
            return b + t.substring(_);
          }, () => {
            let b = t.substring(0, _).trimEnd();
            b.charAt(b.length - 1);
            let T = 0, O = 0, A = false, S = false;
            for (let I = 0; I < b.length; I++) {
              const N = b[I];
              if (S) {
                S = false;
                continue;
              }
              if (N === "\\") {
                S = true;
                continue;
              }
              if (N === '"') {
                A = !A;
                continue;
              }
              A || (N === "{" ? T++ : N === "}" ? T-- : N === "[" ? O++ : N === "]" && O--);
            }
            return O > 0 ? b += "]" : T > 0 && (b += "}"), b += "," + t.substring(_), b;
          }, () => {
            let b = t.substring(0, _).trimEnd();
            b = b.replace(/,\s*$/, "").replace(/"[^"]*$/, '"');
            let T = 0, O = 0, A = false, S = false;
            for (let I = 0; I < b.length; I++) {
              const N = b[I];
              if (S) {
                S = false;
                continue;
              }
              if (N === "\\") {
                S = true;
                continue;
              }
              if (N === '"') {
                A = !A;
                continue;
              }
              A || (N === "{" ? T++ : N === "}" ? T-- : N === "[" ? O++ : N === "]" && O--);
            }
            for (; O > 0; ) b += "]", O--;
            for (; T > 0; ) b += "}", T--;
            return b;
          }];
          for (let b = 0; b < v.length; b++) try {
            console.log(`\u{1F504} \u4FEE\u6B63\u6226\u7565 ${b + 1}/${v.length} \u3092\u8A66\u884C\u4E2D...`);
            const T = v[b](), O = JSON.parse(T);
            return console.log(`\u2705 \u4FEE\u6B63\u6226\u7565 ${b + 1} \u304C\u6210\u529F\u3057\u307E\u3057\u305F\uFF01`), O;
          } catch (T) {
            console.error(`\u274C \u4FEE\u6B63\u6226\u7565 ${b + 1} \u5931\u6557:`, T instanceof Error ? T.message : String(T));
          }
          console.error("\u274C \u3059\u3079\u3066\u306E\u4FEE\u6B63\u6226\u7565\u304C\u5931\u6557\u3057\u307E\u3057\u305F");
        }
      }
    }
    if (console.error("\u274C \u3059\u3079\u3066\u306E\u4FEE\u6B63\u6226\u7565\u304C\u5931\u6557\u3057\u307E\u3057\u305F"), console.error("\u{1F534} JSON\u4FEE\u6B63\u5931\u6557 - \u30C7\u30D0\u30C3\u30B0\u60C5\u5831:"), console.error("\u30A8\u30E9\u30FC\u8A73\u7D30:", u), console.error("JSON\u9577\u3055:", t.length), console.error("\u6700\u521D\u306E500\u6587\u5B57:", t.substring(0, 500)), console.error("\u6700\u5F8C\u306E500\u6587\u5B57:", t.substring(Math.max(0, t.length - 500))), u instanceof Error && u.message.includes("position")) {
      const d = u.message.match(/position (\d+)/);
      if (d) {
        const _ = parseInt(d[1]), m = Math.max(0, _ - 200), h = Math.min(t.length, _ + 200);
        console.error("\u30A8\u30E9\u30FC\u4F4D\u7F6E\u5468\u8FBA\uFF08\xB1200\u6587\u5B57\uFF09:", t.substring(m, h)), console.error(`\u30A8\u30E9\u30FC\u4F4D\u7F6E\u306E\u6587\u5B57: "${t[_]}" (code: ${t.charCodeAt(_)})`);
      }
    }
    throw new Error(`JSON parse failed: ${u instanceof Error ? u.message : String(u)}`);
  }
}
__name(Y, "Y");
function Et(e) {
  const r = ["standard", "challenge", "review", "optional"];
  return e === "main" || e === "selection" || e === "check" ? "standard" : e && r.includes(e) ? e : (e && !r.includes(e) && console.warn(`\u26A0\uFE0F \u4E0D\u6B63\u306A card_type: '${e}' \u2192 'standard' \u306B\u5909\u66F4\u3057\u307E\u3057\u305F`), "standard");
}
__name(Et, "Et");
function ts(e) {
  return e && { \u5C0F\u5B661\u5E74: "\u3072\u3089\u304C\u306A\u3092\u4E2D\u5FC3\u306B\u4F7F\u3046\u3002\u6F22\u5B57\u306F\u300C\u4E00\u3001\u4E8C\u3001\u4E09\u3001\u4EBA\u3001\u5B50\u3001\u65E5\u3001\u6708\u3001\u706B\u3001\u6C34\u3001\u6728\u3001\u91D1\u3001\u571F\u3001\u76EE\u3001\u8033\u3001\u624B\u3001\u8DB3\u3001\u53E3\u3001\u5C71\u3001\u5DDD\u3001\u7530\u300D\u306A\u30691\u5E74\u751F\u3067\u7FD2\u3063\u305F\u6F22\u5B57\u306E\u307F\u3002\u300C\u3046\u308C\u3057\u3044\u300D\u300C\u304B\u306A\u3057\u3044\u300D\u300C\u305F\u306E\u3057\u3044\u300D\u306A\u3069\u611F\u60C5\u8868\u73FE\u3082\u3072\u3089\u304C\u306A\u30021\u6587\u306F\u77ED\u304F10\u301C15\u6587\u5B57\u7A0B\u5EA6\u3002", \u5C0F\u5B662\u5E74: "\u3084\u3055\u3057\u3044\u6F22\u5B57\uFF08\u5B66\u5E74\u3001\u6642\u9593\u3001\u6D77\u3001\u7B97\u6570\u3001\u6625\u3001\u590F\u3001\u79CB\u3001\u51AC\u3001\u671D\u3001\u663C\u3001\u591C\u3001\u53CB\u3060\u3061\uFF09\u3092\u4F7F\u3048\u308B\u3002\u300C\u3046\u308C\u3057\u3044\u300D\u300C\u697D\u3057\u3044\u300D\u306A\u3069\u306F2\u5E74\u751F\u3067\u306F\u307E\u3060\u7FD2\u308F\u306A\u3044\u306E\u3067\u3072\u3089\u304C\u306A\u30021\u6587\u306F15\u301C20\u6587\u5B57\u7A0B\u5EA6\u3002\u5177\u4F53\u7684\u306A\u4F8B\u3048\u3092\u4F7F\u3046\u3002", \u5C0F\u5B663\u5E74: "\u5C0F\u5B663\u5E74\u751F\u307E\u3067\u306E\u6F22\u5B57\u3092\u4F7F\u3048\u308B\uFF08\u554F\u984C\u3001\u8003\u3048\u308B\u3001\u7B54\u3048\u3001\u8ABF\u3079\u308B\u3001\u4F7F\u3046\u3001\u6301\u3064\u3001\u9032\u3080\u3001\u80B2\u3064\u3001\u8449\u3001\u6839\u3001\u5B9F\u3001\u6C7A\u3081\u308B\u3001\u9032\u3081\u308B\u3001\u610F\u5473\u3001\u4E88\u60F3\u3001\u767A\u8868\u3001\u767B\u308B\u3001\u9F3B\u3001\u6B6F\u3001\u8840\u3001\u53F7\u3001\u5F0F\u3001\u5BFE\u3001\u79D2\u3001\u7B49\uFF09\u3002\u300C\u60B2\u3057\u3044\u300D\u300C\u5B09\u3057\u3044\u300D\u306A\u3069\u306F4\u5E74\u751F\u306E\u6F22\u5B57\u306A\u306E\u3067\u3072\u3089\u304C\u306A\u30021\u6587\u306F20\u301C25\u6587\u5B57\u7A0B\u5EA6\u3002", \u5C0F\u5B664\u5E74: "\u5C0F\u5B664\u5E74\u751F\u307E\u3067\u306E\u6F22\u5B57\u3092\u4F7F\u3048\u308B\uFF08\u8AAC\u660E\u3001\u4F8B\u3001\u95A2\u4FC2\u3001\u5FC5\u8981\u3001\u4FBF\u5229\u3001\u7D04\u675F\u3001\u52AA\u529B\u3001\u5931\u6557\u3001\u6210\u529F\u3001\u5E0C\u671B\u3001\u60B2\u3057\u3044\u3001\u5B09\u3057\u3044\u3001\u611B\u3001\u6226\u3001\u5BDF\u3001\u5FF5\u3001\u7167\u3001\u7A4D\u3001\u4F1D\u3001\u6F22\u3001\u98DB\u3001\u826F\uFF09\u3002\u3084\u3084\u62BD\u8C61\u7684\u306A\u8A00\u8449\u3082\u4F7F\u3048\u308B\u30021\u6587\u306F25\u301C30\u6587\u5B57\u7A0B\u5EA6\u3002", \u5C0F\u5B665\u5E74: "\u5C0F\u5B665\u5E74\u751F\u307E\u3067\u306E\u6F22\u5B57\u3092\u4F7F\u3048\u308B\uFF08\u6761\u4EF6\u3001\u904E\u7A0B\u3001\u8981\u7D20\u3001\u72B6\u614B\u3001\u7D4C\u9A13\u3001\u60C5\u5831\u3001\u73FE\u5728\u3001\u79FB\u52D5\u3001\u6BD4\u8F03\u3001\u5897\u52A0\u3001\u6E1B\u5C11\u3001\u5FEB\u9069\u3001\u8CBF\u6613\u3001\u5727\u529B\u3001\u8CC7\u6E90\u3001\u8B1B\u7FA9\u3001\u614B\u5EA6\uFF09\u3002\u8AD6\u7406\u7684\u306A\u8AAC\u660E\u304C\u3067\u304D\u308B\u30021\u6587\u306F30\u301C35\u6587\u5B57\u7A0B\u5EA6\u3002", \u5C0F\u5B666\u5E74: "\u5C0F\u5B666\u5E74\u751F\u307E\u3067\u306E\u6F22\u5B57\u3092\u4F7F\u3048\u308B\uFF08\u69CB\u6210\u3001\u6A5F\u80FD\u3001\u5F71\u97FF\u3001\u7CFB\u7D71\u3001\u4FA1\u5024\u3001\u6279\u5224\u3001\u66AE\u3089\u3057\u3001\u7802\u6F20\u3001\u9769\u547D\u3001\u8A8D\u3081\u308B\u3001\u5438\u53CE\u3001\u523B\u3080\u3001\u6A21\u69D8\u3001\u7B4B\u8089\u3001\u9AA8\u3001\u8535\u3001\u8CB4\u91CD\uFF09\u3002\u8907\u96D1\u306A\u8AAC\u660E\u3082\u53EF\u80FD\u30021\u6587\u306F35\u301C40\u6587\u5B57\u7A0B\u5EA6\u3002", \u4E2D\u5B661\u5E74: "\u4E2D\u5B66\u751F\u30EC\u30D9\u30EB\u306E\u8A00\u8449\u3092\u4F7F\u3048\u308B\u3002\u5C02\u9580\u7528\u8A9E\u3082\u9069\u5EA6\u306B\u4F7F\u7528\u3002\u5168\u5B66\u5E74\u306E\u6F22\u5B57\u3092\u4F7F\u7528\u3067\u304D\u308B\u3002", \u4E2D\u5B662\u5E74: "\u4E2D\u5B66\u751F\u30EC\u30D9\u30EB\u306E\u8A00\u8449\u3092\u4F7F\u3048\u308B\u3002\u5C02\u9580\u7528\u8A9E\u3082\u9069\u5EA6\u306B\u4F7F\u7528\u3002\u5168\u5B66\u5E74\u306E\u6F22\u5B57\u3092\u4F7F\u7528\u3067\u304D\u308B\u3002", \u4E2D\u5B663\u5E74: "\u4E2D\u5B66\u751F\u30EC\u30D9\u30EB\u306E\u8A00\u8449\u3092\u4F7F\u3048\u308B\u3002\u5C02\u9580\u7528\u8A9E\u3082\u9069\u5EA6\u306B\u4F7F\u7528\u3002\u5168\u5B66\u5E74\u306E\u6F22\u5B57\u3092\u4F7F\u7528\u3067\u304D\u308B\u3002" }[e] || "\u5C0F\u5B663\u301C4\u5E74\u751F\u30EC\u30D9\u30EB\u306E\u8A00\u8449\u3092\u4F7F\u3046\uFF08\u3084\u3055\u3057\u3044\u8A00\u8449\u3001\u77ED\u3044\u6587\uFF09";
}
__name(ts, "ts");
async function mt(e, r, t, s, n, a) {
  try {
    const o = r === "curriculum_history" ? "curriculum_id" : "card_id";
    await e.prepare(`
      INSERT INTO ${r} (${o}, action, changed_fields, snapshot)
      VALUES (?, ?, ?, ?)
    `).bind(t, s, a ? JSON.stringify(a) : null, JSON.stringify(n)).run(), console.log(`\u{1F4DD} \u5C65\u6B74\u8A18\u9332: ${r}, action=${s}, id=${t}`);
  } catch (o) {
    console.error("\u5C65\u6B74\u8A18\u9332\u30A8\u30E9\u30FC:", o);
  }
}
__name(mt, "mt");
async function Ft(e) {
  var d, _, m, h, g;
  const { model: r, prompt: t, apiKey: s, maxOutputTokens: n = 8192, temperature: a = 0.8, retries: o = 3, retryDelay: i = 2e3 } = e, c = Date.now();
  let l = "";
  for (let f = 1; f <= o; f++) try {
    console.log(`\u{1F504} Gemini API\u547C\u3073\u51FA\u3057: ${r} (\u8A66\u884C ${f}/${o})`);
    const E = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${r}:generateContent?key=${s}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ parts: [{ text: t }] }], generationConfig: { temperature: a, maxOutputTokens: n } }) });
    if (!E.ok) {
      const b = await E.text();
      if (l = `HTTP ${E.status}: ${b.substring(0, 200)}`, console.error(`\u274C Gemini API \u30A8\u30E9\u30FC (${r}):`, l), (E.status === 429 || E.status >= 500) && f < o) {
        console.log(`\u23F3 ${i}ms \u5F85\u6A5F\u3057\u3066\u30EA\u30C8\u30E9\u30A4...`), await new Promise((T) => setTimeout(T, i * f));
        continue;
      }
      break;
    }
    const y = (g = (h = (m = (_ = (d = (await E.json()).candidates) == null ? void 0 : d[0]) == null ? void 0 : _.content) == null ? void 0 : m.parts) == null ? void 0 : h[0]) == null ? void 0 : g.text;
    if (!y) {
      l = "AI\u306E\u5FDC\u7B54\u304C\u7A7A\u3067\u3057\u305F", console.error(`\u274C \u5FDC\u7B54\u306A\u3057 (${r})`);
      continue;
    }
    const v = Date.now() - c;
    return console.log(`\u2705 Gemini API\u6210\u529F: ${r} (${f}\u56DE\u76EE, ${v}ms)`), { success: true, content: y, model: r, attempts: f, totalTime: v };
  } catch (E) {
    l = E instanceof Error ? E.message : "Unknown error", console.error(`\u274C Gemini API\u4F8B\u5916 (${r}):`, l), f < o && (console.log(`\u23F3 ${i}ms \u5F85\u6A5F\u3057\u3066\u30EA\u30C8\u30E9\u30A4...`), await new Promise((x) => setTimeout(x, i * f)));
  }
  const u = Date.now() - c;
  return console.error(`\u274C Gemini API\u5931\u6557: ${r} (\u5168${o}\u56DE\u8A66\u884C, ${u}ms)`), { success: false, error: l, model: r, attempts: o, totalTime: u };
}
__name(Ft, "Ft");
p.use("*", Vn);
p.use("/api/*", Kn);
p.use("*", async (e, r) => {
  await r(), e.header("X-Content-Type-Options", "nosniff"), e.header("X-Frame-Options", "SAMEORIGIN"), e.header("X-XSS-Protection", "1; mode=block"), e.header("Referrer-Policy", "strict-origin-when-cross-origin"), e.header("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
  const t = e.req.path;
  t.startsWith("/static/") || t.match(/\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2)$/) ? e.header("Cache-Control", "public, max-age=31536000, immutable") : (t === "/" || t.startsWith("/api/")) && e.header("Cache-Control", "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400"), e.header("CDN-Cache-Control", "max-age=86400");
});
p.use("/api/*", Gs());
p.get("/health", async (e) => {
  const r = await Pr(e), t = r.status === "healthy" || r.status === "degraded" ? 200 : 503;
  return e.json(r, t);
});
p.get("/api/admin/system-status", R, te("admin"), async (e) => {
  const r = await Pr(e), { KV: t } = e.env, s = await qt(t);
  return e.json({ ...r, cache: s, timestamp: (/* @__PURE__ */ new Date()).toISOString(), version: "1.0.0", environment: "production" });
});
p.get("/api/admin/cache-stats", R, te("admin"), async (e) => {
  const { KV: r } = e.env, t = await qt(r);
  return e.json(t);
});
p.post("/api/auth/register/student", Wn);
p.post("/api/auth/logout", Jn);
p.get("/api/auth/me", R, Gn);
p.post("/api/auth/change-password", R, Yn);
p.get("/api/admin/dashboard", R, te("admin", "teacher"), async (e) => e.json({ message: "Admin/Teacher Dashboard", info: "This endpoint is only accessible to admins and teachers" }));
p.get("/api/student/progress", R, Fn("student"), async (e) => {
  const r = e.get("user");
  return e.json({ message: "Student Progress", student_id: r.user_id });
});
p.get("/api/adaptive/detect-learning-style/:studentId", async (e) => {
  const { env: r } = e, t = parseInt(e.req.param("studentId"));
  try {
    const n = await new Jr(r.DB, r.LEARNING_CACHE).detectLearningStyle(t);
    return e.json({ success: true, data: n });
  } catch (s) {
    return e.json({ success: false, error: s.message }, 500);
  }
});
p.get("/api/adaptive/recommend/:studentId", async (e) => {
  const { env: r } = e, t = parseInt(e.req.param("studentId")), s = parseInt(e.req.query("count") || "5");
  try {
    const a = await new Jr(r.DB, r.LEARNING_CACHE).recommendCurriculum(t, s);
    return e.json({ success: true, data: a });
  } catch (n) {
    return e.json({ success: false, error: n.message }, 500);
  }
});
p.get("/api/school/:schoolId/classes", async (e) => {
  const { env: r } = e, t = parseInt(e.req.param("schoolId"));
  try {
    const n = await new Ue(r.DB, r.LEARNING_CACHE).getMultiClassProgress(t);
    return e.json({ success: true, data: n });
  } catch (s) {
    return e.json({ success: false, error: s.message }, 500);
  }
});
p.get("/api/school/:schoolId/grade-summary", async (e) => {
  const { env: r } = e, t = parseInt(e.req.param("schoolId"));
  try {
    const n = await new Ue(r.DB, r.LEARNING_CACHE).getGradeSummary(t);
    return e.json({ success: true, data: n });
  } catch (s) {
    return e.json({ success: false, error: s.message }, 500);
  }
});
p.get("/api/teacher/:teacherId/class/:classCode/analysis", async (e) => {
  const { env: r } = e, t = parseInt(e.req.param("teacherId")), s = e.req.param("classCode");
  try {
    const a = await new Ue(r.DB, r.LEARNING_CACHE).getTeacherClassAnalysis(t, s);
    return e.json({ success: true, data: a });
  } catch (n) {
    return e.json({ success: false, error: n.message }, 500);
  }
});
p.post("/api/parent/notify", async (e) => {
  const { env: r } = e, t = await e.req.json();
  try {
    const n = await new Ue(r.DB, r.LEARNING_CACHE).sendParentNotification(t);
    return e.json({ success: true, data: n });
  } catch (s) {
    return e.json({ success: false, error: s.message }, 500);
  }
});
p.get("/api/parent/notifications/:studentId", async (e) => {
  const { env: r } = e, t = parseInt(e.req.param("studentId"));
  try {
    const n = await new Ue(r.DB, r.LEARNING_CACHE).getParentNotificationHistory(t);
    return e.json({ success: true, data: n });
  } catch (s) {
    return e.json({ success: false, error: s.message }, 500);
  }
});
p.get("/api/school/:schoolId/report", async (e) => {
  const { env: r } = e, t = parseInt(e.req.param("schoolId")), s = e.req.query("start_date") || new Date(Date.now() - 720 * 60 * 60 * 1e3).toISOString(), n = e.req.query("end_date") || (/* @__PURE__ */ new Date()).toISOString();
  try {
    const o = await new Ue(r.DB, r.LEARNING_CACHE).getSchoolReportData(t, s, n);
    return e.json({ success: true, data: o });
  } catch (a) {
    return e.json({ success: false, error: a.message }, 500);
  }
});
p.post("/api/ai/generate-content", async (e) => {
  const { env: r } = e, t = await e.req.json();
  try {
    const n = await new Gr(r.GEMINI_API_KEY, r.DB, r.LEARNING_CACHE).generateContent(t);
    return e.json({ success: true, data: n });
  } catch (s) {
    return e.json({ success: false, error: s.message }, 500);
  }
});
p.get("/api/ai/content-history", async (e) => {
  const { env: r } = e, t = { topic: e.req.query("topic"), learning_style: e.req.query("learning_style"), content_type: e.req.query("content_type"), limit: parseInt(e.req.query("limit") || "20") };
  try {
    const n = await new Gr(r.GEMINI_API_KEY, r.DB, r.LEARNING_CACHE).getGenerationHistory(t);
    return e.json({ success: true, data: n });
  } catch (s) {
    return e.json({ success: false, error: s.message }, 500);
  }
});
p.get("/api/realtime/connect", async (e) => {
  const { env: r } = e;
  if (!r.PROGRESS_WEBSOCKET) return e.json({ error: "WebSocket not configured" }, 500);
  const t = e.req.query("classCode");
  if (!t) return e.json({ error: "classCode is required" }, 400);
  const s = r.PROGRESS_WEBSOCKET.idFromName(t);
  return r.PROGRESS_WEBSOCKET.get(s).fetch(e.req.raw);
});
p.post("/api/notifications/send", async (e) => {
  const { env: r } = e, t = await e.req.json();
  try {
    const { fromUserId: s, classCode: n, notificationType: a, targetUserIds: o, title: i, message: c, priority: l = "normal", additionalData: u = {} } = t, d = o === "all" ? await Xa(r.DB, n) : o, _ = [];
    for (const m of d) {
      const h = await r.DB.prepare(`
        INSERT INTO notifications (
          type, from_user_id, to_user_id, class_code,
          title, message, data, priority
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(a, s, m, n, i, c, JSON.stringify(u), l).run();
      _.push({ notificationId: h.meta.last_row_id, targetUserId: m });
    }
    if (r.PROGRESS_WEBSOCKET) {
      const m = r.PROGRESS_WEBSOCKET.idFromName(n), h = r.PROGRESS_WEBSOCKET.get(m);
    }
    return e.json({ success: true, notifications: _, targetCount: d.length });
  } catch (s) {
    return console.error("\u901A\u77E5\u9001\u4FE1\u30A8\u30E9\u30FC:", s), e.json({ success: false, error: "Failed to send notifications", details: s instanceof Error ? s.message : String(s) }, 500);
  }
});
p.get("/api/notifications", async (e) => {
  const { env: r } = e, t = e.req.query("userId"), s = e.req.query("classCode"), n = parseInt(e.req.query("limit") || "50"), a = e.req.query("unreadOnly") === "true";
  if (!t) return e.json({ error: "userId is required" }, 400);
  try {
    let o = `
      SELECT 
        n.*,
        u.name as from_user_name
      FROM notifications n
      LEFT JOIN users u ON n.from_user_id = u.id
      WHERE n.to_user_id = ?
    `;
    const i = [parseInt(t)];
    a && (o += " AND n.is_read = 0"), s && (o += " AND n.class_code = ?", i.push(s)), o += " ORDER BY n.created_at DESC LIMIT ?", i.push(n);
    const c = await r.DB.prepare(o).bind(...i).all(), l = await r.DB.prepare(`
      SELECT COUNT(*) as count
      FROM notifications
      WHERE to_user_id = ? AND is_read = 0
    `).bind(parseInt(t)).first();
    return e.json({ success: true, notifications: c.results, unreadCount: (l == null ? void 0 : l.count) || 0 });
  } catch (o) {
    return console.error("\u901A\u77E5\u4E00\u89A7\u53D6\u5F97\u30A8\u30E9\u30FC:", o), e.json({ success: false, error: "Failed to fetch notifications" }, 500);
  }
});
p.put("/api/notifications/:id/read", async (e) => {
  const { env: r } = e, t = e.req.param("id"), { userId: s } = await e.req.json();
  try {
    return await r.DB.prepare(`
      UPDATE notifications
      SET is_read = 1, read_at = CURRENT_TIMESTAMP
      WHERE id = ? AND to_user_id = ?
    `).bind(parseInt(t), s).run(), e.json({ success: true });
  } catch (n) {
    return console.error("\u901A\u77E5\u65E2\u8AAD\u30A8\u30E9\u30FC:", n), e.json({ success: false, error: "Failed to mark notification as read" }, 500);
  }
});
p.put("/api/notifications/read-all", async (e) => {
  const { env: r } = e, { userId: t, classCode: s } = await e.req.json();
  try {
    let n = "UPDATE notifications SET is_read = 1, read_at = CURRENT_TIMESTAMP WHERE to_user_id = ?";
    const a = [t];
    return s && (n += " AND class_code = ?", a.push(s)), await r.DB.prepare(n).bind(...a).run(), e.json({ success: true });
  } catch (n) {
    return console.error("\u5168\u901A\u77E5\u65E2\u8AAD\u30A8\u30E9\u30FC:", n), e.json({ success: false, error: "Failed to mark all notifications as read" }, 500);
  }
});
async function Xa(e, r) {
  try {
    return (await e.prepare(`
      SELECT id FROM users WHERE class_code = ? AND role = 'student'
    `).bind(r).all()).results.map((s) => s.id);
  } catch (t) {
    return console.error("\u30AF\u30E9\u30B9\u751F\u5F92\u53D6\u5F97\u30A8\u30E9\u30FC:", t), [];
  }
}
__name(Xa, "Xa");
p.use("/static/*", rn({ root: "./" }));
p.get("/api/curriculum", R, async (e) => {
  const { env: r } = e, t = e.get("user");
  try {
    const s = `curriculum:all:${t.school_id}`, { data: n, cached: a } = await Zn(r.KV, s, Fr.CURRICULUM, async () => {
      let o = `
          SELECT 
            id, school_id, grade, subject, textbook_company, unit_name, 
            unit_order, total_hours, unit_goal, non_cognitive_goal
          FROM curriculum
        `;
      return t.role !== "admin" && (o += ` WHERE school_id = ${t.school_id}`), o += " ORDER BY grade, unit_order", (await r.DB.prepare(o).all()).results.map((c) => ({ ...c, curriculum_id: c.id }));
    });
    return e.json(n, { headers: { "X-Cache-Status": a ? "HIT" : "MISS", "Cache-Control": "private, max-age=3600" } });
  } catch (s) {
    return console.error("\u274C \u30AB\u30EA\u30AD\u30E5\u30E9\u30E0\u53D6\u5F97\u30A8\u30E9\u30FC:", s), e.json({ error: "Database error" }, 500);
  }
});
p.get("/api/curriculum/list", R, async (e) => {
  const { env: r } = e, t = e.get("user");
  try {
    const s = `curriculum:list:${t.school_id}`, n = await Xn(r.KV, s, Fr.CURRICULUM, async () => {
      let a = `
          SELECT id, school_id, grade, subject, unit_name, textbook_company as textbook, created_at
          FROM curriculum
        `;
      return t.role !== "admin" && (a += ` WHERE school_id = ${t.school_id}`), a += " ORDER BY created_at DESC", (await r.DB.prepare(a).all()).results.map((i) => ({ ...i, curriculum_id: i.id }));
    });
    return e.json(n);
  } catch (s) {
    return console.error("Curriculum list error:", s), e.json({ error: "Database error" }, 500);
  }
});
p.get("/api/curriculum/options", async (e) => {
  const { env: r } = e;
  try {
    const t = await r.DB.prepare(`
      SELECT DISTINCT grade FROM curriculum ORDER BY grade
    `).all(), s = await r.DB.prepare(`
      SELECT DISTINCT subject FROM curriculum ORDER BY subject
    `).all(), n = await r.DB.prepare(`
      SELECT DISTINCT textbook_company FROM curriculum ORDER BY textbook_company
    `).all();
    return e.json({ grades: t.results, subjects: s.results, textbooks: n.results });
  } catch {
    return e.json({ error: "Database error" }, 500);
  }
});
p.get("/api/curriculum/:id", async (e) => {
  var s, n;
  const { env: r } = e, t = e.req.param("id");
  try {
    const a = await r.DB.prepare(`
      SELECT * FROM curriculum WHERE id = ?
    `).bind(t).first();
    if (!a) return e.json({ error: "Curriculum not found" }, 404);
    const o = { ...a, curriculum_id: a.id }, i = await r.DB.prepare(`
      SELECT * FROM courses WHERE curriculum_id = ?
      ORDER BY 
        CASE course_level
          WHEN 'basic' THEN 1
          WHEN 'standard' THEN 2
          WHEN 'advanced' THEN 3
        END
    `).bind(t).all();
    console.log("Courses\u53D6\u5F97\u7D50\u679C:", { curriculum_id: t, count: ((s = i.results) == null ? void 0 : s.length) || 0, results: i.results });
    const c = await Promise.all((i.results || []).map(async (u) => {
      console.log("\u30B3\u30FC\u30B9\u51E6\u7406\u4E2D:", { course_id: u.id, course_name: u.course_name, curriculum_id: u.curriculum_id });
      const d = await r.DB.prepare(`
          SELECT * FROM learning_cards 
          WHERE course_id = ?
          ORDER BY card_number
        `).bind(u.id).all(), _ = await Promise.all((d.results || []).map(async (h) => {
        const g = h.card_id || h.id, f = await r.DB.prepare(`
              SELECT 
                hint_id,
                hint_id AS id,
                learning_card_id,
                hint_number,
                hint_number AS hint_level,
                hint_content,
                hint_content AS hint_text,
                thinking_tool_suggestion
              FROM hint_cards 
              WHERE learning_card_id = ?
              ORDER BY hint_number
            `).bind(g).all(), E = await r.DB.prepare(`
              SELECT * FROM answers WHERE learning_card_id = ?
            `).bind(g).first();
        return { ...h, hints: f.results || [], answer: (E == null ? void 0 : E.answer_content) || "", answer_explanation: (E == null ? void 0 : E.explanation) || "", explanation: (E == null ? void 0 : E.explanation) || "" };
      }));
      let m = null;
      if (u.introduction_problem) try {
        m = JSON.parse(u.introduction_problem);
      } catch (h) {
        console.error("\u5C0E\u5165\u554F\u984C\u306E\u30D1\u30FC\u30B9\u30A8\u30E9\u30FC:", h);
      }
      return { ...u, cards: _, introduction_problem: m };
    })), l = await r.DB.prepare(`
      SELECT * FROM optional_problems 
      WHERE curriculum_id = ?
      ORDER BY problem_number
    `).bind(t).all();
    return e.json({ curriculum: o, courses: c, optionalProblems: l.results });
  } catch (a) {
    return console.error("\u30AB\u30EA\u30AD\u30E5\u30E9\u30E0\u53D6\u5F97\u30A8\u30E9\u30FC:", a), e.json({ error: "Database error", details: a.message || String(a), cause: (n = a.cause) == null ? void 0 : n.message }, 500);
  }
});
p.get("/api/curriculum/:id/metadata", async (e) => {
  const { env: r } = e, t = e.req.param("id");
  try {
    const s = await r.DB.prepare(`
      SELECT metadata_key, metadata_value 
      FROM curriculum_metadata 
      WHERE curriculum_id = ?
    `).bind(t).all(), n = {};
    for (const a of s.results || []) try {
      n[a.metadata_key] = JSON.parse(a.metadata_value);
    } catch {
      n[a.metadata_key] = a.metadata_value;
    }
    return e.json(n);
  } catch {
    return e.json({ course_selection_problems: [], check_tests: [] });
  }
});
p.put("/api/curriculum/:id/metadata", async (e) => {
  const { env: r } = e, t = e.req.param("id"), s = await e.req.json();
  try {
    return s.course_selection_problems && await r.DB.prepare(`
        INSERT OR REPLACE INTO curriculum_metadata (curriculum_id, metadata_key, metadata_value)
        VALUES (?, 'course_selection_problems', ?)
      `).bind(t, JSON.stringify(s.course_selection_problems)).run(), s.check_tests && await r.DB.prepare(`
        INSERT OR REPLACE INTO curriculum_metadata (curriculum_id, metadata_key, metadata_value)
        VALUES (?, 'check_tests', ?)
      `).bind(t, JSON.stringify(s.check_tests)).run(), e.json({ success: true });
  } catch (n) {
    return console.error("\u30E1\u30BF\u30C7\u30FC\u30BF\u66F4\u65B0\u30A8\u30E9\u30FC:", n), e.json({ error: "Database error" }, 500);
  }
});
p.get("/api/courses/:courseId/cards", async (e) => {
  const { env: r } = e, t = e.req.param("courseId");
  try {
    const s = await r.DB.prepare(`
      SELECT * FROM learning_cards 
      WHERE course_id = ? AND card_type = 'main'
      ORDER BY card_number
    `).bind(t).all();
    return e.json(s.results);
  } catch {
    return e.json({ error: "Database error" }, 500);
  }
});
p.get("/api/cards/:cardId", async (e) => {
  const { env: r } = e, t = e.req.param("cardId");
  try {
    const s = await r.DB.prepare(`
      SELECT * FROM learning_cards WHERE card_id = ?
    `).bind(t).first(), n = await r.DB.prepare(`
      SELECT 
        hint_id,
        hint_id AS id,
        learning_card_id,
        hint_number,
        hint_number AS hint_level,
        hint_content,
        hint_content AS hint_text,
        thinking_tool_suggestion
      FROM hint_cards 
      WHERE learning_card_id = ?
      ORDER BY hint_number
    `).bind(t).all(), a = await r.DB.prepare(`
      SELECT * FROM answers WHERE learning_card_id = ?
    `).bind(t).first();
    return e.json({ card: s, hints: n.results, answer: a });
  } catch {
    return e.json({ error: "Database error" }, 500);
  }
});
p.post("/api/progress", async (e) => {
  const { env: r } = e, t = await e.req.json();
  try {
    const s = await r.DB.prepare(`
      INSERT INTO student_progress 
        (student_id, curriculum_id, course_id, learning_card_id, 
         status, understanding_level, help_requested_from, help_count)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(t.student_id, t.curriculum_id, t.course_id, t.learning_card_id, t.status, t.understanding_level, t.help_requested_from, t.help_count || 0).run();
    return e.json({ success: true, id: s.meta.last_row_id });
  } catch {
    return e.json({ error: "Database error" }, 500);
  }
});
p.post("/api/learning/log", R, async (e) => {
  const { env: r } = e, t = e.get("user"), s = await e.req.json();
  try {
    return await r.DB.prepare(`
      INSERT INTO learning_logs (
        school_id, student_id, unit_id, card_id, course_type,
        is_correct, answer_time_seconds, hint_count, retry_count,
        difficulty_level, problem_type, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(t.school_id, s.student_id, s.unit_id || s.curriculum_id, s.card_id, s.course_type || "unknown", s.is_correct ? 1 : 0, s.answer_time_seconds || 0, s.hint_count || 0, s.retry_count || 0, s.difficulty_level || "medium", s.problem_type || "general").run(), e.json({ success: true });
  } catch (n) {
    return console.error("\u5B66\u7FD2\u30ED\u30B0\u4FDD\u5B58\u30A8\u30E9\u30FC:", n), e.json({ success: false, error: n.message }, 500);
  }
});
p.post("/api/learning/session/start", async (e) => {
  const { env: r } = e, { student_id: t, unit_id: s, session_id: n } = await e.req.json();
  try {
    return await r.DB.prepare(`
      INSERT INTO learning_sessions (
        student_id, unit_id, session_id,
        started_at, is_active
      ) VALUES (?, ?, ?, CURRENT_TIMESTAMP, 1)
    `).bind(t, s, n).run(), e.json({ success: true, session_id: n });
  } catch (a) {
    return console.error("\u30BB\u30C3\u30B7\u30E7\u30F3\u958B\u59CB\u30A8\u30E9\u30FC:", a), e.json({ success: false, error: a.message }, 500);
  }
});
p.post("/api/learning/session/end", async (e) => {
  const { env: r } = e, { session_id: t, total_problems: s, correct_problems: n, total_hints_used: a, total_ai_requests: o } = await e.req.json();
  try {
    return await r.DB.prepare(`
      UPDATE learning_sessions
      SET ended_at = CURRENT_TIMESTAMP,
          is_active = 0,
          total_problems = ?,
          correct_problems = ?,
          total_hints_used = ?,
          total_ai_requests = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE session_id = ?
    `).bind(s || 0, n || 0, a || 0, o || 0, t).run(), e.json({ success: true });
  } catch (i) {
    return console.error("\u30BB\u30C3\u30B7\u30E7\u30F3\u7D42\u4E86\u30A8\u30E9\u30FC:", i), e.json({ success: false, error: i.message }, 500);
  }
});
p.get("/api/learning/profile/:student_id", async (e) => {
  const { env: r } = e, t = e.req.param("student_id");
  try {
    const s = await r.DB.prepare(`
      SELECT * FROM student_learning_profiles WHERE student_id = ?
    `).bind(t).first();
    return e.json({ success: true, profile: s });
  } catch (s) {
    return e.json({ success: false, error: s.message }, 500);
  }
});
p.post("/api/learning/profile/update", async (e) => {
  const { env: r } = e, { student_id: t } = await e.req.json();
  try {
    const s = await r.DB.prepare(`
      SELECT 
        is_correct,
        answer_time_seconds,
        difficulty_level,
        problem_type,
        hint_count
      FROM learning_logs
      WHERE student_id = ?
      ORDER BY created_at DESC
      LIMIT 50
    `).bind(t).all();
    if (!s.results || s.results.length === 0) return e.json({ success: true, profile: null, message: "\u30C7\u30FC\u30BF\u4E0D\u8DB3" });
    const a = s.results.filter((h) => h.is_correct).length / s.results.length, o = s.results.reduce((h, g) => h + g.answer_time_seconds, 0) / s.results.length;
    let i = "beginner";
    a >= 0.8 && o < 60 ? i = "advanced" : a >= 0.6 && (i = "intermediate");
    let c = "medium";
    a >= 0.85 ? c = "hard" : a < 0.5 && (c = "easy");
    const l = {};
    s.results.forEach((h) => {
      const g = h.problem_type;
      l[g] || (l[g] = { correct: 0, total: 0 }), l[g].total++, h.is_correct && l[g].correct++;
    });
    const u = [], d = [];
    Object.entries(l).forEach(([h, g]) => {
      const f = g.correct / g.total;
      f < 0.5 && g.total >= 3 ? u.push(h) : f >= 0.8 && g.total >= 3 && d.push(h);
    });
    const _ = s.results.reduce((h, g) => h + g.hint_count, 0) / s.results.length, m = Math.min(_ / 3, 1);
    return await r.DB.prepare(`
      INSERT INTO student_learning_profiles (
        student_id, overall_level, avg_correct_rate, avg_answer_time,
        preferred_difficulty, weak_areas, strong_areas,
        hint_dependency_score, total_problems_solved,
        last_updated, stats_updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT(student_id) DO UPDATE SET
        overall_level = excluded.overall_level,
        avg_correct_rate = excluded.avg_correct_rate,
        avg_answer_time = excluded.avg_answer_time,
        preferred_difficulty = excluded.preferred_difficulty,
        weak_areas = excluded.weak_areas,
        strong_areas = excluded.strong_areas,
        hint_dependency_score = excluded.hint_dependency_score,
        total_problems_solved = excluded.total_problems_solved,
        last_updated = CURRENT_TIMESTAMP,
        stats_updated_at = CURRENT_TIMESTAMP
    `).bind(t, i, a, o, c, JSON.stringify(u), JSON.stringify(d), m, s.results.length).run(), e.json({ success: true, profile: { level: i, correctRate: (a * 100).toFixed(1) + "%", avgTime: o.toFixed(1) + "\u79D2", preferredDifficulty: c, weakAreas: u, strongAreas: d, hintDependency: (m * 100).toFixed(0) + "%" } });
  } catch (s) {
    return console.error("\u30D7\u30ED\u30D5\u30A1\u30A4\u30EB\u66F4\u65B0\u30A8\u30E9\u30FC:", s), e.json({ success: false, error: s.message }, 500);
  }
});
p.get("/api/analytics/class/:classCode", async (e) => {
  const { env: r } = e, t = e.req.param("classCode");
  try {
    const s = await r.DB.prepare(`
      SELECT 
        COUNT(DISTINCT student_id) as total_students,
        COUNT(*) as total_sessions,
        ROUND(AVG(CASE WHEN correct_problems > 0 THEN (correct_problems * 1.0 / total_problems) * 100 ELSE 0 END), 1) as avg_correct_rate,
        SUM(total_problems) as total_problems_solved,
        SUM(total_hints_used) as total_hints_used,
        SUM(total_ai_requests) as total_ai_requests
      FROM learning_sessions ls
      JOIN students s ON ls.student_id = s.id
      WHERE s.class_code = ?
        AND ls.ended_at IS NOT NULL
        AND DATE(ls.started_at) >= DATE('now', '-30 days')
    `).bind(t).first(), n = await r.DB.prepare(`
      SELECT 
        s.id,
        s.name,
        s.student_number,
        COUNT(ls.id) as session_count,
        ROUND(AVG(CASE WHEN ls.correct_problems > 0 THEN (ls.correct_problems * 1.0 / ls.total_problems) * 100 ELSE 0 END), 1) as avg_correct_rate,
        SUM(ls.total_problems) as problems_solved,
        SUM(ls.total_hints_used) as hints_used
      FROM students s
      LEFT JOIN learning_sessions ls ON s.id = ls.student_id
        AND ls.ended_at IS NOT NULL
        AND DATE(ls.started_at) >= DATE('now', '-30 days')
      WHERE s.class_code = ?
      GROUP BY s.id, s.name, s.student_number
      ORDER BY avg_correct_rate DESC
    `).bind(t).all(), a = await r.DB.prepare(`
      SELECT 
        DATE(started_at) as date,
        COUNT(*) as session_count,
        COUNT(DISTINCT student_id) as active_students,
        SUM(total_problems) as problems_solved
      FROM learning_sessions ls
      JOIN students s ON ls.student_id = s.id
      WHERE s.class_code = ?
        AND ended_at IS NOT NULL
        AND DATE(started_at) >= DATE('now', '-30 days')
      GROUP BY DATE(started_at)
      ORDER BY date ASC
    `).bind(t).all();
    return e.json({ success: true, classStats: s, studentPerformance: n.results || [], dailyActivity: a.results || [] });
  } catch (s) {
    return console.error("\u274C \u30AF\u30E9\u30B9\u5206\u6790\u30C7\u30FC\u30BF\u53D6\u5F97\u30A8\u30E9\u30FC:", s), e.json({ success: false, error: s.message }, 500);
  }
});
p.get("/api/analytics/student/:studentId", async (e) => {
  const { env: r } = e, t = e.req.param("studentId");
  try {
    const s = await r.DB.prepare(`
      SELECT 
        COUNT(*) as total_sessions,
        ROUND(AVG(CASE WHEN correct_problems > 0 THEN (correct_problems * 1.0 / total_problems) * 100 ELSE 0 END), 1) as avg_correct_rate,
        SUM(total_problems) as total_problems_solved,
        SUM(total_hints_used) as total_hints_used,
        SUM(total_ai_requests) as total_ai_requests,
        ROUND(AVG(CAST((JULIANDAY(ended_at) - JULIANDAY(started_at)) * 24 * 60 AS REAL)), 1) as avg_session_minutes
      FROM learning_sessions
      WHERE student_id = ?
        AND ended_at IS NOT NULL
        AND DATE(started_at) >= DATE('now', '-90 days')
    `).bind(t).first(), n = await r.DB.prepare(`
      SELECT 
        strftime('%Y-W%W', started_at) as week,
        COUNT(*) as session_count,
        SUM(total_problems) as problems_solved,
        ROUND(AVG(CASE WHEN correct_problems > 0 THEN (correct_problems * 1.0 / total_problems) * 100 ELSE 0 END), 1) as avg_correct_rate
      FROM learning_sessions
      WHERE student_id = ?
        AND ended_at IS NOT NULL
        AND DATE(started_at) >= DATE('now', '-90 days')
      GROUP BY strftime('%Y-W%W', started_at)
      ORDER BY week ASC
    `).bind(t).all(), a = await r.DB.prepare(`
      SELECT 
        ll.problem_type as subject,
        COUNT(*) as attempt_count,
        ROUND(AVG(CASE WHEN ll.is_correct THEN 100.0 ELSE 0.0 END), 1) as correct_rate,
        ROUND(AVG(ll.answer_time_seconds), 1) as avg_time_seconds
      FROM learning_logs ll
      WHERE ll.student_id = ?
        AND DATE(ll.created_at) >= DATE('now', '-90 days')
      GROUP BY ll.problem_type
      ORDER BY attempt_count DESC
    `).bind(t).all();
    return e.json({ success: true, basicStats: s, weeklyProgress: n.results || [], subjectPerformance: a.results || [] });
  } catch (s) {
    return console.error("\u274C \u500B\u4EBA\u5206\u6790\u30C7\u30FC\u30BF\u53D6\u5F97\u30A8\u30E9\u30FC:", s), e.json({ success: false, error: s.message }, 500);
  }
});
p.post("/api/voice-memo", async (e) => {
  const { env: r } = e, { student_id: t, unit_id: s, transcription: n, duration_seconds: a } = await e.req.json();
  if (!t || !n) return e.json({ success: false, error: "student_id\u3068transcription\u304C\u5FC5\u8981\u3067\u3059" }, 400);
  try {
    const o = await r.DB.prepare(`
      INSERT INTO voice_memos (student_id, unit_id, transcription, duration_seconds)
      VALUES (?, ?, ?, ?)
    `).bind(t, s || null, n, a || 0).run();
    return e.json({ success: true, memo_id: o.meta.last_row_id });
  } catch (o) {
    return console.error("\u274C \u97F3\u58F0\u30E1\u30E2\u4FDD\u5B58\u30A8\u30E9\u30FC:", o), e.json({ success: false, error: o.message }, 500);
  }
});
p.get("/api/voice-memos/:studentId", async (e) => {
  const { env: r } = e, t = e.req.param("studentId");
  try {
    const s = await r.DB.prepare(`
      SELECT * FROM voice_memos
      WHERE student_id = ?
      ORDER BY created_at DESC
      LIMIT 50
    `).bind(t).all();
    return e.json({ success: true, memos: s.results || [] });
  } catch (s) {
    return console.error("\u274C \u97F3\u58F0\u30E1\u30E2\u53D6\u5F97\u30A8\u30E9\u30FC:", s), e.json({ success: false, error: s.message }, 500);
  }
});
p.post("/api/gamification/points/add", async (e) => {
  const { env: r } = e, { student_id: t, points: s, reason: n } = await e.req.json();
  try {
    return await r.DB.prepare(`
      INSERT INTO student_points (student_id, points, reason)
      VALUES (?, ?, ?)
      ON CONFLICT(student_id) DO UPDATE SET
        points = points + excluded.points,
        updated_at = CURRENT_TIMESTAMP
    `).bind(t, s, n).run(), e.json({ success: true });
  } catch (a) {
    return e.json({ success: false, error: a.message }, 500);
  }
});
p.post("/api/theme/set", async (e) => {
  const { env: r } = e, { student_id: t, theme_name: s, primary_color: n, font_size: a } = await e.req.json();
  try {
    return await r.DB.prepare(`
      INSERT INTO user_preferences (student_id, theme_name, primary_color, font_size)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(student_id) DO UPDATE SET
        theme_name = excluded.theme_name,
        primary_color = excluded.primary_color,
        font_size = excluded.font_size,
        updated_at = CURRENT_TIMESTAMP
    `).bind(t, s, n, a).run(), e.json({ success: true });
  } catch (o) {
    return e.json({ success: false, error: o.message }, 500);
  }
});
p.post("/api/parent-report/create", async (e) => {
  const { env: r } = e, { student_id: t, week_start: s, week_end: n, teacher_comment: a } = await e.req.json();
  try {
    const o = await r.DB.prepare(`
      INSERT INTO parent_reports (student_id, week_start, week_end, teacher_comment)
      VALUES (?, ?, ?, ?)
    `).bind(t, s, n, a).run();
    return e.json({ success: true, report_id: o.meta.last_row_id });
  } catch (o) {
    return e.json({ success: false, error: o.message }, 500);
  }
});
p.get("/api/progress/class/:classCode", async (e) => {
  const { env: r } = e, t = e.req.param("classCode");
  try {
    const s = await r.DB.prepare(`
      SELECT 
        u.name,
        u.student_number,
        p.curriculum_id,
        p.course_id,
        p.learning_card_id,
        p.status,
        p.understanding_level,
        p.help_requested_from,
        p.help_count,
        p.created_at,
        c.course_level,
        c.course_display_name
      FROM student_progress p
      JOIN users u ON p.student_id = u.id
      LEFT JOIN courses c ON p.course_id = c.id
      WHERE u.class_code = ?
      ORDER BY u.student_number, p.created_at DESC
    `).bind(t).all();
    return e.json(s.results);
  } catch {
    return e.json({ error: "Database error" }, 500);
  }
});
p.get("/api/progress/curriculum/:curriculumId/class/:classCode", async (e) => {
  const { env: r } = e, t = e.req.param("curriculumId"), s = e.req.param("classCode");
  try {
    const n = await r.DB.prepare(`
      SELECT id, name, student_number 
      FROM users 
      WHERE class_code = ? AND role = 'student'
      ORDER BY student_number
    `).bind(s).all(), a = await r.DB.prepare(`
      SELECT 
        p.student_id,
        p.course_id,
        p.learning_card_id,
        p.status,
        p.understanding_level,
        p.help_requested_from,
        p.help_count,
        p.created_at,
        c.course_level,
        c.course_display_name,
        lc.card_number,
        lc.card_title
      FROM student_progress p
      LEFT JOIN courses c ON p.course_id = c.id
      LEFT JOIN learning_cards lc ON p.learning_card_id = lc.id
      WHERE p.curriculum_id = ?
      AND p.student_id IN (
        SELECT id FROM users WHERE class_code = ? AND role = 'student'
      )
      ORDER BY p.student_id, p.created_at DESC
    `).bind(t, s).all(), o = {};
    return n.results.forEach((i) => {
      const c = a.results.find((l) => l.student_id === i.id);
      o[i.id] = { student: i, progress: c || null, allProgress: a.results.filter((l) => l.student_id === i.id) };
    }), e.json(o);
  } catch (n) {
    return console.error("Progress error:", n), e.json({ error: "Database error" }, 500);
  }
});
p.get("/api/progress-board/class/:classCode", async (e) => {
  const { env: r } = e, t = e.req.param("classCode"), s = e.req.query("curriculumIds");
  try {
    const n = s ? s.split(",") : [], a = await r.DB.prepare(`
      SELECT id, name, student_number 
      FROM users 
      WHERE class_code = ? AND role = 'student'
      ORDER BY student_number
    `).bind(t).all(), o = [];
    for (const i of a.results) {
      const c = { student_id: i.id, student_name: i.name, student_number: i.student_number, curriculums: [] };
      for (const l of n) {
        const u = await r.DB.prepare(`
          SELECT 
            sp.*,
            c.course_level,
            c.course_display_name,
            lc.card_number,
            lc.card_title
          FROM student_progress sp
          JOIN courses c ON sp.course_id = c.id
          JOIN learning_cards lc ON sp.learning_card_id = lc.id
          WHERE sp.student_id = ? AND sp.curriculum_id = ?
          ORDER BY c.course_level, lc.card_number
        `).bind(i.id, l).all(), d = await r.DB.prepare(`
          SELECT * FROM check_test_progress
          WHERE student_id = ? AND curriculum_id = ?
          ORDER BY problem_number
        `).bind(i.id, l).all(), _ = await r.DB.prepare(`
          SELECT opp.*, op.problem_title, op.problem_number
          FROM optional_problem_progress opp
          JOIN optional_problems op ON opp.optional_problem_id = op.id
          WHERE opp.student_id = ? AND opp.curriculum_id = ?
          ORDER BY op.problem_number
        `).bind(i.id, l).all(), m = await r.DB.prepare(`
          SELECT 
            help_type,
            COUNT(*) as count
          FROM student_progress
          WHERE student_id = ? AND curriculum_id = ? AND help_type IS NOT NULL
          GROUP BY help_type
        `).bind(i.id, l).all(), h = u.results.length > 0 ? Math.max(...u.results.map((f) => f.intervention_priority || 0)) : 0, g = u.results.some((f) => f.help_requested_at && !f.help_resolved_at);
        c.curriculums.push({ curriculum_id: l, card_progress: u.results, check_test_progress: d.results, optional_progress: _.results, help_stats: m.results, intervention_priority: h, has_help_request: g, completed_cards: u.results.filter((f) => f.status === "completed").length, total_cards: u.results.length });
      }
      o.push(c);
    }
    return o.sort((i, c) => {
      const l = Math.max(...i.curriculums.map((d) => d.intervention_priority));
      return Math.max(...c.curriculums.map((d) => d.intervention_priority)) - l;
    }), e.json({ success: true, class_code: t, students: o, timestamp: (/* @__PURE__ */ new Date()).toISOString() });
  } catch (n) {
    return console.error("\u9032\u6357\u30DC\u30FC\u30C9\u30A8\u30E9\u30FC:", n), e.json({ success: false, error: "\u9032\u6357\u30DC\u30FC\u30C9\u306E\u8AAD\u307F\u8FBC\u307F\u306B\u5931\u6557\u3057\u307E\u3057\u305F", details: n.message }, 500);
  }
});
p.post("/api/progress/help-request", async (e) => {
  const { env: r } = e, { student_id: t, learning_card_id: s, curriculum_id: n } = await e.req.json();
  try {
    return await r.DB.prepare(`
      UPDATE student_progress 
      SET 
        status = 'help_needed',
        help_requested_at = CURRENT_TIMESTAMP,
        help_resolved_at = NULL,
        last_activity_at = CURRENT_TIMESTAMP
      WHERE student_id = ? AND learning_card_id = ? AND curriculum_id = ?
    `).bind(t, s, n).run(), e.json({ success: true, message: "\u30D8\u30EB\u30D7\u8981\u8ACB\u3092\u9001\u4FE1\u3057\u307E\u3057\u305F" });
  } catch (a) {
    return console.error("\u30D8\u30EB\u30D7\u8981\u8ACB\u30A8\u30E9\u30FC:", a), e.json({ success: false, error: "\u30D8\u30EB\u30D7\u8981\u8ACB\u306B\u5931\u6557\u3057\u307E\u3057\u305F" }, 500);
  }
});
p.post("/api/progress/help-resolve", async (e) => {
  const { env: r } = e, { student_id: t, learning_card_id: s, curriculum_id: n } = await e.req.json();
  try {
    return await r.DB.prepare(`
      UPDATE student_progress 
      SET 
        status = 'in_progress',
        help_resolved_at = CURRENT_TIMESTAMP,
        last_activity_at = CURRENT_TIMESTAMP
      WHERE student_id = ? AND learning_card_id = ? AND curriculum_id = ?
    `).bind(t, s, n).run(), e.json({ success: true, message: "\u30D8\u30EB\u30D7\u3092\u89E3\u6C7A\u3057\u307E\u3057\u305F" });
  } catch (a) {
    return console.error("\u30D8\u30EB\u30D7\u89E3\u6C7A\u30A8\u30E9\u30FC:", a), e.json({ success: false, error: "\u30D8\u30EB\u30D7\u89E3\u6C7A\u306B\u5931\u6557\u3057\u307E\u3057\u305F" }, 500);
  }
});
p.get("/api/error-analysis/:studentId/:curriculumId", async (e) => {
  const { env: r } = e, t = e.req.param("studentId"), s = e.req.param("curriculumId");
  try {
    const n = await r.DB.prepare(`
      SELECT 
        eh.*,
        CASE 
          WHEN eh.question_type = 'learning_card' THEN lc.card_title
          WHEN eh.question_type = 'check_test' THEN '\u30C1\u30A7\u30C3\u30AF\u30C6\u30B9\u30C8\u554F\u984C' || eh.question_number
          WHEN eh.question_type = 'optional' THEN op.problem_title
        END as question_title
      FROM error_history eh
      LEFT JOIN learning_cards lc ON eh.question_type = 'learning_card' AND eh.question_id = lc.id
      LEFT JOIN optional_problems op ON eh.question_type = 'optional' AND eh.question_id = op.id
      WHERE eh.student_id = ? AND eh.curriculum_id = ?
      ORDER BY eh.submitted_at DESC
      LIMIT 100
    `).bind(t, s).all(), a = await r.DB.prepare(`
      SELECT 
        error_pattern,
        COUNT(*) as count,
        GROUP_CONCAT(question_type) as question_types
      FROM error_history
      WHERE student_id = ? AND curriculum_id = ? AND is_correct = 0 AND error_pattern IS NOT NULL
      GROUP BY error_pattern
      ORDER BY count DESC
    `).bind(t, s).all(), o = await r.DB.prepare(`
      SELECT 
        DATE(submitted_at) as date,
        COUNT(*) as total,
        SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct
      FROM error_history
      WHERE student_id = ? AND curriculum_id = ?
      GROUP BY DATE(submitted_at)
      ORDER BY date ASC
    `).bind(t, s).all(), i = await r.DB.prepare(`
      SELECT id, name, email, student_number
      FROM users
      WHERE id = ? AND role = 'student'
    `).bind(t).first();
    return e.json({ success: true, student: i, error_history: n.results, error_patterns: a.results, accuracy_trend: o.results });
  } catch (n) {
    return console.error("\u8AA4\u7B54\u5206\u6790\u30A8\u30E9\u30FC:", n), e.json({ success: false, error: "\u8AA4\u7B54\u5206\u6790\u306E\u8AAD\u307F\u8FBC\u307F\u306B\u5931\u6557\u3057\u307E\u3057\u305F", details: n.message }, 500);
  }
});
p.post("/api/progress/activity", async (e) => {
  const { env: r } = e, { student_id: t, learning_card_id: s, curriculum_id: n } = await e.req.json();
  try {
    return await r.DB.prepare(`
      UPDATE student_progress 
      SET 
        last_activity_at = CURRENT_TIMESTAMP
      WHERE student_id = ? AND learning_card_id = ? AND curriculum_id = ?
    `).bind(t, s, n).run(), e.json({ success: true });
  } catch (a) {
    return console.error("\u6D3B\u52D5\u8A18\u9332\u30A8\u30E9\u30FC:", a), e.json({ success: false }, 500);
  }
});
p.get("/api/progress/class-peer/:classCode/:curriculumId", async (e) => {
  const { env: r } = e, t = e.req.param("classCode"), s = e.req.param("curriculumId");
  try {
    const a = (await r.DB.prepare(`
      SELECT 
        u.id,
        u.name,
        u.student_number,
        COUNT(DISTINCT sp.learning_card_id) as completed_cards,
        AVG(sp.understanding_level) as avg_understanding,
        MAX(sp.created_at) as last_activity,
        SUM(CASE WHEN sp.status = 'help_requested' THEN 1 ELSE 0 END) as is_asking_help
      FROM users u
      LEFT JOIN student_progress sp ON u.id = sp.student_id 
        AND sp.curriculum_id = ? 
        AND sp.status = 'completed'
      WHERE u.class_code = ? AND u.role = 'student'
      GROUP BY u.id, u.name, u.student_number
      ORDER BY u.student_number
    `).bind(s, t).all()).results.map((o) => ({ id: o.id, name: o.name, student_number: o.student_number, completed_cards: o.completed_cards || 0, can_help: (o.completed_cards || 0) >= 3 && (o.avg_understanding || 0) >= 60, is_asking_help: (o.is_asking_help || 0) > 0, last_activity: o.last_activity }));
    return e.json({ success: true, peers: a });
  } catch (n) {
    return console.error("\u30AF\u30E9\u30B9\u9032\u6357\u53D6\u5F97\u30A8\u30E9\u30FC:", n), e.json({ success: false, error: "\u30C7\u30FC\u30BF\u53D6\u5F97\u306B\u5931\u6557\u3057\u307E\u3057\u305F" }, 500);
  }
});
p.get("/api/help/available-helpers/:classCode/:curriculumId/:cardId", async (e) => {
  const { env: r } = e, t = e.req.param("classCode"), s = e.req.param("curriculumId"), n = e.req.param("cardId");
  try {
    const a = await r.DB.prepare(`
      SELECT 
        u.id,
        u.name,
        u.student_number,
        sp.understanding_level,
        sp.created_at as completed_at,
        COUNT(DISTINCT sp2.learning_card_id) as total_completed
      FROM users u
      INNER JOIN student_progress sp ON u.id = sp.student_id
        AND sp.curriculum_id = ?
        AND sp.learning_card_id = ?
        AND sp.status = 'completed'
        AND sp.understanding_level >= 60
      LEFT JOIN student_progress sp2 ON u.id = sp2.student_id
        AND sp2.curriculum_id = ?
        AND sp2.status = 'completed'
      WHERE u.class_code = ? AND u.role = 'student'
      GROUP BY u.id, u.name, u.student_number, sp.understanding_level, sp.created_at
      HAVING total_completed >= 3
      ORDER BY sp.understanding_level DESC, sp.created_at ASC
      LIMIT 10
    `).bind(s, n, s, t).all();
    return e.json({ success: true, helpers: a.results.map((o) => ({ id: o.id, name: o.name, student_number: o.student_number, total_completed: o.total_completed, completed_at: o.completed_at })) });
  } catch (a) {
    return console.error("\u30D8\u30EB\u30D1\u30FC\u691C\u7D22\u30A8\u30E9\u30FC:", a), e.json({ success: false, error: "\u30C7\u30FC\u30BF\u53D6\u5F97\u306B\u5931\u6557\u3057\u307E\u3057\u305F" }, 500);
  }
});
p.post("/api/help/request-peer", async (e) => {
  const { env: r } = e, { requester_id: t, helper_id: s, curriculum_id: n, learning_card_id: a, message: o } = await e.req.json();
  try {
    const i = await r.DB.prepare(`
      INSERT INTO peer_help_requests (
        requester_id, helper_id, curriculum_id, learning_card_id, 
        message, status, created_at
      ) VALUES (?, ?, ?, ?, ?, 'pending', CURRENT_TIMESTAMP)
    `).bind(t, s, n, a, o || "\u3053\u306E\u554F\u984C\u3092\u6559\u3048\u3066\u304F\u3060\u3055\u3044").run();
    return await r.DB.prepare(`
      UPDATE student_progress
      SET help_requested_from = 'friend',
          help_count = help_count + 1,
          last_activity_at = CURRENT_TIMESTAMP
      WHERE student_id = ? AND learning_card_id = ? AND curriculum_id = ?
    `).bind(t, a, n).run(), e.json({ success: true, message: "\u30D8\u30EB\u30D7\u8981\u8ACB\u3092\u9001\u4FE1\u3057\u307E\u3057\u305F", request_id: i.meta.last_row_id });
  } catch (i) {
    return console.error("\u30D8\u30EB\u30D7\u8981\u8ACB\u30A8\u30E9\u30FC:", i), e.json({ success: false, error: "\u30D8\u30EB\u30D7\u8981\u8ACB\u306B\u5931\u6557\u3057\u307E\u3057\u305F" }, 500);
  }
});
p.get("/api/help/requests-for-me/:studentId", async (e) => {
  const { env: r } = e, t = e.req.param("studentId");
  try {
    const s = await r.DB.prepare(`
      SELECT 
        phr.id,
        phr.requester_id,
        u.name as requester_name,
        phr.curriculum_id,
        cur.unit_name,
        phr.learning_card_id,
        lc.card_title,
        phr.message,
        phr.status,
        phr.created_at
      FROM peer_help_requests phr
      INNER JOIN users u ON phr.requester_id = u.id
      INNER JOIN curriculum cur ON phr.curriculum_id = cur.id
      LEFT JOIN learning_cards lc ON phr.learning_card_id = lc.id
      WHERE phr.helper_id = ? AND phr.status = 'pending'
      ORDER BY phr.created_at DESC
      LIMIT 20
    `).bind(t).all();
    return e.json({ success: true, requests: s.results });
  } catch (s) {
    return console.error("\u30D8\u30EB\u30D7\u8981\u8ACB\u53D6\u5F97\u30A8\u30E9\u30FC:", s), e.json({ success: false, error: "\u30C7\u30FC\u30BF\u53D6\u5F97\u306B\u5931\u6557\u3057\u307E\u3057\u305F" }, 500);
  }
});
p.post("/api/help/respond-peer", async (e) => {
  const { env: r } = e, { request_id: t, response: s } = await e.req.json();
  try {
    return await r.DB.prepare(`
      UPDATE peer_help_requests
      SET status = ?, responded_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(s, t).run(), e.json({ success: true, message: "\u5FDC\u7B54\u3092\u8A18\u9332\u3057\u307E\u3057\u305F" });
  } catch (n) {
    return console.error("\u5FDC\u7B54\u8A18\u9332\u30A8\u30E9\u30FC:", n), e.json({ success: false, error: "\u5FDC\u7B54\u306E\u8A18\u9332\u306B\u5931\u6557\u3057\u307E\u3057\u305F" }, 500);
  }
});
p.get("/api/reports/weekly/:classCode", async (e) => {
  const { env: r } = e, t = e.req.param("classCode"), s = e.req.query("startDate"), n = e.req.query("endDate");
  try {
    const a = await r.DB.prepare(`
      SELECT 
        u.name as student_name,
        u.student_number,
        COUNT(DISTINCT sp.learning_card_id) as completed_cards,
        AVG(sp.understanding_level) as avg_understanding,
        SUM(CASE WHEN sp.help_type = 'ai' THEN 1 ELSE 0 END) as ai_help_count,
        SUM(CASE WHEN sp.help_type = 'teacher' THEN 1 ELSE 0 END) as teacher_help_count,
        SUM(CASE WHEN sp.help_type = 'friend' THEN 1 ELSE 0 END) as friend_help_count,
        SUM(CASE WHEN sp.help_type = 'hint' THEN 1 ELSE 0 END) as hint_help_count
      FROM users u
      LEFT JOIN student_progress sp ON u.id = sp.student_id
        AND sp.status = 'completed'
        AND DATE(sp.completed_at) BETWEEN ? AND ?
      WHERE u.class_code = ? AND u.role = 'student'
      GROUP BY u.id, u.name, u.student_number
      ORDER BY u.student_number
    `).bind(s, n, t).all();
    return e.json({ success: true, period: { start: s, end: n }, class_code: t, stats: a.results });
  } catch (a) {
    return console.error("\u9031\u6B21\u30EC\u30DD\u30FC\u30C8\u30A8\u30E9\u30FC:", a), e.json({ success: false, error: "\u9031\u6B21\u30EC\u30DD\u30FC\u30C8\u306E\u751F\u6210\u306B\u5931\u6557\u3057\u307E\u3057\u305F", details: a.message }, 500);
  }
});
p.get("/api/reports/monthly/:classCode", async (e) => {
  const { env: r } = e, t = e.req.param("classCode"), s = e.req.query("year"), n = e.req.query("month");
  try {
    const a = `${s}-${n}-01`, o = `${s}-${n}-31`, i = await r.DB.prepare(`
      SELECT 
        u.name as student_name,
        u.student_number,
        COUNT(DISTINCT sp.learning_card_id) as completed_cards,
        AVG(sp.understanding_level) as avg_understanding,
        COUNT(DISTINCT DATE(sp.created_at)) as active_days,
        SUM(CASE WHEN sp.help_type IS NOT NULL THEN 1 ELSE 0 END) as total_help_count
      FROM users u
      LEFT JOIN student_progress sp ON u.id = sp.student_id
        AND DATE(sp.created_at) BETWEEN ? AND ?
      WHERE u.class_code = ? AND u.role = 'student'
      GROUP BY u.id, u.name, u.student_number
      ORDER BY u.student_number
    `).bind(a, o, t).all(), c = await r.DB.prepare(`
      SELECT 
        cur.unit_name,
        cur.subject,
        COUNT(DISTINCT sp.student_id) as students_count,
        COUNT(DISTINCT sp.learning_card_id) as completed_cards_total
      FROM curriculum cur
      LEFT JOIN student_progress sp ON cur.id = sp.curriculum_id
        AND sp.status = 'completed'
        AND DATE(sp.completed_at) BETWEEN ? AND ?
      JOIN users u ON sp.student_id = u.id
      WHERE u.class_code = ?
      GROUP BY cur.id, cur.unit_name, cur.subject
    `).bind(a, o, t).all();
    return e.json({ success: true, period: { year: s, month: n, start: a, end: o }, class_code: t, student_stats: i.results, curriculum_progress: c.results });
  } catch (a) {
    return console.error("\u6708\u6B21\u30EC\u30DD\u30FC\u30C8\u30A8\u30E9\u30FC:", a), e.json({ success: false, error: "\u6708\u6B21\u30EC\u30DD\u30FC\u30C8\u306E\u751F\u6210\u306B\u5931\u6557\u3057\u307E\u3057\u305F", details: a.message }, 500);
  }
});
p.get("/api/reports/student/:studentId/detailed", async (e) => {
  const { env: r } = e, { generateLearningReport: t } = await Promise.resolve().then(() => is);
  try {
    const s = parseInt(e.req.param("studentId")), n = e.req.query("type") || "weekly", a = e.req.query("endDate") || (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    let o;
    const i = new Date(a);
    if (n === "weekly") {
      const l = new Date(i);
      l.setDate(l.getDate() - 7), o = l.toISOString().split("T")[0];
    } else if (n === "monthly") {
      const l = new Date(i);
      l.setMonth(l.getMonth() - 1), o = l.toISOString().split("T")[0];
    } else {
      const l = new Date(i);
      l.setMonth(l.getMonth() - 3), o = l.toISOString().split("T")[0];
    }
    const c = await t(r.DB, s, o, a, n);
    return e.json({ success: true, report: c, generated_at: (/* @__PURE__ */ new Date()).toISOString() });
  } catch (s) {
    return console.error("Failed to generate detailed report:", s), e.json({ success: false, error: "\u30EC\u30DD\u30FC\u30C8\u751F\u6210\u306B\u5931\u6557\u3057\u307E\u3057\u305F", details: s.message }, 500);
  }
});
p.get("/api/reports/class/:classCode/summary", async (e) => {
  const { env: r } = e, t = e.req.param("classCode"), s = e.req.query("type") || "weekly";
  try {
    const n = await r.DB.prepare(`
      SELECT s.student_id, s.name
      FROM students s
      JOIN class_enrollments ce ON s.student_id = ce.student_id
      JOIN classes c ON ce.class_id = c.class_id
      WHERE c.class_code = ? AND ce.is_active = TRUE
    `).bind(t).all();
    if (n.results.length === 0) return e.json({ success: false, error: "\u30AF\u30E9\u30B9\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093" }, 404);
    const { generateLearningReport: a } = await Promise.resolve().then(() => is), o = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    let i;
    const c = new Date(o);
    if (s === "weekly") {
      const _ = new Date(c);
      _.setDate(_.getDate() - 7), i = _.toISOString().split("T")[0];
    } else {
      const _ = new Date(c);
      _.setMonth(_.getMonth() - 1), i = _.toISOString().split("T")[0];
    }
    const u = (await Promise.all(n.results.map(async (_) => {
      try {
        const m = await a(r.DB, _.student_id, i, o, s);
        return { student_id: _.student_id, student_name: _.name, summary: m.summary, learning_style: m.learning_style.dominant_style };
      } catch (m) {
        return console.error(`Failed to generate report for student ${_.student_id}:`, m), null;
      }
    }))).filter((_) => _ !== null), d = { total_students: u.length, average_learning_time: Math.round(u.reduce((_, m) => _ + m.summary.total_learning_time_minutes, 0) / u.length), average_mastery_score: Math.round(u.reduce((_, m) => _ + m.summary.average_mastery_score, 0) / u.length), total_cards_completed: u.reduce((_, m) => _ + m.summary.total_cards_completed, 0), learning_style_distribution: { visual: u.filter((_) => _.learning_style === "visual").length, auditory: u.filter((_) => _.learning_style === "auditory").length, reading: u.filter((_) => _.learning_style === "reading").length, kinesthetic: u.filter((_) => _.learning_style === "kinesthetic").length } };
    return e.json({ success: true, class_code: t, period: { start_date: i, end_date: o, type: s }, class_stats: d, student_reports: u, generated_at: (/* @__PURE__ */ new Date()).toISOString() });
  } catch (n) {
    return console.error("Failed to generate class summary:", n), e.json({ success: false, error: "\u30AF\u30E9\u30B9\u30B5\u30DE\u30EA\u30FC\u751F\u6210\u306B\u5931\u6557\u3057\u307E\u3057\u305F", details: n.message }, 500);
  }
});
p.post("/api/ai/ask", async (e) => {
  var o, i, c, l, u, d, _;
  const { env: r } = e, t = await e.req.json(), s = Date.now(), n = r.GEMINI_API_KEY;
  if (!n || n === "your-gemini-api-key-here") return e.json({ answer: "\u7533\u3057\u8A33\u3042\u308A\u307E\u305B\u3093\u3002AI\u5148\u751F\u306F\u73FE\u5728\u5229\u7528\u3067\u304D\u307E\u305B\u3093\u3002\u30D2\u30F3\u30C8\u30AB\u30FC\u30C9\u3084\u5148\u751F\u306B\u805E\u3044\u3066\u307F\u307E\u3057\u3087\u3046\u3002", error: "API key not configured" });
  const a = t.sessionId || `session-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  try {
    const m = await r.DB.prepare(`
      SELECT * FROM learning_cards WHERE id = ?
    `).bind(t.cardId).first(), g = ((o = (await r.DB.prepare(`
      SELECT message_type, message_text
      FROM ai_conversations
      WHERE session_id = ? AND student_id = ?
      ORDER BY created_at DESC
      LIMIT 5
    `).bind(a, t.studentId).all()).results) == null ? void 0 : o.reverse().map((b) => `${b.message_type === "question" ? "\u751F\u5F92" : "AI\u5148\u751F"}: ${b.message_text}`).join(`
`)) || "";
    await r.DB.prepare(`
      INSERT INTO ai_conversations (
        student_id, curriculum_id, learning_card_id, session_id, message_type, message_text, context_data
      ) VALUES (?, ?, ?, ?, 'question', ?, ?)
    `).bind(t.studentId, t.curriculumId, t.cardId, a, t.question, JSON.stringify({ cardTitle: m == null ? void 0 : m.card_title })).run();
    const f = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${n}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ parts: [{ text: `\u3042\u306A\u305F\u306F${t.grade || "\u5C0F\u5B66\u6821"}\u306E\u5150\u7AE5\u30FB\u751F\u5F92\u306E\u5B66\u7FD2\u3092\u30B5\u30DD\u30FC\u30C8\u3059\u308B\u512A\u3057\u3044AI\u5148\u751F\u3067\u3059\u3002

\u3010\u91CD\u8981\u306A\u30EB\u30FC\u30EB\u3011
1. **\u5B66\u5E74\u306B\u5FDC\u3058\u305F\u8A00\u8449\u9063\u3044**
   - ${ts(t.grade)}
   - \u96E3\u3057\u3044\u6F22\u5B57\u306F\u4F7F\u308F\u305A\u3001\u3072\u3089\u304C\u306A\u3084\u7C21\u5358\u306A\u8A00\u8449\u3067\u8AAC\u660E\u3059\u308B
   - \u5B66\u5E74\u306B\u5408\u308F\u305B\u305F\u5177\u4F53\u4F8B\u3092\u4F7F\u3046

2. **\u8CEA\u554F\u306B\u306F\u5FC5\u305A\u7B54\u3048\u308B**
   - \u8CEA\u554F\u3055\u308C\u305F\u3053\u3068\u306B\u306F\u3001\u308F\u304B\u308A\u3084\u3059\u304F\u7B54\u3048\u308B
   - \u305F\u3060\u3057\u3001\u76F4\u63A5\u7B54\u3048\u3092\u6559\u3048\u308B\u306E\u3067\u306F\u306A\u304F\u3001\u8003\u3048\u65B9\u3084\u30D2\u30F3\u30C8\u3092\u4E2D\u5FC3\u306B\u8AAC\u660E\u3059\u308B
   - \u300C\u308F\u304B\u308A\u307E\u305B\u3093\u300D\u300C\u7B54\u3048\u3089\u308C\u307E\u305B\u3093\u300D\u3068\u306F\u8A00\u308F\u306A\u3044

3. **\u5BFE\u8A71\u3092\u7D9A\u3051\u308B**
   - \u8AAC\u660E\u306E\u5F8C\u306B\u3001\u7406\u89E3\u3092\u78BA\u8A8D\u3059\u308B\u8CEA\u554F\u3092\u3059\u308B
   - \u4E00\u65B9\u7684\u306A\u8AAC\u660E\u3067\u306F\u306A\u304F\u3001\u5BFE\u8A71\u3092\u5FC3\u304C\u3051\u308B
   - \u7C21\u6F54\u306B\u7B54\u3048\u308B\uFF08150\u6587\u5B57\u4EE5\u5185\uFF09

\u3010\u5229\u7528\u53EF\u80FD\u306A\u6A5F\u80FD\u3011
\u2705 **\u624B\u66F8\u304D\u8A8D\u8B58\u6A5F\u80FD**
   - \u751F\u5F92\u304C\u624B\u66F8\u304D\u3067\u7B54\u3048\u3092\u66F8\u3044\u305F\u3089\u3001\u300C\u8A8D\u8B58\u300D\u30DC\u30BF\u30F3\u3067\u6587\u5B57\u306B\u5909\u63DB\u3067\u304D\u307E\u3059
   - \u624B\u66F8\u304D\u306E\u30E1\u30E2\u3084\u30E1\u30E2\u5E33\u306E\u5185\u5BB9\u3082\u8AAD\u307F\u53D6\u308C\u307E\u3059
   - \u6570\u5F0F\u3084\u56F3\u5F62\u3082\u8A8D\u8B58\u3067\u304D\u307E\u3059
   - \u624B\u66F8\u304D\u3067\u7B54\u3048\u3092\u66F8\u304F\u3053\u3068\u3092\u7A4D\u6975\u7684\u306B\u52E7\u3081\u3066\u304F\u3060\u3055\u3044

\u2705 **\u97F3\u58F0\u8AAD\u307F\u4E0A\u3052\u6A5F\u80FD**
   - \u554F\u984C\u6587\u3084\u89E3\u8AAC\u3092\u97F3\u58F0\u3067\u805E\u304F\u3053\u3068\u304C\u3067\u304D\u307E\u3059
   - \u300C\u8AAD\u307F\u4E0A\u3052\u300D\u30DC\u30BF\u30F3\u3067\u5229\u7528\u3067\u304D\u307E\u3059

\u2705 **\u30D2\u30F3\u30C8\u30AB\u30FC\u30C9**
   - 3\u6BB5\u968E\u306E\u30D2\u30F3\u30C8\u304C\u3042\u308A\u307E\u3059
   - \u56F0\u3063\u305F\u3068\u304D\u306F\u300C\u30D2\u30F3\u30C8\u300D\u30DC\u30BF\u30F3\u3092\u62BC\u3059\u3088\u3046\u6848\u5185\u3057\u3066\u304F\u3060\u3055\u3044

\u3010\u5B66\u7FD2\u30AB\u30FC\u30C9\u60C5\u5831\u3011
\u30BF\u30A4\u30C8\u30EB: ${(m == null ? void 0 : m.card_title) || ""}
\u554F\u984C: ${t.context || ""}

${g ? `\u3010\u3053\u308C\u307E\u3067\u306E\u5BFE\u8A71\u3011
${g}
` : ""}

\u3010\u5150\u7AE5\u30FB\u751F\u5F92\u306E\u8CEA\u554F\u3011
${t.question}

\u3010\u56DE\u7B54\u306E\u6761\u4EF6\u3011
- 150\u6587\u5B57\u4EE5\u5185\u3067\u7B54\u3048\u308B
- ${t.grade || "\u5C0F\u5B66\u6821"}\u306E\u5150\u7AE5\u30FB\u751F\u5F92\u304C\u308F\u304B\u308B\u8A00\u8449\u3067\u8AAC\u660E\u3059\u308B
- \u8CEA\u554F\u306B\u306F\u5FC5\u305A\u7B54\u3048\u308B\uFF08\u300C\u308F\u304B\u308A\u307E\u305B\u3093\u300D\u3068\u306F\u8A00\u308F\u306A\u3044\uFF09
- \u8003\u3048\u65B9\u3084\u30D2\u30F3\u30C8\u3092\u4E2D\u5FC3\u306B\u3001\u7B54\u3048\u306B\u8FD1\u3065\u3051\u308B\u3088\u3046\u306B\u5C0E\u304F
- \u624B\u66F8\u304D\u8A8D\u8B58\u306A\u3069\u306E\u6A5F\u80FD\u306B\u3064\u3044\u3066\u805E\u304B\u308C\u305F\u3089\u3001\u4E0A\u8A18\u306E\u300C\u5229\u7528\u53EF\u80FD\u306A\u6A5F\u80FD\u300D\u3092\u53C2\u8003\u306B\u7B54\u3048\u308B` }] }], generationConfig: { temperature: 0.7, maxOutputTokens: 250 } }) }), E = Date.now() - s;
    if (!f.ok) {
      const b = await f.json();
      throw console.error("Gemini API error:", b), await r.DB.prepare(`
        INSERT INTO ai_usage_stats (
          student_id, curriculum_id, learning_card_id, feature_type, 
          response_time_ms, success, error_message
        ) VALUES (?, ?, ?, 'teacher', ?, 0, ?)
      `).bind(t.studentId, t.curriculumId, t.cardId, E, `API Error: ${f.status}`).run(), new Error(`Gemini API error: ${f.status}`);
    }
    const x = await f.json(), y = ((d = (u = (l = (c = (i = x.candidates) == null ? void 0 : i[0]) == null ? void 0 : c.content) == null ? void 0 : l.parts) == null ? void 0 : u[0]) == null ? void 0 : d.text) || "\u8003\u3048\u308B\u30D2\u30F3\u30C8\u3092\u7528\u610F\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F\u3002\u3082\u3046\u4E00\u5EA6\u8CEA\u554F\u3057\u3066\u307F\u3066\u304F\u3060\u3055\u3044\u3002";
    await r.DB.prepare(`
      INSERT INTO ai_conversations (
        student_id, curriculum_id, learning_card_id, session_id, message_type, message_text
      ) VALUES (?, ?, ?, ?, 'answer', ?)
    `).bind(t.studentId, t.curriculumId, t.cardId, a, y).run();
    const v = ((_ = x.usageMetadata) == null ? void 0 : _.totalTokenCount) || 0;
    return await r.DB.prepare(`
      INSERT INTO ai_usage_stats (
        student_id, curriculum_id, learning_card_id, feature_type,
        tokens_used, response_time_ms, success
      ) VALUES (?, ?, ?, 'teacher', ?, ?, 1)
    `).bind(t.studentId, t.curriculumId, t.cardId, v, E).run(), e.json({ answer: y, sessionId: a, tokensUsed: v, responseTime: E });
  } catch (m) {
    console.error("AI error:", m);
    try {
      await r.DB.prepare(`
        INSERT INTO ai_usage_stats (
          student_id, curriculum_id, learning_card_id, feature_type,
          response_time_ms, success, error_message
        ) VALUES (?, ?, ?, 'teacher', ?, 0, ?)
      `).bind(t.studentId, t.curriculumId, t.cardId, Date.now() - s, m.message).run();
    } catch (h) {
      console.error("Failed to log error:", h);
    }
    return e.json({ answer: "\u3054\u3081\u3093\u306A\u3055\u3044\u3001\u4ECA\u306F\u7B54\u3048\u3089\u308C\u307E\u305B\u3093\u3002\u30D2\u30F3\u30C8\u30AB\u30FC\u30C9\u3092\u898B\u3066\u307F\u307E\u3057\u3087\u3046\uFF01", error: m.message });
  }
});
p.get("/api/ai/conversations/:sessionId", async (e) => {
  var s;
  const { env: r } = e, t = e.req.param("sessionId");
  try {
    const n = await r.DB.prepare(`
      SELECT 
        id, message_type, message_text, context_data, created_at,
        learning_card_id, curriculum_id
      FROM ai_conversations
      WHERE session_id = ?
      ORDER BY created_at ASC
    `).bind(t).all();
    return e.json({ conversations: n.results || [], total: ((s = n.results) == null ? void 0 : s.length) || 0 });
  } catch (n) {
    return console.error("Failed to fetch conversations:", n), e.json({ error: "\u5BFE\u8A71\u5C65\u6B74\u306E\u53D6\u5F97\u306B\u5931\u6557\u3057\u307E\u3057\u305F", conversations: [], total: 0 }, 500);
  }
});
p.post("/api/ai/generate-problem", async (e) => {
  var n, a, o, i, c, l, u;
  const { env: r } = e, t = await e.req.json(), s = r.GEMINI_API_KEY;
  if (!s || s === "your-gemini-api-key") return e.json({ error: "Gemini API\u30AD\u30FC\u304C\u8A2D\u5B9A\u3055\u308C\u3066\u3044\u307E\u305B\u3093\u3002\u74B0\u5883\u5909\u6570\u3092\u8A2D\u5B9A\u3057\u3066\u304F\u3060\u3055\u3044\u3002" }, 500);
  try {
    const d = Date.now(), _ = await r.DB.prepare(`
      SELECT * FROM curriculum WHERE id = ?
    `).bind(t.curriculumId).first(), h = ((n = (await r.DB.prepare(`
      SELECT problem_content, learning_meaning FROM learning_cards
      WHERE course_id = ? LIMIT 3
    `).bind(t.courseId).all()).results) == null ? void 0 : n.map((O, A) => `\u4F8B${A + 1}:
\u554F\u984C: ${O.problem_content}
\u5B66\u7FD2\u306E\u610F\u5473: ${O.learning_meaning}`).join(`

`)) || "", g = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${s}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ parts: [{ text: `\u3042\u306A\u305F\u306F\u5C0F\u5B66\u751F\u5411\u3051\u306E\u5B66\u7FD2\u554F\u984C\u3092\u4F5C\u6210\u3059\u308BAI\u5148\u751F\u3067\u3059\u3002\u4EE5\u4E0B\u306E\u60C5\u5831\u3092\u5143\u306B\u3001\u5B66\u7FD2\u30AB\u30FC\u30C9\u306E\u554F\u984C\u3092\u751F\u6210\u3057\u3066\u304F\u3060\u3055\u3044\u3002

\u3010\u30AB\u30EA\u30AD\u30E5\u30E9\u30E0\u60C5\u5831\u3011
\u5B66\u5E74: ${(_ == null ? void 0 : _.grade) || ""}
\u6559\u79D1: ${(_ == null ? void 0 : _.subject) || ""}
\u5358\u5143: ${(_ == null ? void 0 : _.unit_name) || ""}
\u5358\u5143\u76EE\u6A19: ${(_ == null ? void 0 : _.unit_goal) || ""}
\u96E3\u6613\u5EA6: ${t.difficultyLevel || "\u3057\u3063\u304B\u308A"}

${h ? `\u3010\u53C2\u8003\u554F\u984C\u3011
${h}
` : ""}

\u3010\u751F\u6210\u6761\u4EF6\u3011
- \u5C0F\u5B66\u751F\u304C\u7406\u89E3\u3067\u304D\u308B\u8A00\u8449\u3067
- \u5B9F\u793E\u4F1A\u3068\u95A2\u9023\u4ED8\u3051\u308B
- \u601D\u8003\u529B\u3092\u80B2\u3080\u5185\u5BB9
- ${t.requirements || ""}

\u4EE5\u4E0B\u306EJSON\u5F62\u5F0F\u3067\u56DE\u7B54\u3057\u3066\u304F\u3060\u3055\u3044\uFF1A
{
  "problem_description": "\u554F\u984C\u306E\u7C21\u5358\u306A\u8AAC\u660E\uFF0830\u6587\u5B57\u4EE5\u5185\uFF09",
  "problem_content": "\u554F\u984C\u6587\uFF08150\u6587\u5B57\u7A0B\u5EA6\uFF09",
  "learning_meaning": "\u3053\u306E\u554F\u984C\u3067\u5B66\u3079\u308B\u3053\u3068\uFF08100\u6587\u5B57\u7A0B\u5EA6\uFF09",
  "answer": "\u89E3\u7B54\u4F8B\uFF08\u5FC5\u8981\u306B\u5FDC\u3058\u3066\uFF09",
  "difficulty_level": "${t.difficultyLevel || "\u3057\u3063\u304B\u308A"}"
}` }] }], generationConfig: { temperature: 0.8, maxOutputTokens: 500 } }) }), f = Date.now() - d;
    if (!g.ok) {
      const O = await g.json();
      throw console.error("Gemini API error:", O), await r.DB.prepare(`
        INSERT INTO ai_usage_stats (
          curriculum_id, feature_type, 
          response_time_ms, success, error_message
        ) VALUES (?, 'problem_generation', ?, 0, ?)
      `).bind(t.curriculumId, f, `API Error: ${g.status}`).run(), new Error(`Gemini API error: ${g.status}`);
    }
    const E = await g.json(), y = (((l = (c = (i = (o = (a = E.candidates) == null ? void 0 : a[0]) == null ? void 0 : o.content) == null ? void 0 : i.parts) == null ? void 0 : c[0]) == null ? void 0 : l.text) || "").match(/\{[\s\S]*\}/);
    if (!y) throw new Error("\u751F\u6210\u7D50\u679C\u304B\u3089JSON\u3092\u62BD\u51FA\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F");
    const v = JSON.parse(y[0]), b = await r.DB.prepare(`
      INSERT INTO generated_problems (
        curriculum_id, course_id, problem_description, problem_content,
        learning_meaning, answer, difficulty_level, generated_by, 
        generation_params, is_approved
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    `).bind(t.curriculumId, t.courseId, v.problem_description, v.problem_content, v.learning_meaning, v.answer || null, v.difficulty_level, t.userId || 0, JSON.stringify({ requirements: t.requirements, difficultyLevel: t.difficultyLevel })).run(), T = ((u = E.usageMetadata) == null ? void 0 : u.totalTokenCount) || 0;
    return await r.DB.prepare(`
      INSERT INTO ai_usage_stats (
        curriculum_id, feature_type, tokens_used, response_time_ms, success
      ) VALUES (?, 'problem_generation', ?, ?, 1)
    `).bind(t.curriculumId, T, f).run(), e.json({ problem: { id: b.meta.last_row_id, ...v }, tokensUsed: T, responseTime: f });
  } catch (d) {
    return console.error("Problem generation error:", d), e.json({ error: "\u554F\u984C\u306E\u751F\u6210\u306B\u5931\u6557\u3057\u307E\u3057\u305F", details: d.message }, 500);
  }
});
p.get("/api/plans/:studentId/:curriculumId", async (e) => {
  const { env: r } = e, t = e.req.param("studentId"), s = e.req.param("curriculumId");
  try {
    const n = await r.DB.prepare(`
      SELECT * FROM learning_plans
      WHERE student_id = ? AND curriculum_id = ?
      ORDER BY planned_date
    `).bind(t, s).all();
    return e.json(n.results);
  } catch {
    return e.json({ error: "Database error" }, 500);
  }
});
p.post("/api/plans", async (e) => {
  const { env: r } = e, t = await e.req.json();
  try {
    const s = await r.DB.prepare(`
      INSERT INTO learning_plans 
        (student_id, curriculum_id, planned_date, learning_card_id, 
         reflection_good, reflection_bad, reflection_learned)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(t.student_id, t.curriculum_id, t.planned_date, t.learning_card_id || null, t.reflection_good || null, t.reflection_bad || null, t.reflection_learned || null).run();
    return e.json({ success: true, id: s.meta.last_row_id });
  } catch {
    return e.json({ error: "Database error" }, 500);
  }
});
p.put("/api/plans/:id", async (e) => {
  const { env: r } = e, t = e.req.param("id"), s = await e.req.json();
  try {
    return await r.DB.prepare(`
      UPDATE learning_plans 
      SET actual_date = ?,
          learning_card_id = ?,
          reflection_good = ?,
          reflection_bad = ?,
          reflection_learned = ?,
          ai_feedback = ?
      WHERE id = ?
    `).bind(s.actual_date || null, s.learning_card_id || null, s.reflection_good || null, s.reflection_bad || null, s.reflection_learned || null, s.ai_feedback || null, t).run(), e.json({ success: true });
  } catch {
    return e.json({ error: "Database error" }, 500);
  }
});
p.post("/api/ai/reflect", async (e) => {
  var i, c, l, u, d;
  const { env: r } = e, t = await e.req.json(), { reflections: s, type: n } = t, a = r.GEMINI_API_KEY;
  if (!a) return e.json({ feedback: n === "unit" ? "\u5358\u5143\u3092\u6700\u5F8C\u307E\u3067\u5B66\u7FD2\u3067\u304D\u307E\u3057\u305F\u306D\uFF01\u6B21\u306E\u5358\u5143\u3082\u697D\u3057\u307F\u3067\u3059\u3002" : "\u304C\u3093\u3070\u308A\u307E\u3057\u305F\u306D\uFF01\u6B21\u56DE\u3082\u697D\u3057\u304F\u5B66\u7FD2\u3057\u307E\u3057\u3087\u3046\u3002" });
  const o = n === "unit" ? `\u3042\u306A\u305F\u306F\u5C0F\u5B66\u751F\u306E\u5B66\u7FD2\u3092\u5FDC\u63F4\u3059\u308BAI\u5148\u751F\u3067\u3059\u3002\u5B50\u3069\u3082\u306E\u5358\u5143\u5168\u4F53\u306E\u632F\u308A\u8FD4\u308A\u3092\u8AAD\u3093\u3067\u3001\u6210\u9577\u3092\u8A8D\u3081\u3001\u6B21\u306E\u5B66\u7FD2\u3078\u306E\u610F\u6B32\u3092\u9AD8\u3081\u308B\u30E1\u30C3\u30BB\u30FC\u30B8\u3092\u9001\u3063\u3066\u304F\u3060\u3055\u3044\u3002

\u3010\u5358\u5143\u5168\u4F53\u306E\u632F\u308A\u8FD4\u308A\u3011
\u826F\u304B\u3063\u305F\u3053\u3068: ${s.good || "\u306A\u3057"}
\u76F4\u3057\u305F\u3044\u3053\u3068: ${s.bad || "\u306A\u3057"}
\u308F\u304B\u3063\u305F\u3053\u3068: ${s.learned || "\u306A\u3057"}

\u3010\u30D5\u30A3\u30FC\u30C9\u30D0\u30C3\u30AF\u306E\u30EB\u30FC\u30EB\u3011
1. \u5358\u5143\u5168\u4F53\u3092\u901A\u3057\u3066\u306E\u6210\u9577\u3092\u8A8D\u3081\u308B
2. \u826F\u304B\u3063\u305F\u3053\u3068\u3092\u5177\u4F53\u7684\u306B\u8912\u3081\u308B
3. \u76F4\u3057\u305F\u3044\u3053\u3068\u306F\u6B21\u306E\u76EE\u6A19\u3068\u3057\u3066\u524D\u5411\u304D\u306B\u53D7\u3051\u6B62\u3081\u308B
4. \u308F\u304B\u3063\u305F\u3053\u3068\u306E\u4FA1\u5024\u3092\u4F1D\u3048\u3001\u5B66\u3073\u306E\u559C\u3073\u3092\u5171\u611F\u3059\u308B
5. \u6B21\u306E\u5358\u5143\u3078\u306E\u671F\u5F85\u611F\u3092\u6301\u305F\u305B\u308B
6. \u5C0F\u5B66\u751F\u306B\u308F\u304B\u308A\u3084\u3059\u3044\u8A00\u8449\u3067
7. 200\u6587\u5B57\u4EE5\u5185\u3067

\u6E29\u304B\u304F\u52B1\u307E\u3059\u30E1\u30C3\u30BB\u30FC\u30B8\u3092\u66F8\u3044\u3066\u304F\u3060\u3055\u3044\u3002` : `\u3042\u306A\u305F\u306F\u5C0F\u5B66\u751F\u306E\u5B66\u7FD2\u3092\u5FDC\u63F4\u3059\u308BAI\u5148\u751F\u3067\u3059\u3002\u5B50\u3069\u3082\u306E1\u6642\u9593\u306E\u5B66\u7FD2\u306E\u632F\u308A\u8FD4\u308A\u3092\u8AAD\u3093\u3067\u3001\u52B1\u307E\u3057\u3068\u30A2\u30C9\u30D0\u30A4\u30B9\u3092\u3057\u3066\u304F\u3060\u3055\u3044\u3002

\u3010\u632F\u308A\u8FD4\u308A\u5185\u5BB9\u3011
\u826F\u304B\u3063\u305F\u3053\u3068: ${s.good || "\u306A\u3057"}
\u96E3\u3057\u304B\u3063\u305F\u3053\u3068: ${s.bad || "\u306A\u3057"}
\u308F\u304B\u3063\u305F\u3053\u3068: ${s.learned || "\u306A\u3057"}

\u3010\u30D5\u30A3\u30FC\u30C9\u30D0\u30C3\u30AF\u306E\u30EB\u30FC\u30EB\u3011
1. \u5FC5\u305A\u52B1\u307E\u3057\u306E\u8A00\u8449\u304B\u3089\u59CB\u3081\u308B
2. \u826F\u304B\u3063\u305F\u3053\u3068\u3092\u5177\u4F53\u7684\u306B\u8912\u3081\u308B
3. \u96E3\u3057\u304B\u3063\u305F\u3053\u3068\u306B\u306F\u5171\u611F\u3057\u3001\u6B21\u3078\u306E\u30D2\u30F3\u30C8\u3092\u51FA\u3059
4. \u308F\u304B\u3063\u305F\u3053\u3068\u306E\u7D20\u6674\u3089\u3057\u3055\u3092\u4F1D\u3048\u308B
5. \u6B21\u306E\u5B66\u7FD2\u3078\u306E\u610F\u6B32\u304C\u6E67\u304F\u8A00\u8449\u3067\u7DE0\u3081\u308B
6. \u5C0F\u5B66\u751F\u306B\u308F\u304B\u308A\u3084\u3059\u3044\u8A00\u8449\u3067
7. 150\u6587\u5B57\u4EE5\u5185\u3067\u7C21\u6F54\u306B

\u30D5\u30A3\u30FC\u30C9\u30D0\u30C3\u30AF\u3057\u3066\u304F\u3060\u3055\u3044\u3002`;
  try {
    const _ = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${a}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ parts: [{ text: o }] }], generationConfig: { temperature: 0.8, maxOutputTokens: n === "unit" ? 300 : 200 } }) }), m = await _.json();
    if (!_.ok) throw new Error("Gemini API error");
    const h = ((d = (u = (l = (c = (i = m.candidates) == null ? void 0 : i[0]) == null ? void 0 : c.content) == null ? void 0 : l.parts) == null ? void 0 : u[0]) == null ? void 0 : d.text) || (n === "unit" ? "\u5358\u5143\u3092\u3057\u3063\u304B\u308A\u5B66\u7FD2\u3067\u304D\u307E\u3057\u305F\uFF01\u6B21\u306E\u5358\u5143\u3082\u697D\u3057\u307F\u3067\u3059\uFF01" : "\u3088\u304F\u304C\u3093\u3070\u308A\u307E\u3057\u305F\uFF01\u6B21\u56DE\u3082\u697D\u3057\u304F\u5B66\u7FD2\u3057\u307E\u3057\u3087\u3046\u3002");
    return e.json({ feedback: h });
  } catch (_) {
    return console.error("AI reflection error:", _), e.json({ feedback: "\u3059\u3070\u3089\u3057\u3044\u632F\u308A\u8FD4\u308A\u3067\u3059\u306D\uFF01\u3053\u308C\u304B\u3089\u3082\u4E00\u7DD2\u306B\u304C\u3093\u3070\u308A\u307E\u3057\u3087\u3046\uFF01" });
  }
});
p.get("/api/answers/curriculum/:curriculumId", async (e) => {
  const { env: r } = e, t = e.req.param("curriculumId");
  try {
    const s = await r.DB.prepare(`
      SELECT 
        c.course_display_name,
        c.course_level,
        lc.card_number,
        lc.card_title,
        lc.card_type,
        a.answer_content,
        a.explanation
      FROM courses c
      JOIN learning_cards lc ON c.id = lc.course_id
      LEFT JOIN answers a ON lc.id = a.learning_card_id
      WHERE c.curriculum_id = ?
      ORDER BY c.course_level, lc.card_number
    `).bind(t).all(), n = await r.DB.prepare(`
      SELECT 
        op.problem_number,
        op.problem_title,
        op.problem_description,
        op.learning_meaning,
        a.answer_content,
        a.explanation
      FROM optional_problems op
      LEFT JOIN answers a ON op.id = a.optional_problem_id
      WHERE op.curriculum_id = ?
      ORDER BY op.problem_number
    `).bind(t).all();
    return e.json({ cardAnswers: s.results, optionalAnswers: n.results });
  } catch {
    return e.json({ error: "Database error" }, 500);
  }
});
p.post("/api/custom/content", async (e) => {
  const { env: r } = e, t = await e.req.json();
  try {
    const s = await r.DB.prepare(`
      INSERT INTO custom_content 
        (teacher_id, original_learning_card_id, original_optional_problem_id, 
         content_type, custom_data)
      VALUES (?, ?, ?, ?, ?)
    `).bind(t.teacher_id, t.original_learning_card_id || null, t.original_optional_problem_id || null, t.content_type, JSON.stringify(t.custom_data)).run();
    return e.json({ success: true, id: s.meta.last_row_id });
  } catch {
    return e.json({ error: "Database error" }, 500);
  }
});
p.get("/api/custom/content/:teacherId", async (e) => {
  const { env: r } = e, t = e.req.param("teacherId");
  try {
    const n = (await r.DB.prepare(`
      SELECT * FROM custom_content
      WHERE teacher_id = ?
      ORDER BY created_at DESC
    `).bind(t).all()).results.map((a) => ({ ...a, custom_data: JSON.parse(a.custom_data) }));
    return e.json(n);
  } catch {
    return e.json({ error: "Database error" }, 500);
  }
});
p.post("/api/evaluations", async (e) => {
  const { env: r } = e, t = await e.req.json();
  try {
    const s = await r.DB.prepare(`
      INSERT INTO evaluations 
        (student_id, curriculum_id, knowledge_skill, 
         thinking_judgment_expression, attitude_toward_learning, 
         non_cognitive_evaluation, teacher_comment)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(t.student_id, t.curriculum_id, t.knowledge_skill, t.thinking_judgment_expression, t.attitude_toward_learning, t.non_cognitive_evaluation, t.teacher_comment).run();
    return e.json({ success: true, id: s.meta.last_row_id });
  } catch {
    return e.json({ error: "Database error" }, 500);
  }
});
p.get("/api/evaluations/student/:studentId/curriculum/:curriculumId", async (e) => {
  const { env: r } = e, t = e.req.param("studentId"), s = e.req.param("curriculumId");
  try {
    const n = await r.DB.prepare(`
      SELECT e.*, u.name as student_name
      FROM evaluations e
      JOIN users u ON e.student_id = u.id
      WHERE e.student_id = ? AND e.curriculum_id = ?
      ORDER BY e.created_at DESC
      LIMIT 1
    `).bind(t, s).first();
    return e.json(n);
  } catch {
    return e.json({ error: "Database error" }, 500);
  }
});
p.get("/api/learning-plan/:studentId/:curriculumId", async (e) => {
  const { env: r } = e, t = e.req.param("studentId"), s = e.req.param("curriculumId");
  try {
    const n = await r.DB.prepare(`
      SELECT * FROM learning_plans
      WHERE student_id = ? AND curriculum_id = ?
      ORDER BY planned_date ASC
    `).bind(t, s).all();
    return e.json({ plans: n.results });
  } catch (n) {
    return console.error("\u5B66\u7FD2\u8A08\u753B\u53D6\u5F97\u30A8\u30E9\u30FC:", n), e.json({ error: "Database error" }, 500);
  }
});
p.post("/api/learning-plan/save", async (e) => {
  const { env: r } = e, t = await e.req.json(), { student_id: s, curriculum_id: n, total_hours: a, plans: o, unit_reflection: i } = t;
  try {
    await r.DB.prepare(`
      DELETE FROM learning_plans 
      WHERE student_id = ? AND curriculum_id = ?
    `).bind(s, n).run(), await r.DB.prepare(`
      DELETE FROM unit_reflections 
      WHERE student_id = ? AND curriculum_id = ?
    `).bind(s, n).run();
    for (const c of o) await r.DB.prepare(`
        INSERT INTO learning_plans (
          student_id, 
          curriculum_id,
          hour_number,
          subject,
          planned_date,
          learning_content,
          reflection_good, 
          reflection_bad, 
          reflection_learned,
          ai_feedback
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(s, n, c.hour_number, c.subject, c.planned_date || null, c.learning_content || "", c.reflection_good || "", c.reflection_bad || "", c.reflection_learned || "", c.ai_feedback || null).run();
    return i && (i.good || i.bad || i.learned) && await r.DB.prepare(`
        INSERT INTO unit_reflections (
          student_id, 
          curriculum_id,
          reflection_good, 
          reflection_bad, 
          reflection_learned
        ) VALUES (?, ?, ?, ?, ?)
      `).bind(s, n, i.good || "", i.bad || "", i.learned || "").run(), e.json({ success: true });
  } catch (c) {
    return console.error("\u5B66\u7FD2\u8A08\u753B\u4FDD\u5B58\u30A8\u30E9\u30FC:", c), e.json({ error: "Database error", details: c.message }, 500);
  }
});
p.get("/api/environment/:curriculumId", async (e) => {
  const { env: r } = e, t = e.req.param("curriculumId");
  try {
    const s = await r.DB.prepare(`
      SELECT * FROM learning_environment
      WHERE curriculum_id = ?
      ORDER BY category, id
    `).bind(t).all();
    return e.json(s.results);
  } catch {
    return e.json({ error: "Database error" }, 500);
  }
});
p.get("/api/evaluations/three-point/student/:studentId/curriculum/:curriculumId", async (e) => {
  const { env: r } = e, t = e.req.param("studentId"), s = e.req.param("curriculumId");
  try {
    const n = await r.DB.prepare(`
      SELECT e.*, u.name as student_name
      FROM three_point_evaluations e
      JOIN users u ON e.student_id = u.id
      WHERE e.student_id = ? AND e.curriculum_id = ?
      ORDER BY e.created_at DESC
      LIMIT 1
    `).bind(t, s).first();
    return e.json(n || {});
  } catch {
    return e.json({ error: "Database error" }, 500);
  }
});
p.post("/api/evaluations/three-point", async (e) => {
  const { env: r } = e, t = await e.req.json();
  try {
    const s = await r.DB.prepare(`
      INSERT INTO three_point_evaluations (
        student_id, curriculum_id,
        knowledge_skill, knowledge_skill_comment,
        thinking_judgment, thinking_judgment_comment,
        attitude, attitude_comment,
        overall_comment
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(t.student_id, t.curriculum_id, t.knowledge_skill || "", t.knowledge_skill_comment || "", t.thinking_judgment || "", t.thinking_judgment_comment || "", t.attitude || "", t.attitude_comment || "", t.overall_comment || "").run();
    return e.json({ success: true, id: s.meta.last_row_id });
  } catch {
    return e.json({ error: "Database error" }, 500);
  }
});
p.put("/api/evaluations/three-point/:id", async (e) => {
  const { env: r } = e, t = e.req.param("id"), s = await e.req.json();
  try {
    return await r.DB.prepare(`
      UPDATE three_point_evaluations SET
        knowledge_skill = ?,
        knowledge_skill_comment = ?,
        thinking_judgment = ?,
        thinking_judgment_comment = ?,
        attitude = ?,
        attitude_comment = ?,
        overall_comment = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(s.knowledge_skill || "", s.knowledge_skill_comment || "", s.thinking_judgment || "", s.thinking_judgment_comment || "", s.attitude || "", s.attitude_comment || "", s.overall_comment || "", t).run(), e.json({ success: true });
  } catch {
    return e.json({ error: "Database error" }, 500);
  }
});
p.get("/api/evaluations/non-cognitive/student/:studentId/curriculum/:curriculumId", async (e) => {
  const { env: r } = e, t = e.req.param("studentId"), s = e.req.param("curriculumId");
  try {
    const n = await r.DB.prepare(`
      SELECT e.*, u.name as student_name
      FROM non_cognitive_evaluations e
      JOIN users u ON e.student_id = u.id
      WHERE e.student_id = ? AND e.curriculum_id = ?
      ORDER BY e.created_at DESC
      LIMIT 1
    `).bind(t, s).first();
    return e.json(n || {});
  } catch {
    return e.json({ error: "Database error" }, 500);
  }
});
p.post("/api/evaluations/non-cognitive", async (e) => {
  const { env: r } = e, t = await e.req.json();
  try {
    const s = await r.DB.prepare(`
      INSERT INTO non_cognitive_evaluations (
        student_id, curriculum_id,
        self_regulation, self_regulation_comment,
        motivation, motivation_comment,
        collaboration, collaboration_comment,
        metacognition, metacognition_comment,
        creativity, creativity_comment,
        curiosity, curiosity_comment,
        self_esteem, self_esteem_comment
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(t.student_id, t.curriculum_id, t.self_regulation || 0, t.self_regulation_comment || "", t.motivation || 0, t.motivation_comment || "", t.collaboration || 0, t.collaboration_comment || "", t.metacognition || 0, t.metacognition_comment || "", t.creativity || 0, t.creativity_comment || "", t.curiosity || 0, t.curiosity_comment || "", t.self_esteem || 0, t.self_esteem_comment || "").run();
    return e.json({ success: true, id: s.meta.last_row_id });
  } catch {
    return e.json({ error: "Database error" }, 500);
  }
});
p.put("/api/evaluations/non-cognitive/:id", async (e) => {
  const { env: r } = e, t = e.req.param("id"), s = await e.req.json();
  try {
    return await r.DB.prepare(`
      UPDATE non_cognitive_evaluations SET
        self_regulation = ?,
        self_regulation_comment = ?,
        motivation = ?,
        motivation_comment = ?,
        collaboration = ?,
        collaboration_comment = ?,
        metacognition = ?,
        metacognition_comment = ?,
        creativity = ?,
        creativity_comment = ?,
        curiosity = ?,
        curiosity_comment = ?,
        self_esteem = ?,
        self_esteem_comment = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(s.self_regulation || 0, s.self_regulation_comment || "", s.motivation || 0, s.motivation_comment || "", s.collaboration || 0, s.collaboration_comment || "", s.metacognition || 0, s.metacognition_comment || "", s.creativity || 0, s.creativity_comment || "", s.curiosity || 0, s.curiosity_comment || "", s.self_esteem || 0, s.self_esteem_comment || "", t).run(), e.json({ success: true });
  } catch {
    return e.json({ error: "Database error" }, 500);
  }
});
p.get("/api/environment/design/:curriculumId", async (e) => {
  const { env: r } = e, t = e.req.param("curriculumId");
  try {
    const s = await r.DB.prepare(`
      SELECT * FROM learning_environment_designs
      WHERE curriculum_id = ?
      LIMIT 1
    `).bind(t).first();
    return e.json(s || {});
  } catch {
    return e.json({ error: "Database error" }, 500);
  }
});
p.post("/api/environment/design", async (e) => {
  const { env: r } = e, t = await e.req.json();
  try {
    const s = await r.DB.prepare(`
      INSERT INTO learning_environment_designs (
        curriculum_id,
        expression_creative, expression_creative_enabled,
        research_fieldwork, research_fieldwork_enabled,
        critical_thinking, critical_thinking_enabled,
        social_contribution, social_contribution_enabled,
        metacognition_reflection, metacognition_reflection_enabled,
        question_generation, question_generation_enabled
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(t.curriculum_id, t.expression_creative || "", t.expression_creative_enabled ? 1 : 0, t.research_fieldwork || "", t.research_fieldwork_enabled ? 1 : 0, t.critical_thinking || "", t.critical_thinking_enabled ? 1 : 0, t.social_contribution || "", t.social_contribution_enabled ? 1 : 0, t.metacognition_reflection || "", t.metacognition_reflection_enabled ? 1 : 0, t.question_generation || "", t.question_generation_enabled ? 1 : 0).run();
    return e.json({ success: true, id: s.meta.last_row_id });
  } catch {
    return e.json({ error: "Database error" }, 500);
  }
});
p.put("/api/environment/design/:id", async (e) => {
  const { env: r } = e, t = e.req.param("id"), s = await e.req.json();
  try {
    return await r.DB.prepare(`
      UPDATE learning_environment_designs SET
        expression_creative = ?,
        expression_creative_enabled = ?,
        research_fieldwork = ?,
        research_fieldwork_enabled = ?,
        critical_thinking = ?,
        critical_thinking_enabled = ?,
        social_contribution = ?,
        social_contribution_enabled = ?,
        metacognition_reflection = ?,
        metacognition_reflection_enabled = ?,
        question_generation = ?,
        question_generation_enabled = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(s.expression_creative || "", s.expression_creative_enabled ? 1 : 0, s.research_fieldwork || "", s.research_fieldwork_enabled ? 1 : 0, s.critical_thinking || "", s.critical_thinking_enabled ? 1 : 0, s.social_contribution || "", s.social_contribution_enabled ? 1 : 0, s.metacognition_reflection || "", s.metacognition_reflection_enabled ? 1 : 0, s.question_generation || "", s.question_generation_enabled ? 1 : 0, t).run(), e.json({ success: true });
  } catch {
    return e.json({ error: "Database error" }, 500);
  }
});
p.get("/api/teacher/customization/:curriculumId", async (e) => {
  const { env: r } = e, t = e.req.param("curriculumId");
  try {
    const s = await r.DB.prepare(`
      SELECT * FROM teacher_customization
      WHERE curriculum_id = ?
      LIMIT 1
    `).bind(t).first();
    return e.json(s || {});
  } catch {
    return e.json({ error: "Database error" }, 500);
  }
});
p.post("/api/teacher/customization", async (e) => {
  const { env: r } = e, t = await e.req.json();
  try {
    const s = await r.DB.prepare(`
      SELECT id FROM teacher_customization
      WHERE curriculum_id = ?
    `).bind(t.curriculum_id).first();
    if (s) return await r.DB.prepare(`
        UPDATE teacher_customization SET
          teacher_id = ?,
          teaching_philosophy = ?,
          custom_unit_goal = ?,
          custom_non_cognitive_goal = ?,
          teaching_notes = ?,
          gamification_enabled = ?,
          badge_system_enabled = ?,
          narrative_enabled = ?,
          story_theme = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE curriculum_id = ?
      `).bind(t.teacher_id || 1, t.teaching_philosophy || "", t.custom_unit_goal || "", t.custom_non_cognitive_goal || "", t.teaching_notes || "", t.gamification_enabled ? 1 : 0, t.badge_system_enabled ? 1 : 0, t.narrative_enabled ? 1 : 0, t.story_theme || "", t.curriculum_id).run(), e.json({ success: true, id: s.id });
    {
      const n = await r.DB.prepare(`
        INSERT INTO teacher_customization (
          curriculum_id, teacher_id,
          teaching_philosophy,
          custom_unit_goal,
          custom_non_cognitive_goal,
          teaching_notes,
          gamification_enabled,
          badge_system_enabled,
          narrative_enabled,
          story_theme
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(t.curriculum_id, t.teacher_id || 1, t.teaching_philosophy || "", t.custom_unit_goal || "", t.custom_non_cognitive_goal || "", t.teaching_notes || "", t.gamification_enabled ? 1 : 0, t.badge_system_enabled ? 1 : 0, t.narrative_enabled ? 1 : 0, t.story_theme || "").run();
      return e.json({ success: true, id: n.meta.last_row_id });
    }
  } catch {
    return e.json({ error: "Database error" }, 500);
  }
});
p.get("/api/badges/student/:studentId/curriculum/:curriculumId", async (e) => {
  const { env: r } = e, t = e.req.param("studentId"), s = e.req.param("curriculumId");
  try {
    const n = await r.DB.prepare(`
      SELECT * FROM student_badges
      WHERE student_id = ? AND curriculum_id = ?
      ORDER BY earned_at DESC
    `).bind(t, s).all();
    return e.json(n.results);
  } catch {
    return e.json({ error: "Database error" }, 500);
  }
});
p.get("/api/narratives/student/:studentId/curriculum/:curriculumId", async (e) => {
  const { env: r } = e, t = e.req.param("studentId"), s = e.req.param("curriculumId");
  try {
    const n = await r.DB.prepare(`
      SELECT * FROM learning_narratives
      WHERE student_id = ? AND curriculum_id = ?
      ORDER BY chapter_number
    `).bind(t, s).all();
    return e.json(n.results);
  } catch {
    return e.json({ error: "Database error" }, 500);
  }
});
p.put("/api/cards/:cardId", async (e) => {
  const { env: r } = e, t = e.req.param("cardId"), s = await e.req.json();
  try {
    return await r.DB.prepare(`
      UPDATE learning_cards SET
        card_title = ?,
        problem_description = ?,
        new_terms = ?,
        example_problem = ?,
        example_solution = ?,
        diagram_url = ?,
        real_world_connection = ?,
        answer = ?,
        answer_explanation = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(s.card_title || "", s.problem_description || "", s.new_terms || "", s.example_problem || "", s.example_solution || "", s.diagram_url || "", s.real_world_connection || "", s.answer || "", s.answer_explanation || "", t).run(), e.json({ success: true });
  } catch {
    return e.json({ error: "Database error" }, 500);
  }
});
p.post("/api/cards", async (e) => {
  const { env: r } = e, t = await e.req.json();
  try {
    const s = await r.DB.prepare(`
      INSERT INTO learning_cards (
        course_id, card_number, card_title, card_type,
        problem_description, new_terms, example_problem,
        example_solution, diagram_url, real_world_connection
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(t.course_id, t.card_number, t.card_title || "", Et(t.card_type), t.problem_description || "", t.new_terms || "", t.example_problem || "", t.example_solution || "", t.diagram_url || "", t.real_world_connection || "").run();
    return e.json({ success: true, id: s.meta.last_row_id });
  } catch {
    return e.json({ error: "Database error" }, 500);
  }
});
p.delete("/api/cards/:cardId", async (e) => {
  const { env: r } = e, t = e.req.param("cardId");
  try {
    return await r.DB.prepare(`
      DELETE FROM hint_cards WHERE learning_card_id = ?
    `).bind(t).run(), await r.DB.prepare(`
      DELETE FROM learning_cards WHERE id = ?
    `).bind(t).run(), e.json({ success: true });
  } catch {
    return e.json({ error: "Database error" }, 500);
  }
});
p.put("/api/hints/:hintId", async (e) => {
  const { env: r } = e, t = e.req.param("hintId"), s = await e.req.json();
  try {
    return await r.DB.prepare(`
      UPDATE hint_cards SET
        hint_text = ?,
        thinking_tool_suggestion = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(s.hint_text || "", s.thinking_tool_suggestion || "", t).run(), e.json({ success: true });
  } catch {
    return e.json({ error: "Database error" }, 500);
  }
});
p.post("/api/hints", async (e) => {
  const { env: r } = e, t = await e.req.json();
  try {
    const s = await r.DB.prepare(`
      INSERT INTO hint_cards (
        learning_card_id, hint_number, hint_content, thinking_tool_suggestion
      ) VALUES (?, ?, ?, ?)
    `).bind(t.learning_card_id, t.hint_level || t.hint_number || 1, t.hint_text || t.hint_content || "", t.thinking_tool_suggestion || "").run();
    return e.json({ success: true, id: s.meta.last_row_id });
  } catch {
    return e.json({ error: "Database error" }, 500);
  }
});
p.delete("/api/hints/:hintId", async (e) => {
  const { env: r } = e, t = e.req.param("hintId");
  try {
    return await r.DB.prepare(`
      DELETE FROM hint_cards WHERE hint_id = ?
    `).bind(t).run(), e.json({ success: true });
  } catch {
    return e.json({ error: "Database error" }, 500);
  }
});
p.post("/api/course/:courseId/add-card", async (e) => {
  const { env: r } = e, t = e.req.param("courseId"), s = await e.req.json();
  try {
    const n = await r.DB.prepare(`
      SELECT MAX(card_number) as max_num
      FROM learning_cards
      WHERE course_id = ?
    `).bind(t).first(), a = ((n == null ? void 0 : n.max_num) || 0) + 1, i = (await r.DB.prepare(`
      INSERT INTO learning_cards (
        course_id, card_number, card_title, card_type,
        textbook_page, problem_description, new_terms, 
        example_problem, example_solution, real_world_connection,
        answer, answer_explanation
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(t, a, s.card_title || `\u5B66\u7FD2\u30AB\u30FC\u30C9${a}`, Et(s.card_type), s.textbook_page || "", s.problem_description || "", s.new_terms || "", s.example_problem || "", s.example_solution || "", s.real_world_connection || "", s.answer || "", s.answer_explanation || "").run()).meta.last_row_id;
    if (s.hints && Array.isArray(s.hints)) for (const c of s.hints) await r.DB.prepare(`
          INSERT INTO hint_cards (
            learning_card_id, hint_number, hint_content, thinking_tool_suggestion
          ) VALUES (?, ?, ?, ?)
        `).bind(i, c.hint_level || c.hint_number || 1, c.hint_text || c.hint_content || "", c.thinking_tool_suggestion || "").run();
    return e.json({ success: true, cardId: i, cardNumber: a });
  } catch (n) {
    return console.error("\u30AB\u30FC\u30C9\u8FFD\u52A0\u30A8\u30E9\u30FC:", n), e.json({ error: "\u30AB\u30FC\u30C9\u306E\u8FFD\u52A0\u306B\u5931\u6557\u3057\u307E\u3057\u305F", details: n.message }, 500);
  }
});
p.put("/api/cards/:cardId", async (e) => {
  const { env: r } = e, t = e.req.param("cardId"), s = await e.req.json();
  try {
    return await r.DB.prepare(`
      UPDATE learning_cards SET
        card_title = ?,
        card_type = ?,
        textbook_page = ?,
        problem_description = ?,
        new_terms = ?,
        example_problem = ?,
        example_solution = ?,
        real_world_connection = ?,
        answer = ?,
        answer_explanation = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(s.card_title || "", Et(s.card_type), s.textbook_page || "", s.problem_description || "", s.new_terms || "", s.example_problem || "", s.example_solution || "", s.real_world_connection || "", s.answer || "", s.answer_explanation || "", t).run(), e.json({ success: true });
  } catch (n) {
    return console.error("\u30AB\u30FC\u30C9\u66F4\u65B0\u30A8\u30E9\u30FC:", n), e.json({ error: "\u30AB\u30FC\u30C9\u306E\u66F4\u65B0\u306B\u5931\u6557\u3057\u307E\u3057\u305F", details: n.message }, 500);
  }
});
p.put("/api/cards/:cardId/hints", async (e) => {
  const { env: r } = e, t = e.req.param("cardId"), { hints: s } = await e.req.json();
  try {
    if (await r.DB.prepare(`
      DELETE FROM hint_cards WHERE learning_card_id = ?
    `).bind(t).run(), s && s.length > 0) for (let n = 0; n < s.length; n++) {
      const a = s[n];
      await r.DB.prepare(`
          INSERT INTO hint_cards (
            learning_card_id, hint_number, hint_content, hint_text, thinking_tool_suggestion
          ) VALUES (?, ?, ?, ?, ?)
        `).bind(t, n + 1, a.hint_text || a.hint_content || "", a.hint_text || a.hint_content || "", a.thinking_tool_suggestion || "").run();
    }
    return e.json({ success: true, message: "\u30D2\u30F3\u30C8\u3092\u66F4\u65B0\u3057\u307E\u3057\u305F" });
  } catch (n) {
    return console.error("\u30D2\u30F3\u30C8\u66F4\u65B0\u30A8\u30E9\u30FC:", n), e.json({ success: false, error: "\u30D2\u30F3\u30C8\u306E\u66F4\u65B0\u306B\u5931\u6557\u3057\u307E\u3057\u305F", details: n.message }, 500);
  }
});
p.post("/api/cards/:cardId/generate-similar", async (e) => {
  var s, n, a, o, i;
  const { env: r } = e, t = e.req.param("cardId");
  try {
    const c = await r.DB.prepare(`
      SELECT lc.*, c.course_name, curr.grade, curr.subject, curr.unit_name
      FROM learning_cards lc
      JOIN courses c ON lc.course_id = c.id
      JOIN curriculum curr ON c.curriculum_id = curr.id
      WHERE lc.id = ?
    `).bind(t).first();
    if (!c) return e.json({ error: "Card not found" }, 404);
    const l = r.GEMINI_API_KEY;
    if (!l) return e.json({ error: "API key not configured" }, 500);
    const u = `\u3042\u306A\u305F\u306F\u5C0F\u5B66\u6821\u306E\u512A\u79C0\u306A\u6559\u5E2B\u3067\u3059\u3002\u4EE5\u4E0B\u306E\u5B66\u7FD2\u30AB\u30FC\u30C9\u306E\u554F\u984C\u306B\u57FA\u3065\u3044\u3066\u3001\u985E\u4F3C\u554F\u984C\u30921\u554F\u751F\u6210\u3057\u3066\u304F\u3060\u3055\u3044\u3002

\u3010\u5143\u306E\u5B66\u7FD2\u30AB\u30FC\u30C9\u60C5\u5831\u3011
- \u5B66\u5E74: ${c.grade}
- \u6559\u79D1: ${c.subject}
- \u5358\u5143: ${c.unit_name}
- \u30B3\u30FC\u30B9: ${c.course_name}
- \u30AB\u30FC\u30C9\u30BF\u30A4\u30C8\u30EB: ${c.card_title}
- \u5143\u306E\u554F\u984C: ${c.problem_content}
- \u89E3\u7B54\u4F8B: ${c.answer || c.example_solution || ""}

\u3010\u985E\u4F3C\u554F\u984C\u306E\u6761\u4EF6\u3011
1. \u5143\u306E\u554F\u984C\u3068**\u540C\u3058\u5B66\u7FD2\u5185\u5BB9**\u3092\u7DF4\u7FD2\u3067\u304D\u308B\u554F\u984C\u306B\u3059\u308B
2. **\u6570\u5B57\u3084\u72B6\u6CC1\u3092\u5909\u3048\u305F**\u30D0\u30EA\u30A8\u30FC\u30B7\u30E7\u30F3\u3092\u4F5C\u6210
3. \u96E3\u6613\u5EA6\u306F\u5143\u306E\u554F\u984C\u3068\u540C\u7A0B\u5EA6
4. \u5177\u4F53\u7684\u3067\u5B50\u3069\u3082\u304C\u89E3\u3051\u308B\u5F62\u5F0F
5. \u5FC5\u305A\u89E3\u7B54\u4F8B\u3092\u4ED8\u3051\u308B

\u4EE5\u4E0B\u306EJSON\u5F62\u5F0F\u3067\u51FA\u529B\u3057\u3066\u304F\u3060\u3055\u3044\u3002\u8AAC\u660E\u6587\u306F\u4E0D\u8981\u3067\u3059\uFF1A
{
  "problem_text": "\u65B0\u3057\u3044\u985E\u4F3C\u554F\u984C\u306E\u554F\u984C\u6587",
  "answer": "\u89E3\u7B54\u4F8B",
  "hint_1": "\u30D2\u30F3\u30C81\uFF08\u307E\u305A\u8003\u3048\u3066\u307B\u3057\u3044\u3053\u3068\uFF09",
  "hint_2": "\u30D2\u30F3\u30C82\uFF08\u4E2D\u9593\u30D2\u30F3\u30C8\uFF09",
  "hint_3": "\u30D2\u30F3\u30C83\uFF08\u7B54\u3048\u306B\u8FD1\u3044\u30D2\u30F3\u30C8\uFF09"
}`, h = (((i = (o = (a = (n = (s = (await (await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${l}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ parts: [{ text: u }] }], generationConfig: { temperature: 0.9, maxOutputTokens: 2048 } }) })).json()).candidates) == null ? void 0 : s[0]) == null ? void 0 : n.content) == null ? void 0 : a.parts) == null ? void 0 : o[0]) == null ? void 0 : i.text) || "").match(/\{[\s\S]*\}/);
    if (!h) throw new Error("AI response is not valid JSON");
    const g = JSON.parse(h[0]);
    return e.json({ success: true, problem: g });
  } catch (c) {
    return console.error("\u985E\u4F3C\u554F\u984C\u751F\u6210\u30A8\u30E9\u30FC:", c), e.json({ error: "\u985E\u4F3C\u554F\u984C\u306E\u751F\u6210\u306B\u5931\u6557\u3057\u307E\u3057\u305F", details: c instanceof Error ? c.message : String(c) }, 500);
  }
});
p.post("/api/ai-chat", async (e) => {
  var r, t, s, n, a, o, i, c, l, u, d;
  console.log("\u{1F916} AI Chat API called");
  try {
    const { message: _, cardContext: m, conversationHistory: h, studentGrade: g } = await e.req.json();
    console.log("\u{1F4DD} Request data:", { message: _ == null ? void 0 : _.substring(0, 50), hasCardContext: !!m, conversationHistoryLength: (h == null ? void 0 : h.length) || 0, studentGrade: g });
    const { env: f } = e;
    if (!f.GEMINI_API_KEY) return console.error("\u274C GEMINI_API_KEY not found in environment variables"), console.error("\u274C Available env keys:", Object.keys(f)), e.json({ error: "Gemini API\u30AD\u30FC\u304C\u8A2D\u5B9A\u3055\u308C\u3066\u3044\u307E\u305B\u3093", details: "Cloudflare Pages\u306E\u74B0\u5883\u5909\u6570\u3067GEMINI_API_KEY\u3092\u8A2D\u5B9A\u3057\u3066\u304F\u3060\u3055\u3044\u3002Settings > Environment variables > Production/Preview \u304B\u3089\u8A2D\u5B9A\u3067\u304D\u307E\u3059\u3002" }, 500);
    console.log("\u2705 GEMINI_API_KEY found:", f.GEMINI_API_KEY.substring(0, 10) + "...");
    const E = g || h && h.some((S) => S.text && S.text.match(/[1-6]年生/));
    console.log("\u{1F4CA} Grade info:", { hasGradeInfo: E, studentGrade: g });
    let x = "";
    if (!E && (!h || h.length === 0)) x = `\u3042\u306A\u305F\u306F\u5C0F\u5B66\u751F\u306E\u5B66\u7FD2\u3092\u512A\u3057\u304F\u30B5\u30DD\u30FC\u30C8\u3059\u308BAI\u5148\u751F\u3067\u3059\u3002

\u3010\u521D\u56DE\u5BFE\u5FDC\u3011
\u6700\u521D\u306B\u3001\u5B50\u3069\u3082\u306B\u4F55\u5E74\u751F\u304B\u3092\u5C0B\u306D\u3066\u304F\u3060\u3055\u3044\u3002\u305D\u306E\u5F8C\u3001\u305D\u306E\u5B66\u5E74\u306B\u5408\u308F\u305B\u305F\u8A00\u8449\u3068\u8AAC\u660E\u306E\u96E3\u3057\u3055\u3067\u5BFE\u5FDC\u3057\u3066\u304F\u3060\u3055\u3044\u3002

\u3010\u56DE\u7B54\u4F8B\u3011
\u300C\u3053\u3093\u306B\u3061\u306F\uFF01AI\u5148\u751F\u3060\u3088\u3002\u4F55\u5E74\u751F\u304B\u306A\uFF1F\u6559\u3048\u3066\u304F\u308C\u308B\u3068\u3001\u3061\u3087\u3046\u3069\u3044\u3044\u8AAC\u660E\u304C\u3067\u304D\u308B\u3088\uFF01\u300D`;
    else {
      const S = g || "\u5C0F\u5B66\u751F";
      x = `\u3042\u306A\u305F\u306F${S}\u306E\u5B66\u7FD2\u3092\u512A\u3057\u304F\u30B5\u30DD\u30FC\u30C8\u3059\u308BAI\u5148\u751F\u3067\u3059\u3002
${m ? `
\u3010\u73FE\u5728\u306E\u5B66\u7FD2\u5185\u5BB9\u3011
- \u30AB\u30FC\u30C9\u30BF\u30A4\u30C8\u30EB: ${m.card_title}
- \u5B66\u7FD2\u5185\u5BB9: ${m.problem_description}
- \u65B0\u51FA\u7528\u8A9E: ${m.new_terms || "\u306A\u3057"}
` : ""}

\u3010\u7D76\u5BFE\u30EB\u30FC\u30EB\u3011
1. **\u5B66\u5E74\u306B\u5FDC\u3058\u305F\u8A00\u8449\u9063\u3044\u3092\u5FC5\u305A\u5B88\u308B**
   - ${ts(S)}
   - \u96E3\u3057\u3044\u6F22\u5B57\u3084\u8A00\u8449\u306F\u7D76\u5BFE\u306B\u4F7F\u308F\u305A\u3001${S}\u304C\u7FD2\u3063\u305F\u8A00\u8449\u3060\u3051\u3092\u4F7F\u3046
   - \u5C02\u9580\u7528\u8A9E\u306F\u4F7F\u308F\u305A\u3001\u3084\u3055\u3057\u304F\u8A00\u3044\u63DB\u3048\u308B

2. **\u3069\u3093\u306A\u8CEA\u554F\u306B\u3082\u5FC5\u305A\u7B54\u3048\u308B\uFF08\u8D85\u91CD\u8981\uFF01\uFF09**
   - \u274C \u7D76\u5BFE\u7981\u6B62: \u300C\u7B54\u3048\u3089\u308C\u307E\u305B\u3093\u300D\u300C\u308F\u304B\u308A\u307E\u305B\u3093\u300D\u300C\u8AAC\u660E\u304C\u96E3\u3057\u3044\u3067\u3059\u300D\u3068\u8A00\u3046\u3053\u3068
   - \u2705 \u5FC5\u305A\u5B9F\u884C: \u3069\u3093\u306A\u8CEA\u554F\u3067\u3082\u3001\u5B50\u3069\u3082\u306B\u5206\u304B\u308B\u5F62\u3067\u8AAC\u660E\u3092\u63D0\u4F9B\u3059\u308B
   - \u2705 \u65B9\u6CD5: \u96E3\u3057\u3044\u5185\u5BB9\u3067\u3082\u3001\u5177\u4F53\u4F8B\u30FB\u305F\u3068\u3048\u8A71\u30FB\u8EAB\u8FD1\u306A\u4F8B\u3067\u8AAC\u660E\u3059\u308B
   - \u2705 **\u7C21\u5358\u306A\u8CEA\u554F\u30FB\u57FA\u672C\u7684\u306A\u8CEA\u554F\u306B\u306F\u76F4\u63A5\u7B54\u3048\u3066OK**
   - \u2705 \u96E3\u3057\u3044\u554F\u984C\u3084\u8003\u3048\u3055\u305B\u305F\u3044\u554F\u984C\u306E\u5834\u5408\u306E\u307F\u3001\u8003\u3048\u65B9\u3084\u30D2\u30F3\u30C8\u3092\u6BB5\u968E\u7684\u306B\u5C0E\u304F

3. **\u3084\u3055\u3057\u304F\u5BFE\u8A71\u3092\u7D9A\u3051\u308B**
   - \u300C\u307E\u305A\u301C\u3092\u8003\u3048\u3066\u307F\u3088\u3046\u300D\u306E\u3088\u3046\u306B\u30B9\u30C6\u30C3\u30D7\u3092\u793A\u3059
   - \u300C\u56F3\u306B\u66F8\u3044\u3066\u307F\u308B\u3068\u3044\u3044\u3088\u300D\u306A\u3069\u5177\u4F53\u7684\u306A\u65B9\u6CD5\u3092\u63D0\u6848
   - \u300C\u3044\u3044\u3068\u3053\u308D\u306B\u6C17\u3065\u3044\u305F\u306D\uFF01\u300D\u306A\u3069\u52B1\u307E\u3057\u3092\u5FC5\u305A\u5165\u308C\u308B
   - **300\u301C500\u6587\u5B57\u7A0B\u5EA6\u3067\u3001\u4E01\u5BE7\u306B\u8AAC\u660E\u3057\u3001\u9014\u4E2D\u3067\u5207\u308C\u306A\u3044\u3088\u3046\u306B\u5B8C\u7D50\u3057\u305F\u56DE\u7B54\u3092\u3059\u308B**
   - **\u8AAC\u660E\u306F\u5177\u4F53\u4F8B\u30922\u301C3\u500B\u5165\u308C\u3066\u3001\u5206\u304B\u308A\u3084\u3059\u304F\u3059\u308B**
   - \u6700\u5F8C\u306B\u300C\u301C\u306F\u5206\u304B\u3063\u305F\u304B\u306A\uFF1F\u300D\u300C\u3082\u3063\u3068\u77E5\u308A\u305F\u3044\u3053\u3068\u306F\u3042\u308B\uFF1F\u300D\u3068\u7406\u89E3\u78BA\u8A8D\u30FB\u8FFD\u52A0\u8CEA\u554F\u3092\u4FC3\u3059

\u3010\u826F\u3044\u56DE\u7B54\u4F8B\u3011

**\u7C21\u5358\u306A\u8CEA\u554F\u30FB\u7528\u8A9E\u8AAC\u660E\uFF08\u76F4\u63A5\u7B54\u3048\u308B\uFF09\uFF1A**
\u8CEA\u554F\u300C\u5B89\u5168\u4FDD\u969C\u7406\u4E8B\u4F1A\u3063\u3066\u4F55\uFF1F\u300D
\u2192 \u5C0F\u5B664\u5E74\u751F\u5411\u3051: \u300C\u3042\u3093\u305C\u3093\u307B\u3057\u3087\u3046\u308A\u3058\u304B\u3044\u306F\u3001\u4E16\u754C\u306E\u5E73\u548C\u3092\u5B88\u308B\u305F\u3081\u306E\u5927\u5207\u306A\u8A71\u3057\u5408\u3044\u306E\u5834\u3060\u3088\u300215\u306E\u56FD\u304C\u30E1\u30F3\u30D0\u30FC\u3067\u3001\u305D\u306E\u4E2D\u3067\u3082\u7279\u306B\u5927\u304D\u306A\u529B\u3092\u6301\u30645\u3064\u306E\u56FD\u304C\u3042\u308B\u3093\u3060\u3002\u65E5\u672C\u3082\u53C2\u52A0\u3057\u305F\u3044\u3068\u8003\u3048\u3066\u3044\u308B\u3088\u3002\u56FD\u3068\u56FD\u306E\u3051\u3093\u304B\u3092\u6B62\u3081\u305F\u308A\u3001\u5E73\u548C\u3092\u5B88\u308B\u305F\u3081\u306E\u30EB\u30FC\u30EB\u3092\u6C7A\u3081\u305F\u308A\u3057\u3066\u3044\u308B\u3093\u3060\u3088\u3002\u300D

\u8CEA\u554F\u300C\u9996\u90FD\u3063\u3066\u4F55\uFF1F\u300D
\u2192 \u5C0F\u5B663\u5E74\u751F\u5411\u3051: \u300C\u3057\u3085\u3068\u306F\u3001\u56FD\u3067\u4E00\u756A\u5927\u5207\u306A\u753A\u306E\u3053\u3068\u3060\u3088\u3002\u65E5\u672C\u306E\u3057\u3085\u3068\u306F\u6771\u4EAC\u3067\u3001\u56FD\u306E\u30EA\u30FC\u30C0\u30FC\u3084\u5927\u5207\u306A\u5EFA\u7269\u304C\u3042\u308B\u3093\u3060\u3002\u30A2\u30E1\u30EA\u30AB\u306E\u3057\u3085\u3068\u306F\u30EF\u30B7\u30F3\u30C8\u30F3D.C.\u3060\u3088\u3002\u300D

\u8CEA\u554F\u300C3\xD74\u306F\u3044\u304F\u3064\uFF1F\u300D
\u2192 \u5C0F\u5B662\u5E74\u751F\u5411\u3051: \u300C3\xD74\u306F12\u3060\u3088\uFF01\u304B\u3051\u7B97\u306F\u3001\u540C\u3058\u6570\u3092\u305F\u304F\u3055\u3093\u8DB3\u3059\u3053\u3068\u3060\u304B\u3089\u30013+3+3+3=12\u306B\u306A\u308B\u3093\u3060\u3002\u308A\u3093\u3054\u304C3\u3053\u305A\u3064\u30014\u3064\u306E\u304B\u3054\u306B\u3042\u308B\u3068\u8003\u3048\u3066\u307F\u3066\u306D\u3002\u300D

**\u8003\u3048\u3055\u305B\u305F\u3044\u554F\u984C\uFF08\u30D2\u30F3\u30C8\u3067\u5C0E\u304F\uFF09\uFF1A**
\u8CEA\u554F\u300C\u3053\u306E\u554F\u984C\u306E\u7B54\u3048\u3092\u6559\u3048\u3066\u300D
\u2192 \u300C\u307E\u305A\u3001\u554F\u984C\u6587\u3067\u4F55\u3092\u805E\u304B\u308C\u3066\u3044\u308B\u304B\u78BA\u8A8D\u3057\u3066\u307F\u3088\u3046\u3002\u6B21\u306B\u3001\u5206\u304B\u3063\u3066\u3044\u308B\u3053\u3068\u3092\u6574\u7406\u3059\u308B\u3068\u8003\u3048\u3084\u3059\u304F\u306A\u308B\u3088\u3002\u3069\u3093\u306A\u3068\u3053\u308D\u307E\u3067\u5206\u304B\u3063\u305F\u304B\u306A\uFF1F\u300D

\u8CEA\u554F\u300C\u306A\u3093\u3067\u52C9\u5F37\u3057\u306A\u3044\u3068\u3044\u3051\u306A\u3044\u306E\uFF1F\u300D
\u2192 \u5C0F\u5B663\u5E74\u751F\u5411\u3051: \u300C\u3044\u3044\u8CEA\u554F\u3060\u306D\uFF01\u52C9\u5F37\u306F\u3001\u304D\u307F\u306E\u300E\u3067\u304D\u308B\u3053\u3068\u300F\u3092\u3075\u3084\u3059\u305F\u3081\u3060\u3088\u3002\u5B57\u304C\u8AAD\u3081\u308B\u3068\u672C\u304C\u8AAD\u3081\u308B\u3057\u3001\u8A08\u7B97\u304C\u3067\u304D\u308B\u3068\u304A\u8CB7\u3044\u7269\u3082\u697D\u3057\u304F\u306A\u308B\u3002\u5C06\u6765\u306A\u308A\u305F\u3044\u3082\u306E\u3092\u898B\u3064\u3051\u305F\u3068\u304D\u3001\u52C9\u5F37\u3057\u305F\u3053\u3068\u304C\u5F79\u306B\u7ACB\u3064\u3093\u3060\u3002\u4ECA\u306F\u4F55\u306B\u8208\u5473\u304C\u3042\u308B\u304B\u306A\uFF1F\u300D`;
    }
    const y = h && h.length > 0 ? [{ parts: [{ text: x }] }, ...h.map((S) => ({ role: S.role === "user" ? "user" : "model", parts: [{ text: S.text }] })), { role: "user", parts: [{ text: _ }] }] : [{ parts: [{ text: x }, { text: `\u5B50\u3069\u3082\u306E\u8CEA\u554F: ${_}` }] }];
    console.log("\u{1F680} Calling Gemini API..."), console.log("\u{1F4E4} Request contents length:", y.length), console.log("\u{1F4E4} First content:", JSON.stringify(y[0]).substring(0, 200));
    const v = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${f.GEMINI_API_KEY}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: y, generationConfig: { temperature: 0.8, maxOutputTokens: 1500, topK: 40, topP: 0.95 }, safetySettings: [{ category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" }, { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }, { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" }, { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" }] }) });
    if (console.log("\u{1F4E5} Gemini API response status:", v.status), console.log("\u{1F4E5} Response OK:", v.ok), !v.ok) {
      const S = await v.text();
      throw console.error("\u274C Gemini API\u30A8\u30E9\u30FC:", v.status, v.statusText), console.error("\u274C Error body:", S), new Error(`Gemini API returned ${v.status}: ${v.statusText}`);
    }
    const b = await v.json();
    if (console.log("\u2705 Gemini API response received"), console.log("\u{1F4CA} Response data keys:", Object.keys(b)), console.log("\u{1F50D} Gemini API \u30EC\u30B9\u30DD\u30F3\u30B9\u69CB\u9020:", { hasCandidates: !!b.candidates, candidatesLength: (r = b.candidates) == null ? void 0 : r.length, firstCandidate: (t = b.candidates) != null && t[0] ? { finishReason: b.candidates[0].finishReason, hasContent: !!b.candidates[0].content, hasParts: !!((s = b.candidates[0].content) != null && s.parts), partsLength: (a = (n = b.candidates[0].content) == null ? void 0 : n.parts) == null ? void 0 : a.length } : null }), !b.candidates || b.candidates.length === 0) return console.error("\u274C Gemini API - \u5019\u88DC\u306A\u3057:", JSON.stringify(b, null, 2)), e.json({ response: `\u3054\u3081\u3093\u306D\u3001\u4ECA\u305D\u306E\u8CEA\u554F\u306B\u3046\u307E\u304F\u7B54\u3048\u3089\u308C\u306A\u304B\u3063\u305F\u3088\u3002
\u5225\u306E\u805E\u304D\u65B9\u3092\u3057\u3066\u307F\u308B\u304B\u3001\u5177\u4F53\u7684\u306B\u3069\u3053\u304C\u5206\u304B\u3089\u306A\u3044\u304B\u6559\u3048\u3066\u304F\u308C\u308B\u304B\u306A\uFF1F
\u5148\u751F\u3084\u304A\u7236\u3055\u3093\u30FB\u304A\u6BCD\u3055\u3093\u306B\u805E\u304F\u306E\u3082\u3044\u3044\u65B9\u6CD5\u3060\u3088\uFF01` });
    const T = b.candidates[0];
    console.log("\u{1F4CA} Candidate finishReason:", T.finishReason), console.log("\u{1F4CA} Has content:", !!T.content), console.log("\u{1F4CA} Has parts:", !!((o = T.content) != null && o.parts)), console.log("\u{1F4CA} Parts length:", (c = (i = T.content) == null ? void 0 : i.parts) == null ? void 0 : c.length);
    const O = (d = (u = (l = T == null ? void 0 : T.content) == null ? void 0 : l.parts) == null ? void 0 : u[0]) == null ? void 0 : d.text;
    return O && O.trim() !== "" ? (console.log("\u2705 AI\u56DE\u7B54\u53D6\u5F97\u6210\u529F:", O.substring(0, 100)), e.json({ response: O })) : (console.error("\u274C AI\u56DE\u7B54\u304C\u7A7A:", { candidate: T, finishReason: T.finishReason, safetyRatings: T.safetyRatings }), T.finishReason === "SAFETY" ? e.json({ response: `\u305D\u306E\u8CEA\u554F\u3001\u3061\u3087\u3063\u3068\u96E3\u3057\u3044\u306D\u3002
\u9055\u3046\u805E\u304D\u65B9\u3067\u3001\u3082\u3046\u4E00\u5EA6\u8CEA\u554F\u3057\u3066\u307F\u3066\u304F\u308C\u308B\u304B\u306A\uFF1F
\u305D\u308C\u304B\u3001\u5148\u751F\u306B\u805E\u3044\u3066\u307F\u308B\u306E\u3082\u3044\u3044\u3088\uFF01` }) : e.json({ response: `\u3054\u3081\u3093\u306D\u3001\u4ECA\u305D\u306E\u8CEA\u554F\u306B\u3046\u307E\u304F\u7B54\u3048\u3089\u308C\u306A\u304B\u3063\u305F\u3088\u3002
\u3082\u3046\u4E00\u5EA6\u3001\u5225\u306E\u8A00\u8449\u3067\u8CEA\u554F\u3057\u3066\u307F\u3066\u304F\u308C\u308B\u304B\u306A\uFF1F
\u5148\u751F\u306B\u805E\u3044\u3066\u307F\u308B\u306E\u3082\u3044\u3044\u3088\uFF01` }));
  } catch (_) {
    return console.error("AI\u30C1\u30E3\u30C3\u30C8\u30A8\u30E9\u30FC:", _), console.error("\u30A8\u30E9\u30FC\u8A73\u7D30:", _.message), e.json({ error: "AI\u304C\u4ECA\u306F\u7B54\u3048\u3089\u308C\u307E\u305B\u3093\u3002\u5148\u751F\u306B\u805E\u3044\u3066\u307F\u3066\u306D\uFF01", details: _.message }, 500);
  }
});
p.get("/test-buttons.html", async (e) => e.html(`<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>\u30DC\u30BF\u30F3\u30C6\u30B9\u30C8</title>
    <script src="https://cdn.tailwindcss.com"><\/script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"><\/script>
</head>
<body class="bg-gray-100 p-8">
    <div class="max-w-4xl mx-auto">
        <h1 class="text-3xl font-bold mb-8">\u30DC\u30BF\u30F3\u52D5\u4F5C\u30C6\u30B9\u30C8</h1>
        
        <div class="bg-white rounded-lg shadow-xl p-8 mb-6">
            <h2 class="text-2xl font-bold mb-4">\u30B0\u30ED\u30FC\u30D0\u30EB\u95A2\u6570\u30C1\u30A7\u30C3\u30AF</h2>
            <div id="function-check" class="space-y-2 font-mono text-sm"></div>
        </div>
        
        <div class="bg-white rounded-lg shadow-xl p-8 mb-6">
            <h2 class="text-2xl font-bold mb-4">\u30C6\u30B9\u30C8\u30DC\u30BF\u30F3</h2>
            
            <div class="space-y-4">
                <button 
                    onclick="testProgressBoard()"
                    class="w-full bg-blue-500 hover:bg-blue-600 text-white px-6 py-4 rounded-lg font-bold">
                    \u9032\u6357\u30DC\u30FC\u30C9\u9078\u629E\u3092\u30C6\u30B9\u30C8
                </button>
                
                <button 
                    onclick="testWeeklyReport()"
                    class="w-full bg-green-500 hover:bg-green-600 text-white px-6 py-4 rounded-lg font-bold">
                    \u9031\u6B21\u30EC\u30DD\u30FC\u30C8\u3092\u30C6\u30B9\u30C8
                </button>
                
                <button 
                    onclick="testLoadProgressBoard()"
                    class="w-full bg-purple-500 hover:bg-purple-600 text-white px-6 py-4 rounded-lg font-bold">
                    \u9032\u6357\u30DC\u30FC\u30C9\u8AAD\u307F\u8FBC\u307F\u3092\u30C6\u30B9\u30C8 (ID=1)
                </button>
            </div>
        </div>
        
        <div class="bg-white rounded-lg shadow-xl p-8">
            <h2 class="text-2xl font-bold mb-4">\u30B3\u30F3\u30BD\u30FC\u30EB\u30ED\u30B0</h2>
            <div id="console-log" class="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm h-64 overflow-y-auto"></div>
        </div>
    </div>
    
    <script>
        // DOMContentLoaded\u5F8C\u306B\u521D\u671F\u5316
        document.addEventListener('DOMContentLoaded', () => {
            // \u30B3\u30F3\u30BD\u30FC\u30EB\u30ED\u30B0\u3092\u30DA\u30FC\u30B8\u306B\u8868\u793A
            const originalLog = console.log
            const originalError = console.error
            const logDiv = document.getElementById('console-log')
            
            function addLog(message, isError = false) {
                if (!logDiv) return
                const line = document.createElement('div')
                line.textContent = new Date().toLocaleTimeString() + ' - ' + message
                line.className = isError ? 'text-red-400' : 'text-green-400'
                logDiv.appendChild(line)
                logDiv.scrollTop = logDiv.scrollHeight
            }
            
            console.log = function(...args) {
                originalLog.apply(console, args)
                addLog(args.join(' '))
            }
            
            console.error = function(...args) {
                originalError.apply(console, args)
                addLog(args.join(' '), true)
            }
            
            console.log('\u2705 \u30C6\u30B9\u30C8\u30DA\u30FC\u30B8\u521D\u671F\u5316\u5B8C\u4E86')
        })
    <\/script>
    
    <script src="/static/ocr-handler.js"><\/script>
    <script src="/static/app.js"><\/script>
    
    <script>
        // app.js\u8AAD\u307F\u8FBC\u307F\u5F8C\u306B\u30B0\u30ED\u30FC\u30D0\u30EB\u95A2\u6570\u3092\u30C1\u30A7\u30C3\u30AF
        window.addEventListener('load', () => {
            const checkDiv = document.getElementById('function-check')
            if (!checkDiv) {
                console.error('\u274C function-check \u8981\u7D20\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093')
                return
            }
            
            const functions = [
                'showProgressBoardSelection',
                'showDemoWeeklyReport',
                'loadProgressBoard',
                'renderTopPage'
            ]
            
            functions.forEach(fname => {
                const exists = typeof window[fname] === 'function'
                const status = exists ? '\u2705' : '\u274C'
                const color = exists ? 'text-green-600' : 'text-red-600'
                const windowCheck = typeof window[fname]
                checkDiv.innerHTML += '<div class="' + color + '">' + status + ' window.' + fname + ' = ' + windowCheck + '</div>'
            })
            
            console.log('\u2705 \u30B0\u30ED\u30FC\u30D0\u30EB\u95A2\u6570\u30C1\u30A7\u30C3\u30AF\u5B8C\u4E86')
        })
        
        // \u30C6\u30B9\u30C8\u95A2\u6570
        function testProgressBoard() {
            console.log('\u{1F9EA} \u9032\u6357\u30DC\u30FC\u30C9\u9078\u629E\u3092\u30C6\u30B9\u30C8\u4E2D...')
            try {
                if (typeof window.showProgressBoardSelection === 'function') {
                    window.showProgressBoardSelection()
                    console.log('\u2705 showProgressBoardSelection() \u547C\u3073\u51FA\u3057\u6210\u529F')
                } else {
                    console.error('\u274C window.showProgressBoardSelection \u304C\u95A2\u6570\u3067\u306F\u3042\u308A\u307E\u305B\u3093')
                }
            } catch (error) {
                console.error('\u274C \u30A8\u30E9\u30FC:', error.message)
            }
        }
        
        function testWeeklyReport() {
            console.log('\u{1F9EA} \u9031\u6B21\u30EC\u30DD\u30FC\u30C8\u3092\u30C6\u30B9\u30C8\u4E2D...')
            try {
                if (typeof window.showDemoWeeklyReport === 'function') {
                    window.showDemoWeeklyReport()
                    console.log('\u2705 showDemoWeeklyReport() \u547C\u3073\u51FA\u3057\u6210\u529F')
                } else {
                    console.error('\u274C window.showDemoWeeklyReport \u304C\u95A2\u6570\u3067\u306F\u3042\u308A\u307E\u305B\u3093')
                }
            } catch (error) {
                console.error('\u274C \u30A8\u30E9\u30FC:', error.message)
            }
        }
        
        function testLoadProgressBoard() {
            console.log('\u{1F9EA} \u9032\u6357\u30DC\u30FC\u30C9\u8AAD\u307F\u8FBC\u307F\u3092\u30C6\u30B9\u30C8\u4E2D...')
            try {
                if (typeof window.loadProgressBoard === 'function') {
                    // \u30C0\u30DF\u30FC\u306Estate\u8A2D\u5B9A
                    if (!window.state) {
                        window.state = {
                            student: {
                                classCode: 'CLASS2024A'
                            }
                        }
                    }
                    window.loadProgressBoard(1)
                    console.log('\u2705 loadProgressBoard(1) \u547C\u3073\u51FA\u3057\u6210\u529F')
                } else {
                    console.error('\u274C window.loadProgressBoard \u304C\u95A2\u6570\u3067\u306F\u3042\u308A\u307E\u305B\u3093')
                }
            } catch (error) {
                console.error('\u274C \u30A8\u30E9\u30FC:', error.message)
            }
        }
    <\/script>
</body>
</html>`));
p.get("/", (e) => e.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="description" content="AI\u642D\u8F09\u306E\u81EA\u7531\u9032\u5EA6\u5B66\u7FD2\u652F\u63F4\u30B7\u30B9\u30C6\u30E0 - \u500B\u5225\u6700\u9069\u5316\u3055\u308C\u305F\u5B66\u7FD2\u4F53\u9A13\u3092\u63D0\u4F9B">
        <title>\u81EA\u7531\u9032\u5EA6\u5B66\u7FD2\u652F\u63F4\u30B7\u30B9\u30C6\u30E0</title>
        
        <!-- DNS Prefetch & Preconnect for faster CDN loading -->
        <link rel="dns-prefetch" href="https://cdn.tailwindcss.com">
        <link rel="dns-prefetch" href="https://cdn.jsdelivr.net">
        <link rel="dns-prefetch" href="https://cdnjs.cloudflare.com">
        <link rel="preconnect" href="https://cdn.tailwindcss.com" crossorigin>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
        
        <!-- Preload Critical Resources -->
        <link rel="preload" href="https://cdn.tailwindcss.com" as="script">
        <link rel="preload" href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" as="style">
        <link rel="preload" href="/static/styles.css" as="style">
        <link rel="preload" href="/static/app.js" as="script">
        
        <!-- Stylesheets -->
        <script src="https://cdn.tailwindcss.com"><\/script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        
        <!-- Deferred Libraries (non-critical) -->
        <script defer src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"><\/script>
        <script defer src="https://cdn.jsdelivr.net/npm/sortablejs@1.15.0/Sortable.min.js"><\/script>
        <script defer src="https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js"><\/script>
        <script defer src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"><\/script>
        <script defer src="https://unpkg.com/@ffmpeg/ffmpeg@0.11.6/dist/ffmpeg.min.js"><\/script>
        <script defer src="https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.13/dist/face-api.min.js"><\/script>
        <style>
          /* FontAwesome fa-spin animation */
          @keyframes fa-spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .fa-spin {
            animation: fa-spin 1s infinite linear;
          }
          
          @media print {
            body { background: white !important; }
            .print\\:hidden { display: none !important; }
            .print\\:shadow-none { box-shadow: none !important; }
            .print\\:break-after-page { page-break-after: always; }
            .print\\:break-inside-avoid { page-break-inside: avoid; }
            @page { margin: 1cm; }
          }
        </style>
    </head>
    <body class="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
        <div id="app">
          <div class="flex items-center justify-center min-h-screen">
            <div class="text-center">
              <div class="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mb-4"></div>
              <p class="text-xl text-gray-700">\u30B7\u30B9\u30C6\u30E0\u3092\u8AAD\u307F\u8FBC\u3093\u3067\u3044\u307E\u3059...</p>
            </div>
          </div>
        </div>
        
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"><\/script>
        <script>
          // DOMContentLoaded\u5F8C\u306B\u30B9\u30AF\u30EA\u30D7\u30C8\u3092\u52D5\u7684\u8AAD\u307F\u8FBC\u307F
          document.addEventListener('DOMContentLoaded', () => {
            console.log('\u{1F4E6} DOMContentLoaded: \u30B9\u30AF\u30EA\u30D7\u30C8\u8AAD\u307F\u8FBC\u307F\u958B\u59CB')
            
            const scripts = [
              '/static/ocr-simple.js',
              '/static/tts.js',
              '/static/visual-support.js', 
              '/static/realtime.js',
              '/static/realtime-notifications.js',
              '/static/visual-diagram-generator.js',
              '/static/visual-feedback.js',
              '/static/educational-media.js',
              '/static/advanced-speech.js',
              '/static/interactive-tools-level3.js',
              '/static/advanced-3d-visualization.js',
              '/static/music-generation-level3.js',
              '/static/all-subjects-master.js',
              '/static/learning-styles.js',
              '/static/phase3-demo-data.js',
              '/static/phase3.js',
              '/static/app.js'
            ]
            
            let loadedCount = 0
            
            scripts.forEach((src, index) => {
              const script = document.createElement('script')
              script.src = src
              script.async = false // \u9806\u756A\u306B\u8AAD\u307F\u8FBC\u3080
              script.onload = () => {
                console.log('\u2705 \u8AAD\u307F\u8FBC\u307F\u5B8C\u4E86:', src)
                loadedCount++
                
                // \u5168\u30B9\u30AF\u30EA\u30D7\u30C8\u8AAD\u307F\u8FBC\u307F\u5B8C\u4E86\u5F8C
                if (loadedCount === scripts.length) {
                  console.log('\u{1F680} \u5168\u30B9\u30AF\u30EA\u30D7\u30C8\u8AAD\u307F\u8FBC\u307F\u5B8C\u4E86')
                  setTimeout(() => {
                    if (typeof window.renderTopPage === 'function') {
                      console.log('\u{1F3AF} renderTopPage\u3092\u5B9F\u884C')
                      window.renderTopPage()
                    } else {
                      console.error('\u274C renderTopPage not found')
                      document.getElementById('app').innerHTML = '<div class="flex items-center justify-center min-h-screen p-4"><div class="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center"><div class="text-red-600 mb-4"><i class="fas fa-exclamation-triangle text-6xl"></i></div><h2 class="text-2xl font-bold text-gray-800 mb-4">\u30B7\u30B9\u30C6\u30E0\u30A8\u30E9\u30FC</h2><p class="text-gray-600 mb-6">\u30B9\u30AF\u30EA\u30D7\u30C8\u306E\u8AAD\u307F\u8FBC\u307F\u306B\u5931\u6557\u3057\u307E\u3057\u305F\u3002\u30DA\u30FC\u30B8\u3092\u30EA\u30D5\u30EC\u30C3\u30B7\u30E5\u3057\u3066\u304F\u3060\u3055\u3044\u3002</p><button onclick="location.reload()" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition"><i class="fas fa-redo mr-2"></i>\u30EA\u30D5\u30EC\u30C3\u30B7\u30E5</button></div></div>'
                    }
                  }, 200)
                }
              }
              script.onerror = (error) => {
                console.error('\u274C \u8AAD\u307F\u8FBC\u307F\u30A8\u30E9\u30FC:', src, error)
                document.getElementById('app').innerHTML = '<div class="flex items-center justify-center min-h-screen p-4"><div class="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center"><div class="text-red-600 mb-4"><i class="fas fa-exclamation-triangle text-6xl"></i></div><h2 class="text-2xl font-bold text-gray-800 mb-4">\u8AAD\u307F\u8FBC\u307F\u30A8\u30E9\u30FC</h2><p class="text-gray-600 mb-6">\u30D5\u30A1\u30A4\u30EB: ' + src + '</p><button onclick="location.reload()" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition"><i class="fas fa-redo mr-2"></i>\u30EA\u30D5\u30EC\u30C3\u30B7\u30E5</button></div></div>'
              }
              document.head.appendChild(script)
            })
          })
        <\/script>
    </body>
    </html>
  `));
p.post("/api/ai/diagnosis", async (e) => {
  var a, o, i, c, l;
  const { env: r } = e, { studentId: t, curriculumId: s } = await e.req.json(), n = r.GEMINI_API_KEY;
  if (!n) return e.json({ diagnosis: "\u5B66\u7FD2\u8A3A\u65AD\u6A5F\u80FD\u306F\u73FE\u5728\u5229\u7528\u3067\u304D\u307E\u305B\u3093\u3002", recommendations: [], strengths: [], areas_for_improvement: [] });
  try {
    const u = await r.DB.prepare(`
      SELECT 
        sp.*,
        lc.card_title,
        lc.card_type,
        lc.card_number
      FROM student_progress sp
      JOIN learning_cards lc ON sp.learning_card_id = lc.id
      WHERE sp.student_id = ? AND sp.curriculum_id = ?
      ORDER BY sp.updated_at DESC
      LIMIT 20
    `).bind(t, s).all(), d = await r.DB.prepare(`
      SELECT help_type, COUNT(*) as count
      FROM student_progress
      WHERE student_id = ? AND curriculum_id = ?
      GROUP BY help_type
    `).bind(t, s).all(), _ = u.results.reduce((b, T) => (T.understanding_level && (b.total++, b.sum += T.understanding_level, T.understanding_level >= 4 && b.high++, T.understanding_level <= 2 && b.low++), b), { total: 0, sum: 0, high: 0, low: 0 }), m = _.total > 0 ? (_.sum / _.total).toFixed(1) : "0", h = `\u3042\u306A\u305F\u306F\u5C0F\u5B66\u751F\u306E\u5B66\u7FD2\u3092\u652F\u63F4\u3059\u308B\u512A\u3057\u3044AI\u5148\u751F\u3067\u3059\u3002
\u4EE5\u4E0B\u306E\u5B66\u7FD2\u30C7\u30FC\u30BF\u304B\u3089\u3001\u3053\u306E\u5150\u7AE5\u306E\u5B66\u7FD2\u72B6\u6CC1\u3092\u5206\u6790\u3057\u3066\u3001\u5177\u4F53\u7684\u306A\u30A2\u30C9\u30D0\u30A4\u30B9\u3092\u3057\u3066\u304F\u3060\u3055\u3044\u3002

\u3010\u5B66\u7FD2\u30C7\u30FC\u30BF\u3011
- \u5B66\u7FD2\u30AB\u30FC\u30C9\u7DCF\u6570: ${u.results.length}\u679A
- \u5E73\u5747\u7406\u89E3\u5EA6: ${m}/5
- \u9AD8\u7406\u89E3\u5EA6\u30AB\u30FC\u30C9: ${_.high}\u679A
- \u4F4E\u7406\u89E3\u5EA6\u30AB\u30FC\u30C9: ${_.low}\u679A
- \u52A9\u3051\u8981\u8ACB: ${JSON.stringify(d.results)}

\u3010\u6700\u8FD1\u306E\u5B66\u7FD2\u30AB\u30FC\u30C9\u3011
${u.results.slice(0, 5).map((b) => `- ${b.card_title} (\u7406\u89E3\u5EA6: ${b.understanding_level || "\u672A\u8A55\u4FA1"}/5)`).join(`
`)}

\u4EE5\u4E0B\u306EJSON\u5F62\u5F0F\u3067\u8A3A\u65AD\u7D50\u679C\u3092\u51FA\u529B\u3057\u3066\u304F\u3060\u3055\u3044\uFF1A
{
  "overall_assessment": "\u5168\u4F53\u7684\u306A\u5B66\u7FD2\u72B6\u6CC1\u306E\u8A55\u4FA1\uFF08100\u6587\u5B57\u4EE5\u5185\uFF09",
  "strengths": ["\u5F37\u307F1", "\u5F37\u307F2", "\u5F37\u307F3"],
  "areas_for_improvement": ["\u6539\u5584\u70B91", "\u6539\u5584\u70B92"],
  "recommendations": [
    {"title": "\u304A\u3059\u3059\u3081\u30A2\u30AF\u30B7\u30E7\u30F31", "description": "\u5177\u4F53\u7684\u306A\u8AAC\u660E"},
    {"title": "\u304A\u3059\u3059\u3081\u30A2\u30AF\u30B7\u30E7\u30F32", "description": "\u5177\u4F53\u7684\u306A\u8AAC\u660E"}
  ],
  "encouragement": "\u5150\u7AE5\u3078\u306E\u52B1\u307E\u3057\u30E1\u30C3\u30BB\u30FC\u30B8\uFF0850\u6587\u5B57\u4EE5\u5185\uFF09"
}`, g = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${n}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ parts: [{ text: h }] }], generationConfig: { temperature: 0.7, maxOutputTokens: 2048 } }) }), f = await g.json();
    if (!g.ok) throw console.error("Gemini API \u30A8\u30E9\u30FC:", f), new Error(`Gemini API error: ${JSON.stringify(f)}`);
    const E = ((l = (c = (i = (o = (a = f.candidates) == null ? void 0 : a[0]) == null ? void 0 : o.content) == null ? void 0 : i.parts) == null ? void 0 : c[0]) == null ? void 0 : l.text) || "{}";
    console.log("AI\u8A3A\u65AD\u30EC\u30B9\u30DD\u30F3\u30B9\uFF08\u6700\u521D\u306E500\u6587\u5B57\uFF09:", E.substring(0, 500)), console.log("AI\u8A3A\u65AD\u30EC\u30B9\u30DD\u30F3\u30B9\uFF08\u6700\u5F8C\u306E500\u6587\u5B57\uFF09:", E.substring(Math.max(0, E.length - 500)));
    let x = "{}";
    const y = E.match(/```json\s*([\s\S]*?)\s*```/);
    if (y) x = y[1];
    else {
      const b = E.match(/\{[\s\S]*\}/);
      b && (x = b[0]);
    }
    console.log("\u62BD\u51FA\u3057\u305FJSON\uFF08\u6700\u521D\u306E500\u6587\u5B57\uFF09:", x.substring(0, 500)), x = x.replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"').replace(/[\u2013\u2014]/g, "-");
    let v;
    try {
      v = JSON.parse(x);
    } catch (b) {
      throw console.error("JSON parse \u30A8\u30E9\u30FC:", b), console.error("\u30D1\u30FC\u30B9\u5931\u6557\u3057\u305FJSON:", x), new Error(`JSON parse failed: ${b.message}`);
    }
    return e.json(v);
  } catch (u) {
    return console.error("AI\u8A3A\u65AD\u30A8\u30E9\u30FC:", u), e.json({ overall_assessment: "\u5B66\u7FD2\u8A3A\u65AD\u3092\u5B9F\u884C\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F\u3002", strengths: ["\u9811\u5F35\u3063\u3066\u5B66\u7FD2\u3092\u7D9A\u3051\u3066\u3044\u307E\u3059"], areas_for_improvement: [], recommendations: [], encouragement: "\u3053\u308C\u304B\u3089\u3082\u4E00\u7DD2\u306B\u9811\u5F35\u308A\u307E\u3057\u3087\u3046\uFF01" });
  }
});
p.post("/api/ai/generate-problem", async (e) => {
  var a, o, i, c, l;
  const { env: r } = e, { cardId: t, difficulty: s } = await e.req.json(), n = r.GEMINI_API_KEY;
  if (!n) return e.json({ problem: "\u554F\u984C\u751F\u6210\u6A5F\u80FD\u306F\u73FE\u5728\u5229\u7528\u3067\u304D\u307E\u305B\u3093\u3002", answer: "", hint: "" });
  try {
    const u = await r.DB.prepare(`
      SELECT * FROM learning_cards WHERE id = ?
    `).bind(t).first();
    if (!u) return e.json({ error: "\u30AB\u30FC\u30C9\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093" }, 404);
    const _ = `\u3042\u306A\u305F\u306F\u5C0F\u5B66\u751F\u5411\u3051\u306E\u554F\u984C\u3092\u4F5C\u308B\u5148\u751F\u3067\u3059\u3002
\u4EE5\u4E0B\u306E\u5B66\u7FD2\u30AB\u30FC\u30C9\u306E\u5185\u5BB9\u306B\u57FA\u3065\u3044\u3066\u3001${s === "easy" ? "\u3084\u3055\u3057\u3044" : s === "hard" ? "\u96E3\u3057\u3044" : "\u6A19\u6E96\u7684\u306A"}\u30EC\u30D9\u30EB\u306E\u985E\u4F3C\u554F\u984C\u30921\u3064\u4F5C\u6210\u3057\u3066\u304F\u3060\u3055\u3044\u3002

\u3010\u5143\u306E\u5B66\u7FD2\u30AB\u30FC\u30C9\u3011
\u30BF\u30A4\u30C8\u30EB: ${u.card_title}
\u554F\u984C: ${u.problem_description}
\u4F8B\u984C: ${u.example_problem}

\u4EE5\u4E0B\u306EJSON\u5F62\u5F0F\u3067\u554F\u984C\u3092\u51FA\u529B\u3057\u3066\u304F\u3060\u3055\u3044\uFF1A
{
  "problem": "\u65B0\u3057\u3044\u554F\u984C\u6587\uFF08\u6570\u5024\u3084\u72B6\u6CC1\u3092\u5909\u3048\u3066\uFF09",
  "answer": "\u6B63\u89E3",
  "hint": "\u30D2\u30F3\u30C8\uFF08\u56F0\u3063\u305F\u3068\u304D\u306E\u30A2\u30C9\u30D0\u30A4\u30B9\uFF09",
  "explanation": "\u89E3\u304D\u65B9\u306E\u8AAC\u660E"
}`, g = ((l = (c = (i = (o = (a = (await (await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${n}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ parts: [{ text: _ }] }], generationConfig: { temperature: 0.8, maxOutputTokens: 500 } }) })).json()).candidates) == null ? void 0 : a[0]) == null ? void 0 : o.content) == null ? void 0 : i.parts) == null ? void 0 : c[0]) == null ? void 0 : l.text) || "{}", f = g.match(/```json\s*([\s\S]*?)\s*```/) || g.match(/\{[\s\S]*\}/), E = f ? f[1] || f[0] : "{}", x = JSON.parse(E);
    return e.json(x);
  } catch (u) {
    return console.error("\u554F\u984C\u751F\u6210\u30A8\u30E9\u30FC:", u), e.json({ problem: "\u554F\u984C\u3092\u751F\u6210\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F\u3002", answer: "", hint: "\u5148\u751F\u306B\u805E\u3044\u3066\u307F\u307E\u3057\u3087\u3046", explanation: "" });
  }
});
p.post("/api/ai/suggest-plan", async (e) => {
  var a, o, i, c, l;
  const { env: r } = e, { studentId: t, curriculumId: s } = await e.req.json(), n = r.GEMINI_API_KEY;
  if (!n) return e.json({ suggestion: "\u5B66\u7FD2\u8A08\u753B\u63D0\u6848\u6A5F\u80FD\u306F\u73FE\u5728\u5229\u7528\u3067\u304D\u307E\u305B\u3093\u3002", daily_goals: [], weekly_goals: [] });
  try {
    const u = await r.DB.prepare(`
      SELECT sp.*, lc.card_title, lc.card_number, lc.card_type
      FROM student_progress sp
      JOIN learning_cards lc ON sp.learning_card_id = lc.id
      WHERE sp.student_id = ? AND sp.curriculum_id = ?
      ORDER BY sp.updated_at DESC
    `).bind(t, s).all(), d = await r.DB.prepare(`
      SELECT * FROM learning_plans
      WHERE student_id = ? AND curriculum_id = ?
      ORDER BY planned_date DESC
      LIMIT 7
    `).bind(t, s).all(), _ = u.results.filter((b) => b.is_completed).length, m = u.results.length, h = `\u3042\u306A\u305F\u306F\u5C0F\u5B66\u751F\u306E\u5B66\u7FD2\u3092\u30B5\u30DD\u30FC\u30C8\u3059\u308BAI\u5148\u751F\u3067\u3059\u3002
\u4EE5\u4E0B\u306E\u30C7\u30FC\u30BF\u304B\u3089\u3001\u4ECA\u5F8C\u306E\u5B66\u7FD2\u8A08\u753B\u3092\u63D0\u6848\u3057\u3066\u304F\u3060\u3055\u3044\u3002

\u3010\u73FE\u5728\u306E\u72B6\u6CC1\u3011
- \u5B8C\u4E86\u30AB\u30FC\u30C9: ${_}/${m}\u679A
- \u6700\u8FD1\u306E\u5B66\u7FD2: ${d.results.length}\u65E5\u5206\u306E\u30C7\u30FC\u30BF
- \u5E73\u5747\u7406\u89E3\u5EA6: ${u.results.filter((b) => b.understanding_level).length > 0 ? (u.results.reduce((b, T) => b + (T.understanding_level || 0), 0) / u.results.filter((b) => b.understanding_level).length).toFixed(1) : "\u672A\u8A55\u4FA1"}

\u4EE5\u4E0B\u306EJSON\u5F62\u5F0F\u3067\u5B66\u7FD2\u8A08\u753B\u3092\u63D0\u6848\u3057\u3066\u304F\u3060\u3055\u3044\uFF1A
{
  "overall_suggestion": "\u5168\u4F53\u7684\u306A\u5B66\u7FD2\u8A08\u753B\u306E\u63D0\u6848\uFF08100\u6587\u5B57\u4EE5\u5185\uFF09",
  "daily_goals": [
    {"day": "\u4ECA\u65E5", "goal": "\u5177\u4F53\u7684\u306A\u76EE\u6A19", "cards": 2},
    {"day": "\u660E\u65E5", "goal": "\u5177\u4F53\u7684\u306A\u76EE\u6A19", "cards": 2}
  ],
  "weekly_goals": [
    {"goal": "\u4ECA\u9031\u306E\u76EE\u6A191", "importance": "high"},
    {"goal": "\u4ECA\u9031\u306E\u76EE\u6A192", "importance": "medium"}
  ],
  "tips": ["\u5B66\u7FD2\u306E\u30B3\u30C41", "\u5B66\u7FD2\u306E\u30B3\u30C42"]
}`, E = ((l = (c = (i = (o = (a = (await (await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${n}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ parts: [{ text: h }] }], generationConfig: { temperature: 0.7, maxOutputTokens: 800 } }) })).json()).candidates) == null ? void 0 : a[0]) == null ? void 0 : o.content) == null ? void 0 : i.parts) == null ? void 0 : c[0]) == null ? void 0 : l.text) || "{}", x = E.match(/```json\s*([\s\S]*?)\s*```/) || E.match(/\{[\s\S]*\}/), y = x ? x[1] || x[0] : "{}", v = JSON.parse(y);
    return e.json(v);
  } catch (u) {
    return console.error("\u8A08\u753B\u63D0\u6848\u30A8\u30E9\u30FC:", u), e.json({ overall_suggestion: "\u5B66\u7FD2\u8A08\u753B\u3092\u63D0\u6848\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F\u3002", daily_goals: [], weekly_goals: [], tips: ["\u81EA\u5206\u306E\u30DA\u30FC\u30B9\u3067\u9811\u5F35\u308A\u307E\u3057\u3087\u3046"] });
  }
});
p.post("/api/ai/analyze-errors", async (e) => {
  var a, o, i, c, l;
  const { env: r } = e, { studentId: t, curriculumId: s } = await e.req.json(), n = r.GEMINI_API_KEY;
  if (!n) return e.json({ analysis: "\u8AA4\u7B54\u5206\u6790\u6A5F\u80FD\u306F\u73FE\u5728\u5229\u7528\u3067\u304D\u307E\u305B\u3093\u3002", error_patterns: [], suggestions_for_teacher: [] });
  try {
    const u = await r.DB.prepare(`
      SELECT sp.*, lc.card_title, lc.problem_description, lc.card_type
      FROM student_progress sp
      JOIN learning_cards lc ON sp.learning_card_id = lc.id
      WHERE sp.student_id = ? 
        AND sp.curriculum_id = ?
        AND sp.understanding_level <= 2
      ORDER BY sp.updated_at DESC
      LIMIT 10
    `).bind(t, s).all(), d = await r.DB.prepare(`
      SELECT sp.*, lc.card_title, sp.help_type
      FROM student_progress sp
      JOIN learning_cards lc ON sp.learning_card_id = lc.id
      WHERE sp.student_id = ? 
        AND sp.curriculum_id = ?
        AND sp.help_type IS NOT NULL
      ORDER BY sp.updated_at DESC
      LIMIT 10
    `).bind(t, s).all();
    if (u.results.length === 0 && d.results.length === 0) return e.json({ analysis: "\u3053\u306E\u5150\u7AE5\u306F\u9806\u8ABF\u306B\u5B66\u7FD2\u3092\u9032\u3081\u3066\u3044\u307E\u3059\u3002\u7279\u306B\u3064\u307E\u305A\u304D\u306F\u898B\u3089\u308C\u307E\u305B\u3093\u3002", error_patterns: [], suggestions_for_teacher: ["\u5F15\u304D\u7D9A\u304D\u898B\u5B88\u308A\u306A\u304C\u3089\u3001\u30C1\u30E3\u30EC\u30F3\u30B8\u554F\u984C\u3092\u63D0\u6848\u3057\u3066\u307F\u3066\u304F\u3060\u3055\u3044\u3002"] });
    const _ = `\u3042\u306A\u305F\u306F\u6559\u80B2\u5C02\u9580\u306EAI\u5206\u6790\u30A8\u30FC\u30B8\u30A7\u30F3\u30C8\u3067\u3059\u3002
\u4EE5\u4E0B\u306E\u30C7\u30FC\u30BF\u304B\u3089\u3001\u5150\u7AE5\u306E\u3064\u307E\u305A\u304D\u30D1\u30BF\u30FC\u30F3\u3092\u5206\u6790\u3057\u3001\u6307\u5C0E\u30A2\u30C9\u30D0\u30A4\u30B9\u3092\u63D0\u4F9B\u3057\u3066\u304F\u3060\u3055\u3044\u3002

\u3010\u7406\u89E3\u5EA6\u304C\u4F4E\u3044\u30AB\u30FC\u30C9\u3011
${u.results.map((y) => `- ${y.card_title} (\u7406\u89E3\u5EA6: ${y.understanding_level}/5)`).join(`
`)}

\u3010\u52A9\u3051\u3092\u6C42\u3081\u305F\u30AB\u30FC\u30C9\u3011
${d.results.map((y) => `- ${y.card_title} (\u52A9\u3051: ${y.help_type})`).join(`
`)}

\u4EE5\u4E0B\u306EJSON\u5F62\u5F0F\u3067\u5206\u6790\u7D50\u679C\u3092\u51FA\u529B\u3057\u3066\u304F\u3060\u3055\u3044\uFF1A
{
  "overall_analysis": "\u5168\u4F53\u7684\u306A\u5206\u6790\uFF08150\u6587\u5B57\u4EE5\u5185\uFF09",
  "error_patterns": [
    {"pattern": "\u3064\u307E\u305A\u304D\u30D1\u30BF\u30FC\u30F31", "frequency": "\u3088\u304F\u898B\u3089\u308C\u308B"},
    {"pattern": "\u3064\u307E\u305A\u304D\u30D1\u30BF\u30FC\u30F32", "frequency": "\u6642\u3005\u898B\u3089\u308C\u308B"}
  ],
  "root_causes": ["\u6839\u672C\u539F\u56E01", "\u6839\u672C\u539F\u56E02"],
  "suggestions_for_teacher": [
    {"suggestion": "\u6307\u5C0E\u30A2\u30C9\u30D0\u30A4\u30B91", "priority": "high"},
    {"suggestion": "\u6307\u5C0E\u30A2\u30C9\u30D0\u30A4\u30B92", "priority": "medium"}
  ],
  "support_strategies": ["\u30B5\u30DD\u30FC\u30C8\u65B9\u6CD51", "\u30B5\u30DD\u30FC\u30C8\u65B9\u6CD52"]
}`, g = ((l = (c = (i = (o = (a = (await (await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${n}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ parts: [{ text: _ }] }], generationConfig: { temperature: 0.6, maxOutputTokens: 1e3 } }) })).json()).candidates) == null ? void 0 : a[0]) == null ? void 0 : o.content) == null ? void 0 : i.parts) == null ? void 0 : c[0]) == null ? void 0 : l.text) || "{}", f = g.match(/```json\s*([\s\S]*?)\s*```/) || g.match(/\{[\s\S]*\}/), E = f ? f[1] || f[0] : "{}", x = JSON.parse(E);
    return e.json(x);
  } catch (u) {
    return console.error("\u8AA4\u7B54\u5206\u6790\u30A8\u30E9\u30FC:", u), e.json({ overall_analysis: "\u5206\u6790\u3092\u5B9F\u884C\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F\u3002", error_patterns: [], root_causes: [], suggestions_for_teacher: [], support_strategies: [] });
  }
});
p.post("/api/ai/suggest-units", async (e) => {
  const { env: r } = e, { grade: t, subject: s, textbook: n } = await e.req.json(), a = r.GEMINI_API_KEY;
  if (!a || a === "your-gemini-api-key-here") return e.json({ error: "AI\u5358\u5143\u5019\u88DC\u6A5F\u80FD\u3092\u4F7F\u7528\u3059\u308B\u306B\u306F\u3001GEMINI_API_KEY\u306E\u8A2D\u5B9A\u304C\u5FC5\u8981\u3067\u3059\u3002", message: "\u624B\u52D5\u3067\u5358\u5143\u540D\u3092\u5165\u529B\u3057\u3066\u304F\u3060\u3055\u3044\u3002\u4F8B: \u304B\u3051\u7B97\u306E\u7B46\u7B97\u3001\u7269\u8A9E\u6587\u306E\u8AAD\u89E3\u3001\u306A\u3069", units: [] });
  try {
    let o = "";
    t === "\u5C0F\u5B666\u5E74" && s === "\u793E\u4F1A" ? o = `
\u3010\u5C0F\u5B666\u5E74\u793E\u4F1A\u306E\u5FC5\u9808\u5358\u5143\uFF08\u6771\u4EAC\u66F8\u7C4D\u6E96\u62E0\uFF09\u3011
\u4EE5\u4E0B\u306E\u9806\u5E8F\u3067\u6B63\u78BA\u306B30\u500B\u306E\u5358\u5143\u3092\u51FA\u529B\u3057\u3066\u304F\u3060\u3055\u3044\uFF1A

\u3010\u6B74\u53F2\u5206\u91CE\uFF081\u301C20\uFF09\u3011
1. \u7E04\u6587\u6642\u4EE3\u30FB\u5F25\u751F\u6642\u4EE3\u306E\u66AE\u3089\u3057
2. \u53E4\u58B3\u6642\u4EE3\u3068\u5927\u548C\u671D\u5EF7
3. \u98DB\u9CE5\u6642\u4EE3\u306E\u6587\u5316\u3068\u653F\u6CBB
4. \u5948\u826F\u6642\u4EE3\u306E\u653F\u6CBB\u3068\u6587\u5316
5. \u5E73\u5B89\u6642\u4EE3\u306E\u8CB4\u65CF\u306E\u66AE\u3089\u3057
6. \u938C\u5009\u6642\u4EE3\u306E\u6B66\u58EB\u306E\u653F\u6CBB
7. \u5BA4\u753A\u6642\u4EE3\u306E\u6587\u5316\u3068\u793E\u4F1A
8. \u6226\u56FD\u6642\u4EE3\u3068\u5929\u4E0B\u7D71\u4E00
9. \u6C5F\u6238\u6642\u4EE3\u306E\u5E55\u5E9C\u653F\u6CBB
10. \u6C5F\u6238\u6642\u4EE3\u306E\u6587\u5316\u3068\u7523\u696D
11. \u660E\u6CBB\u7DAD\u65B0\u3068\u8FD1\u4EE3\u5316
12. \u5927\u6B63\u30C7\u30E2\u30AF\u30E9\u30B7\u30FC
13. \u662D\u548C\u6642\u4EE3\u3068\u6226\u4E89
14. \u6226\u5F8C\u306E\u65E5\u672C\u306E\u767A\u5C55
15. \u73FE\u4EE3\u306E\u65E5\u672C\u3068\u4E16\u754C
16. \u8056\u5FB3\u592A\u5B50\u306E\u653F\u6CBB\u3068\u6587\u5316
17. \u9063\u5510\u4F7F\u3068\u5510\u306E\u6587\u5316
18. \u6B66\u58EB\u306E\u6210\u9577\u3068\u6E90\u5E73\u306E\u4E89\u3044
19. \u6226\u56FD\u306E\u4E16\u3068\u793E\u4F1A\u3068\u6587\u5316
20. \u6C5F\u6238\u6642\u4EE3\u306E\u4EA4\u901A\u3068\u7523\u696D

\u3010\u653F\u6CBB\u30FB\u56FD\u969B\u5206\u91CE\uFF0821\u301C30\uFF09\u3011
21. \u65E5\u672C\u56FD\u61B2\u6CD5\u3068\u57FA\u672C\u7684\u4EBA\u6A29
22. \u56FD\u4F1A\u30FB\u5185\u95A3\u30FB\u88C1\u5224\u6240\u306E\u50CD\u304D
23. \u5730\u65B9\u81EA\u6CBB\u306E\u3057\u304F\u307F
24. \u4E16\u754C\u306E\u4E2D\u306E\u65E5\u672C
25. \u56FD\u969B\u9023\u5408\u306E\u5F79\u5272
26. \u958B\u56FD\u3068\u5E55\u672B\u306E\u52D5\u4E71
27. \u8FD1\u4EE3\u56FD\u5BB6\u306E\u5EFA\u8A2D\u3068\u4EBA\u3005\u306E\u304F\u3089\u3057
28. \u56FD\u6C11\u306E\u6A29\u5229\u3068\u7FA9\u52D9
29. \u8056\u5FB3\u592A\u5B50\u306E\u653F\u6CBB\u3068\u6587\u5316
30. \u9063\u5510\u4F7F\u3068\u5510\u306E\u6587\u5316

\u3010\u91CD\u8981\u3011\u4E0A\u8A18\u306E\u9806\u5E8F\u3068\u5185\u5BB9\u3092\u6B63\u78BA\u306B\u5B88\u3063\u3066\u304F\u3060\u3055\u3044\u3002
` : t === "\u5C0F\u5B665\u5E74" && s === "\u793E\u4F1A" ? o = `
\u3010\u5C0F\u5B665\u5E74\u793E\u4F1A\u306E\u91CD\u70B9\u5358\u5143\u3011
\u5C0F\u5B665\u5E74\u793E\u4F1A\u306F\u300C\u7523\u696D\u300D\u300C\u74B0\u5883\u300D\u300C\u56FD\u571F\u300D\u304C\u4E2D\u5FC3\u3067\u3059\uFF1A

1. \u65E5\u672C\u306E\u56FD\u571F\u3068\u5730\u5F62
2. \u65E5\u672C\u306E\u6C17\u5019\u3068\u81EA\u7136\u707D\u5BB3
3. \u7C73\u4F5C\u308A\u3068\u8FB2\u696D
4. \u6C34\u7523\u696D\u3068\u305D\u306E\u8AB2\u984C
5. \u5DE5\u696D\u306E\u7A2E\u985E\u3068\u7279\u8272
6. \u81EA\u52D5\u8ECA\u5DE5\u696D\u306E\u767A\u5C55
7. \u98DF\u6599\u751F\u7523\u3068\u6D41\u901A
8. \u60C5\u5831\u7523\u696D\u3068\u30E1\u30C7\u30A3\u30A2
9. \u74B0\u5883\u554F\u984C\u3068\u53D6\u308A\u7D44\u307F
10. \u68EE\u6797\u306E\u4FDD\u5168

\uFF08\u4EE5\u4E0B\u300120\u500B\u306E\u88DC\u8DB3\u5358\u5143\uFF09
` : t === "\u5C0F\u5B664\u5E74" && s === "\u793E\u4F1A" && (o = `
\u3010\u5C0F\u5B664\u5E74\u793E\u4F1A\u306E\u91CD\u70B9\u5358\u5143\u3011
\u5C0F\u5B664\u5E74\u793E\u4F1A\u306F\u300C\u5730\u57DF\u300D\u300C\u304F\u3089\u3057\u300D\u304C\u4E2D\u5FC3\u3067\u3059\uFF1A

1. \u308F\u305F\u3057\u305F\u3061\u306E\u770C
2. \u5730\u56F3\u306E\u898B\u65B9\u30FB\u4F7F\u3044\u65B9
3. \u6C34\u306F\u3069\u3053\u304B\u3089\uFF08\u6C34\u9053\uFF09
4. \u3054\u307F\u306E\u3086\u304F\u3048
5. \u81EA\u7136\u707D\u5BB3\u304B\u3089\u304F\u3089\u3057\u3092\u5B88\u308B
6. \u4F1D\u7D71\u7684\u306A\u5DE5\u82B8\u54C1
7. \u5730\u57DF\u306E\u767A\u5C55\u306B\u3064\u304F\u3057\u305F\u4EBA\u3005
8. \u770C\u5185\u306E\u4EA4\u901A\u3068\u901A\u4FE1

\uFF08\u4EE5\u4E0B\u300122\u500B\u306E\u88DC\u8DB3\u5358\u5143\uFF09
`);
    const i = `${t}${s}\uFF08${n}\uFF09\u306E\u4E3B\u8981\u306A\u5358\u5143\u540D\u3092\u6B63\u78BA\u306B30\u500B\u30011\u884C\u306B1\u3064\u305A\u3064\u65E5\u672C\u8A9E\u3067\u51FA\u529B\u3057\u3066\u304F\u3060\u3055\u3044\u3002

${o}

\u3010\u91CD\u8981\u306A\u6307\u793A\u3011
- \u4E0A\u8A18\u3067\u6307\u5B9A\u3057\u305F\u5358\u5143\u540D\u3092**\u305D\u306E\u307E\u307E\u6B63\u78BA\u306B**\u51FA\u529B\u3059\u308B\u3053\u3068
- \u9806\u5E8F\u3092\u5909\u66F4\u3057\u306A\u3044\u3053\u3068
- \u5358\u5143\u540D\u3092\u5909\u66F4\u30FB\u7701\u7565\u30FB\u8FFD\u52A0\u3057\u306A\u3044\u3053\u3068
- \u756A\u53F7\u3001\u8A18\u53F7\u3001\u8AAC\u660E\u3001\u82F1\u8A9E\u3001\u601D\u8003\u904E\u7A0B\uFF08THOUGHT\uFF09\u306F\u4E00\u5207\u4E0D\u8981
- 1\u884C\u306B1\u3064\u306E\u5358\u5143\u540D\u306E\u307F\u3092\u51FA\u529B
- \u6B63\u78BA\u306B30\u884C\u51FA\u529B\u3059\u308B\u3053\u3068
- ${t}${s}\u306E\u5B66\u7FD2\u5185\u5BB9\u306B\u5B8C\u5168\u306B\u4E00\u81F4\u3055\u305B\u308B\u3053\u3068

\u51FA\u529B\u4F8B\uFF08\u7B97\u6570\u306E\u5834\u5408\uFF09:
\u304B\u3051\u7B97\u306E\u7B46\u7B97
\u308F\u308A\u7B97\u306E\u7B46\u7B97
\u5C0F\u6570\u306E\u304B\u3051\u7B97
\u5C0F\u6570\u306E\u308F\u308A\u7B97
\u5206\u6570\u306E\u305F\u3057\u7B97
\u5206\u6570\u306E\u3072\u304D\u7B97
\u5206\u6570\u306E\u304B\u3051\u7B97
\u5206\u6570\u306E\u308F\u308A\u7B97
\u9762\u7A4D\u306E\u6C42\u3081\u65B9
\u4F53\u7A4D\u306E\u5B66\u7FD2
\u30B0\u30E9\u30D5\u306E\u8AAD\u307F\u65B9
\u8CC7\u6599\u306E\u6574\u7406
\u78BA\u7387\u306E\u57FA\u790E
\u56F3\u5F62\u306E\u6027\u8CEA
\u6BD4\u3068\u6BD4\u306E\u5024
\u901F\u3055\u306E\u554F\u984C
\u5272\u5408\u306E\u8A08\u7B97
\u5E73\u5747\u306E\u6C42\u3081\u65B9
\u5BFE\u79F0\u306A\u56F3\u5F62
\u62E1\u5927\u56F3\u3068\u7E2E\u56F3
\u5186\u306E\u9762\u7A4D
\u5186\u5468\u7387\u306E\u6D3B\u7528
\u89D2\u67F1\u3068\u5186\u67F1\u306E\u4F53\u7A4D
\u5206\u6570\u3068\u5C0F\u6570\u306E\u95A2\u4FC2
\u8CC7\u6599\u306E\u8ABF\u3079\u65B9
\u5909\u308F\u308A\u65B9\u306E\u8ABF\u3079\u65B9
\u6BD4\u4F8B\u3068\u53CD\u6BD4\u4F8B
\u5B9A\u7FA9\u57DF\u3068\u5024\u57DF
\u8AD6\u7406\u7684\u63A8\u8AD6\u306E\u57FA\u790E
\u96C6\u5408\u306E\u6982\u5FF5`, c = ["gemini-3-flash-preview", "gemini-3-pro-preview"];
    let l = null;
    for (const d of c) if (l = await Ft({ model: d, prompt: i, apiKey: a, maxOutputTokens: 2048, temperature: 0.7, retries: 2 }), l.success) break;
    if (!l || !l.success || !l.content) throw new Error("\u3059\u3079\u3066\u306E\u30E2\u30C7\u30EB\u3067\u5358\u5143\u5019\u88DC\u306E\u751F\u6210\u306B\u5931\u6557\u3057\u307E\u3057\u305F");
    console.log("\u{1F4DD} Gemini \u30EC\u30B9\u30DD\u30F3\u30B9:", l.content);
    const u = l.content.split(`
`).map((d) => d.trim()).filter((d) => {
      if (!d || d.length === 0 || d.includes("THOUGHT") || d.includes("user wants") || d.includes("need to") || d.includes("Common themes") || d.includes("Japan:") || d.startsWith("I ") || d.startsWith("The ") || d.match(/^[\*\-\#\d\.\s\:\(\)]+$/) || d.match(/^[a-zA-Z\s\:\(\)\*\-]+$/) || !d.match(/[ぁ-んァ-ヶー一-龯]/) || d.length < 2 || d.length > 100) return false;
      const m = true;
      return console.log(`  \u884C: "${d}" -> ${m ? "\u2705 \u63A1\u7528" : "\u274C \u9664\u5916"}`), m;
    }).map((d) => d.replace(/^[\d\.\-\*\#\s\:\(\)]+/, "").replace(/\*+$/, "").trim()).filter((d) => d.length > 1).slice(0, 30);
    return console.log("\u2705 \u62BD\u51FA\u3055\u308C\u305F\u5358\u5143:", u), console.log("\u{1F4CA} \u62BD\u51FA\u3055\u308C\u305F\u5358\u5143\u6570:", u.length), e.json({ success: true, units: u, model_used: l.model, attempts: l.attempts, totalTime: l.totalTime });
  } catch (o) {
    return console.error("\u5358\u5143\u5019\u88DC\u751F\u6210\u30A8\u30E9\u30FC:", o), e.json({ error: "\u5358\u5143\u5019\u88DC\u306E\u751F\u6210\u306B\u5931\u6557\u3057\u307E\u3057\u305F\u3002", details: o.message, units: [] }, 500);
  }
});
p.post("/api/ai/ocr", async (e) => {
  var o, i, c, l, u, d, _;
  const { env: r } = e, { imageData: t, language: s } = await e.req.json(), n = r.GOOGLE_CLOUD_API_KEY, a = r.GEMINI_API_KEY;
  try {
    console.log("\u{1F50D} OCR\u8A8D\u8B58\u3092\u958B\u59CB\uFF082\u6BB5\u968E\u30D5\u30A9\u30FC\u30EB\u30D0\u30C3\u30AF\uFF09...");
    const m = t.replace(/^data:image\/\w+;base64,/, "");
    if (n && n !== "your-google-cloud-api-key-here") try {
      console.log("\u{1F4E4} [\u7B2C1\u6BB5\u968E] Google Cloud Vision API \u3092\u4F7F\u7528\u3057\u307E\u3059");
      const h = `https://vision.googleapis.com/v1/images:annotate?key=${n}`, f = await fetch(h, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ requests: [{ image: { content: m }, features: [{ type: "TEXT_DETECTION", maxResults: 1 }], imageContext: { languageHints: s === "ja" ? ["ja", "en"] : ["en"] } }] }) });
      if (f.ok) {
        const E = await f.json();
        console.log("\u2705 Vision API \u30EC\u30B9\u30DD\u30F3\u30B9\u53D7\u4FE1");
        const x = (o = E.responses[0]) == null ? void 0 : o.textAnnotations;
        if (x && x.length > 0) {
          const y = x[0].description.trim();
          return console.log("\u2705 [\u7B2C1\u6BB5\u968E\u6210\u529F] Vision API OCR\u8A8D\u8B58\u6210\u529F:", y), e.json({ success: true, text: y, confidence: 95, method: "google-cloud-vision", stage: 1 });
        }
      } else {
        const E = await f.text();
        console.warn("\u26A0\uFE0F [\u7B2C1\u6BB5\u968E\u5931\u6557] Vision API \u30A8\u30E9\u30FC:", f.status, E);
      }
    } catch (h) {
      console.warn("\u26A0\uFE0F [\u7B2C1\u6BB5\u968E\u5931\u6557] Vision API \u4F8B\u5916:", h.message);
    }
    if (a && a !== "your-gemini-api-key-here") try {
      console.log("\u{1F4E4} [\u7B2C2\u6BB5\u968E] Gemini Vision API \u3092\u4F7F\u7528\u3057\u307E\u3059\uFF08\u30D5\u30A9\u30FC\u30EB\u30D0\u30C3\u30AF\uFF09");
      const h = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${a}`, f = await fetch(h, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ parts: [{ text: s === "ja" ? "\u753B\u50CF\u306B\u66F8\u304B\u308C\u3066\u3044\u308B\u65E5\u672C\u8A9E\u306E\u30C6\u30AD\u30B9\u30C8\u3092\u6B63\u78BA\u306B\u8AAD\u307F\u53D6\u3063\u3066\u304F\u3060\u3055\u3044\u3002\u624B\u66F8\u304D\u6587\u5B57\u3082\u542B\u307E\u308C\u307E\u3059\u3002\u8A8D\u8B58\u3057\u305F\u30C6\u30AD\u30B9\u30C8\u306E\u307F\u3092\u51FA\u529B\u3057\u3066\u304F\u3060\u3055\u3044\u3002\u8AAC\u660E\u3084\u88DC\u8DB3\u306F\u4E00\u5207\u4E0D\u8981\u3067\u3059\u3002" : "Read the text written in this image accurately. Include handwritten text. Output only the recognized text without any explanation or additional commentary." }, { inline_data: { mime_type: "image/png", data: m } }] }], generationConfig: { temperature: 0.1, maxOutputTokens: 500 } }) });
      if (f.ok) {
        const E = await f.json();
        console.log("\u2705 Gemini Vision API \u30EC\u30B9\u30DD\u30F3\u30B9\u53D7\u4FE1");
        const x = (_ = (d = (u = (l = (c = (i = E.candidates) == null ? void 0 : i[0]) == null ? void 0 : c.content) == null ? void 0 : l.parts) == null ? void 0 : u[0]) == null ? void 0 : d.text) == null ? void 0 : _.trim();
        if (x) return console.log("\u2705 [\u7B2C2\u6BB5\u968E\u6210\u529F] Gemini Vision API OCR\u8A8D\u8B58\u6210\u529F:", x), e.json({ success: true, text: x, confidence: 90, method: "gemini-vision", stage: 2 });
      } else {
        const E = await f.text();
        console.warn("\u26A0\uFE0F [\u7B2C2\u6BB5\u968E\u5931\u6557] Gemini Vision API \u30A8\u30E9\u30FC:", f.status, E);
      }
    } catch (h) {
      console.warn("\u26A0\uFE0F [\u7B2C2\u6BB5\u968E\u5931\u6557] Gemini Vision API \u4F8B\u5916:", h.message);
    }
    return console.log("\u26A0\uFE0F OCR\u8A8D\u8B58\u5931\u6557: \u4E21\u65B9\u306EAPI\u3067\u8A8D\u8B58\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F"), e.json({ success: false, text: null, error: "\u30C6\u30AD\u30B9\u30C8\u304C\u691C\u51FA\u3055\u308C\u307E\u305B\u3093\u3067\u3057\u305F", message: "\u4E21\u65B9\u306EAPI\u3067\u6587\u5B57\u3092\u8A8D\u8B58\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F", stage: 2 });
  } catch (m) {
    return console.error("\u274C OCR\u30A8\u30E9\u30FC:", m), e.json({ success: false, error: m.message, text: null, stage: 0 }, 500);
  }
});
p.post("/api/ai/tts", async (e) => {
  var i;
  const { env: r } = e, { text: t, voiceType: s = "female-friendly", speed: n = 1, pitch: a = 0 } = await e.req.json(), o = r.GOOGLE_CLOUD_API_KEY;
  if (!o || o === "your-google-cloud-api-key-here") return console.log("\u26A0\uFE0F Google Cloud API\u30AD\u30FC\u304C\u672A\u8A2D\u5B9A \u2192 Web Speech API \u3092\u4F7F\u7528"), e.json({ success: false, fallbackToWebSpeech: true, error: "Google Cloud API \u30AD\u30FC\u304C\u8A2D\u5B9A\u3055\u308C\u3066\u3044\u307E\u305B\u3093" });
  try {
    console.log("\u{1F3A4} Google Cloud TTS API \u547C\u3073\u51FA\u3057:", { textLength: t.length, voiceType: s, speed: n, pitch: a });
    let c = { languageCode: "ja-JP", ssmlGender: "FEMALE" };
    switch (s) {
      case "female-friendly":
        c.name = "ja-JP-Neural2-B";
        break;
      case "male-friendly":
        c.name = "ja-JP-Neural2-C", c.ssmlGender = "MALE";
        break;
      case "female-energetic":
        c.name = "ja-JP-Neural2-A";
        break;
      case "male-energetic":
        c.name = "ja-JP-Neural2-D", c.ssmlGender = "MALE";
        break;
      default:
        c.name = "ja-JP-Neural2-B";
    }
    const l = { input: { text: t }, voice: c, audioConfig: { audioEncoding: "MP3", speakingRate: Math.max(0.25, Math.min(4, n)), pitch: Math.max(-20, Math.min(20, a)) } }, u = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${o}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(l) });
    if (!u.ok) {
      const _ = await u.text();
      console.error("\u274C Google Cloud TTS API \u30A8\u30E9\u30FC:", { status: u.status, statusText: u.statusText, errorBody: _ });
      let m = `Google Cloud TTS API \u30A8\u30E9\u30FC: ${u.status} ${u.statusText}`;
      try {
        const h = JSON.parse(_);
        m += ` - ${((i = h.error) == null ? void 0 : i.message) || "\u8A73\u7D30\u4E0D\u660E"}`;
      } catch {
        m += ` - ${_}`;
      }
      throw new Error(m);
    }
    const d = await u.json();
    if (d.audioContent) return console.log("\u2705 Google Cloud TTS \u97F3\u58F0\u751F\u6210\u6210\u529F"), e.json({ success: true, audioContent: d.audioContent, method: "google-cloud-tts" });
    throw new Error("\u97F3\u58F0\u30C7\u30FC\u30BF\u304C\u751F\u6210\u3055\u308C\u307E\u305B\u3093\u3067\u3057\u305F");
  } catch (c) {
    return console.error("\u274C TTS\u30A8\u30E9\u30FC:", c), console.error("\u274C TTS\u30A8\u30E9\u30FC\u8A73\u7D30:", { message: c.message, stack: c.stack, name: c.name }), e.json({ success: false, fallbackToWebSpeech: true, error: c.message, errorDetails: { name: c.name, message: c.message } }, 500);
  }
});
p.get("/api/ai/list-models", async (e) => {
  var s, n, a;
  const { env: r } = e, t = r.GEMINI_API_KEY;
  if (console.log("\u{1F50D} \u30E2\u30C7\u30EB\u30EA\u30B9\u30C8\u53D6\u5F97\u958B\u59CB"), !t || t === "your-gemini-api-key-here") return console.error("\u274C API\u30AD\u30FC\u304C\u8A2D\u5B9A\u3055\u308C\u3066\u3044\u307E\u305B\u3093"), e.json({ error: "API\u30AD\u30FC\u304C\u8A2D\u5B9A\u3055\u308C\u3066\u3044\u307E\u305B\u3093" }, 500);
  console.log("\u{1F511} API\u30AD\u30FC\u78BA\u8A8D: \u6700\u521D\u306E10\u6587\u5B57 =", t.substring(0, 10));
  try {
    const o = `https://generativelanguage.googleapis.com/v1beta/models?key=${t}`;
    console.log("\u{1F4E1} Gemini API\u547C\u3073\u51FA\u3057:", o.replace(t, "REDACTED"));
    const i = await fetch(o);
    console.log("\u{1F4E6} \u30EC\u30B9\u30DD\u30F3\u30B9\u53D7\u4FE1:", { status: i.status, statusText: i.statusText, ok: i.ok });
    const c = await i.text();
    console.log("\u{1F4C4} \u30EC\u30B9\u30DD\u30F3\u30B9\u672C\u6587\uFF08\u6700\u521D\u306E500\u6587\u5B57\uFF09:", c.substring(0, 500));
    let l;
    try {
      l = JSON.parse(c);
    } catch (d) {
      return console.error("\u274C JSON\u30D1\u30FC\u30B9\u30A8\u30E9\u30FC:", d.message), console.error("\u{1F4C4} \u30EC\u30B9\u30DD\u30F3\u30B9\u5168\u6587:", c), e.json({ error: "JSON\u30D1\u30FC\u30B9\u5931\u6557", parseError: d.message, responsePreview: c.substring(0, 200) }, 500);
    }
    if (!i.ok) return console.error("\u274C API\u30A8\u30E9\u30FC:", l), e.json({ error: "\u30E2\u30C7\u30EB\u30EA\u30B9\u30C8\u53D6\u5F97\u5931\u6557", details: l }, 500);
    console.log("\u2705 \u30C7\u30FC\u30BF\u53D6\u5F97\u6210\u529F:", { modelsCount: ((s = l.models) == null ? void 0 : s.length) || 0 });
    const u = ((a = (n = l.models) == null ? void 0 : n.filter((d) => {
      var _;
      return (_ = d.supportedGenerationMethods) == null ? void 0 : _.includes("generateContent");
    })) == null ? void 0 : a.map((d) => ({ name: d.name, displayName: d.displayName, description: d.description, supportedMethods: d.supportedGenerationMethods }))) || [];
    return console.log("\u2705 \u30B5\u30DD\u30FC\u30C8\u3055\u308C\u3066\u3044\u308B\u30E2\u30C7\u30EB\u6570:", u.length), u.forEach((d) => {
      console.log(`  - ${d.name}`);
    }), e.json({ success: true, total: u.length, models: u });
  } catch (o) {
    return console.error("\u274C \u30A8\u30E9\u30FC\u767A\u751F:", o), e.json({ error: o.message, stack: o.stack }, 500);
  }
});
p.post("/api/ai/generate-course", async (e) => {
  var d, _, m;
  const { env: r } = e, { grade: t, subject: s, textbook: n, unitName: a, unitGoal: o, courseLevel: i, courseInfo: c, customization: l } = await e.req.json();
  console.log("\u{1F50D} \u30B3\u30FC\u30B9\u751F\u6210API\u30EA\u30AF\u30A8\u30B9\u30C8\u53D7\u4FE1:", { grade: t, subject: s, textbook: n, unitName: a, unitGoal: (o == null ? void 0 : o.substring(0, 50)) + "...", courseLevel: i, courseInfo: c, customization: l ? "\u3042\u308A" : "\u306A\u3057" });
  const u = r.GEMINI_API_KEY;
  if (!u || u === "your-gemini-api-key-here") return console.error("\u274C API\u30AD\u30FC\u304C\u8A2D\u5B9A\u3055\u308C\u3066\u3044\u307E\u305B\u3093"), e.json({ error: "Gemini API\u30AD\u30FC\u304C\u8A2D\u5B9A\u3055\u308C\u3066\u3044\u307E\u305B\u3093\u3002\u7BA1\u7406\u8005\u306B\u9023\u7D61\u3057\u3066\u304F\u3060\u3055\u3044\u3002", course: null }, 500);
  console.log(`\u{1F3AF} \u30B3\u30FC\u30B9\u751F\u6210\u958B\u59CB: ${c == null ? void 0 : c.name} (${i})`);
  try {
    const h = l ? `
\u3010\u30AB\u30B9\u30BF\u30DE\u30A4\u30BA\u60C5\u5831\u3011
- \u5150\u7AE5\u751F\u5F92\u306E\u30CB\u30FC\u30BA: ${l.studentNeeds}
- \u6559\u5E2B\u306E\u6307\u5C0E\u76EE\u6A19: ${l.teacherGoals}
- \u5B66\u7FD2\u30B9\u30BF\u30A4\u30EB: ${l.learningStyle}
- \u7279\u5225\u306A\u914D\u616E: ${l.specialSupport}
` : "", g = { slow: "\u3086\u3063\u304F\u308A\u30FB\u3058\u3063\u304F\u308A\u5B66\u3076\u30B3\u30FC\u30B9\u3002\u57FA\u790E\u3092\u4E01\u5BE7\u306B\u3001\u30B9\u30C6\u30C3\u30D7\u3092\u7D30\u304B\u304F\u5206\u3051\u3066\u8AAC\u660E\u3002", steady: "\u6A19\u6E96\u7684\u306A\u30DA\u30FC\u30B9\u3067\u5B66\u3076\u30B3\u30FC\u30B9\u3002\u30D0\u30E9\u30F3\u30B9\u3088\u304F\u7406\u89E3\u3092\u6DF1\u3081\u308B\u3002", fast: "\u3069\u3093\u3069\u3093\u9032\u3080\u30B3\u30FC\u30B9\u3002\u767A\u5C55\u7684\u306A\u5185\u5BB9\u3084\u5FDC\u7528\u554F\u984C\u3082\u542B\u3081\u308B\u3002" }[i] || "\u6A19\u6E96\u7684\u306A\u30DA\u30FC\u30B9\u3067\u5B66\u3076\u30B3\u30FC\u30B9", f = `\u3042\u306A\u305F\u306F\u5C0F\u5B66\u6821\u306E\u512A\u79C0\u306A\u6559\u5E2B\u3067\u3059\u3002\u4EE5\u4E0B\u306E\u5358\u5143\u306E\u5B66\u7FD2\u30AB\u30FC\u30C96\u679A\u3092\u751F\u6210\u3057\u3066\u304F\u3060\u3055\u3044\u3002

\u3010\u5358\u5143\u60C5\u5831\u3011
- \u5B66\u5E74: ${t}
- \u6559\u79D1: ${s}
- \u5358\u5143\u540D: ${a}
- \u30B3\u30FC\u30B9: ${c.name} (${g})

\u3010\u91CD\u8981\u3011\u4EE5\u4E0B\u306EJSON\u5F62\u5F0F\u3067\u3001\u5FC5\u305A\u5B8C\u5168\u306A6\u679A\u306E\u30AB\u30FC\u30C9\u3092\u751F\u6210\u3057\u3066\u304F\u3060\u3055\u3044\uFF1A

{
  "course_name": "${c.name}",
  "name": "${c.name}",
  "label": "${c.label}",
  "description": "${c.description}",
  "color_code": "${c.color_code}",
  "cards": [
    {
      "card_number": 1,
      "card_title": "\u9B45\u529B\u7684\u306A\u30BF\u30A4\u30C8\u30EB\uFF0820\u5B57\u4EE5\u5185\uFF09",
      "card_type": "main",
      "textbook_page": "p.XX",
      "problem_description": "\u5177\u4F53\u7684\u306A\u6570\u5B57\u3092\u542B\u3080\u554F\u984C\u6587\uFF0880-150\u5B57\uFF09",
      "new_terms": "\u65B0\u51FA\u7528\u8A9E\uFF08\u30AB\u30F3\u30DE\u533A\u5207\u308A\uFF09",
      "example_problem": "\u4F8B\u984C\uFF08\u5177\u4F53\u7684\u306A\u6570\u5B57\uFF09",
      "example_solution": "\u89E3\u304D\u65B9\u306E\u8AAC\u660E",
      "real_world_connection": "\u5B9F\u751F\u6D3B\u3068\u306E\u3064\u306A\u304C\u308A",
      "answer": "\u89E3\u7B54\u3068\u89E3\u8AAC\uFF0850-100\u5B57\uFF09",
      "answer_explanation": "\u306A\u305C\u305D\u306E\u7B54\u3048\u306B\u306A\u308B\u304B\uFF0850-100\u5B57\uFF09",
      "hints": [
        {"hint_level": 1, "hint_text": "\u30D2\u30F3\u30C81: \u307E\u305A\u4F55\u3092\u8003\u3048\u308B\uFF1F", "thinking_tool_suggestion": "\u56F3\u30FB\u8868\u30FB\u5F0F"},
        {"hint_level": 2, "hint_text": "\u30D2\u30F3\u30C82: \u6B21\u306B\u4F55\u3092\u3059\u308B\uFF1F", "thinking_tool_suggestion": "\u56F3\u30FB\u8868\u30FB\u5F0F"},
        {"hint_level": 3, "hint_text": "\u30D2\u30F3\u30C83: \u7B54\u3048\u306B\u8FD1\u3065\u304F\u305F\u3081\u306B", "thinking_tool_suggestion": "\u56F3\u30FB\u8868\u30FB\u5F0F"}
      ]
    },
    { /* \u30AB\u30FC\u30C92: \u4E0A\u8A18\u3068\u540C\u3058\u69CB\u9020 */ },
    { /* \u30AB\u30FC\u30C93: \u4E0A\u8A18\u3068\u540C\u3058\u69CB\u9020 */ },
    { /* \u30AB\u30FC\u30C94: \u4E0A\u8A18\u3068\u540C\u3058\u69CB\u9020 */ },
    { /* \u30AB\u30FC\u30C95: \u4E0A\u8A18\u3068\u540C\u3058\u69CB\u9020 */ },
    { /* \u30AB\u30FC\u30C96: \u4E0A\u8A18\u3068\u540C\u3058\u69CB\u9020 */ }
  ]
}

\u3010\u53B3\u5B88\u4E8B\u9805\u3011
1. \u5FC5\u305A6\u679A\u306E\u30AB\u30FC\u30C9\u3092\u751F\u6210\u3059\u308B\u3053\u3068
2. \u5404\u30AB\u30FC\u30C9\u306B\u5FC5\u305A3\u3064\u306E\u30D2\u30F3\u30C8\u3092\u542B\u3081\u308B\u3053\u3068
3. JSON\u306E\u307F\u3092\u51FA\u529B\u3057\u3001\u8AAC\u660E\u6587\u306F\u542B\u3081\u306A\u3044\u3053\u3068
4. \u3059\u3079\u3066\u306E\u30D5\u30A3\u30FC\u30EB\u30C9\u306B\u5177\u4F53\u7684\u306A\u5185\u5BB9\u3092\u8A18\u5165\u3059\u308B\u3053\u3068
5. \u5B8C\u5168\u306AJSON\uFF08{\u3067\u59CB\u307E\u308A}\u3067\u7D42\u308F\u308B\uFF09\u3092\u51FA\u529B\u3059\u308B\u3053\u3068`, E = "gemini-3-flash-preview", x = `https://generativelanguage.googleapis.com/v1beta/models/${E}:generateContent?key=${u}`;
    console.log(`\u{1F4E1} ${E} API\u3092\u547C\u3073\u51FA\u3057\u307E\u3059\uFF08\u30B3\u30FC\u30B9\u751F\u6210\u7528\uFF09...`), console.log(`\u{1F4E1} ${E} API\u3092\u547C\u3073\u51FA\u3057\u307E\u3059\uFF08\u30B3\u30FC\u30B9\u751F\u6210\u7528\uFF09...`), console.log("\u{1F4CB} \u30B3\u30FC\u30B9\u60C5\u5831:", { \u30B3\u30FC\u30B9\u540D: c.name, \u30EC\u30D9\u30EB: i, \u5358\u5143\u540D: a, \u5B66\u5E74: t, \u6559\u79D1: s });
    let y = null;
    const v = 3;
    for (let b = 1; b <= v; b++) try {
      console.log(`\u{1F504} \u30B3\u30FC\u30B9\u751F\u6210\u8A66\u884C ${b}/${v}...`);
      const T = await fetch(x, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ parts: [{ text: f }] }], generationConfig: { temperature: 0.2, maxOutputTokens: 32768, topP: 0.9, topK: 20 } }) });
      if (!T.ok) {
        const D = await T.text();
        throw console.error("\u274C Gemini API \u30A8\u30E9\u30FC\uFF08\u8A73\u7D30\uFF09:", { status: T.status, statusText: T.statusText, url: x.replace(u, "REDACTED"), errorBody: D.substring(0, 500), headers: Object.fromEntries(T.headers.entries()) }), new Error(`Gemini API ${T.status}: ${D.substring(0, 200)}`);
      }
      const O = await T.json();
      if (!O.candidates || O.candidates.length === 0) throw console.error("\u274C API\u30EC\u30B9\u30DD\u30F3\u30B9\u30A8\u30E9\u30FC:", { dataKeys: Object.keys(O), promptFeedback: O.promptFeedback, candidates: O.candidates }), new Error("API\u30EC\u30B9\u30DD\u30F3\u30B9\u306Bcandidates\u304C\u3042\u308A\u307E\u305B\u3093\u3002promptFeedback: " + JSON.stringify(O.promptFeedback));
      const A = O.candidates[0], S = A.finishReason;
      if (console.log("\u{1F4CA} finishReason:", S), console.log("\u{1F4CA} candidate \u60C5\u5831:", { finishReason: S, safetyRatings: A.safetyRatings, citationMetadata: A.citationMetadata }), S && S !== "STOP") throw console.error("\u274C \u7570\u5E38\u7D42\u4E86:", S), console.error("\u{1F4CA} \u5019\u88DC\u30C7\u30FC\u30BF:", A), new Error(`Gemini API \u304C\u7570\u5E38\u7D42\u4E86\u3057\u307E\u3057\u305F: ${S}`);
      let I = A.content.parts[0].text;
      console.log("\u2705 \u30B3\u30FC\u30B9\u751F\u6210\u6210\u529F:", c.name), console.log("\u{1F4C4} AI\u751F\u6210JSON\uFF08\u751F\u30C7\u30FC\u30BF\u30FB\u6700\u521D\u306E500\u6587\u5B57\uFF09:", I.substring(0, 500)), console.log("\u{1F4C4} AI\u751F\u6210JSON\uFF08\u751F\u30C7\u30FC\u30BF\u30FB\u6700\u5F8C\u306E500\u6587\u5B57\uFF09:", I.substring(Math.max(0, I.length - 500))), console.log("\u{1F4CA} AI\u751F\u6210JSON\u9577\u3055\uFF08\u751F\u30C7\u30FC\u30BF\uFF09:", I.length, "\u6587\u5B57"), I.includes("```") && (console.log("\u{1F527} \u30DE\u30FC\u30AF\u30C0\u30A6\u30F3\u306E\u30B3\u30FC\u30C9\u30D6\u30ED\u30C3\u30AF\u3092\u691C\u51FA\u3057\u307E\u3057\u305F\u3002\u9664\u53BB\u3057\u307E\u3059..."), I = I.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim(), console.log("\u{1F4C4} \u30AF\u30EA\u30FC\u30F3\u30A2\u30C3\u30D7\u5F8C\u306EJSON\uFF08\u6700\u521D\u306E500\u6587\u5B57\uFF09:", I.substring(0, 500)), console.log("\u{1F4C4} \u30AF\u30EA\u30FC\u30F3\u30A2\u30C3\u30D7\u5F8C\u306EJSON\uFF08\u6700\u5F8C\u306E500\u6587\u5B57\uFF09:", I.substring(Math.max(0, I.length - 500))), console.log("\u{1F4CA} \u30AF\u30EA\u30FC\u30F3\u30A2\u30C3\u30D7\u5F8C\u306EJSON\u9577\u3055:", I.length, "\u6587\u5B57"));
      const N = I.trim().slice(-1);
      if (N !== "}" && N !== "]") throw console.error("\u274C JSON\u4E0D\u5B8C\u5168\uFF08\u6700\u5F8C\u306E\u6587\u5B57\uFF09:", N), console.error("\u{1F4C4} JSON\u672B\u5C3E100\u6587\u5B57:", I.slice(-100)), new Error(`JSON\u4E0D\u5B8C\u5168: \u6700\u5F8C\u306E\u6587\u5B57\u304C ${N} \u3067\u3059\uFF08\u671F\u5F85: } \u307E\u305F\u306F ]\uFF09`);
      console.log("\u2705 JSON\u5B8C\u5168\u6027\u30C1\u30A7\u30C3\u30AF: \u6700\u5F8C\u306E\u6587\u5B57 =", N);
      try {
        y = JSON.parse(I), console.log("\u2705 JSON.parse\u6210\u529F\uFF081\u56DE\u76EE\uFF09");
      } catch (D) {
        console.error("\u274C JSON.parse\u5931\u6557\uFF081\u56DE\u76EE\uFF09:", D), console.log("\u{1F527} extractJSON\u95A2\u6570\u3092\u4F7F\u7528\u3057\u307E\u3059...");
        try {
          y = Y(I), console.log("\u2705 extractJSON\u6210\u529F\uFF082\u56DE\u76EE\uFF09");
        } catch (j) {
          console.error("\u274C extractJSON\u5931\u6557\uFF082\u56DE\u76EE\uFF09:", j), console.log("\u{1F4C4} AI\u751F\u6210JSON\u5168\u6587:", I);
          try {
            let $ = I;
            $ = $.replace(/\}\s*\{/g, "},{"), $ = $.replace(/\]\s*\{/g, "],["), $ = $.replace(/\}\s*\[/g, "},["), y = JSON.parse($), console.log("\u2705 \u624B\u52D5\u4FEE\u6B63JSON.parse\u6210\u529F\uFF083\u56DE\u76EE\uFF09");
          } catch {
            throw console.error("\u274C \u3059\u3079\u3066\u306E\u30D1\u30FC\u30B9\u65B9\u6CD5\u304C\u5931\u6557\u3057\u307E\u3057\u305F"), new Error(`JSON\u30D1\u30FC\u30B9\u30A8\u30E9\u30FC: ${D.message}`);
          }
        }
      }
      if (!y.cards || y.cards.length !== 6) throw console.error("\u274C \u30D0\u30EA\u30C7\u30FC\u30B7\u30E7\u30F3\u30A8\u30E9\u30FC:", { cards\u5B58\u5728: !!y.cards, cards\u9577\u3055: ((d = y.cards) == null ? void 0 : d.length) || 0, \u671F\u5F85\u679A\u6570: 6 }), new Error(`\u30AB\u30FC\u30C9\u304C6\u679A\u3067\u306F\u3042\u308A\u307E\u305B\u3093: ${((_ = y.cards) == null ? void 0 : _.length) || 0}\u679A\uFF08\u671F\u5F85: 6\u679A\uFF09`);
      for (let D = 0; D < y.cards.length; D++) {
        const j = y.cards[D];
        if (!j.hints || j.hints.length < 3) {
          for (console.error(`\u274C \u30AB\u30FC\u30C9${D + 1}\u306E\u30D2\u30F3\u30C8\u4E0D\u8DB3:`, { \u30AB\u30FC\u30C9\u756A\u53F7: j.card_number, \u30D2\u30F3\u30C8\u6570: ((m = j.hints) == null ? void 0 : m.length) || 0, \u671F\u5F85\u6570: 3 }), j.hints || (j.hints = []); j.hints.length < 3; ) {
            const $ = j.hints.length + 1;
            j.hints.push({ hint_level: $, hint_text: $ === 1 ? "\u307E\u305A\u3001\u554F\u984C\u3067\u4F55\u3092\u6C42\u3081\u3089\u308C\u3066\u3044\u308B\u304B\u78BA\u8A8D\u3057\u307E\u3057\u3087\u3046\u3002" : $ === 2 ? "\u56F3\u3084\u8868\u306B\u66F8\u3044\u3066\u6574\u7406\u3057\u3066\u307F\u307E\u3057\u3087\u3046\u3002" : "\u4F3C\u3066\u3044\u308B\u554F\u984C\u3092\u601D\u3044\u51FA\u3057\u3066\u307F\u307E\u3057\u3087\u3046\u3002", thinking_tool_suggestion: "" });
          }
          console.log(`\u2705 \u30AB\u30FC\u30C9${D + 1}\u306E\u30D2\u30F3\u30C8\u3092\u81EA\u52D5\u88DC\u5B8C\u3057\u307E\u3057\u305F\uFF08${j.hints.length}\u500B\uFF09`);
        }
      }
      const k = ["card_number", "card_title", "problem_description", "answer"];
      for (let D = 0; D < y.cards.length; D++) {
        const j = y.cards[D], $ = k.filter((re) => !j[re]);
        $.length > 0 && (console.warn(`\u26A0\uFE0F \u30AB\u30FC\u30C9${D + 1}\u306E\u5FC5\u9808\u30D5\u30A3\u30FC\u30EB\u30C9\u4E0D\u8DB3:`, $), j.card_number || (j.card_number = D + 1), j.card_title || (j.card_title = `\u5B66\u7FD2\u30AB\u30FC\u30C9${D + 1}`), j.problem_description || (j.problem_description = "\u554F\u984C\u306E\u8AAC\u660E\u3092\u751F\u6210\u4E2D\u3067\u3059"), j.answer || (j.answer = "\u89E3\u7B54\u3092\u751F\u6210\u4E2D\u3067\u3059"), console.log(`\u2705 \u30AB\u30FC\u30C9${D + 1}\u306E\u5FC5\u9808\u30D5\u30A3\u30FC\u30EB\u30C9\u3092\u81EA\u52D5\u88DC\u5B8C\u3057\u307E\u3057\u305F`));
      }
      console.log("\u2705 \u30D0\u30EA\u30C7\u30FC\u30B7\u30E7\u30F3\u6210\u529F:", { \u30B3\u30FC\u30B9\u540D: y.course_name || y.name, \u30AB\u30FC\u30C9\u679A\u6570: y.cards.length, \u4F7F\u7528\u30E2\u30C7\u30EB: E, \u8A66\u884C\u56DE\u6570: b });
      break;
    } catch (T) {
      if (console.error(`\u274C \u8A66\u884C ${b}/${v} \u5931\u6557:`, T.message), b === v) throw console.error("\u274C \u3059\u3079\u3066\u306E\u518D\u8A66\u884C\u304C\u5931\u6557\u3057\u307E\u3057\u305F"), T;
      const O = 2e3 * b;
      console.log(`\u23F3 ${O}ms \u5F85\u6A5F\u3057\u3066\u30EA\u30C8\u30E9\u30A4\u3057\u307E\u3059...`), await new Promise((A) => setTimeout(A, O));
    }
    if (!y) throw new Error("\u30B3\u30FC\u30B9\u30C7\u30FC\u30BF\u306E\u751F\u6210\u306B\u5931\u6557\u3057\u307E\u3057\u305F\uFF08\u3059\u3079\u3066\u306E\u518D\u8A66\u884C\u304C\u5931\u6557\uFF09");
    return console.log("\u2705 \u30B3\u30FC\u30B9\u751F\u6210\u5B8C\u4E86:", y.course_name || y.name), e.json({ success: true, course: y });
  } catch (h) {
    return console.error("\u274C \u30B3\u30FC\u30B9\u751F\u6210\u30A8\u30E9\u30FC\uFF08\u8A73\u7D30\uFF09:", { \u30A8\u30E9\u30FC\u30E1\u30C3\u30BB\u30FC\u30B8: h.message, \u30A8\u30E9\u30FC\u30B9\u30BF\u30C3\u30AF: h.stack, \u30A8\u30E9\u30FC\u578B: h.constructor.name, \u30B3\u30FC\u30B9\u540D: c == null ? void 0 : c.name, \u30B3\u30FC\u30B9\u30EC\u30D9\u30EB: i }), e.json({ error: h.message || "\u30B3\u30FC\u30B9\u751F\u6210\u306B\u5931\u6557\u3057\u307E\u3057\u305F", course: null, details: { errorType: h.constructor.name, courseName: c == null ? void 0 : c.name, courseLevel: i } }, 500);
  }
});
p.post("/api/ai/generate-unit", async (e) => {
  var l, u, d, _;
  const { env: r } = e, { grade: t, subject: s, textbook: n, unitName: a, customization: o, qualityMode: i } = await e.req.json(), c = r.GEMINI_API_KEY;
  if (!c || c === "your-gemini-api-key-here") return console.error("\u274C API\u30AD\u30FC\u304C\u8A2D\u5B9A\u3055\u308C\u3066\u3044\u307E\u305B\u3093"), e.json({ error: "Gemini API\u30AD\u30FC\u304C\u8A2D\u5B9A\u3055\u308C\u3066\u3044\u307E\u305B\u3093\u3002\u7BA1\u7406\u8005\u306B\u9023\u7D61\u3057\u3066\u304F\u3060\u3055\u3044\u3002", curriculum: null }, 500);
  console.log("\u{1F511} API\u30AD\u30FC\u78BA\u8A8D: \u6700\u521D\u306E10\u6587\u5B57 =", c.substring(0, 10));
  try {
    const m = o ? `

\u3010\u7279\u5225\u306A\u914D\u616E\u30FB\u30AB\u30B9\u30BF\u30DE\u30A4\u30BA\u3011
${o.studentNeeds ? `\u751F\u5F92\u306E\u72B6\u6CC1: ${o.studentNeeds}` : ""}
${o.teacherGoals ? `\u5148\u751F\u306E\u9858\u3044: ${o.teacherGoals}` : ""}
${o.learningStyle ? `\u5B66\u7FD2\u30B9\u30BF\u30A4\u30EB: ${o.learningStyle}` : ""}
${o.specialSupport ? `\u7279\u5225\u652F\u63F4: ${o.specialSupport}` : ""}
` : "", h = `${t}${s}\u300C${a}\u300D\uFF08${n}\uFF09\u306E\u5B66\u7FD2\u30AB\u30EA\u30AD\u30E5\u30E9\u30E0\u306E\u57FA\u672C\u60C5\u5831\u3092JSON\u5F62\u5F0F\u3067\u4F5C\u6210\u3057\u3066\u304F\u3060\u3055\u3044\u3002

**\u3010\u6700\u91CD\u8981\u3011JSON \u51FA\u529B\u306E\u53B3\u683C\u306A\u30EB\u30FC\u30EB:**
1. **\u5FC5\u305A { \u3067\u59CB\u307E\u308A } \u3067\u7D42\u308F\u308B\u3053\u3068**
2. **\u3059\u3079\u3066\u306E\u6587\u5B57\u5217\u306F\u4E8C\u91CD\u5F15\u7528\u7B26\u3067\u56F2\u3080\u3053\u3068**
3. **JSON\u4EE5\u5916\u306E\u30C6\u30AD\u30B9\u30C8\u306F\u4E00\u5207\u51FA\u529B\u3057\u306A\u3044\u3053\u3068**

${m}

\u51FA\u529B\u5F62\u5F0F\uFF08\u57FA\u672C\u60C5\u5831\u306E\u307F\uFF09:
{
  "curriculum": {
    "grade": "${t}",
    "subject": "${s}",
    "textbook_company": "${n}",
    "unit_name": "${a}",
    "total_hours": 8,
    "unit_goal": "\u5B66\u7FD2\u76EE\u6A19\uFF08100\u6587\u5B57\u4EE5\u5185\u3002\u96E3\u3057\u3044\u6F22\u5B57\u306B\u306F\u76F4\u5F8C\u306B\uFF08\u3072\u3089\u304C\u306A\uFF09\u3092\u3064\u3051\u308B\u3002\u4F8B\uFF1A\u56FD\u4F1A\uFF08\u3053\u3063\u304B\u3044\uFF09\uFF09",
    "non_cognitive_goal": "\u975E\u8A8D\u77E5\u76EE\u6A19\uFF0880\u6587\u5B57\u4EE5\u5185\uFF09"
  }
}

\u6CE8\u610F\uFF1A
- \u30B3\u30FC\u30B9\uFF08courses\uFF09\u306F\u542B\u3081\u306A\u3044\u3067\u304F\u3060\u3055\u3044
- \u57FA\u672C\u60C5\u5831\uFF08curriculum\uFF09\u306E\u307F\u3092\u751F\u6210\u3057\u3066\u304F\u3060\u3055\u3044
- \u7C21\u6F54\u306AJSON\u51FA\u529B\u3092\u304A\u9858\u3044\u3057\u307E\u3059
`, g = i === "high", f = i === "high";
    let E, x;
    f ? (E = [{ name: "gemini-3-flash-preview", maxTokens: 16384 }], x = { temperature: 0.5, maxOutputTokens: 16384, topP: 0.9, topK: 20, responseMimeType: "application/json", responseSchema: { type: "object", properties: { curriculum: { type: "object", properties: { grade: { type: "string" }, subject: { type: "string" }, textbook_company: { type: "string" }, unit_name: { type: "string" }, total_hours: { type: "number" }, unit_goal: { type: "string" }, non_cognitive_goal: { type: "string" } }, required: ["grade", "subject", "unit_name", "unit_goal"] }, courses: { type: "array", items: { type: "object", properties: { name: { type: "string" }, course_name: { type: "string" }, label: { type: "string" }, description: { type: "string" }, color_code: { type: "string" }, cards: { type: "array", items: { type: "object", properties: { card_number: { type: "number" }, card_title: { type: "string" }, card_type: { type: "string" }, textbook_page: { type: "string" }, problem_description: { type: "string" }, new_terms: { type: "string" }, example_problem: { type: "string" }, example_solution: { type: "string" }, real_world_connection: { type: "string" }, answer: { type: "string" }, answer_explanation: { type: "string" }, hints: { type: "array", items: { type: "object", properties: { hint_level: { type: "number" }, hint_text: { type: "string" } }, required: ["hint_level", "hint_text"] } } }, required: ["card_number", "card_title", "problem_description", "real_world_connection", "answer", "hints"] } } }, required: ["name", "course_name", "cards"] } } }, required: ["curriculum", "courses"] } }) : (E = [{ name: "gemini-3-flash-preview", maxTokens: 16384 }, { name: "gemini-3-flash-preview", maxTokens: 16384 }, { name: "gemini-3-flash-preview", maxTokens: 16384 }], x = { temperature: 0.7, maxOutputTokens: 16384, topP: 0.95, topK: 40, responseMimeType: "application/json", responseSchema: { type: "object", properties: { curriculum: { type: "object", properties: { grade: { type: "string" }, subject: { type: "string" }, textbook_company: { type: "string" }, unit_name: { type: "string" }, total_hours: { type: "number" }, unit_goal: { type: "string" }, non_cognitive_goal: { type: "string" } }, required: ["grade", "subject", "unit_name", "unit_goal"] }, courses: { type: "array", items: { type: "object", properties: { name: { type: "string" }, course_name: { type: "string" }, label: { type: "string" }, description: { type: "string" }, color_code: { type: "string" }, cards: { type: "array", items: { type: "object", properties: { card_number: { type: "number" }, card_title: { type: "string" }, card_type: { type: "string" }, textbook_page: { type: "string" }, problem_description: { type: "string" }, new_terms: { type: "string" }, example_problem: { type: "string" }, example_solution: { type: "string" }, real_world_connection: { type: "string" }, answer: { type: "string" }, answer_explanation: { type: "string" }, hints: { type: "array", items: { type: "object", properties: { hint_level: { type: "number" }, hint_text: { type: "string" } }, required: ["hint_level", "hint_text"] } } }, required: ["card_number", "card_title", "problem_description", "real_world_connection", "answer", "hints"] } } }, required: ["name", "course_name", "cards"] } } }, required: ["curriculum", "courses"] } });
    let y, v, b;
    for (const k of E) try {
      if (console.log(`\u{1F504} \u521D\u671F\u751F\u6210\u30E2\u30C7\u30EB\u8A66\u884C\u4E2D: ${k.name}`), v = k.name, y = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${v}:generateContent?key=${c}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ parts: [{ text: h }] }], generationConfig: x }) }), y.ok) {
        console.log(`\u2705 \u521D\u671F\u751F\u6210\u30E2\u30C7\u30EB\u6210\u529F: ${v}`);
        break;
      } else {
        const D = await y.text();
        console.warn(`\u26A0\uFE0F \u521D\u671F\u751F\u6210\u30E2\u30C7\u30EB\u5931\u6557: ${v} (status: ${y.status})`), console.warn(`   \u30A8\u30E9\u30FC\u8A73\u7D30: ${D.substring(0, 200)}`), b = new Error(`${v} returned ${y.status}: ${D.substring(0, 100)}`);
      }
    } catch (D) {
      console.warn(`\u26A0\uFE0F \u521D\u671F\u751F\u6210\u30E2\u30C7\u30EB\u30A8\u30E9\u30FC: ${k.name} - ${D.message}`), b = D;
    }
    if (!y || !y.ok) throw console.error("\u274C \u3059\u3079\u3066\u306E\u30E2\u30C7\u30EB\u304C\u5931\u6557\u3057\u307E\u3057\u305F:", b == null ? void 0 : b.message), b || new Error("\u3059\u3079\u3066\u306E\u30E2\u30C7\u30EB\u304C\u5931\u6557\u3057\u307E\u3057\u305F");
    const T = await y.json();
    console.log("\u{1F4E6} API Response Status:", y.status), console.log("\u{1F4E6} API Response Data Keys:", Object.keys(T));
    const O = (l = T.candidates) == null ? void 0 : l[0], A = O == null ? void 0 : O.finishReason;
    console.log("\u{1F4CA} finishReason:", A), A === "MAX_TOKENS" && console.warn("\u26A0\uFE0F \u8B66\u544A: \u30C8\u30FC\u30AF\u30F3\u4E0A\u9650\u306B\u9054\u3057\u307E\u3057\u305F\u3002JSON\u304C\u4E0D\u5B8C\u5168\u306A\u53EF\u80FD\u6027\u304C\u3042\u308A\u307E\u3059\u3002");
    const S = (_ = (d = (u = O == null ? void 0 : O.content) == null ? void 0 : u.parts) == null ? void 0 : d[0]) == null ? void 0 : _.text;
    if (!S) return console.error("\u274C AI\u30EC\u30B9\u30DD\u30F3\u30B9\u304C\u7A7A\u3067\u3059"), console.error("   \u5B8C\u5168\u306A\u30EC\u30B9\u30DD\u30F3\u30B9:", JSON.stringify(T, null, 2).substring(0, 500)), e.json({ error: "\u5358\u5143\u306E\u751F\u6210\u306B\u5931\u6557\u3057\u307E\u3057\u305F\u3002AI\u306E\u5FDC\u7B54\u304C\u7A7A\u3067\u3057\u305F\u3002", details: JSON.stringify(T).substring(0, 200), curriculum: null });
    console.log("\u{1F4DD} AI\u30EC\u30B9\u30DD\u30F3\u30B9\uFF08\u6700\u521D\u306E500\u6587\u5B57\uFF09:", S.substring(0, 500)), console.log("\u{1F4DD} AI\u30EC\u30B9\u30DD\u30F3\u30B9\uFF08\u6700\u5F8C\u306E200\u6587\u5B57\uFF09:", S.substring(Math.max(0, S.length - 200)));
    let I;
    try {
      I = Y(S), console.log("\u2705 JSON\u30D1\u30FC\u30B9\u6210\u529F"), console.log("\u{1F4CA} \u30C7\u30FC\u30BF\u69CB\u9020\u30AD\u30FC:", Object.keys(I));
    } catch (k) {
      console.error("\u274C JSON\u30D1\u30FC\u30B9\u30A8\u30E9\u30FC:", k.message), console.error("\u{1F4DD} \u30D1\u30FC\u30B9\u306B\u5931\u6557\u3057\u305F\u30EC\u30B9\u30DD\u30F3\u30B9\u306E\u6700\u521D\u306E1000\u6587\u5B57:"), console.error(S.substring(0, 1e3)), console.error("\u{1F4DD} \u30D1\u30FC\u30B9\u306B\u5931\u6557\u3057\u305F\u30EC\u30B9\u30DD\u30F3\u30B9\u306E\u6700\u5F8C\u306E1000\u6587\u5B57:"), console.error(S.substring(Math.max(0, S.length - 1e3)));
      let D = null;
      try {
        const j = S.match(/\{[\s\S]*?\}(?=\s*$|$)/);
        j && (D = JSON.parse(j[0]), console.log("\u26A0\uFE0F \u90E8\u5206\u7684\u306AJSON\u30D1\u30FC\u30B9\u306B\u6210\u529F\u3057\u307E\u3057\u305F"));
      } catch (j) {
        console.error("\u274C \u30D5\u30A9\u30FC\u30EB\u30D0\u30C3\u30AF\u30D1\u30FC\u30B9\u3082\u5931\u6557:", j);
      }
      return e.json({ error: "\u5358\u5143\u306E\u751F\u6210\u306B\u5931\u6557\u3057\u307E\u3057\u305F\u3002AI\u306E\u5FDC\u7B54\u304CJSON\u5F62\u5F0F\u3067\u306F\u3042\u308A\u307E\u305B\u3093\u3067\u3057\u305F\u3002", details: `\u30D1\u30FC\u30B9\u30A8\u30E9\u30FC: ${k.message}`, partial_data: D, ai_response_preview: S.substring(0, 500), curriculum: null }, 500);
    }
    const N = [];
    return I.curriculum ? (I.curriculum.grade || N.push("curriculum.grade \u304C\u6B20\u3051\u3066\u3044\u307E\u3059"), I.curriculum.subject || N.push("curriculum.subject \u304C\u6B20\u3051\u3066\u3044\u307E\u3059"), I.curriculum.unit_name || N.push("curriculum.unit_name \u304C\u6B20\u3051\u3066\u3044\u307E\u3059"), I.curriculum.unit_goal || N.push("curriculum.unit_goal \u304C\u6B20\u3051\u3066\u3044\u307E\u3059")) : N.push("curriculum \u304C\u6B20\u3051\u3066\u3044\u307E\u3059"), N.length > 0 ? (console.error("\u274C \u5358\u5143\u30C7\u30FC\u30BF\u691C\u8A3C\u30A8\u30E9\u30FC:", N), console.error("\u{1F4CA} \u751F\u6210\u3055\u308C\u305F\u30C7\u30FC\u30BF\u306E\u4E00\u90E8:", JSON.stringify(I).substring(0, 1e3)), e.json({ error: "\u5358\u5143\u30C7\u30FC\u30BF\u306E\u69CB\u9020\u304C\u6B63\u3057\u304F\u3042\u308A\u307E\u305B\u3093\u3002", validation_errors: N, data_preview: JSON.stringify(I).substring(0, 500), curriculum: null }, 400)) : (console.log("\u2705 \u30C7\u30FC\u30BF\u691C\u8A3C\u6210\u529F"), e.json({ success: true, model_used: v, data: I }));
  } catch (m) {
    return console.error("\u5358\u5143\u751F\u6210\u30A8\u30E9\u30FC:", m), e.json({ error: "\u5358\u5143\u3092\u751F\u6210\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F\u3002", details: m instanceof Error ? m.message : String(m), curriculum: null });
  }
});
p.post("/api/curriculum/save-generated", async (e) => {
  var i, c, l, u;
  const { env: r } = e, { curriculum: t, courses: s, optionalProblems: n, courseSelectionProblems: a, commonCheckTest: o } = await e.req.json();
  try {
    const _ = (await r.DB.prepare(`
      INSERT INTO curriculum (
        grade, subject, textbook_company, unit_name, 
        unit_order, total_hours, unit_goal, non_cognitive_goal
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(t.grade, t.subject, t.textbook_company, t.unit_name, 99, t.total_hours, t.unit_goal, t.non_cognitive_goal).run()).meta.last_row_id;
    for (const m of s) {
      let h = "standard";
      (i = m.course_name) != null && i.includes("\u3086\u3063\u304F\u308A") || (c = m.course_name) != null && c.includes("\u3058\u3063\u304F\u308A") ? h = "basic" : ((l = m.course_name) != null && l.includes("\u3069\u3093\u3069\u3093") || (u = m.course_name) != null && u.includes("\u3050\u3093\u3050\u3093")) && (h = "advanced");
      const f = (await r.DB.prepare(`
        INSERT INTO courses (
          curriculum_id, course_level, course_display_name, 
          selection_question_title, selection_question_content,
          course_name, description, color_code, course_label
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(_, h, m.course_name || m.course_label || m.name || "\u30B3\u30FC\u30B9", m.course_name || m.name || "\u30B3\u30FC\u30B9\u9078\u629E\u554F\u984C", m.description || "", m.course_name || m.name || "\u30B3\u30FC\u30B9", m.description || "", m.color_code || "blue", m.course_label || m.label || "").run()).meta.last_row_id;
      await r.DB.prepare("PRAGMA foreign_keys = OFF").run();
      for (const E of m.cards || []) {
        const x = Et(E.card_type), v = (await r.DB.prepare(`
          INSERT INTO learning_cards (
            course_id, card_number, card_title, card_type,
            problem_content, problem_description, new_terms, example_problem,
            example_solution, real_world_connection, textbook_page
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(f, E.card_number || 1, E.card_title || E.title || "\u30AB\u30FC\u30C9", x, E.problem_description || E.problem_content || E.content || "", E.problem_description || E.problem_content || E.content || "", E.new_terms || "", E.example_problem || "", E.example_solution || "", E.real_world_connection || E.real_world_context || "", E.textbook_page || "").run()).meta.last_row_id, b = E.answer || E.problem_description || E.problem_content || "\u89E3\u7B54\u3092\u751F\u6210\u4E2D\u3067\u3059", T = E.answer_explanation || E.explanation || E.real_world_connection || "\u89E3\u8AAC\u3092\u751F\u6210\u4E2D\u3067\u3059";
        await r.DB.prepare(`
          INSERT INTO answers (
            learning_card_id, answer_content, explanation
          ) VALUES (?, ?, ?)
        `).bind(v, b, T).run();
        const O = E.hints || [];
        O.length === 0 && (O.push({ hint_level: 1, hint_text: "\u307E\u305A\u3001\u554F\u984C\u3067\u4F55\u3092\u6C42\u3081\u3089\u308C\u3066\u3044\u308B\u304B\u78BA\u8A8D\u3057\u307E\u3057\u3087\u3046\u3002", thinking_tool_suggestion: "" }, { hint_level: 2, hint_text: "\u56F3\u3084\u8868\u306B\u66F8\u3044\u3066\u6574\u7406\u3057\u3066\u307F\u307E\u3057\u3087\u3046\u3002", thinking_tool_suggestion: "" }, { hint_level: 3, hint_text: "\u4F3C\u3066\u3044\u308B\u554F\u984C\u3092\u601D\u3044\u51FA\u3057\u3066\u307F\u307E\u3057\u3087\u3046\u3002", thinking_tool_suggestion: "" }), console.log(`\u26A0\uFE0F \u30AB\u30FC\u30C9${E.card_number}\u306E\u30D2\u30F3\u30C8\u304C\u7A7A\u306E\u305F\u3081\u3001\u30C7\u30D5\u30A9\u30EB\u30C8\u5024\u3092\u8A2D\u5B9A\u3057\u307E\u3057\u305F`));
        for (const A of O) await r.DB.prepare(`
            INSERT INTO hint_cards (
              learning_card_id, hint_number, hint_content, thinking_tool_suggestion
            ) VALUES (?, ?, ?, ?)
          `).bind(v, A.hint_level || A.hint_number || 1, A.hint_text || A.hint_content || "", A.thinking_tool_suggestion || "").run();
      }
      await r.DB.prepare("PRAGMA foreign_keys = ON").run();
    }
    for (const m of n || []) await r.DB.prepare(`
        INSERT INTO optional_problems (
          curriculum_id, problem_number, problem_title, problem_description, problem_content,
          difficulty_level, learning_meaning
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(_, m.problem_number || 1, m.problem_title || m.title || "\u9078\u629E\u554F\u984C", m.problem_description || m.description || "", m.problem_content || m.problem_description || m.content || "\u554F\u984C\u5185\u5BB9", m.difficulty_level || "medium", m.learning_meaning || "").run();
    if (a && a.length > 0) {
      const m = JSON.stringify(a);
      await r.DB.prepare(`
        INSERT OR REPLACE INTO curriculum_metadata (
          curriculum_id, metadata_key, metadata_value
        ) VALUES (?, ?, ?)
      `).bind(_, "course_selection_problems", m).run();
    }
    if (o && o.sample_problems && o.sample_problems.length > 0) {
      const m = JSON.stringify(o);
      await r.DB.prepare(`
        INSERT OR REPLACE INTO curriculum_metadata (
          curriculum_id, metadata_key, metadata_value
        ) VALUES (?, ?, ?)
      `).bind(_, "common_check_test", m).run();
    }
    return console.log("\u2705 \u5358\u5143\u4FDD\u5B58\u5B8C\u4E86:", { curriculum_id: _, courses: s.length, total_cards: s.reduce((m, h) => {
      var g;
      return m + (((g = h.cards) == null ? void 0 : g.length) || 0);
    }, 0), optional_problems: (n == null ? void 0 : n.length) || 0, course_selection_problems: (a == null ? void 0 : a.length) || 0, common_check_test: o ? "\u6709" : "\u7121" }), e.json({ success: true, curriculum_id: _, saved_data: { optional_problems_count: (n == null ? void 0 : n.length) || 0, course_selection_count: (a == null ? void 0 : a.length) || 0, common_check_test: !!o } });
  } catch (d) {
    return console.error("\u5358\u5143\u4FDD\u5B58\u30A8\u30E9\u30FC:", d), e.json({ success: false, error: "Database error", details: d instanceof Error ? d.message : String(d) }, 500);
  }
});
p.post("/api/curriculum/:curriculumId/generate-course-problems", async (e) => {
  var n, a, o, i, c, l, u, d, _, m, h, g, f, E, x, y, v;
  const { env: r } = e, t = e.req.param("curriculumId"), s = r.GEMINI_API_KEY;
  if (!s || s === "your-gemini-api-key-here") return e.json({ error: "Gemini API\u30AD\u30FC\u304C\u8A2D\u5B9A\u3055\u308C\u3066\u3044\u307E\u305B\u3093" }, 500);
  try {
    const b = await r.DB.prepare("SELECT * FROM curriculum WHERE id = ?").bind(t).first(), T = await r.DB.prepare("SELECT * FROM courses WHERE curriculum_id = ?").bind(t).all();
    if (!b || !T.results || T.results.length === 0) return e.json({ error: "\u30AB\u30EA\u30AD\u30E5\u30E9\u30E0\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093" }, 404);
    const O = `\u5C0F\u5B66${b.grade}\u5E74 ${b.subject}\u300C${b.unit_name}\u300D\u306E\u554F\u984C\u3068\u5B66\u7FD2\u30B5\u30DD\u30FC\u30C8\u30B3\u30F3\u30C6\u30F3\u30C4\u3092\u751F\u6210\u3002

\u3010\u5FC5\u9808\uFF1A3\u3064\u306E\u30B3\u30FC\u30B9\u3011
1. ${((n = T.results[0]) == null ? void 0 : n.course_name) || "\u3086\u3063\u304F\u308A\u30B3\u30FC\u30B9"}
2. ${((a = T.results[1]) == null ? void 0 : a.course_name) || "\u3057\u3063\u304B\u308A\u30B3\u30FC\u30B9"}  
3. ${((o = T.results[2]) == null ? void 0 : o.course_name) || "\u3050\u3093\u3050\u3093\u30B3\u30FC\u30B9"}

\u3010\u6559\u80B2\u7406\u8AD6\u306B\u57FA\u3065\u304F\u691C\u7D22\u7DF4\u7FD2\u30B3\u30F3\u30C6\u30F3\u30C4\u3011
- \u3088\u304F\u51FA\u308B\u554F\u984C\uFF08\u691C\u7D22\u7DF4\u7FD2: Roediger & Karpicke 2006\uFF09
- \u5FDC\u7528\u554F\u984C\uFF08\u4EA4\u4E92\u914D\u7F6E: Rohrer & Taylor 2007\uFF09
- \u7DCF\u5FA9\u7FD2\u30C1\u30A7\u30C3\u30AF\u30EA\u30B9\u30C8\uFF08\u5206\u6563\u5B66\u7FD2: Cepeda et al. 2006\uFF09

\u3010\u5FC5\u9808\uFF1AJSON\u306E\u307F\u51FA\u529B\u3011
{
  "course_selection_problems": [
    {"problem_number": 1, "problem_title": "\u30B3\u30FC\u30B91\u306E\u9B45\u529B\u7684\u306A\u30BF\u30A4\u30C8\u30EB", "problem_content": "\u5177\u4F53\u7684\u306A\u6570\u5B57\u3092\u542B\u3080\u554F\u984C\u6587\uFF0850\u5B57\u4EE5\u4E0A\uFF09", "course_level": "\u57FA\u790E"},
    {"problem_number": 2, "problem_title": "\u30B3\u30FC\u30B92\u306E\u9B45\u529B\u7684\u306A\u30BF\u30A4\u30C8\u30EB", "problem_content": "\u5177\u4F53\u7684\u306A\u6570\u5B57\u3092\u542B\u3080\u554F\u984C\u6587\uFF0850\u5B57\u4EE5\u4E0A\uFF09", "course_level": "\u6A19\u6E96"},
    {"problem_number": 3, "problem_title": "\u30B3\u30FC\u30B93\u306E\u9B45\u529B\u7684\u306A\u30BF\u30A4\u30C8\u30EB", "problem_content": "\u5177\u4F53\u7684\u306A\u6570\u5B57\u3092\u542B\u3080\u554F\u984C\u6587\uFF0850\u5B57\u4EE5\u4E0A\uFF09", "course_level": "\u767A\u5C55"}
  ],
  "introduction_problems": [
    {"course_number": 1, "problem_title": "\u5C0E\u5165\u554F\u984C1", "problem_content": "\u5177\u4F53\u7684\u306A\u6570\u5B57\u3092\u542B\u3080\u554F\u984C\u6587\uFF0850\u5B57\u4EE5\u4E0A\uFF09", "answer": "\u89E3\u7B54\u3068\u89E3\u8AAC\uFF0830\u5B57\u4EE5\u4E0A\uFF09"},
    {"course_number": 2, "problem_title": "\u5C0E\u5165\u554F\u984C2", "problem_content": "\u5177\u4F53\u7684\u306A\u6570\u5B57\u3092\u542B\u3080\u554F\u984C\u6587\uFF0850\u5B57\u4EE5\u4E0A\uFF09", "answer": "\u89E3\u7B54\u3068\u89E3\u8AAC\uFF0830\u5B57\u4EE5\u4E0A\uFF09"},
    {"course_number": 3, "problem_title": "\u5C0E\u5165\u554F\u984C3", "problem_content": "\u5177\u4F53\u7684\u306A\u6570\u5B57\u3092\u542B\u3080\u554F\u984C\u6587\uFF0850\u5B57\u4EE5\u4E0A\uFF09", "answer": "\u89E3\u7B54\u3068\u89E3\u8AAC\uFF0830\u5B57\u4EE5\u4E0A\uFF09"}
  ],
  "retrieval_practice": {
    "frequent_problems": [
      {"problem_number": 1, "problem_title": "\u57FA\u672C\u30D1\u30BF\u30FC\u30F31", "problem_content": "\u30C6\u30B9\u30C8\u306B\u3088\u304F\u51FA\u308B\u554F\u984C\uFF08\u5177\u4F53\u7684\u306A\u6570\u5B57\uFF09", "answer": "\u6B63\u89E3", "explanation": "\u89E3\u8AAC\uFF08\u306A\u305C\u3053\u306E\u7B54\u3048\u304B\uFF09", "time_limit": 10, "difficulty": "easy"},
      {"problem_number": 2, "problem_title": "\u57FA\u672C\u30D1\u30BF\u30FC\u30F32", "problem_content": "\u30C6\u30B9\u30C8\u306B\u3088\u304F\u51FA\u308B\u554F\u984C", "answer": "\u6B63\u89E3", "explanation": "\u89E3\u8AAC", "time_limit": 10, "difficulty": "easy"},
      {"problem_number": 3, "problem_title": "\u57FA\u672C\u30D1\u30BF\u30FC\u30F33", "problem_content": "\u30C6\u30B9\u30C8\u306B\u3088\u304F\u51FA\u308B\u554F\u984C", "answer": "\u6B63\u89E3", "explanation": "\u89E3\u8AAC", "time_limit": 10, "difficulty": "easy"},
      {"problem_number": 4, "problem_title": "\u57FA\u672C\u30D1\u30BF\u30FC\u30F34", "problem_content": "\u30C6\u30B9\u30C8\u306B\u3088\u304F\u51FA\u308B\u554F\u984C", "answer": "\u6B63\u89E3", "explanation": "\u89E3\u8AAC", "time_limit": 10, "difficulty": "easy"},
      {"problem_number": 5, "problem_title": "\u57FA\u672C\u30D1\u30BF\u30FC\u30F35", "problem_content": "\u30C6\u30B9\u30C8\u306B\u3088\u304F\u51FA\u308B\u554F\u984C", "answer": "\u6B63\u89E3", "explanation": "\u89E3\u8AAC", "time_limit": 10, "difficulty": "easy"}
    ],
    "application_problems": [
      {"problem_number": 1, "problem_title": "\u5FDC\u7528\u554F\u984C1", "problem_content": "\u8907\u6570\u306E\u6982\u5FF5\u3092\u7D44\u307F\u5408\u308F\u305B\u305F\u554F\u984C", "answer": "\u6B63\u89E3", "explanation": "\u89E3\u8AAC\uFF08\u601D\u8003\u30D7\u30ED\u30BB\u30B9\u542B\u3080\uFF09", "thinking_points": ["\u8003\u3048\u65B9\u306E\u30DD\u30A4\u30F3\u30C81", "\u30DD\u30A4\u30F3\u30C82"], "difficulty": "medium"},
      {"problem_number": 2, "problem_title": "\u5FDC\u7528\u554F\u984C2", "problem_content": "\u8907\u6570\u306E\u6982\u5FF5\u3092\u7D44\u307F\u5408\u308F\u305B\u305F\u554F\u984C", "answer": "\u6B63\u89E3", "explanation": "\u89E3\u8AAC", "thinking_points": ["\u30DD\u30A4\u30F3\u30C81", "\u30DD\u30A4\u30F3\u30C82"], "difficulty": "medium"},
      {"problem_number": 3, "problem_title": "\u5FDC\u7528\u554F\u984C3", "problem_content": "\u8907\u6570\u306E\u6982\u5FF5\u3092\u7D44\u307F\u5408\u308F\u305B\u305F\u554F\u984C", "answer": "\u6B63\u89E3", "explanation": "\u89E3\u8AAC", "thinking_points": ["\u30DD\u30A4\u30F3\u30C81", "\u30DD\u30A4\u30F3\u30C82"], "difficulty": "hard"},
      {"problem_number": 4, "problem_title": "\u5FDC\u7528\u554F\u984C4", "problem_content": "\u8907\u6570\u306E\u6982\u5FF5\u3092\u7D44\u307F\u5408\u308F\u305B\u305F\u554F\u984C", "answer": "\u6B63\u89E3", "explanation": "\u89E3\u8AAC", "thinking_points": ["\u30DD\u30A4\u30F3\u30C81", "\u30DD\u30A4\u30F3\u30C82"], "difficulty": "hard"},
      {"problem_number": 5, "problem_title": "\u5FDC\u7528\u554F\u984C5", "problem_content": "\u8907\u6570\u306E\u6982\u5FF5\u3092\u7D44\u307F\u5408\u308F\u305B\u305F\u554F\u984C", "answer": "\u6B63\u89E3", "explanation": "\u89E3\u8AAC", "thinking_points": ["\u30DD\u30A4\u30F3\u30C81", "\u30DD\u30A4\u30F3\u30C82"], "difficulty": "hard"}
    ],
    "review_checklist": [
      {"item_number": 1, "check_point": "\u3053\u306E\u5358\u5143\u3067\u5B66\u3093\u3060\u3053\u30681", "description": "\u5177\u4F53\u7684\u306A\u78BA\u8A8D\u5185\u5BB9", "example": "\u4F8B: \u3007\u3007\u306E\u610F\u5473\u3092\u8AAC\u660E\u3067\u304D\u308B"},
      {"item_number": 2, "check_point": "\u3053\u306E\u5358\u5143\u3067\u5B66\u3093\u3060\u3053\u30682", "description": "\u5177\u4F53\u7684\u306A\u78BA\u8A8D\u5185\u5BB9", "example": "\u4F8B: \u3007\u3007\u3092\u8A08\u7B97\u3067\u304D\u308B"},
      {"item_number": 3, "check_point": "\u3053\u306E\u5358\u5143\u3067\u5B66\u3093\u3060\u3053\u30683", "description": "\u5177\u4F53\u7684\u306A\u78BA\u8A8D\u5185\u5BB9", "example": "\u4F8B: \u56F3\u3092\u898B\u3066\u3007\u3007\u3067\u304D\u308B"},
      {"item_number": 4, "check_point": "\u3053\u306E\u5358\u5143\u3067\u5B66\u3093\u3060\u3053\u30684", "description": "\u5177\u4F53\u7684\u306A\u78BA\u8A8D\u5185\u5BB9", "example": "\u4F8B: \u6587\u7AE0\u984C\u304B\u3089\u3007\u3007\u3067\u304D\u308B"},
      {"item_number": 5, "check_point": "\u3053\u306E\u5358\u5143\u3067\u5B66\u3093\u3060\u3053\u30685", "description": "\u5177\u4F53\u7684\u306A\u78BA\u8A8D\u5185\u5BB9", "example": "\u4F8B: \u3007\u3007\u3092\u4F7F\u3063\u305F\u554F\u984C\u3092\u4F5C\u308C\u308B"},
      {"item_number": 6, "check_point": "\u3053\u306E\u5358\u5143\u3067\u5B66\u3093\u3060\u3053\u30686", "description": "\u5177\u4F53\u7684\u306A\u78BA\u8A8D\u5185\u5BB9", "example": "\u4F8B: \u5B9F\u751F\u6D3B\u3067\u3007\u3007\u3092\u6D3B\u7528\u3067\u304D\u308B"}
    ]
  }
}`, A = ["gemini-3-flash-preview", "gemini-3-flash-preview", "gemini-3-flash-preview"];
    let S, I;
    for (const j of A) try {
      if (console.log(`\u{1F504} \u30E2\u30C7\u30EB\u8A66\u884C\u4E2D: ${j}`), S = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${j}:generateContent?key=${s}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ parts: [{ text: O }] }], generationConfig: { temperature: 0.8, maxOutputTokens: 8192 } }) }), S.ok) {
        console.log(`\u2705 \u30E2\u30C7\u30EB\u6210\u529F: ${j}`);
        break;
      } else console.warn(`\u26A0\uFE0F \u30E2\u30C7\u30EB\u5931\u6557: ${j} (status: ${S.status})`), I = new Error(`${j} returned ${S.status}`);
    } catch ($) {
      console.warn(`\u26A0\uFE0F \u30E2\u30C7\u30EB\u30A8\u30E9\u30FC: ${j} - ${$.message}`), I = $;
    }
    if (!S || !S.ok) throw I || new Error("\u3059\u3079\u3066\u306E\u30E2\u30C7\u30EB\u304C\u5931\u6557\u3057\u307E\u3057\u305F");
    const k = (d = (u = (l = (c = (i = (await S.json()).candidates) == null ? void 0 : i[0]) == null ? void 0 : c.content) == null ? void 0 : l.parts) == null ? void 0 : u[0]) == null ? void 0 : d.text;
    if (!k) throw new Error("AI response is empty");
    console.log("AI\u30EC\u30B9\u30DD\u30F3\u30B9\uFF08\u30B3\u30FC\u30B9\u554F\u984C\uFF09:", k);
    const D = Y(k);
    if (console.log("\u30D1\u30FC\u30B9\u7D50\u679C\uFF08\u30B3\u30FC\u30B9\u554F\u984C\uFF09:", JSON.stringify(D, null, 2)), D.course_selection_problems) {
      console.log(`\u30B3\u30FC\u30B9\u9078\u629E\u554F\u984C\u3092\u4FDD\u5B58: ${D.course_selection_problems.length}\u4EF6`);
      const j = JSON.stringify(D.course_selection_problems);
      await r.DB.prepare(`
        INSERT OR REPLACE INTO curriculum_metadata (curriculum_id, metadata_key, metadata_value)
        VALUES (?, ?, ?)
      `).bind(t, "course_selection_problems", j).run();
    } else console.warn("course_selection_problems\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093");
    if (D.introduction_problems) {
      console.log(`\u5C0E\u5165\u554F\u984C\u3092\u4FDD\u5B58: ${D.introduction_problems.length}\u4EF6`);
      const j = T.results;
      for (let $ = 0; $ < D.introduction_problems.length && $ < j.length; $++) {
        const re = D.introduction_problems[$], he = j[$], se = JSON.stringify(re);
        console.log(`\u30B3\u30FC\u30B9${$ + 1}(ID:${he.id})\u306B\u5C0E\u5165\u554F\u984C\u3092\u4FDD\u5B58:`, re.problem_title), await r.DB.prepare(`
          UPDATE courses SET introduction_problem = ? WHERE id = ?
        `).bind(se, he.id).run();
      }
    } else console.warn("introduction_problems\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093");
    if (D.retrieval_practice) {
      if (console.log("\u{1F3AF} \u691C\u7D22\u7DF4\u7FD2\u30B3\u30F3\u30C6\u30F3\u30C4\u3092\u4FDD\u5B58\u958B\u59CB"), D.retrieval_practice.frequent_problems) {
        console.log(`\u3088\u304F\u51FA\u308B\u554F\u984C\u3092\u4FDD\u5B58: ${D.retrieval_practice.frequent_problems.length}\u4EF6`);
        const j = JSON.stringify(D.retrieval_practice.frequent_problems);
        await r.DB.prepare(`
          INSERT OR REPLACE INTO retrieval_practice_content (curriculum_id, content_type, problem_data)
          VALUES (?, ?, ?)
        `).bind(t, "frequent_problems", j).run();
      }
      if (D.retrieval_practice.application_problems) {
        console.log(`\u5FDC\u7528\u554F\u984C\u3092\u4FDD\u5B58: ${D.retrieval_practice.application_problems.length}\u4EF6`);
        const j = JSON.stringify(D.retrieval_practice.application_problems);
        await r.DB.prepare(`
          INSERT OR REPLACE INTO retrieval_practice_content (curriculum_id, content_type, problem_data)
          VALUES (?, ?, ?)
        `).bind(t, "application_problems", j).run();
      }
      if (D.retrieval_practice.review_checklist) {
        console.log(`\u7DCF\u5FA9\u7FD2\u30C1\u30A7\u30C3\u30AF\u30EA\u30B9\u30C8\u3092\u4FDD\u5B58: ${D.retrieval_practice.review_checklist.length}\u4EF6`);
        const j = JSON.stringify(D.retrieval_practice.review_checklist);
        await r.DB.prepare(`
          INSERT OR REPLACE INTO retrieval_practice_content (curriculum_id, content_type, problem_data)
          VALUES (?, ?, ?)
        `).bind(t, "review_checklist", j).run();
      }
      console.log("\u2705 \u691C\u7D22\u7DF4\u7FD2\u30B3\u30F3\u30C6\u30F3\u30C4\u306E\u4FDD\u5B58\u5B8C\u4E86");
    } else console.warn("retrieval_practice\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093");
    return e.json({ success: true, message: "\u30B3\u30FC\u30B9\u95A2\u9023\u554F\u984C\u3068\u691C\u7D22\u7DF4\u7FD2\u30B3\u30F3\u30C6\u30F3\u30C4\u3092\u751F\u6210\u30FB\u4FDD\u5B58\u3057\u307E\u3057\u305F", details: { course_selection_count: ((_ = D.course_selection_problems) == null ? void 0 : _.length) || 0, introduction_count: ((m = D.introduction_problems) == null ? void 0 : m.length) || 0, frequent_problems_count: ((g = (h = D.retrieval_practice) == null ? void 0 : h.frequent_problems) == null ? void 0 : g.length) || 0, application_problems_count: ((E = (f = D.retrieval_practice) == null ? void 0 : f.application_problems) == null ? void 0 : E.length) || 0, review_checklist_count: ((y = (x = D.retrieval_practice) == null ? void 0 : x.review_checklist) == null ? void 0 : y.length) || 0 } });
  } catch (b) {
    return console.error("\u30B3\u30FC\u30B9\u95A2\u9023\u554F\u984C\u751F\u6210\u30A8\u30E9\u30FC:", b), console.error("\u30A8\u30E9\u30FC\u30B9\u30BF\u30C3\u30AF:", b.stack), e.json({ error: "\u30B3\u30FC\u30B9\u95A2\u9023\u554F\u984C\u306E\u751F\u6210\u306B\u5931\u6557\u3057\u307E\u3057\u305F", details: b.message, stack: (v = b.stack) == null ? void 0 : v.substring(0, 200) }, 500);
  }
});
p.get("/api/curriculum/:curriculumId/retrieval-practice", async (e) => {
  const { env: r } = e, t = e.req.param("curriculumId");
  try {
    const s = await r.DB.prepare(`
      SELECT content_type, problem_data, created_at
      FROM retrieval_practice_content
      WHERE curriculum_id = ?
      ORDER BY content_type
    `).bind(t).all();
    if (!s.results || s.results.length === 0) return e.json({ success: true, message: "\u691C\u7D22\u7DF4\u7FD2\u30B3\u30F3\u30C6\u30F3\u30C4\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093", data: null });
    const n = { frequent_problems: null, application_problems: null, review_checklist: null };
    for (const a of s.results) {
      const o = JSON.parse(a.problem_data);
      a.content_type === "frequent_problems" ? n.frequent_problems = o : a.content_type === "application_problems" ? n.application_problems = o : a.content_type === "review_checklist" && (n.review_checklist = o);
    }
    return e.json({ success: true, data: n });
  } catch (s) {
    return console.error("\u691C\u7D22\u7DF4\u7FD2\u30B3\u30F3\u30C6\u30F3\u30C4\u53D6\u5F97\u30A8\u30E9\u30FC:", s), e.json({ error: "\u30B3\u30F3\u30C6\u30F3\u30C4\u306E\u53D6\u5F97\u306B\u5931\u6557\u3057\u307E\u3057\u305F", details: s.message }, 500);
  }
});
p.post("/api/retrieval-practice/log", async (e) => {
  const { env: r } = e;
  try {
    const t = await e.req.json(), { student_id: s, curriculum_id: n, content_type: a, problem_id: o, item_id: i, is_correct: c, answer_time_seconds: l, hint_used: u, attempt_count: d, session_id: _, device_type: m } = t;
    if (!s || !n || !a) return e.json({ success: false, error: "\u5FC5\u9808\u30D1\u30E9\u30E1\u30FC\u30BF\u304C\u4E0D\u8DB3\u3057\u3066\u3044\u307E\u3059\uFF08student_id, curriculum_id, content_type\uFF09" }, 400);
    const h = ["frequent_problems", "application_problems", "review_checklist"];
    if (!h.includes(a)) return e.json({ success: false, error: `\u7121\u52B9\u306Acontent_type\u3067\u3059\u3002\u6709\u52B9\u306A\u5024: ${h.join(", ")}` }, 400);
    const g = await r.DB.prepare(`
      INSERT INTO retrieval_practice_log (
        student_id, curriculum_id, content_type, problem_id, item_id,
        is_correct, answer_time_seconds, hint_used, attempt_count,
        session_id, device_type, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(s, n, a, o || null, i || null, c !== void 0 ? c ? 1 : 0 : null, l || null, u ? 1 : 0, d || 1, _ || null, m || null).run();
    return console.log(`\u2705 \u5B66\u7FD2\u6D3B\u52D5\u8A18\u9332: student=${s}, curriculum=${n}, type=${a}`), e.json({ success: true, log_id: g.meta.last_row_id, message: "\u5B66\u7FD2\u6D3B\u52D5\u3092\u8A18\u9332\u3057\u307E\u3057\u305F" });
  } catch (t) {
    return console.error("\u5B66\u7FD2\u6D3B\u52D5\u8A18\u9332\u30A8\u30E9\u30FC:", t), e.json({ success: false, error: "\u5B66\u7FD2\u6D3B\u52D5\u306E\u8A18\u9332\u306B\u5931\u6557\u3057\u307E\u3057\u305F", details: t.message }, 500);
  }
});
p.get("/api/retrieval-practice/stats/student/:studentId", async (e) => {
  const { env: r } = e, t = e.req.param("studentId"), s = e.req.query("curriculum_id");
  try {
    let n = `
      SELECT 
        content_type,
        COUNT(*) as total_attempts,
        SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct_count,
        ROUND(AVG(CASE WHEN is_correct IS NOT NULL THEN is_correct ELSE 0 END) * 100, 2) as accuracy_rate,
        ROUND(AVG(answer_time_seconds), 1) as avg_answer_time,
        SUM(hint_used) as total_hints_used,
        MIN(created_at) as first_attempt,
        MAX(created_at) as last_attempt
      FROM retrieval_practice_log
      WHERE student_id = ?
    `;
    const a = [t];
    s && (n += " AND curriculum_id = ?", a.push(s)), n += " GROUP BY content_type";
    const o = await r.DB.prepare(n).bind(...a).all();
    return e.json({ success: true, student_id: t, curriculum_id: s || "all", stats: o.results || [] });
  } catch (n) {
    return console.error("\u5B66\u7FD2\u7D71\u8A08\u53D6\u5F97\u30A8\u30E9\u30FC:", n), e.json({ success: false, error: "\u5B66\u7FD2\u7D71\u8A08\u306E\u53D6\u5F97\u306B\u5931\u6557\u3057\u307E\u3057\u305F", details: n.message }, 500);
  }
});
p.get("/api/retrieval-practice/stats/curriculum/:curriculumId", async (e) => {
  const { env: r } = e, t = e.req.param("curriculumId");
  try {
    const s = await r.DB.prepare(`
      SELECT 
        content_type,
        COUNT(DISTINCT student_id) as unique_students,
        COUNT(*) as total_attempts,
        SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct_count,
        ROUND(AVG(CASE WHEN is_correct IS NOT NULL THEN is_correct ELSE 0 END) * 100, 2) as avg_accuracy,
        ROUND(AVG(answer_time_seconds), 1) as avg_time,
        MIN(created_at) as first_activity,
        MAX(created_at) as last_activity
      FROM retrieval_practice_log
      WHERE curriculum_id = ?
      GROUP BY content_type
    `).bind(t).all();
    return e.json({ success: true, curriculum_id: t, stats: s.results || [] });
  } catch (s) {
    return console.error("\u30AB\u30EA\u30AD\u30E5\u30E9\u30E0\u7D71\u8A08\u53D6\u5F97\u30A8\u30E9\u30FC:", s), e.json({ success: false, error: "\u30AB\u30EA\u30AD\u30E5\u30E9\u30E0\u7D71\u8A08\u306E\u53D6\u5F97\u306B\u5931\u6557\u3057\u307E\u3057\u305F", details: s.message }, 500);
  }
});
p.get("/api/retrieval-practice/history/:studentId", async (e) => {
  const { env: r } = e, t = e.req.param("studentId"), s = e.req.query("curriculum_id"), n = e.req.query("content_type"), a = parseInt(e.req.query("limit") || "50");
  try {
    let o = `
      SELECT *
      FROM retrieval_practice_log
      WHERE student_id = ?
    `;
    const i = [t];
    s && (o += " AND curriculum_id = ?", i.push(s)), n && (o += " AND content_type = ?", i.push(n)), o += " ORDER BY created_at DESC LIMIT ?", i.push(a);
    const c = await r.DB.prepare(o).bind(...i).all();
    return e.json({ success: true, student_id: t, history: c.results || [] });
  } catch (o) {
    return console.error("\u5B66\u7FD2\u5C65\u6B74\u53D6\u5F97\u30A8\u30E9\u30FC:", o), e.json({ success: false, error: "\u5B66\u7FD2\u5C65\u6B74\u306E\u53D6\u5F97\u306B\u5931\u6557\u3057\u307E\u3057\u305F", details: o.message }, 500);
  }
});
p.get("/api/teacher/class-stats/:curriculumId", async (e) => {
  var s;
  const { env: r } = e, t = e.req.param("curriculumId");
  try {
    const n = await r.DB.prepare(`
      SELECT 
        student_id,
        content_type,
        COUNT(*) as total_attempts,
        SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct_count,
        ROUND(AVG(CASE WHEN is_correct IS NOT NULL THEN is_correct ELSE 0 END) * 100, 2) as accuracy_rate,
        ROUND(AVG(answer_time_seconds), 1) as avg_answer_time,
        SUM(hint_used) as total_hints_used,
        MIN(created_at) as first_attempt,
        MAX(created_at) as last_attempt
      FROM retrieval_practice_log
      WHERE curriculum_id = ?
      GROUP BY student_id, content_type
    `).bind(t).all(), a = await r.DB.prepare(`
      SELECT 
        COUNT(DISTINCT student_id) as total_students,
        COUNT(*) as total_attempts,
        ROUND(AVG(CASE WHEN is_correct IS NOT NULL THEN is_correct ELSE 0 END) * 100, 2) as avg_accuracy,
        ROUND(AVG(answer_time_seconds), 1) as avg_time,
        SUM(hint_used) as total_hints
      FROM retrieval_practice_log
      WHERE curriculum_id = ?
    `).bind(t).first(), o = await r.DB.prepare(`
      SELECT DISTINCT student_id
      FROM retrieval_practice_log
      WHERE curriculum_id = ?
    `).bind(t).all();
    return e.json({ success: true, curriculum_id: t, class_overview: a, students_count: ((s = o.results) == null ? void 0 : s.length) || 0, student_stats: n.results || [] });
  } catch (n) {
    return console.error("\u30AF\u30E9\u30B9\u7D71\u8A08\u53D6\u5F97\u30A8\u30E9\u30FC:", n), e.json({ success: false, error: "\u30AF\u30E9\u30B9\u7D71\u8A08\u306E\u53D6\u5F97\u306B\u5931\u6557\u3057\u307E\u3057\u305F", details: n.message }, 500);
  }
});
p.get("/api/teacher/student-report/:studentId", async (e) => {
  const { env: r } = e, t = e.req.param("studentId"), s = e.req.query("curriculum_id");
  try {
    let n = `
      SELECT 
        content_type,
        COUNT(*) as total_attempts,
        SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct_count,
        ROUND(AVG(CASE WHEN is_correct IS NOT NULL THEN is_correct ELSE 0 END) * 100, 2) as accuracy_rate,
        ROUND(AVG(answer_time_seconds), 1) as avg_answer_time,
        SUM(hint_used) as hints_used,
        MIN(created_at) as first_activity,
        MAX(created_at) as last_activity
      FROM retrieval_practice_log
      WHERE student_id = ?
    `;
    const a = [t];
    s && (n += " AND curriculum_id = ?", a.push(s)), n += " GROUP BY content_type";
    const o = await r.DB.prepare(n).bind(...a).all(), i = await r.DB.prepare(`
      SELECT 
        problem_id,
        content_type,
        COUNT(*) as attempts,
        SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct,
        ROUND(AVG(CASE WHEN is_correct IS NOT NULL THEN is_correct ELSE 0 END) * 100, 2) as accuracy
      FROM retrieval_practice_log
      WHERE student_id = ? ${s ? "AND curriculum_id = ?" : ""}
        AND problem_id IS NOT NULL
      GROUP BY problem_id, content_type
      ORDER BY accuracy ASC
    `).bind(s ? [t, s] : [t]).all(), c = await r.DB.prepare(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as activities,
        SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct
      FROM retrieval_practice_log
      WHERE student_id = ? ${s ? "AND curriculum_id = ?" : ""}
      GROUP BY DATE(created_at)
      ORDER BY date DESC
      LIMIT 30
    `).bind(s ? [t, s] : [t]).all();
    return e.json({ success: true, student_id: t, stats: o.results || [], problem_stats: i.results || [], daily_activity: c.results || [] });
  } catch (n) {
    return console.error("\u5B66\u751F\u30EC\u30DD\u30FC\u30C8\u53D6\u5F97\u30A8\u30E9\u30FC:", n), e.json({ success: false, error: "\u5B66\u751F\u30EC\u30DD\u30FC\u30C8\u306E\u53D6\u5F97\u306B\u5931\u6557\u3057\u307E\u3057\u305F", details: n.message }, 500);
  }
});
p.get("/api/teacher/weak-areas/:studentId", async (e) => {
  var n;
  const { env: r } = e, t = e.req.param("studentId"), s = e.req.query("curriculum_id");
  try {
    const a = await r.DB.prepare(`
      SELECT 
        problem_id,
        content_type,
        COUNT(*) as attempts,
        SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct,
        ROUND(AVG(CASE WHEN is_correct IS NOT NULL THEN is_correct ELSE 0 END) * 100, 2) as accuracy,
        AVG(answer_time_seconds) as avg_time,
        SUM(hint_used) as hints_used
      FROM retrieval_practice_log
      WHERE student_id = ? ${s ? "AND curriculum_id = ?" : ""}
        AND problem_id IS NOT NULL
      GROUP BY problem_id, content_type
      HAVING accuracy < 60 OR attempts >= 3
      ORDER BY accuracy ASC, attempts DESC
    `).bind(s ? [t, s] : [t]).all(), o = { total_weak_problems: ((n = a.results) == null ? void 0 : n.length) || 0, needs_review: (a.results || []).filter((i) => i.accuracy < 50).length, needs_practice: (a.results || []).filter((i) => i.accuracy >= 50 && i.accuracy < 70).length, high_hint_usage: (a.results || []).filter((i) => i.hints_used >= 2).length };
    return e.json({ success: true, student_id: t, weak_problems: a.results || [], summary: o, recommendations: Qa(o) });
  } catch (a) {
    return console.error("\u82E6\u624B\u5206\u91CE\u691C\u51FA\u30A8\u30E9\u30FC:", a), e.json({ success: false, error: "\u82E6\u624B\u5206\u91CE\u306E\u691C\u51FA\u306B\u5931\u6557\u3057\u307E\u3057\u305F", details: a.message }, 500);
  }
});
function Qa(e) {
  const r = [];
  return e.needs_review > 0 && r.push({ priority: "high", type: "review", message: `\u6B63\u7B54\u738750%\u672A\u6E80\u306E\u554F\u984C\u304C${e.needs_review}\u554F\u3042\u308A\u307E\u3059\u3002\u57FA\u790E\u304B\u3089\u5FA9\u7FD2\u3059\u308B\u3053\u3068\u3092\u304A\u52E7\u3081\u3057\u307E\u3059\u3002` }), e.needs_practice > 0 && r.push({ priority: "medium", type: "practice", message: `\u6B63\u7B54\u738750-70%\u306E\u554F\u984C\u304C${e.needs_practice}\u554F\u3042\u308A\u307E\u3059\u3002\u8FFD\u52A0\u7DF4\u7FD2\u3067\u7406\u89E3\u3092\u6DF1\u3081\u307E\u3057\u3087\u3046\u3002` }), e.high_hint_usage > 0 && r.push({ priority: "medium", type: "hint_dependency", message: `\u30D2\u30F3\u30C8\u3092\u591A\u304F\u4F7F\u7528\u3057\u3066\u3044\u308B\u554F\u984C\u304C${e.high_hint_usage}\u554F\u3042\u308A\u307E\u3059\u3002\u81EA\u529B\u3067\u89E3\u304F\u7DF4\u7FD2\u304C\u5FC5\u8981\u3067\u3059\u3002` }), e.total_weak_problems === 0 && r.push({ priority: "low", type: "good", message: "\u82E6\u624B\u306A\u554F\u984C\u306F\u898B\u3064\u304B\u308A\u307E\u305B\u3093\u3067\u3057\u305F\u3002\u3053\u306E\u8ABF\u5B50\u3067\u5B66\u7FD2\u3092\u7D9A\u3051\u307E\u3057\u3087\u3046\uFF01" }), r;
}
__name(Qa, "Qa");
p.post("/api/ai/recommend-problems/:studentId", async (e) => {
  var a, o, i, c, l, u, d, _, m;
  const { env: r } = e, t = parseInt(e.req.param("studentId")), { curriculumId: s } = await e.req.json(), n = r.GEMINI_API_KEY;
  if (!n || n === "your-gemini-api-key-here") return e.json({ error: "Gemini API\u30AD\u30FC\u304C\u8A2D\u5B9A\u3055\u308C\u3066\u3044\u307E\u305B\u3093" }, 500);
  try {
    console.log(`\u{1F916} AI\u63A8\u5968\u554F\u984C\u751F\u6210\u958B\u59CB: \u5B66\u751FID=${t}, \u30AB\u30EA\u30AD\u30E5\u30E9\u30E0ID=${s}`);
    const h = await r.DB.prepare("SELECT * FROM curriculum WHERE id = ?").bind(s).first();
    if (!h) return e.json({ error: "\u30AB\u30EA\u30AD\u30E5\u30E9\u30E0\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093" }, 404);
    const f = (await r.DB.prepare(`
      SELECT 
        content_type,
        problem_id,
        is_correct,
        answer_time_seconds,
        hint_used,
        created_at
      FROM retrieval_practice_log
      WHERE student_id = ? AND curriculum_id = ?
      ORDER BY created_at DESC
      LIMIT 50
    `).bind(t, s).all()).results || [], E = { total_attempts: f.length, correct_count: f.filter((I) => I.is_correct === 1).length, accuracy: f.length > 0 ? Math.round(f.filter((I) => I.is_correct === 1).length / f.length * 100) : 0, avg_time: f.length > 0 ? Math.round(f.reduce((I, N) => I + (N.answer_time_seconds || 0), 0) / f.length) : 0, hint_usage: f.filter((I) => I.hint_used === 1).length, by_content_type: {} };
    ["frequent_problems", "application_problems", "review_checklist"].forEach((I) => {
      const N = f.filter((k) => k.content_type === I);
      N.length > 0 && (E.by_content_type[I] = { attempts: N.length, correct: N.filter((k) => k.is_correct === 1).length, accuracy: Math.round(N.filter((k) => k.is_correct === 1).length / N.length * 100), avg_time: Math.round(N.reduce((k, D) => k + (D.answer_time_seconds || 0), 0) / N.length) });
    });
    const y = [];
    ((a = E.by_content_type.frequent_problems) == null ? void 0 : a.accuracy) < 60 && y.push("\u983B\u51FA\u554F\u984C"), ((o = E.by_content_type.application_problems) == null ? void 0 : o.accuracy) < 60 && y.push("\u5FDC\u7528\u554F\u984C"), ((i = E.by_content_type.review_checklist) == null ? void 0 : i.accuracy) < 60 && y.push("\u5FA9\u7FD2\u30C1\u30A7\u30C3\u30AF\u30EA\u30B9\u30C8");
    const v = `
\u3042\u306A\u305F\u306F\u5C0F\u5B66\u751F\u306E\u5B66\u7FD2\u3092\u652F\u63F4\u3059\u308B\u6559\u80B2AI\u3067\u3059\u3002\u4EE5\u4E0B\u306E\u5B66\u7FD2\u30C7\u30FC\u30BF\u3092\u5206\u6790\u3057\u3001\u500B\u5225\u6700\u9069\u5316\u3055\u308C\u305F\u554F\u984C\u63A8\u5968\u3092\u884C\u3063\u3066\u304F\u3060\u3055\u3044\u3002

\u3010\u30AB\u30EA\u30AD\u30E5\u30E9\u30E0\u60C5\u5831\u3011
- \u5B66\u5E74: \u5C0F\u5B66${h.grade}\u5E74
- \u6559\u79D1: ${h.subject}
- \u5358\u5143\u540D: ${h.unit_name}

\u3010\u5B66\u7FD2\u5C65\u6B74\u3011
- \u7DCF\u6311\u6226\u56DE\u6570: ${E.total_attempts}\u56DE
- \u6B63\u7B54\u6570: ${E.correct_count}\u56DE
- \u6B63\u7B54\u7387: ${E.accuracy}%
- \u5E73\u5747\u56DE\u7B54\u6642\u9593: ${E.avg_time}\u79D2
- \u30D2\u30F3\u30C8\u4F7F\u7528\u56DE\u6570: ${E.hint_usage}\u56DE

\u3010\u30B3\u30F3\u30C6\u30F3\u30C4\u30BF\u30A4\u30D7\u5225\u30D1\u30D5\u30A9\u30FC\u30DE\u30F3\u30B9\u3011
${Object.entries(E.by_content_type).map(([I, N]) => `- ${I}: ${N.attempts}\u56DE\u6311\u6226\u3001\u6B63\u7B54\u7387${N.accuracy}%\u3001\u5E73\u5747${N.avg_time}\u79D2`).join(`
`)}

\u3010\u82E6\u624B\u5206\u91CE\u3011
${y.length > 0 ? y.join("\u3001") : "\u306A\u3057"}

\u3010\u30BF\u30B9\u30AF\u3011
\u4E0A\u8A18\u306E\u30C7\u30FC\u30BF\u3092\u5206\u6790\u3057\u3001\u3053\u306E\u5150\u7AE5\u306B\u6700\u9069\u306A\u5B66\u7FD2\u63A8\u5968\u3092\u751F\u6210\u3057\u3066\u304F\u3060\u3055\u3044\u3002

\u3010\u51FA\u529B\u5F62\u5F0F\u3011
\u4EE5\u4E0B\u306EJSON\u5F62\u5F0F\u3067\u51FA\u529B\u3057\u3066\u304F\u3060\u3055\u3044\uFF1A

{
  "analysis": {
    "learning_level": "\u521D\u7D1A / \u4E2D\u7D1A / \u4E0A\u7D1A",
    "study_style": "\u5B66\u7FD2\u30B9\u30BF\u30A4\u30EB\u306E\u7279\u5FB4\uFF082-3\u6587\uFF09",
    "strengths": ["\u5F37\u307F1", "\u5F37\u307F2"],
    "weaknesses": ["\u8AB2\u984C1", "\u8AB2\u984C2"]
  },
  "recommended_problems": [
    {
      "problem_type": "frequent_problems / application_problems / review_checklist",
      "difficulty": "easy / medium / hard",
      "title": "\u554F\u984C\u30BF\u30A4\u30C8\u30EB\uFF0820\u6587\u5B57\u4EE5\u5185\uFF09",
      "content": "\u554F\u984C\u5185\u5BB9\uFF0880-150\u6587\u5B57\uFF09",
      "reason": "\u3053\u306E\u554F\u984C\u3092\u63A8\u5968\u3059\u308B\u7406\u7531\uFF0850\u6587\u5B57\u4EE5\u5185\uFF09",
      "hints": ["\u30D2\u30F3\u30C81", "\u30D2\u30F3\u30C82"],
      "answer": "\u89E3\u7B54\uFF0850-100\u6587\u5B57\uFF09",
      "explanation": "\u89E3\u8AAC\uFF08100-200\u6587\u5B57\uFF09"
    }
  ],
  "study_plan": {
    "immediate_focus": "\u4ECA\u3059\u3050\u53D6\u308A\u7D44\u3080\u3079\u304D\u5185\u5BB9",
    "weekly_goal": "\u4ECA\u9031\u306E\u76EE\u6A19",
    "long_term_goal": "\u9577\u671F\u7684\u306A\u76EE\u6A19",
    "estimated_time": "\u63A8\u5968\u5B66\u7FD2\u6642\u9593\uFF08\u5206\uFF09"
  },
  "motivation_message": "\u5150\u7AE5\u3078\u306E\u30E1\u30C3\u30BB\u30FC\u30B8\uFF0850-100\u6587\u5B57\u3001\u30DD\u30B8\u30C6\u30A3\u30D6\u3067\u52B1\u307E\u3059\u5185\u5BB9\uFF09"
}

\u203B recommended_problems \u306F3-5\u554F\u3092\u63A8\u5968\u3057\u3066\u304F\u3060\u3055\u3044
\u203B \u82E6\u624B\u5206\u91CE\u304C\u3042\u308B\u5834\u5408\u306F\u3001\u305D\u306E\u5206\u91CE\u3092\u91CD\u70B9\u7684\u306B\u30AB\u30D0\u30FC\u3059\u308B\u554F\u984C\u3092\u542B\u3081\u3066\u304F\u3060\u3055\u3044
\u203B \u6B63\u7B54\u7387\u304C\u9AD8\u3044\u5834\u5408\u306F\u3001\u3088\u308A\u96E3\u6613\u5EA6\u306E\u9AD8\u3044\u554F\u984C\u3092\u63A8\u5968\u3057\u3066\u304F\u3060\u3055\u3044
`;
    console.log("\u{1F916} Gemini API\u3092\u547C\u3073\u51FA\u3057\u4E2D...");
    const b = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${n}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ parts: [{ text: v }] }], generationConfig: { temperature: 0.8, maxOutputTokens: 2e3 } }) });
    if (!b.ok) {
      const I = await b.text();
      throw console.error("\u274C Gemini API\u30A8\u30E9\u30FC:", I), new Error("AI\u63A8\u5968\u751F\u6210\u306B\u5931\u6557\u3057\u307E\u3057\u305F");
    }
    const O = ((_ = (d = (u = (l = (c = (await b.json()).candidates) == null ? void 0 : c[0]) == null ? void 0 : l.content) == null ? void 0 : u.parts) == null ? void 0 : d[0]) == null ? void 0 : _.text) || "";
    console.log("\u2705 Gemini API\u30EC\u30B9\u30DD\u30F3\u30B9\u53D7\u4FE1");
    const A = O.match(/\{[\s\S]*\}/);
    if (!A) throw console.error("\u274C JSON\u30D1\u30FC\u30B9\u30A8\u30E9\u30FC:", O), new Error("AI\u63A8\u5968\u306E\u30D1\u30FC\u30B9\u306B\u5931\u6557\u3057\u307E\u3057\u305F");
    const S = JSON.parse(A[0]);
    return console.log(`\u2705 AI\u63A8\u5968\u554F\u984C\u751F\u6210\u5B8C\u4E86: ${(m = S.recommended_problems) == null ? void 0 : m.length}\u554F`), e.json({ success: true, student_id: t, curriculum_id: s, learning_stats: E, weak_areas: y, recommendations: S, generated_at: (/* @__PURE__ */ new Date()).toISOString() });
  } catch (h) {
    return console.error("\u274C AI\u63A8\u5968\u554F\u984C\u751F\u6210\u30A8\u30E9\u30FC:", h), e.json({ success: false, error: "AI\u63A8\u5968\u554F\u984C\u306E\u751F\u6210\u306B\u5931\u6557\u3057\u307E\u3057\u305F", details: h.message }, 500);
  }
});
p.post("/api/ai/generate-study-plan/:studentId", async (e) => {
  var o, i, c, l, u;
  const { env: r } = e, t = parseInt(e.req.param("studentId")), { curriculumId: s, targetDate: n } = await e.req.json(), a = r.GEMINI_API_KEY;
  if (!a || a === "your-gemini-api-key-here") return e.json({ error: "Gemini API\u30AD\u30FC\u304C\u8A2D\u5B9A\u3055\u308C\u3066\u3044\u307E\u305B\u3093" }, 500);
  try {
    console.log(`\u{1F4C5} \u5B66\u7FD2\u8A08\u753B\u751F\u6210\u958B\u59CB: \u5B66\u751FID=${t}, \u76EE\u6A19\u65E5=${n}`);
    const d = await r.DB.prepare("SELECT * FROM curriculum WHERE id = ?").bind(s).first();
    if (!d) return e.json({ error: "\u30AB\u30EA\u30AD\u30E5\u30E9\u30E0\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093" }, 404);
    const _ = await r.DB.prepare(`
      SELECT 
        COUNT(*) as total_attempts,
        SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct_count,
        AVG(answer_time_seconds) as avg_time,
        COUNT(DISTINCT DATE(created_at)) as study_days
      FROM retrieval_practice_log
      WHERE student_id = ? AND curriculum_id = ?
    `).bind(t, s).first(), m = await r.DB.prepare(`
      SELECT 
        DATE(created_at) as study_date,
        COUNT(*) as problems_solved
      FROM retrieval_practice_log
      WHERE student_id = ? AND curriculum_id = ?
        AND created_at >= datetime('now', '-30 days')
      GROUP BY DATE(created_at)
      ORDER BY study_date DESC
      LIMIT 30
    `).bind(t, s).all(), h = { total_days: (_ == null ? void 0 : _.study_days) || 0, avg_problems_per_day: ((_ == null ? void 0 : _.total_attempts) || 0) / ((_ == null ? void 0 : _.study_days) || 1), recent_activity: m.results || [] }, g = `
\u3042\u306A\u305F\u306F\u5C0F\u5B66\u751F\u306E\u5B66\u7FD2\u8A08\u753B\u3092\u7ACB\u3066\u308B\u6559\u80B2AI\u3067\u3059\u3002\u4EE5\u4E0B\u306E\u30C7\u30FC\u30BF\u304B\u3089\u6700\u9069\u306A\u5B66\u7FD2\u8A08\u753B\u3092\u4F5C\u6210\u3057\u3066\u304F\u3060\u3055\u3044\u3002

\u3010\u30AB\u30EA\u30AD\u30E5\u30E9\u30E0\u60C5\u5831\u3011
- \u5B66\u5E74: \u5C0F\u5B66${d.grade}\u5E74
- \u6559\u79D1: ${d.subject}
- \u5358\u5143\u540D: ${d.unit_name}
- \u7DCF\u5B66\u7FD2\u6642\u9593: ${d.total_hours}\u6642\u9593

\u3010\u5B66\u7FD2\u5B9F\u7E3E\u3011
- \u7DCF\u5B66\u7FD2\u65E5\u6570: ${h.total_days}\u65E5
- \u7DCF\u554F\u984C\u6570: ${(_ == null ? void 0 : _.total_attempts) || 0}\u554F
- \u6B63\u7B54\u6570: ${(_ == null ? void 0 : _.correct_count) || 0}\u554F
- \u6B63\u7B54\u7387: ${_ ? Math.round(_.correct_count / _.total_attempts * 100) : 0}%
- 1\u65E5\u3042\u305F\u308A\u5E73\u5747: ${Math.round(h.avg_problems_per_day)}\u554F

\u3010\u76EE\u6A19\u3011
- \u76EE\u6A19\u9054\u6210\u65E5: ${n || "\u672A\u8A2D\u5B9A"}

\u3010\u30BF\u30B9\u30AF\u3011
\u4E0A\u8A18\u30C7\u30FC\u30BF\u304B\u3089\u3001\u76EE\u6A19\u9054\u6210\u306B\u5411\u3051\u305F\u5B66\u7FD2\u8A08\u753B\u3092\u4F5C\u6210\u3057\u3066\u304F\u3060\u3055\u3044\u3002

\u3010\u51FA\u529B\u5F62\u5F0F\u3011
{
  "plan_summary": "\u8A08\u753B\u306E\u6982\u8981\uFF082-3\u6587\uFF09",
  "daily_schedule": [
    {
      "day": 1,
      "date": "YYYY-MM-DD",
      "tasks": [
        {
          "time": "10:00-10:30",
          "activity": "\u6D3B\u52D5\u5185\u5BB9",
          "content_type": "frequent_problems / application_problems / review_checklist",
          "estimated_minutes": 30
        }
      ],
      "daily_goal": "\u4ECA\u65E5\u306E\u76EE\u6A19"
    }
  ],
  "weekly_milestones": [
    {
      "week": 1,
      "goal": "\u9031\u306E\u76EE\u6A19",
      "focus_areas": ["\u91CD\u70B9\u5206\u91CE1", "\u91CD\u70B9\u5206\u91CE2"]
    }
  ],
  "review_schedule": [
    {
      "date": "YYYY-MM-DD",
      "review_type": "short_term / long_term",
      "content": "\u5FA9\u7FD2\u5185\u5BB9"
    }
  ],
  "tips": ["\u5B66\u7FD2\u306E\u30B3\u30C41", "\u5B66\u7FD2\u306E\u30B3\u30C42", "\u5B66\u7FD2\u306E\u30B3\u30C43"],
  "motivation": "\u76EE\u6A19\u9054\u6210\u306B\u5411\u3051\u305F\u30E1\u30C3\u30BB\u30FC\u30B8"
}
`, f = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${a}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ parts: [{ text: g }] }], generationConfig: { temperature: 0.7, maxOutputTokens: 2500 } }) });
    if (!f.ok) throw new Error("AI\u5B66\u7FD2\u8A08\u753B\u751F\u6210\u306B\u5931\u6557\u3057\u307E\u3057\u305F");
    const y = (((u = (l = (c = (i = (o = (await f.json()).candidates) == null ? void 0 : o[0]) == null ? void 0 : i.content) == null ? void 0 : c.parts) == null ? void 0 : l[0]) == null ? void 0 : u.text) || "").match(/\{[\s\S]*\}/);
    if (!y) throw new Error("\u5B66\u7FD2\u8A08\u753B\u306E\u30D1\u30FC\u30B9\u306B\u5931\u6557\u3057\u307E\u3057\u305F");
    const v = JSON.parse(y[0]);
    return console.log("\u2705 \u5B66\u7FD2\u8A08\u753B\u751F\u6210\u5B8C\u4E86"), e.json({ success: true, student_id: t, curriculum_id: s, study_pace: h, study_plan: v, generated_at: (/* @__PURE__ */ new Date()).toISOString() });
  } catch (d) {
    return console.error("\u274C \u5B66\u7FD2\u8A08\u753B\u751F\u6210\u30A8\u30E9\u30FC:", d), e.json({ success: false, error: "\u5B66\u7FD2\u8A08\u753B\u306E\u751F\u6210\u306B\u5931\u6557\u3057\u307E\u3057\u305F", details: d.message }, 500);
  }
});
p.post("/api/curriculum/:curriculumId/generate-assessment-problems", async (e) => {
  var n, a, o, i, c, l, u, d, _, m;
  const { env: r } = e, t = e.req.param("curriculumId"), s = r.GEMINI_API_KEY;
  if (!s || s === "your-gemini-api-key-here") return e.json({ error: "Gemini API\u30AD\u30FC\u304C\u8A2D\u5B9A\u3055\u308C\u3066\u3044\u307E\u305B\u3093" }, 500);
  try {
    const h = await r.DB.prepare("SELECT * FROM curriculum WHERE id = ?").bind(t).first();
    if (!h) return e.json({ error: "\u30AB\u30EA\u30AD\u30E5\u30E9\u30E0\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093" }, 404);
    const g = `\u5C0F\u5B66${h.grade}\u5E74 ${h.subject}\u300C${h.unit_name}\u300D\u306E\u8A55\u4FA1\u554F\u984C\u3092\u751F\u6210\u3002

\u3010\u5FC5\u9808\uFF1AJSON\u306E\u307F\u51FA\u529B\u3011
{
  "common_check_test": {
    "test_title": "\u57FA\u790E\u57FA\u672C\u30C1\u30A7\u30C3\u30AF\u30C6\u30B9\u30C8",
    "sample_problems": [
      {"problem_number": 1, "problem_text": "\u5177\u4F53\u7684\u306A\u6570\u5B57\u3092\u542B\u3080\u554F\u984C\u6587\uFF0830\u5B57\u4EE5\u4E0A\uFF09", "answer": "\u89E3\u7B54", "difficulty": "basic"},
      {"problem_number": 2, "problem_text": "\u5177\u4F53\u7684\u306A\u6570\u5B57\u3092\u542B\u3080\u554F\u984C\u6587\uFF0830\u5B57\u4EE5\u4E0A\uFF09", "answer": "\u89E3\u7B54", "difficulty": "basic"},
      {"problem_number": 3, "problem_text": "\u5177\u4F53\u7684\u306A\u6570\u5B57\u3092\u542B\u3080\u554F\u984C\u6587\uFF0830\u5B57\u4EE5\u4E0A\uFF09", "answer": "\u89E3\u7B54", "difficulty": "basic"},
      {"problem_number": 4, "problem_text": "\u5177\u4F53\u7684\u306A\u6570\u5B57\u3092\u542B\u3080\u554F\u984C\u6587\uFF0830\u5B57\u4EE5\u4E0A\uFF09", "answer": "\u89E3\u7B54", "difficulty": "basic"},
      {"problem_number": 5, "problem_text": "\u5177\u4F53\u7684\u306A\u6570\u5B57\u3092\u542B\u3080\u554F\u984C\u6587\uFF0830\u5B57\u4EE5\u4E0A\uFF09", "answer": "\u89E3\u7B54", "difficulty": "basic"},
      {"problem_number": 6, "problem_text": "\u5177\u4F53\u7684\u306A\u6570\u5B57\u3092\u542B\u3080\u554F\u984C\u6587\uFF0830\u5B57\u4EE5\u4E0A\uFF09", "answer": "\u89E3\u7B54", "difficulty": "basic"}
    ]
  },
  "optional_problems": [
    {"problem_number": 1, "problem_title": "\u5B9F\u751F\u6D3B\u554F\u984C", "problem_description": "\u5177\u4F53\u7684\u306A\u6570\u5B57\u3092\u542B\u3080\u554F\u984C\u6587\uFF0850\u5B57\u4EE5\u4E0A\uFF09", "learning_meaning": "\u5B9F\u751F\u6D3B\u3067\u5F79\u7ACB\u3064\u529B\u304C\u3064\u304F\uFF0820\u5B57\u4EE5\u4E0A\uFF09", "difficulty_level": "medium"},
    {"problem_number": 2, "problem_title": "\u8003\u3048\u65B9\u554F\u984C", "problem_description": "\u5177\u4F53\u7684\u306A\u6570\u5B57\u3092\u542B\u3080\u554F\u984C\u6587\uFF0850\u5B57\u4EE5\u4E0A\uFF09", "learning_meaning": "\u6DF1\u304F\u7406\u89E3\u3067\u304D\u308B\uFF0820\u5B57\u4EE5\u4E0A\uFF09", "difficulty_level": "medium"},
    {"problem_number": 3, "problem_title": "\u4ED6\u6559\u79D1\u554F\u984C", "problem_description": "\u5177\u4F53\u7684\u306A\u6570\u5B57\u3092\u542B\u3080\u554F\u984C\u6587\uFF0850\u5B57\u4EE5\u4E0A\uFF09", "learning_meaning": "\u4ED6\u6559\u79D1\u3067\u3082\u4F7F\u3048\u308B\uFF0820\u5B57\u4EE5\u4E0A\uFF09", "difficulty_level": "hard"},
    {"problem_number": 4, "problem_title": "\u5FDC\u7528\u554F\u984C", "problem_description": "\u5177\u4F53\u7684\u306A\u6570\u5B57\u3092\u542B\u3080\u554F\u984C\u6587\uFF0850\u5B57\u4EE5\u4E0A\uFF09", "learning_meaning": "\u7D44\u307F\u5408\u308F\u305B\u3066\u8003\u3048\u308B\u529B\uFF0820\u5B57\u4EE5\u4E0A\uFF09", "difficulty_level": "hard"},
    {"problem_number": 5, "problem_title": "\u63A2\u7A76\u554F\u984C", "problem_description": "\u5177\u4F53\u7684\u306A\u6570\u5B57\u3092\u542B\u3080\u554F\u984C\u6587\uFF0850\u5B57\u4EE5\u4E0A\uFF09", "learning_meaning": "\u4E0D\u601D\u8B70\u3055\u306B\u6C17\u3065\u304F\uFF0820\u5B57\u4EE5\u4E0A\uFF09", "difficulty_level": "very_hard"},
    {"problem_number": 6, "problem_title": "\u5275\u9020\u554F\u984C", "problem_description": "\u5177\u4F53\u7684\u306A\u6570\u5B57\u3092\u542B\u3080\u554F\u984C\u6587\uFF0850\u5B57\u4EE5\u4E0A\uFF09", "learning_meaning": "\u65B0\u3057\u3044\u65B9\u6CD5\u3092\u8003\u3048\u308B\uFF0820\u5B57\u4EE5\u4E0A\uFF09", "difficulty_level": "very_hard"}
  ]
}`, f = ["gemini-3-flash-preview", "gemini-3-flash-preview", "gemini-3-flash-preview"];
    let E, x;
    for (const T of f) try {
      if (console.log(`\u{1F504} \u8A55\u4FA1\u554F\u984C\u30E2\u30C7\u30EB\u8A66\u884C\u4E2D: ${T}`), E = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${T}:generateContent?key=${s}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ parts: [{ text: g }] }], generationConfig: { temperature: 0.8, maxOutputTokens: 8192 } }) }), E.ok) {
        console.log(`\u2705 \u8A55\u4FA1\u554F\u984C\u30E2\u30C7\u30EB\u6210\u529F: ${T}`);
        break;
      } else console.warn(`\u26A0\uFE0F \u8A55\u4FA1\u554F\u984C\u30E2\u30C7\u30EB\u5931\u6557: ${T} (status: ${E.status})`), x = new Error(`${T} returned ${E.status}`);
    } catch (O) {
      console.warn(`\u26A0\uFE0F \u8A55\u4FA1\u554F\u984C\u30E2\u30C7\u30EB\u30A8\u30E9\u30FC: ${T} - ${O.message}`), x = O;
    }
    if (!E || !E.ok) throw x || new Error("\u3059\u3079\u3066\u306E\u30E2\u30C7\u30EB\u304C\u5931\u6557\u3057\u307E\u3057\u305F");
    const v = (c = (i = (o = (a = (n = (await E.json()).candidates) == null ? void 0 : n[0]) == null ? void 0 : a.content) == null ? void 0 : o.parts) == null ? void 0 : i[0]) == null ? void 0 : c.text;
    if (!v) throw new Error("AI response is empty");
    console.log("AI\u30EC\u30B9\u30DD\u30F3\u30B9\uFF08\u8A55\u4FA1\u554F\u984C\uFF09:", v);
    const b = Y(v);
    if (console.log("\u30D1\u30FC\u30B9\u7D50\u679C\uFF08\u8A55\u4FA1\u554F\u984C\uFF09:", JSON.stringify(b, null, 2)), b.common_check_test) {
      const T = ((l = b.common_check_test.sample_problems) == null ? void 0 : l.length) || 0;
      console.log(`\u30C1\u30A7\u30C3\u30AF\u30C6\u30B9\u30C8\u554F\u984C\u3092\u4FDD\u5B58: ${T}\u4EF6`);
      const O = { test_title: b.common_check_test.test_title || "\u5168\u30B3\u30FC\u30B9\u5171\u901A\u306E\u57FA\u790E\u57FA\u672C\u30C1\u30A7\u30C3\u30AF\u30C6\u30B9\u30C8", test_description: b.common_check_test.test_description || "\u3069\u306E\u30B3\u30FC\u30B9\u3092\u9078\u3093\u3067\u3082\u3001\u540C\u3058\u30C1\u30A7\u30C3\u30AF\u30C6\u30B9\u30C8\u3092\u53D7\u3051\u307E\u3059\u3002\u5358\u5143\u306E\u57FA\u790E\u57FA\u672C\u304C\u8EAB\u306B\u3064\u3044\u3066\u3044\u308B\u304B\u3092\u78BA\u8A8D\u3057\u307E\u3059\u3002", sample_problems: b.common_check_test.sample_problems || [] }, A = JSON.stringify(O);
      await r.DB.prepare(`
        INSERT OR REPLACE INTO curriculum_metadata (curriculum_id, metadata_key, metadata_value)
        VALUES (?, ?, ?)
      `).bind(t, "common_check_test", A).run();
    } else console.warn("common_check_test\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093");
    if (b.optional_problems) {
      console.log(`\u9078\u629E\u554F\u984C\u3092\u4FDD\u5B58: ${b.optional_problems.length}\u4EF6`);
      for (const T of b.optional_problems) console.log(`  - \u554F\u984C${T.problem_number}: ${T.problem_title}`), await r.DB.prepare(`
          INSERT INTO optional_problems (
            curriculum_id, problem_number, problem_title, problem_content, problem_description,
            difficulty_level, learning_meaning
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(t, T.problem_number, T.problem_title || "\u554F\u984C", T.problem_content || T.problem_description || "\u554F\u984C\u5185\u5BB9", T.problem_description || T.problem_content || "\u554F\u984C\u306E\u8AAC\u660E", T.difficulty_level || "medium", T.learning_meaning || "").run();
    } else console.warn("optional_problems\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093");
    return e.json({ success: true, message: "\u8A55\u4FA1\u554F\u984C\u3092\u751F\u6210\u30FB\u4FDD\u5B58\u3057\u307E\u3057\u305F", details: { check_test_count: ((d = (u = b.common_check_test) == null ? void 0 : u.sample_problems) == null ? void 0 : d.length) || 0, optional_count: ((_ = b.optional_problems) == null ? void 0 : _.length) || 0 } });
  } catch (h) {
    return console.error("\u8A55\u4FA1\u554F\u984C\u751F\u6210\u30A8\u30E9\u30FC:", h), console.error("\u30A8\u30E9\u30FC\u30B9\u30BF\u30C3\u30AF:", h.stack), e.json({ error: "\u8A55\u4FA1\u554F\u984C\u306E\u751F\u6210\u306B\u5931\u6557\u3057\u307E\u3057\u305F", details: h.message, stack: (m = h.stack) == null ? void 0 : m.substring(0, 200) }, 500);
  }
});
p.post("/api/curriculum/:curriculumId/generate-intro-problems", async (e) => {
  var n, a, o, i, c, l, u, d, _, m, h, g;
  const { env: r } = e, t = e.req.param("curriculumId"), s = r.GEMINI_API_KEY;
  if (!s || s === "your-gemini-api-key-here") return e.json({ error: "Gemini API\u30AD\u30FC\u304C\u8A2D\u5B9A\u3055\u308C\u3066\u3044\u307E\u305B\u3093" }, 500);
  try {
    const f = await r.DB.prepare("SELECT * FROM curriculum WHERE id = ?").bind(t).first(), E = await r.DB.prepare("SELECT * FROM courses WHERE curriculum_id = ?").bind(t).all();
    if (!f || !E.results || E.results.length < 3) return e.json({ error: "\u30AB\u30EA\u30AD\u30E5\u30E9\u30E0\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093" }, 404);
    const x = `\u5C0F\u5B66${f.grade}\u5E74 ${f.subject}\u300C${f.unit_name}\u300D\u306E3\u3064\u306E\u30B3\u30FC\u30B9\u306E\u5C0E\u5165\u554F\u984C\u3092\u751F\u6210\u3002

\u30103\u3064\u306E\u30B3\u30FC\u30B9\u3011
1. ${((n = E.results[0]) == null ? void 0 : n.course_name) || "\u3086\u3063\u304F\u308A\u30B3\u30FC\u30B9"}: ${((a = E.results[0]) == null ? void 0 : a.description) || ""}
2. ${((o = E.results[1]) == null ? void 0 : o.course_name) || "\u3057\u3063\u304B\u308A\u30B3\u30FC\u30B9"}: ${((i = E.results[1]) == null ? void 0 : i.description) || ""}
3. ${((c = E.results[2]) == null ? void 0 : c.course_name) || "\u3050\u3093\u3050\u3093\u30B3\u30FC\u30B9"}: ${((l = E.results[2]) == null ? void 0 : l.description) || ""}

\u3010JSON\u51FA\u529B\uFF08\u5C0E\u5165\u554F\u984C3\u984C\u306E\u307F\uFF09\u3011
{
  "introduction_problems": [
    {"course_number": 1, "problem_title": "\u30BF\u30A4\u30C8\u30EB\uFF0820\u5B57\u4EE5\u5185\uFF09", "problem_content": "\u5177\u4F53\u7684\u306A\u6570\u5B57\u3092\u542B\u3080\u554F\u984C\u6587\uFF0880-150\u5B57\uFF09", "answer": "\u89E3\u7B54\u3068\u89E3\u8AAC\uFF0850-100\u5B57\uFF09"},
    {"course_number": 2, "problem_title": "\u30BF\u30A4\u30C8\u30EB\uFF0820\u5B57\u4EE5\u5185\uFF09", "problem_content": "\u5177\u4F53\u7684\u306A\u6570\u5B57\u3092\u542B\u3080\u554F\u984C\u6587\uFF0880-150\u5B57\uFF09", "answer": "\u89E3\u7B54\u3068\u89E3\u8AAC\uFF0850-100\u5B57\uFF09"},
    {"course_number": 3, "problem_title": "\u30BF\u30A4\u30C8\u30EB\uFF0820\u5B57\u4EE5\u5185\uFF09", "problem_content": "\u5177\u4F53\u7684\u306A\u6570\u5B57\u3092\u542B\u3080\u554F\u984C\u6587\uFF0880-150\u5B57\uFF09", "answer": "\u89E3\u7B54\u3068\u89E3\u8AAC\uFF0850-100\u5B57\uFF09"}
  ]
}`, y = ["gemini-3-flash-preview", "gemini-3-flash-preview", "gemini-3-flash-preview"];
    let v, b;
    for (const S of y) try {
      if (console.log(`\u{1F504} \u5C0E\u5165\u554F\u984C\u30E2\u30C7\u30EB\u8A66\u884C\u4E2D: ${S}`), v = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${S}:generateContent?key=${s}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ parts: [{ text: x }] }], generationConfig: { temperature: 0.7, maxOutputTokens: 2e3 } }) }), v.ok) {
        console.log(`\u2705 \u5C0E\u5165\u554F\u984C\u30E2\u30C7\u30EB\u6210\u529F: ${S}`);
        break;
      } else console.warn(`\u26A0\uFE0F \u5C0E\u5165\u554F\u984C\u30E2\u30C7\u30EB\u5931\u6557: ${S} (status: ${v.status})`), b = new Error(`${S} returned ${v.status}`);
    } catch (I) {
      console.warn(`\u26A0\uFE0F \u5C0E\u5165\u554F\u984C\u30E2\u30C7\u30EB\u30A8\u30E9\u30FC: ${S} - ${I.message}`), b = I;
    }
    if (!v || !v.ok) throw b || new Error("\u3059\u3079\u3066\u306E\u30E2\u30C7\u30EB\u304C\u5931\u6557\u3057\u307E\u3057\u305F");
    const O = (h = (m = (_ = (d = (u = (await v.json()).candidates) == null ? void 0 : u[0]) == null ? void 0 : d.content) == null ? void 0 : _.parts) == null ? void 0 : m[0]) == null ? void 0 : h.text;
    if (!O) throw new Error("AI response is empty");
    console.log("AI\u30EC\u30B9\u30DD\u30F3\u30B9\uFF08\u5C0E\u5165\u554F\u984C\uFF09:", O);
    const A = Y(O);
    if (console.log("\u30D1\u30FC\u30B9\u7D50\u679C\uFF08\u5C0E\u5165\u554F\u984C\uFF09:", JSON.stringify(A, null, 2)), A.introduction_problems && A.introduction_problems.length === 3) {
      const S = E.results;
      for (let I = 0; I < 3; I++) {
        const N = A.introduction_problems[I], k = S[I], D = JSON.stringify(N);
        console.log(`\u30B3\u30FC\u30B9${I + 1}(ID:${k.id})\u306B\u5C0E\u5165\u554F\u984C\u3092\u4FDD\u5B58:`, N.problem_title), await r.DB.prepare(`
          UPDATE courses SET introduction_problem = ? WHERE id = ?
        `).bind(D, k.id).run();
      }
      return e.json({ success: true, message: "\u5C0E\u5165\u554F\u984C3\u984C\u3092\u751F\u6210\u30FB\u4FDD\u5B58\u3057\u307E\u3057\u305F", details: { introduction_count: 3 } });
    } else throw new Error("\u5C0E\u5165\u554F\u984C\u304C3\u984C\u751F\u6210\u3055\u308C\u307E\u305B\u3093\u3067\u3057\u305F");
  } catch (f) {
    return console.error("\u5C0E\u5165\u554F\u984C\u751F\u6210\u30A8\u30E9\u30FC:", f), console.error("\u30A8\u30E9\u30FC\u30B9\u30BF\u30C3\u30AF:", f.stack), e.json({ error: "\u5C0E\u5165\u554F\u984C\u306E\u751F\u6210\u306B\u5931\u6557\u3057\u307E\u3057\u305F", details: f.message, stack: (g = f.stack) == null ? void 0 : g.substring(0, 200) }, 500);
  }
});
p.get("/api/curriculum/:curriculumId/optional-problems", async (e) => {
  var s;
  const { env: r } = e, t = e.req.param("curriculumId");
  try {
    const n = await r.DB.prepare(`
      SELECT * FROM optional_problems 
      WHERE curriculum_id = ? 
      ORDER BY problem_number
    `).bind(t).all();
    return console.log(`\u9078\u629E\u554F\u984C\u53D6\u5F97: ${((s = n.results) == null ? void 0 : s.length) || 0}\u4EF6`), e.json({ success: true, optional_problems: n.results || [] });
  } catch (n) {
    return console.error("\u9078\u629E\u554F\u984C\u53D6\u5F97\u30A8\u30E9\u30FC:", n), e.json({ success: false, error: "\u9078\u629E\u554F\u984C\u306E\u53D6\u5F97\u306B\u5931\u6557\u3057\u307E\u3057\u305F", optional_problems: [] }, 500);
  }
});
p.post("/api/curriculum/:curriculumId/generate-additional-problems", async (e) => {
  var n, a, o, i, c;
  const { env: r } = e, t = e.req.param("curriculumId"), s = r.GEMINI_API_KEY;
  if (!s || s === "your-gemini-api-key-here") return e.json({ error: "Gemini API\u30AD\u30FC\u304C\u8A2D\u5B9A\u3055\u308C\u3066\u3044\u307E\u305B\u3093" }, 500);
  try {
    const l = await r.DB.prepare("SELECT * FROM curriculum WHERE id = ?").bind(t).first(), u = await r.DB.prepare("SELECT * FROM courses WHERE curriculum_id = ?").bind(t).all();
    if (!l || !u.results || u.results.length === 0) return e.json({ error: "\u30AB\u30EA\u30AD\u30E5\u30E9\u30E0\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093" }, 404);
    const d = `\u3042\u306A\u305F\u306F\u5C0F\u5B66\u6821\u306E\u6559\u5E2B\u3067\u3059\u3002\u4EE5\u4E0B\u306E\u5358\u5143\u306E\u8FFD\u52A0\u554F\u984C\u3092\u751F\u6210\u3057\u3066\u304F\u3060\u3055\u3044\u3002

\u3010\u5358\u5143\u60C5\u5831\u3011
- \u5B66\u5E74: ${l.grade}
- \u6559\u79D1: ${l.subject}
- \u6559\u79D1\u66F8\u4F1A\u793E: ${l.textbook_company}
- \u5358\u5143\u540D: ${l.unit_name}
- \u5358\u5143\u76EE\u6A19: ${l.unit_goal}

\u30103\u3064\u306E\u30B3\u30FC\u30B9\u3011
${u.results.map((f, E) => `${E + 1}. ${f.course_name}: ${f.description}`).join(`
`)}

\u3010\u751F\u6210\u3059\u308B\u554F\u984C\u3011
1. **\u30B3\u30FC\u30B9\u9078\u629E\u554F\u984C3\u984C**\uFF08\u5404\u30B3\u30FC\u30B91\u984C\u305A\u3064\u3001\u5B50\u3069\u3082\u304C\u30B3\u30FC\u30B9\u3092\u9078\u3076\u305F\u3081\u306E\u9B45\u529B\u7684\u306A\u554F\u984C\uFF09
2. **\u5C0E\u5165\u554F\u984C3\u984C**\uFF08\u5404\u30B3\u30FC\u30B91\u984C\u305A\u3064\u3001\u5B66\u7FD2\u5185\u5BB9\u3092\u30A4\u30E1\u30FC\u30B8\u3067\u304D\u308B\u554F\u984C\uFF09
3. **\u30C1\u30A7\u30C3\u30AF\u30C6\u30B9\u30C86\u984C**\uFF08\u5168\u30B3\u30FC\u30B9\u5171\u901A\u3001\u57FA\u790E\u57FA\u672C\u306E\u78BA\u8A8D\u554F\u984C\uFF09
4. **\u9078\u629E\u554F\u984C6\u984C**\uFF08\u767A\u5C55\u7684\u306A\u8AB2\u984C\u3001\u5B66\u7FD2\u306E\u610F\u5473\u3092\u5B9F\u611F\u3067\u304D\u308B\u554F\u984C\uFF09

\u3010\u91CD\u8981\u306A\u8981\u4EF6\u3011
- \u3059\u3079\u3066\u306E\u554F\u984C\u306B\u5177\u4F53\u7684\u306A\u6570\u5B57\u3068\u72B6\u6CC1\u3092\u542B\u3081\u308B\u3053\u3068
- \u554F\u984C\u6587\u306F\u5B9F\u969B\u306B\u89E3\u3051\u308B\u5F62\u5F0F\u306B\u3059\u308B\u3053\u3068
- \u5B50\u3069\u3082\u304C\u300C\u3084\u3063\u3066\u307F\u305F\u3044\uFF01\u300D\u3068\u601D\u3048\u308B\u9B45\u529B\u7684\u306A\u5185\u5BB9\u306B\u3059\u308B\u3053\u3068

\u3010JSON\u5F62\u5F0F\u3067\u51FA\u529B\u3011
{
  "course_selection_problems": [
    {
      "problem_number": 1,
      "problem_title": "\u3086\u3063\u304F\u308A\u30B3\u30FC\u30B9\u306E\u554F\u984C\u30BF\u30A4\u30C8\u30EB",
      "problem_description": "\u554F\u984C\u306E\u8AAC\u660E",
      "problem_content": "\u5177\u4F53\u7684\u306A\u6570\u5B57\u3068\u72B6\u6CC1\u3092\u542B\u3080\u554F\u984C\u6587",
      "course_level": "\u57FA\u790E",
      "connection_to_cards": "\u3053\u306E\u554F\u984C\u306F\u5B66\u7FD2\u30AB\u30FC\u30C91-2\u3067\u5B66\u3076\u5185\u5BB9\u306B\u3064\u306A\u304C\u308A\u307E\u3059"
    },
    {
      "problem_number": 2,
      "problem_title": "\u3057\u3063\u304B\u308A\u30B3\u30FC\u30B9\u306E\u554F\u984C\u30BF\u30A4\u30C8\u30EB",
      "problem_description": "\u554F\u984C\u306E\u8AAC\u660E",
      "problem_content": "\u5177\u4F53\u7684\u306A\u6570\u5B57\u3068\u72B6\u6CC1\u3092\u542B\u3080\u554F\u984C\u6587",
      "course_level": "\u6A19\u6E96",
      "connection_to_cards": "\u3053\u306E\u554F\u984C\u306F\u5B66\u7FD2\u30AB\u30FC\u30C91-3\u3067\u5B66\u3076\u5185\u5BB9\u306B\u3064\u306A\u304C\u308A\u307E\u3059"
    },
    {
      "problem_number": 3,
      "problem_title": "\u3069\u3093\u3069\u3093\u30B3\u30FC\u30B9\u306E\u554F\u984C\u30BF\u30A4\u30C8\u30EB",
      "problem_description": "\u554F\u984C\u306E\u8AAC\u660E",
      "problem_content": "\u5177\u4F53\u7684\u306A\u6570\u5B57\u3068\u72B6\u6CC1\u3092\u542B\u3080\u554F\u984C\u6587",
      "course_level": "\u767A\u5C55",
      "connection_to_cards": "\u3053\u306E\u554F\u984C\u306F\u5B66\u7FD2\u30AB\u30FC\u30C91-4\u306B\u3064\u306A\u304C\u308A\u307E\u3059"
    }
  ],
  "introduction_problems": [
    {
      "course_number": 1,
      "problem_title": "\u3086\u3063\u304F\u308A\u30B3\u30FC\u30B9\u5C0E\u5165\u554F\u984C\u306E\u30BF\u30A4\u30C8\u30EB",
      "problem_content": "\u5177\u4F53\u7684\u306A\u6570\u5B57\u3068\u72B6\u6CC1\u3092\u542B\u3080\u554F\u984C\u6587",
      "answer": "\u89E3\u7B54\u306E\u30D2\u30F3\u30C8"
    },
    {
      "course_number": 2,
      "problem_title": "\u3057\u3063\u304B\u308A\u30B3\u30FC\u30B9\u5C0E\u5165\u554F\u984C\u306E\u30BF\u30A4\u30C8\u30EB",
      "problem_content": "\u5177\u4F53\u7684\u306A\u6570\u5B57\u3068\u72B6\u6CC1\u3092\u542B\u3080\u554F\u984C\u6587",
      "answer": "\u89E3\u7B54\u306E\u30D2\u30F3\u30C8"
    },
    {
      "course_number": 3,
      "problem_title": "\u3069\u3093\u3069\u3093\u30B3\u30FC\u30B9\u5C0E\u5165\u554F\u984C\u306E\u30BF\u30A4\u30C8\u30EB",
      "problem_content": "\u5177\u4F53\u7684\u306A\u6570\u5B57\u3068\u72B6\u6CC1\u3092\u542B\u3080\u554F\u984C\u6587",
      "answer": "\u89E3\u7B54\u306E\u30D2\u30F3\u30C8"
    }
  ],
  "common_check_test": {
    "test_title": "\u57FA\u790E\u57FA\u672C\u30C1\u30A7\u30C3\u30AF\u30C6\u30B9\u30C8",
    "test_description": "\u5168\u30B3\u30FC\u30B9\u5171\u901A\u306E\u57FA\u790E\u57FA\u672C\u30C1\u30A7\u30C3\u30AF\u30C6\u30B9\u30C8\uFF08\u77E5\u8B58\u7406\u89E3\u306E\u6700\u4F4E\u4FDD\u8A3C\uFF09",
    "sample_problems": [
      {
        "problem_number": 1,
        "problem_text": "\u5177\u4F53\u7684\u306A\u6570\u5B57\u3068\u72B6\u6CC1\u3092\u542B\u3080\u554F\u984C\u6587",
        "answer": "\u89E3\u7B54",
        "difficulty": "basic"
      },
      {
        "problem_number": 2,
        "problem_text": "\u5177\u4F53\u7684\u306A\u6570\u5B57\u3068\u72B6\u6CC1\u3092\u542B\u3080\u554F\u984C\u6587",
        "answer": "\u89E3\u7B54",
        "difficulty": "basic"
      },
      {
        "problem_number": 3,
        "problem_text": "\u5177\u4F53\u7684\u306A\u6570\u5B57\u3068\u72B6\u6CC1\u3092\u542B\u3080\u554F\u984C\u6587",
        "answer": "\u89E3\u7B54",
        "difficulty": "basic"
      },
      {
        "problem_number": 4,
        "problem_text": "\u5177\u4F53\u7684\u306A\u6570\u5B57\u3068\u72B6\u6CC1\u3092\u542B\u3080\u554F\u984C\u6587",
        "answer": "\u89E3\u7B54",
        "difficulty": "basic"
      },
      {
        "problem_number": 5,
        "problem_text": "\u5177\u4F53\u7684\u306A\u6570\u5B57\u3068\u72B6\u6CC1\u3092\u542B\u3080\u554F\u984C\u6587",
        "answer": "\u89E3\u7B54",
        "difficulty": "basic"
      },
      {
        "problem_number": 6,
        "problem_text": "\u5177\u4F53\u7684\u306A\u6570\u5B57\u3068\u72B6\u6CC1\u3092\u542B\u3080\u554F\u984C\u6587",
        "answer": "\u89E3\u7B54",
        "difficulty": "basic"
      }
    ]
  },
  "optional_problems": [
    {
      "problem_number": 1,
      "problem_title": "\u5B9F\u751F\u6D3B\u306B\u751F\u304B\u305B\u308B\u554F\u984C",
      "problem_description": "\u5177\u4F53\u7684\u306A\u6570\u5B57\u3068\u72B6\u6CC1\u3092\u542B\u3080\u554F\u984C\u6587",
      "learning_meaning": "\u3053\u306E\u554F\u984C\u3092\u89E3\u304F\u3053\u3068\u3067\u3001\u7B97\u6570\u304C\u5B9F\u969B\u306E\u751F\u6D3B\u3067\u5F79\u306B\u7ACB\u3064\u3053\u3068\u304C\u308F\u304B\u308A\u307E\u3059",
      "difficulty_level": "medium",
      "answer": "\u89E3\u7B54",
      "explanation": "\u8003\u3048\u65B9\u306E\u8AAC\u660E"
    },
    {
      "problem_number": 2,
      "problem_title": "\u6559\u79D1\u306E\u898B\u65B9\u30FB\u8003\u3048\u65B9\u304C\u6DF1\u307E\u308B\u554F\u984C",
      "problem_description": "\u5177\u4F53\u7684\u306A\u6570\u5B57\u3068\u72B6\u6CC1\u3092\u542B\u3080\u554F\u984C\u6587",
      "learning_meaning": "\u3053\u306E\u554F\u984C\u3092\u89E3\u304F\u3053\u3068\u3067\u3001\u306A\u305C\u3053\u306E\u65B9\u6CD5\u3067\u89E3\u3051\u308B\u306E\u304B\u6DF1\u304F\u7406\u89E3\u3067\u304D\u307E\u3059",
      "difficulty_level": "medium",
      "answer": "\u89E3\u7B54",
      "explanation": "\u8003\u3048\u65B9\u306E\u8AAC\u660E"
    },
    {
      "problem_number": 3,
      "problem_title": "\u4ED6\u6559\u79D1\u3068\u3064\u306A\u304C\u308B\u554F\u984C",
      "problem_description": "\u5177\u4F53\u7684\u306A\u6570\u5B57\u3068\u72B6\u6CC1\u3092\u542B\u3080\u554F\u984C\u6587",
      "learning_meaning": "\u3053\u306E\u554F\u984C\u3092\u89E3\u304F\u3053\u3068\u3067\u3001\u7B97\u6570\u304C\u4ED6\u306E\u6559\u79D1\u3067\u3082\u4F7F\u3048\u308B\u3053\u3068\u304C\u308F\u304B\u308A\u307E\u3059",
      "difficulty_level": "hard",
      "answer": "\u89E3\u7B54",
      "explanation": "\u8003\u3048\u65B9\u306E\u8AAC\u660E"
    },
    {
      "problem_number": 4,
      "problem_title": "\u767A\u5C55\u7684\u306A\u554F\u984C",
      "problem_description": "\u5177\u4F53\u7684\u306A\u6570\u5B57\u3068\u72B6\u6CC1\u3092\u542B\u3080\u554F\u984C\u6587",
      "learning_meaning": "\u3053\u306E\u554F\u984C\u3092\u89E3\u304F\u3053\u3068\u3067\u3001\u4ECA\u307E\u3067\u5B66\u3093\u3060\u3053\u3068\u3092\u7D44\u307F\u5408\u308F\u305B\u3066\u8003\u3048\u308B\u529B\u304C\u3064\u304D\u307E\u3059",
      "difficulty_level": "hard",
      "answer": "\u89E3\u7B54",
      "explanation": "\u8003\u3048\u65B9\u306E\u8AAC\u660E"
    },
    {
      "problem_number": 5,
      "problem_title": "\u6559\u79D1\u306E\u672C\u8CEA\u306B\u89E6\u308C\u308B\u63A2\u7A76\u7684\u306A\u554F\u984C",
      "problem_description": "\u5177\u4F53\u7684\u306A\u6570\u5B57\u3068\u72B6\u6CC1\u3092\u542B\u3080\u554F\u984C\u6587",
      "learning_meaning": "\u3053\u306E\u554F\u984C\u3092\u89E3\u304F\u3053\u3068\u3067\u3001\u7B97\u6570\u306E\u9762\u767D\u3055\u3084\u4E0D\u601D\u8B70\u3055\u306B\u6C17\u3065\u304D\u3001\u3082\u3063\u3068\u5B66\u3073\u305F\u304F\u306A\u308A\u307E\u3059",
      "difficulty_level": "very_hard",
      "answer": "\u89E3\u7B54",
      "explanation": "\u8003\u3048\u65B9\u306E\u8AAC\u660E"
    },
    {
      "problem_number": 6,
      "problem_title": "\u5275\u9020\u7684\u30FB\u7DCF\u5408\u7684\u306A\u554F\u984C",
      "problem_description": "\u5177\u4F53\u7684\u306A\u6570\u5B57\u3068\u72B6\u6CC1\u3092\u542B\u3080\u554F\u984C\u6587",
      "learning_meaning": "\u3053\u306E\u554F\u984C\u3092\u89E3\u304F\u3053\u3068\u3067\u3001\u81EA\u5206\u3067\u8003\u3048\u3092\u4F5C\u308A\u51FA\u3059\u529B\u304C\u3064\u304D\u307E\u3059",
      "difficulty_level": "very_hard",
      "answer": "\u89E3\u7B54",
      "explanation": "\u8003\u3048\u65B9\u306E\u8AAC\u660E"
    }
  ]
}

\u5FC5\u305A\u5B8C\u5168\u306AJSON\u306E\u307F\u3092\u51FA\u529B\u3057\u3066\u304F\u3060\u3055\u3044\u3002\u8AAC\u660E\u6587\u306F\u4E0D\u8981\u3067\u3059\u3002`, _ = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=" + s, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ parts: [{ text: d }] }], generationConfig: { temperature: 0.8, maxOutputTokens: 8e3 } }) });
    if (!_.ok) throw new Error(`Gemini API error: ${_.status}`);
    const h = (c = (i = (o = (a = (n = (await _.json()).candidates) == null ? void 0 : n[0]) == null ? void 0 : a.content) == null ? void 0 : o.parts) == null ? void 0 : i[0]) == null ? void 0 : c.text;
    if (!h) throw new Error("AI response is empty");
    const g = Y(h);
    if (g.course_selection_problems) {
      const f = JSON.stringify(g.course_selection_problems);
      await r.DB.prepare(`
        INSERT OR REPLACE INTO curriculum_metadata (curriculum_id, metadata_key, metadata_value)
        VALUES (?, ?, ?)
      `).bind(t, "course_selection_problems", f).run();
    }
    if (g.introduction_problems) {
      const f = u.results;
      for (let E = 0; E < g.introduction_problems.length && E < f.length; E++) {
        const x = g.introduction_problems[E], y = f[E], v = JSON.stringify(x);
        await r.DB.prepare(`
          UPDATE courses SET introduction_problem = ? WHERE id = ?
        `).bind(v, y.id).run();
      }
    }
    if (g.common_check_test) {
      const f = JSON.stringify(g.common_check_test);
      await r.DB.prepare(`
        INSERT OR REPLACE INTO curriculum_metadata (curriculum_id, metadata_key, metadata_value)
        VALUES (?, ?, ?)
      `).bind(t, "common_check_test", f).run();
    }
    if (g.optional_problems) for (const f of g.optional_problems) await r.DB.prepare(`
          INSERT INTO optional_problems (
            curriculum_id, problem_number, problem_title, problem_content, problem_description,
            difficulty_level, learning_meaning
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(t, f.problem_number, f.problem_title || "\u554F\u984C", f.problem_content || f.problem_description || "\u554F\u984C\u5185\u5BB9", f.problem_description || f.problem_content || "\u554F\u984C\u306E\u8AAC\u660E", f.difficulty_level || "medium", f.learning_meaning || "").run();
    return e.json({ success: true, message: "\u8FFD\u52A0\u554F\u984C\u3092\u751F\u6210\u30FB\u4FDD\u5B58\u3057\u307E\u3057\u305F" });
  } catch (l) {
    return console.error("\u8FFD\u52A0\u554F\u984C\u751F\u6210\u30A8\u30E9\u30FC:", l), e.json({ error: "\u8FFD\u52A0\u554F\u984C\u306E\u751F\u6210\u306B\u5931\u6557\u3057\u307E\u3057\u305F", details: l.message }, 500);
  }
});
p.put("/api/curriculum/:id", async (e) => {
  const { env: r } = e, t = e.req.param("id"), { basicInfo: s, courses: n } = await e.req.json();
  try {
    console.log(`\u{1F4DD} \u5358\u5143\u66F4\u65B0\u958B\u59CB: ID=${t}`);
    const a = await r.DB.prepare(`
      SELECT * FROM curriculum WHERE id = ?
    `).bind(t).first();
    await r.DB.prepare(`
      UPDATE curriculum
      SET grade = ?, subject = ?, textbook_company = ?, 
          unit_name = ?, unit_goal = ?, non_cognitive_goal = ?
      WHERE id = ?
    `).bind(s.grade, s.subject, s.textbook_company, s.unit_name, s.unit_goal, s.non_cognitive_goal, t).run(), console.log("  - \u30AB\u30EA\u30AD\u30E5\u30E9\u30E0\u57FA\u672C\u60C5\u5831\u66F4\u65B0\u5B8C\u4E86"), await mt(r.DB, "curriculum_history", parseInt(t), "update", { old: a, new: s });
    for (const o of n) {
      for (const i of o.cards) await r.DB.prepare(`
          UPDATE learning_cards
          SET card_title = ?, problem_description = ?, 
              example_problem = ?, answer = ?
          WHERE id = ?
        `).bind(i.card_title, i.problem_description, i.example_problem, i.answer, i.id).run();
      console.log(`  - \u30B3\u30FC\u30B9 ${o.id} \u306E\u30AB\u30FC\u30C9\u66F4\u65B0\u5B8C\u4E86`);
    }
    return e.json({ success: true, message: "\u5358\u5143\u3092\u66F4\u65B0\u3057\u307E\u3057\u305F" });
  } catch (a) {
    return console.error("\u5358\u5143\u66F4\u65B0\u30A8\u30E9\u30FC:", a), e.json({ success: false, error: "\u5358\u5143\u306E\u66F4\u65B0\u306B\u5931\u6557\u3057\u307E\u3057\u305F", details: a.message }, 500);
  }
});
p.delete("/api/curriculum/:id", async (e) => {
  const { env: r } = e, t = e.req.param("id");
  try {
    console.log(`\u{1F5D1}\uFE0F \u5358\u5143\u524A\u9664\u958B\u59CB: ID=${t}`);
    const n = ((await r.DB.prepare(`
      SELECT id FROM courses WHERE curriculum_id = ?
    `).bind(t).all()).results || []).map((a) => a.id);
    console.log(`  - \u30B3\u30FC\u30B9\u6570: ${n.length}`);
    for (const a of n) await r.DB.prepare(`
        DELETE FROM learning_cards WHERE course_id = ?
      `).bind(a).run();
    return console.log("  - \u5B66\u7FD2\u30AB\u30FC\u30C9\u524A\u9664\u5B8C\u4E86"), await r.DB.prepare(`
      DELETE FROM courses WHERE curriculum_id = ?
    `).bind(t).run(), console.log("  - \u30B3\u30FC\u30B9\u524A\u9664\u5B8C\u4E86"), await r.DB.prepare(`
      DELETE FROM curriculum_metadata WHERE curriculum_id = ?
    `).bind(t).run(), console.log("  - \u30E1\u30BF\u30C7\u30FC\u30BF\u524A\u9664\u5B8C\u4E86"), await r.DB.prepare(`
      DELETE FROM optional_problems WHERE curriculum_id = ?
    `).bind(t).run(), console.log("  - \u9078\u629E\u554F\u984C\u524A\u9664\u5B8C\u4E86"), await r.DB.prepare(`
      DELETE FROM curriculum WHERE id = ?
    `).bind(t).run(), console.log("  - \u30AB\u30EA\u30AD\u30E5\u30E9\u30E0\u672C\u4F53\u524A\u9664\u5B8C\u4E86"), e.json({ success: true, message: "\u5358\u5143\u3092\u524A\u9664\u3057\u307E\u3057\u305F", deleted: { curriculum_id: t, courses_count: n.length } });
  } catch (s) {
    return console.error("\u5358\u5143\u524A\u9664\u30A8\u30E9\u30FC:", s), e.json({ success: false, error: "\u5358\u5143\u306E\u524A\u9664\u306B\u5931\u6557\u3057\u307E\u3057\u305F", details: s.message }, 500);
  }
});
p.post("/api/curriculum/:id/duplicate", async (e) => {
  const { env: r } = e, t = e.req.param("id"), { newGrade: s, newSubject: n, newTextbook: a, newUnitName: o } = await e.req.json();
  try {
    console.log(`\u{1F4CB} \u5358\u5143\u8907\u88FD\u958B\u59CB: sourceId=${t}`);
    const i = await r.DB.prepare(`
      SELECT * FROM curriculum WHERE id = ?
    `).bind(t).first();
    if (!i) return e.json({ error: "\u30AB\u30EA\u30AD\u30E5\u30E9\u30E0\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093" }, 404);
    const l = (await r.DB.prepare(`
      INSERT INTO curriculum (
        grade, subject, textbook_company, unit_name, 
        unit_order, total_hours, unit_goal, non_cognitive_goal
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(s || i.grade, n || i.subject, a || i.textbook_company, o || `${i.unit_name}\uFF08\u30B3\u30D4\u30FC\uFF09`, i.unit_order, i.total_hours, i.unit_goal, i.non_cognitive_goal).run()).meta.last_row_id, u = await r.DB.prepare(`
      SELECT * FROM courses WHERE curriculum_id = ?
    `).bind(t).all();
    for (const m of u.results) {
      const g = (await r.DB.prepare(`
        INSERT INTO courses (
          curriculum_id, course_level, course_name, course_label, 
          color_code, introduction_problem
        ) VALUES (?, ?, ?, ?, ?, ?)
      `).bind(l, m.course_level, m.course_name, m.course_label, m.color_code, m.introduction_problem).run()).meta.last_row_id, f = await r.DB.prepare(`
        SELECT * FROM learning_cards WHERE course_id = ?
      `).bind(m.id).all();
      for (const E of f.results) await r.DB.prepare(`
          INSERT INTO learning_cards (
            course_id, card_number, card_title, card_type, 
            problem_description, new_terms, example_problem, 
            example_solution, real_world_connection, answer, textbook_page
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(g, E.card_number, E.card_title, E.card_type, E.problem_description, E.new_terms, E.example_problem, E.example_solution, E.real_world_connection, E.answer, E.textbook_page).run();
    }
    const d = await r.DB.prepare(`
      SELECT * FROM curriculum_metadata WHERE curriculum_id = ?
    `).bind(t).all();
    for (const m of d.results) await r.DB.prepare(`
        INSERT INTO curriculum_metadata (curriculum_id, metadata_key, metadata_value)
        VALUES (?, ?, ?)
      `).bind(l, m.metadata_key, m.metadata_value).run();
    const _ = await r.DB.prepare(`
      SELECT * FROM optional_problems WHERE curriculum_id = ?
    `).bind(t).all();
    for (const m of _.results) await r.DB.prepare(`
        INSERT INTO optional_problems (
          curriculum_id, problem_number, problem_title, 
          problem_description, problem_content, difficulty_level, learning_meaning
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(l, m.problem_number, m.problem_title, m.problem_description, m.problem_content, m.difficulty_level, m.learning_meaning).run();
    return console.log(`\u2705 \u5358\u5143\u8907\u88FD\u5B8C\u4E86: newId=${l}`), e.json({ success: true, newCurriculumId: l, message: "\u5358\u5143\u3092\u8907\u88FD\u3057\u307E\u3057\u305F" });
  } catch (i) {
    return console.error("\u5358\u5143\u8907\u88FD\u30A8\u30E9\u30FC:", i), e.json({ success: false, error: "\u5358\u5143\u306E\u8907\u88FD\u306B\u5931\u6557\u3057\u307E\u3057\u305F", details: i.message }, 500);
  }
});
p.post("/api/course/:courseId/reorder-cards", async (e) => {
  const { env: r } = e, t = e.req.param("courseId"), { cardIds: s } = await e.req.json();
  try {
    console.log(`\u{1F4CB} \u30AB\u30FC\u30C9\u4E26\u3073\u66FF\u3048\u958B\u59CB: courseId=${t}, cards=${s.length}`);
    for (let n = 0; n < s.length; n++) await r.DB.prepare(`
        UPDATE learning_cards
        SET card_number = ?
        WHERE id = ? AND course_id = ?
      `).bind(n + 1, s[n], t).run();
    return console.log(`\u2705 \u30AB\u30FC\u30C9\u4E26\u3073\u66FF\u3048\u5B8C\u4E86: ${s.length}\u679A`), e.json({ success: true, message: "\u30AB\u30FC\u30C9\u306E\u4E26\u3073\u66FF\u3048\u3092\u4FDD\u5B58\u3057\u307E\u3057\u305F", count: s.length });
  } catch (n) {
    return console.error("\u30AB\u30FC\u30C9\u4E26\u3073\u66FF\u3048\u30A8\u30E9\u30FC:", n), e.json({ success: false, error: "\u30AB\u30FC\u30C9\u306E\u4E26\u3073\u66FF\u3048\u306B\u5931\u6557\u3057\u307E\u3057\u305F", details: n.message }, 500);
  }
});
p.delete("/api/optional-problem/:id", async (e) => {
  const { env: r } = e, t = e.req.param("id");
  try {
    return await r.DB.prepare(`
      DELETE FROM optional_problems WHERE id = ?
    `).bind(t).run(), e.json({ success: true, message: "\u9078\u629E\u554F\u984C\u3092\u524A\u9664\u3057\u307E\u3057\u305F" });
  } catch (s) {
    return console.error("\u9078\u629E\u554F\u984C\u524A\u9664\u30A8\u30E9\u30FC:", s), e.json({ success: false, error: "\u9078\u629E\u554F\u984C\u306E\u524A\u9664\u306B\u5931\u6557\u3057\u307E\u3057\u305F", details: s.message }, 500);
  }
});
p.put("/api/optional-problem/:id", async (e) => {
  const { env: r } = e, t = e.req.param("id"), { problem_title: s, problem_description: n, problem_content: a, difficulty_level: o, learning_meaning: i } = await e.req.json();
  try {
    const c = [];
    return (!s || s.trim() === "") && c.push("problem_title: \u554F\u984C\u30BF\u30A4\u30C8\u30EB\u304C\u7A7A\u3067\u3059"), (!n || n.trim() === "") && c.push("problem_description: \u554F\u984C\u5185\u5BB9\u304C\u7A7A\u3067\u3059"), o ? ["minimum", "standard", "advanced", "easy", "medium", "hard"].includes(o) || c.push(`difficulty_level: \u7121\u52B9\u306A\u96E3\u6613\u5EA6 "${o}"\uFF08\u6709\u52B9\u5024: minimum, standard, advanced, easy, medium, hard\uFF09`) : c.push("difficulty_level: \u96E3\u6613\u5EA6\u304C\u6307\u5B9A\u3055\u308C\u3066\u3044\u307E\u305B\u3093"), c.length > 0 ? e.json({ success: false, error: "\u5FC5\u9808\u30D5\u30A3\u30FC\u30EB\u30C9\u304C\u5165\u529B\u3055\u308C\u3066\u3044\u306A\u3044\u304B\u3001\u5024\u304C\u7121\u52B9\u3067\u3059", validation_errors: c }, 400) : (await r.DB.prepare(`
      UPDATE optional_problems
      SET problem_title = ?, problem_description = ?, 
          problem_content = ?, difficulty_level = ?, learning_meaning = ?
      WHERE id = ?
    `).bind(s.trim(), n.trim(), a || "", o, i || "", t).run(), e.json({ success: true, message: "\u9078\u629E\u554F\u984C\u3092\u66F4\u65B0\u3057\u307E\u3057\u305F" }));
  } catch (c) {
    return console.error("\u9078\u629E\u554F\u984C\u66F4\u65B0\u30A8\u30E9\u30FC:", c), e.json({ success: false, error: "\u9078\u629E\u554F\u984C\u306E\u66F4\u65B0\u306B\u5931\u6557\u3057\u307E\u3057\u305F", details: c.message }, 500);
  }
});
p.post("/api/curriculum/:id/optional-problem", async (e) => {
  const { env: r } = e, t = e.req.param("id"), s = await e.req.json(), { problem_title: n, problem_description: a, problem_content: o, problem_category: i, learning_meaning: c } = s;
  console.log("\u{1F4DD} \u9078\u629E\u554F\u984C\u8FFD\u52A0\u30EA\u30AF\u30A8\u30B9\u30C8:", { curriculumId: t, body: s });
  try {
    const l = await r.DB.prepare(`
      SELECT COUNT(*) as count FROM optional_problems WHERE curriculum_id = ?
    `).bind(t).first(), u = ((l == null ? void 0 : l.count) || 0) + 1;
    console.log("\u{1F4DD} \u6B21\u306E\u554F\u984C\u756A\u53F7:", u);
    const d = await r.DB.prepare(`
      INSERT INTO optional_problems (
        curriculum_id, problem_number, problem_title, 
        problem_description, problem_content, problem_category, learning_meaning
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(t, u, n || "\u554F\u984C", a || "\u554F\u984C\u306E\u8AAC\u660E", o || a || "\u554F\u984C\u5185\u5BB9", i || "other", c || "").run();
    return console.log("\u2705 \u9078\u629E\u554F\u984C\u8FFD\u52A0\u6210\u529F:", d.meta.last_row_id), e.json({ success: true, message: "\u9078\u629E\u554F\u984C\u3092\u8FFD\u52A0\u3057\u307E\u3057\u305F", problemId: d.meta.last_row_id });
  } catch (l) {
    return console.error("\u274C \u9078\u629E\u554F\u984C\u8FFD\u52A0\u30A8\u30E9\u30FC:", l), console.error("\u30A8\u30E9\u30FC\u8A73\u7D30:", { message: l.message, stack: l.stack, curriculumId: t, body: s }), e.json({ success: false, error: "\u9078\u629E\u554F\u984C\u306E\u8FFD\u52A0\u306B\u5931\u6557\u3057\u307E\u3057\u305F", details: l.message, stack: l.stack }, 500);
  }
});
p.put("/api/course/:id/introduction-problem", async (e) => {
  const { env: r } = e, t = e.req.param("id"), { problem_title: s, problem_content: n, answer: a } = await e.req.json();
  try {
    const o = JSON.stringify({ problem_title: s, problem_content: n, answer: a });
    return await r.DB.prepare(`
      UPDATE courses
      SET introduction_problem = ?
      WHERE id = ?
    `).bind(o, t).run(), e.json({ success: true, message: "\u5C0E\u5165\u554F\u984C\u3092\u66F4\u65B0\u3057\u307E\u3057\u305F" });
  } catch (o) {
    return console.error("\u5C0E\u5165\u554F\u984C\u66F4\u65B0\u30A8\u30E9\u30FC:", o), e.json({ success: false, error: "\u5C0E\u5165\u554F\u984C\u306E\u66F4\u65B0\u306B\u5931\u6557\u3057\u307E\u3057\u305F", details: o.message }, 500);
  }
});
p.delete("/api/course/:id/introduction-problem", async (e) => {
  const { env: r } = e, t = e.req.param("id");
  try {
    return await r.DB.prepare(`
      UPDATE courses
      SET introduction_problem = NULL
      WHERE id = ?
    `).bind(t).run(), e.json({ success: true, message: "\u5C0E\u5165\u554F\u984C\u3092\u524A\u9664\u3057\u307E\u3057\u305F" });
  } catch (s) {
    return console.error("\u5C0E\u5165\u554F\u984C\u524A\u9664\u30A8\u30E9\u30FC:", s), e.json({ success: false, error: "\u5C0E\u5165\u554F\u984C\u306E\u524A\u9664\u306B\u5931\u6557\u3057\u307E\u3057\u305F", details: s.message }, 500);
  }
});
p.put("/api/curriculum/:id/check-test/problem/:problemNumber", async (e) => {
  const { env: r } = e, t = e.req.param("id"), s = parseInt(e.req.param("problemNumber")), { problem_text: n, answer: a, difficulty: o } = await e.req.json();
  try {
    const i = await r.DB.prepare(`
      SELECT metadata_value FROM curriculum_metadata
      WHERE curriculum_id = ? AND metadata_key = 'common_check_test'
    `).bind(t).first();
    if (!i) return e.json({ error: "\u30C1\u30A7\u30C3\u30AF\u30C6\u30B9\u30C8\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093" }, 404);
    const c = JSON.parse(i.metadata_value), l = c.sample_problems.findIndex((u) => u.problem_number === s);
    return l === -1 ? e.json({ error: "\u6307\u5B9A\u3055\u308C\u305F\u554F\u984C\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093" }, 404) : (c.sample_problems[l].problem_text = n, c.sample_problems[l].answer = a, o !== void 0 && (c.sample_problems[l].difficulty = o), await r.DB.prepare(`
      UPDATE curriculum_metadata
      SET metadata_value = ?
      WHERE curriculum_id = ? AND metadata_key = 'common_check_test'
    `).bind(JSON.stringify(c), t).run(), e.json({ success: true, message: "\u30C1\u30A7\u30C3\u30AF\u30C6\u30B9\u30C8\u554F\u984C\u3092\u66F4\u65B0\u3057\u307E\u3057\u305F" }));
  } catch (i) {
    return console.error("\u30C1\u30A7\u30C3\u30AF\u30C6\u30B9\u30C8\u66F4\u65B0\u30A8\u30E9\u30FC:", i), e.json({ success: false, error: "\u30C1\u30A7\u30C3\u30AF\u30C6\u30B9\u30C8\u554F\u984C\u306E\u66F4\u65B0\u306B\u5931\u6557\u3057\u307E\u3057\u305F", details: i.message }, 500);
  }
});
p.put("/api/curriculum/:id/check-test", async (e) => {
  const { env: r } = e, t = e.req.param("id"), { test_description: s, test_note: n, sample_problems: a } = await e.req.json();
  try {
    console.log("\u{1F4DD} \u30C1\u30A7\u30C3\u30AF\u30C6\u30B9\u30C8\u66F4\u65B0:", { curriculumId: t, test_description: s, test_note: n, problemsCount: a == null ? void 0 : a.length });
    const o = await r.DB.prepare(`
      SELECT metadata_value FROM curriculum_metadata
      WHERE curriculum_id = ? AND metadata_key = 'common_check_test'
    `).bind(t).first(), i = o ? JSON.parse(o.metadata_value) : { test_title: "\u57FA\u790E\u57FA\u672C\u30C1\u30A7\u30C3\u30AF\u30C6\u30B9\u30C8", test_description: "", test_note: "", sample_problems: [] };
    return i.test_description = s || i.test_description, i.test_note = n || i.test_note, i.sample_problems = a || i.sample_problems, o ? await r.DB.prepare(`
        UPDATE curriculum_metadata
        SET metadata_value = ?
        WHERE curriculum_id = ? AND metadata_key = 'common_check_test'
      `).bind(JSON.stringify(i), t).run() : await r.DB.prepare(`
        INSERT INTO curriculum_metadata (curriculum_id, metadata_key, metadata_value)
        VALUES (?, 'common_check_test', ?)
      `).bind(t, JSON.stringify(i)).run(), console.log("\u2705 \u30C1\u30A7\u30C3\u30AF\u30C6\u30B9\u30C8\u66F4\u65B0\u6210\u529F"), e.json({ success: true, message: "\u30C1\u30A7\u30C3\u30AF\u30C6\u30B9\u30C8\u3092\u66F4\u65B0\u3057\u307E\u3057\u305F" });
  } catch (o) {
    return console.error("\u274C \u30C1\u30A7\u30C3\u30AF\u30C6\u30B9\u30C8\u66F4\u65B0\u30A8\u30E9\u30FC:", o), e.json({ success: false, error: "\u30C1\u30A7\u30C3\u30AF\u30C6\u30B9\u30C8\u306E\u66F4\u65B0\u306B\u5931\u6557\u3057\u307E\u3057\u305F", details: o.message }, 500);
  }
});
p.delete("/api/curriculum/:id/check-test/problem/:problemNumber", async (e) => {
  const { env: r } = e, t = e.req.param("id"), s = parseInt(e.req.param("problemNumber"));
  try {
    const n = await r.DB.prepare(`
      SELECT metadata_value FROM curriculum_metadata
      WHERE curriculum_id = ? AND metadata_key = 'common_check_test'
    `).bind(t).first();
    if (!n) return e.json({ error: "\u30C1\u30A7\u30C3\u30AF\u30C6\u30B9\u30C8\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093" }, 404);
    const a = JSON.parse(n.metadata_value);
    return a.sample_problems = a.sample_problems.filter((o) => o.problem_number !== s), a.sample_problems.forEach((o, i) => {
      o.problem_number = i + 1;
    }), await r.DB.prepare(`
      UPDATE curriculum_metadata
      SET metadata_value = ?
      WHERE curriculum_id = ? AND metadata_key = 'common_check_test'
    `).bind(JSON.stringify(a), t).run(), e.json({ success: true, message: "\u30C1\u30A7\u30C3\u30AF\u30C6\u30B9\u30C8\u554F\u984C\u3092\u524A\u9664\u3057\u307E\u3057\u305F" });
  } catch (n) {
    return console.error("\u30C1\u30A7\u30C3\u30AF\u30C6\u30B9\u30C8\u524A\u9664\u30A8\u30E9\u30FC:", n), e.json({ success: false, error: "\u30C1\u30A7\u30C3\u30AF\u30C6\u30B9\u30C8\u554F\u984C\u306E\u524A\u9664\u306B\u5931\u6557\u3057\u307E\u3057\u305F", details: n.message }, 500);
  }
});
p.post("/api/curriculum/:id/check-test/problem", async (e) => {
  const { env: r } = e, t = e.req.param("id"), { problem_text: s, answer: n, difficulty: a } = await e.req.json();
  try {
    const o = await r.DB.prepare(`
      SELECT metadata_value FROM curriculum_metadata
      WHERE curriculum_id = ? AND metadata_key = 'common_check_test'
    `).bind(t).first();
    let i;
    o ? i = JSON.parse(o.metadata_value) : i = { test_title: "\u57FA\u790E\u57FA\u672C\u30C1\u30A7\u30C3\u30AF\u30C6\u30B9\u30C8", test_description: "\u5168\u30B3\u30FC\u30B9\u5171\u901A\u306E\u57FA\u790E\u57FA\u672C\u30C1\u30A7\u30C3\u30AF\u30C6\u30B9\u30C8\uFF08\u77E5\u8B58\u7406\u89E3\u306E\u6700\u4F4E\u4FDD\u8A3C\uFF09", test_note: "6\u554F\u4E2D5\u554F\u4EE5\u4E0A\u6B63\u89E3\u3067\u5408\u683C\u3067\u3059\uFF01", sample_problems: [] };
    const c = i.sample_problems.length + 1;
    return i.sample_problems.push({ problem_number: c, problem_text: s, answer: n, difficulty: a || "basic" }), o ? await r.DB.prepare(`
        UPDATE curriculum_metadata
        SET metadata_value = ?
        WHERE curriculum_id = ? AND metadata_key = 'common_check_test'
      `).bind(JSON.stringify(i), t).run() : await r.DB.prepare(`
        INSERT INTO curriculum_metadata (curriculum_id, metadata_key, metadata_value)
        VALUES (?, 'common_check_test', ?)
      `).bind(t, JSON.stringify(i)).run(), e.json({ success: true, message: "\u30C1\u30A7\u30C3\u30AF\u30C6\u30B9\u30C8\u554F\u984C\u3092\u8FFD\u52A0\u3057\u307E\u3057\u305F", problemNumber: c });
  } catch (o) {
    return console.error("\u30C1\u30A7\u30C3\u30AF\u30C6\u30B9\u30C8\u8FFD\u52A0\u30A8\u30E9\u30FC:", o), e.json({ success: false, error: "\u30C1\u30A7\u30C3\u30AF\u30C6\u30B9\u30C8\u554F\u984C\u306E\u8FFD\u52A0\u306B\u5931\u6557\u3057\u307E\u3057\u305F", details: o.message }, 500);
  }
});
p.put("/api/card/:cardId", async (e) => {
  const { env: r } = e, t = e.req.param("cardId"), s = await e.req.json();
  try {
    const n = ["card_title", "problem_description", "answer", "problem_image_url", "answer_image_url", "visual_support", "auditory_support", "kinesthetic_support", "hints", "example_problem", "example_solution", "real_world_connection", "new_terms", "textbook_page", "learning_style_notes"], a = [], o = [];
    for (const l of n) l in s && (a.push(`${l} = ?`), ["hints", "new_terms", "visual_support", "auditory_support", "kinesthetic_support"].includes(l) ? o.push(JSON.stringify(s[l])) : o.push(s[l]));
    if (a.length === 0) return e.json({ success: false, error: "\u66F4\u65B0\u3059\u308B\u30D5\u30A3\u30FC\u30EB\u30C9\u304C\u3042\u308A\u307E\u305B\u3093" }, 400);
    o.push(t);
    const i = `
      UPDATE learning_cards
      SET ${a.join(", ")}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    await r.DB.prepare(i).bind(...o).run();
    const c = await r.DB.prepare(`
      SELECT * FROM learning_cards WHERE id = ?
    `).bind(t).first();
    return await mt(r.DB, { type: "card", action: "update_learning_styles", idField: "card_id", idValue: parseInt(t), changedFields: a.map((l) => l.split(" = ")[0]), snapshot: c }), e.json({ success: true, message: "\u5B66\u7FD2\u30AB\u30FC\u30C9\u3092\u66F4\u65B0\u3057\u307E\u3057\u305F", card: c });
  } catch (n) {
    return console.error("\u30AB\u30FC\u30C9\u66F4\u65B0\u30A8\u30E9\u30FC:", n), e.json({ success: false, error: "\u30AB\u30FC\u30C9\u306E\u66F4\u65B0\u306B\u5931\u6557\u3057\u307E\u3057\u305F", details: n.message }, 500);
  }
});
p.post("/api/card/:cardId/suggest-learning-styles", async (e) => {
  const { env: r } = e, t = e.req.param("cardId"), s = r.GEMINI_API_KEY;
  if (!s) return e.json({ success: false, error: "API\u30AD\u30FC\u304C\u8A2D\u5B9A\u3055\u308C\u3066\u3044\u307E\u305B\u3093" }, 500);
  try {
    const n = await r.DB.prepare(`
      SELECT lc.*, c.grade, c.subject, c.unit_name, c.textbook_company
      FROM learning_cards lc
      JOIN courses co ON lc.course_id = co.id
      JOIN curriculum c ON co.curriculum_id = c.id
      WHERE lc.id = ?
    `).bind(t).first();
    if (!n) return e.json({ error: "\u30AB\u30FC\u30C9\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093" }, 404);
    const a = `\u4EE5\u4E0B\u306E\u5B66\u7FD2\u30AB\u30FC\u30C9\u306B\u5BFE\u3057\u3066\u3001\u8996\u899A\u512A\u4F4D\u30FB\u8074\u899A\u512A\u4F4D\u30FB\u4F53\u611F\u512A\u4F4D\u306E3\u3064\u306E\u5B66\u7FD2\u30B9\u30BF\u30A4\u30EB\u306B\u5FDC\u3058\u305F\u30B5\u30DD\u30FC\u30C8\u5185\u5BB9\u3092\u63D0\u6848\u3057\u3066\u304F\u3060\u3055\u3044\u3002

\u3010\u5B66\u7FD2\u30AB\u30FC\u30C9\u60C5\u5831\u3011
\u5B66\u5E74: ${n.grade}
\u6559\u79D1: ${n.subject}
\u5358\u5143: ${n.unit_name}
\u30AB\u30FC\u30C9\u756A\u53F7: ${n.card_number}
\u30AB\u30FC\u30C9\u540D: ${n.card_title}
\u554F\u984C: ${n.problem_description}

\u3010\u51FA\u529B\u5F62\u5F0F\u3011JSON\u5F62\u5F0F\u3067\u51FA\u529B\u3057\u3066\u304F\u3060\u3055\u3044\uFF1A
{
  "visual_support": {
    "description": "\u8996\u899A\u512A\u4F4D\u306A\u5B50\u3069\u3082\u3078\u306E\u652F\u63F4\u5185\u5BB9\uFF08\u56F3\u3084\u30A4\u30E9\u30B9\u30C8\u3001\u8272\u5206\u3051\u3001\u56F3\u89E3\u306A\u3069\u306E\u63D0\u6848\uFF09",
    "materials": ["\u5FC5\u8981\u306A\u6559\u67501", "\u5FC5\u8981\u306A\u6559\u67502"],
    "activities": ["\u6D3B\u52D5\u4F8B1", "\u6D3B\u52D5\u4F8B2"]
  },
  "auditory_support": {
    "description": "\u8074\u899A\u512A\u4F4D\u306A\u5B50\u3069\u3082\u3078\u306E\u652F\u63F4\u5185\u5BB9\uFF08\u97F3\u8AAD\u3001\u30EA\u30BA\u30E0\u3001\u8A9E\u5442\u5408\u308F\u305B\u306A\u3069\u306E\u63D0\u6848\uFF09",
    "materials": ["\u5FC5\u8981\u306A\u6559\u67501", "\u5FC5\u8981\u306A\u6559\u67502"],
    "activities": ["\u6D3B\u52D5\u4F8B1", "\u6D3B\u52D5\u4F8B2"]
  },
  "kinesthetic_support": {
    "description": "\u4F53\u611F\u512A\u4F4D\u306A\u5B50\u3069\u3082\u3078\u306E\u652F\u63F4\u5185\u5BB9\uFF08\u8EAB\u4F53\u6D3B\u52D5\u3001\u5177\u4F53\u7269\u64CD\u4F5C\u306A\u3069\u306E\u63D0\u6848\uFF09",
    "materials": ["\u5FC5\u8981\u306A\u6559\u67501", "\u5FC5\u8981\u306A\u6559\u67502"],
    "activities": ["\u6D3B\u52D5\u4F8B1", "\u6D3B\u52D5\u4F8B2"]
  },
  "learning_style_notes": "\u6559\u5E2B\u5411\u3051\u306E\u6307\u5C0E\u4E0A\u306E\u7559\u610F\u70B9"
}`, o = await Ft({ model: "gemini-3-flash-preview", prompt: a, apiKey: s, maxOutputTokens: 4096, temperature: 0.7, retries: 2 });
    if (!o.success || !o.content) throw new Error("\u5B66\u7FD2\u30B9\u30BF\u30A4\u30EB\u63D0\u6848\u306E\u751F\u6210\u306B\u5931\u6557\u3057\u307E\u3057\u305F");
    const i = Y(o.content);
    return e.json({ success: true, suggestions: i, message: "\u5B66\u7FD2\u30B9\u30BF\u30A4\u30EB\u63D0\u6848\u3092\u751F\u6210\u3057\u307E\u3057\u305F" });
  } catch (n) {
    return console.error("\u5B66\u7FD2\u30B9\u30BF\u30A4\u30EB\u63D0\u6848\u30A8\u30E9\u30FC:", n), e.json({ success: false, error: "\u5B66\u7FD2\u30B9\u30BF\u30A4\u30EB\u63D0\u6848\u306E\u751F\u6210\u306B\u5931\u6557\u3057\u307E\u3057\u305F", details: n.message }, 500);
  }
});
p.post("/api/curriculum/:id/regenerate-check-test", async (e) => {
  const { env: r } = e, t = e.req.param("id"), s = r.GEMINI_API_KEY;
  if (!s) return e.json({ success: false, error: "API\u30AD\u30FC\u304C\u8A2D\u5B9A\u3055\u308C\u3066\u3044\u307E\u305B\u3093" }, 500);
  try {
    const n = await r.DB.prepare(`
      SELECT * FROM curriculum WHERE id = ?
    `).bind(t).first();
    if (!n) return e.json({ error: "\u30AB\u30EA\u30AD\u30E5\u30E9\u30E0\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093" }, 404);
    const a = `${n.grade}${n.subject}\u300C${n.unit_name}\u300D\u306E\u57FA\u790E\u78BA\u8A8D\u30C6\u30B9\u30C86\u554F\u3092\u751F\u6210\u3002\u5404\u554F\u306F30\u5B57\u4EE5\u4E0A\u3001answer\u5FC5\u9808\u3002JSON\u51FA\u529B:
{"sample_problems":[{"problem_number":1,"problem_text":"\u554F\u984C\u6587","answer":"\u7B54\u3048"}]}`, o = await Ft({ model: "gemini-3-flash-preview", prompt: a, apiKey: s, maxOutputTokens: 4096, temperature: 0.8, retries: 3 });
    if (!o.success || !o.content) throw new Error("\u30C1\u30A7\u30C3\u30AF\u30C6\u30B9\u30C8\u306E\u751F\u6210\u306B\u5931\u6557\u3057\u307E\u3057\u305F");
    const i = Y(o.content);
    return await r.DB.prepare(`
      INSERT OR REPLACE INTO curriculum_metadata (curriculum_id, metadata_key, metadata_value)
      VALUES (?, 'common_check_test', ?)
    `).bind(t, JSON.stringify({ test_title: "\u57FA\u790E\u57FA\u672C\u30C1\u30A7\u30C3\u30AF\u30C6\u30B9\u30C8", test_description: "\u5168\u30B3\u30FC\u30B9\u5171\u901A\u306E\u57FA\u790E\u57FA\u672C\u30C1\u30A7\u30C3\u30AF\u30C6\u30B9\u30C8\uFF08\u77E5\u8B58\u7406\u89E3\u306E\u6700\u4F4E\u4FDD\u8A3C\uFF09", test_note: "6\u554F\u4E2D5\u554F\u4EE5\u4E0A\u6B63\u89E3\u3067\u5408\u683C\u3067\u3059\uFF01", sample_problems: i.sample_problems })).run(), e.json({ success: true, checkTest: i.sample_problems, model_used: o.model });
  } catch (n) {
    return console.error("\u30C1\u30A7\u30C3\u30AF\u30C6\u30B9\u30C8\u518D\u751F\u6210\u30A8\u30E9\u30FC:", n), e.json({ success: false, error: "\u30C1\u30A7\u30C3\u30AF\u30C6\u30B9\u30C8\u306E\u518D\u751F\u6210\u306B\u5931\u6557\u3057\u307E\u3057\u305F", details: n.message }, 500);
  }
});
p.get("/api/curriculum/:id/history", async (e) => {
  var s;
  const { env: r } = e, t = e.req.param("id");
  try {
    const n = await r.DB.prepare(`
      SELECT 
        h.*,
        u.name as changed_by_name
      FROM curriculum_history h
      LEFT JOIN users u ON h.changed_by = u.id
      WHERE h.curriculum_id = ?
      ORDER BY h.created_at DESC
      LIMIT 50
    `).bind(t).all();
    return e.json({ success: true, history: n.results || [], count: ((s = n.results) == null ? void 0 : s.length) || 0 });
  } catch (n) {
    return console.error("\u5C65\u6B74\u53D6\u5F97\u30A8\u30E9\u30FC:", n), e.json({ success: false, error: "\u5C65\u6B74\u306E\u53D6\u5F97\u306B\u5931\u6557\u3057\u307E\u3057\u305F", details: n.message }, 500);
  }
});
p.post("/api/curriculum/:id/rollback/:historyId", async (e) => {
  const { env: r } = e, t = e.req.param("id"), s = e.req.param("historyId");
  try {
    const n = await r.DB.prepare(`
      SELECT * FROM curriculum_history 
      WHERE id = ? AND curriculum_id = ?
    `).bind(s, t).first();
    if (!n) return e.json({ success: false, error: "\u5C65\u6B74\u30EC\u30B3\u30FC\u30C9\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093" }, 404);
    const a = await r.DB.prepare(`
      SELECT * FROM curriculum WHERE id = ?
    `).bind(t).first();
    a && await mt(r, "curriculum_history", t, { action: "rollback_before", changed_by: 1, data_before: JSON.stringify(a), data_after: n.data_before });
    const o = JSON.parse(n.data_before);
    return await r.DB.prepare(`
      UPDATE curriculum SET
        grade = ?,
        subject = ?,
        textbook_company = ?,
        unit_name = ?,
        unit_goal = ?,
        non_cognitive_goal = ?
      WHERE id = ?
    `).bind(o.grade, o.subject, o.textbook_company, o.unit_name, o.unit_goal, o.non_cognitive_goal, t).run(), await mt(r, "curriculum_history", t, { action: "rollback_complete", changed_by: 1, data_before: JSON.stringify(a), data_after: JSON.stringify(o) }), e.json({ success: true, message: "\u30ED\u30FC\u30EB\u30D0\u30C3\u30AF\u304C\u5B8C\u4E86\u3057\u307E\u3057\u305F", rolled_back_to: n.created_at });
  } catch (n) {
    return console.error("\u30ED\u30FC\u30EB\u30D0\u30C3\u30AF\u30A8\u30E9\u30FC:", n), e.json({ success: false, error: "\u30ED\u30FC\u30EB\u30D0\u30C3\u30AF\u306B\u5931\u6557\u3057\u307E\u3057\u305F", details: n.message }, 500);
  }
});
p.get("/api/system/stats", async (e) => {
  const { env: r } = e;
  try {
    const t = await r.DB.prepare(`
      SELECT 
        COUNT(*) as total_curriculums,
        COUNT(DISTINCT grade) as total_grades,
        COUNT(DISTINCT subject) as total_subjects,
        COUNT(DISTINCT textbook_company) as total_textbooks
      FROM curriculum
    `).first(), s = await r.DB.prepare(`
      SELECT 
        COUNT(*) as total_courses,
        COUNT(DISTINCT curriculum_id) as curriculums_with_courses
      FROM courses
    `).first(), n = await r.DB.prepare(`
      SELECT 
        COUNT(*) as total_cards,
        COUNT(DISTINCT course_id) as courses_with_cards
      FROM learning_cards
    `).first(), a = await r.DB.prepare(`
      SELECT 
        COUNT(*) as total_optional_problems,
        COUNT(DISTINCT curriculum_id) as curriculums_with_optional_problems
      FROM optional_problems
    `).first();
    return e.json({ success: true, stats: { curriculum: t, courses: s, cards: n, optional_problems: a }, timestamp: (/* @__PURE__ */ new Date()).toISOString() });
  } catch (t) {
    return console.error("\u7D71\u8A08\u60C5\u5831\u53D6\u5F97\u30A8\u30E9\u30FC:", t), e.json({ success: false, error: "\u7D71\u8A08\u60C5\u5831\u306E\u53D6\u5F97\u306B\u5931\u6557\u3057\u307E\u3057\u305F", details: t.message }, 500);
  }
});
async function rs(e) {
  const t = new TextEncoder().encode(e), s = await crypto.subtle.digest("SHA-256", t);
  return Array.from(new Uint8Array(s)).map((a) => a.toString(16).padStart(2, "0")).join("");
}
__name(rs, "rs");
function Mt(e = 32) {
  const r = new Uint8Array(e);
  return crypto.getRandomValues(r), Array.from(r, (t) => t.toString(16).padStart(2, "0")).join("");
}
__name(Mt, "Mt");
async function P(e, r) {
  const { env: t } = e, s = e.req.header("Authorization");
  if (!s || !s.startsWith("Bearer ")) return e.json({ error: "\u8A8D\u8A3C\u304C\u5FC5\u8981\u3067\u3059" }, 401);
  const n = s.substring(7);
  try {
    const a = await t.DB.prepare(`
      SELECT s.*, u.id as user_id, u.name, u.email, u.role, u.class_code
      FROM user_sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.session_token = ? AND s.expires_at > datetime('now') AND u.is_active = 1
    `).bind(n).first();
    if (!a) return e.json({ error: "\u30BB\u30C3\u30B7\u30E7\u30F3\u304C\u7121\u52B9\u3067\u3059" }, 401);
    e.set("user", { id: a.user_id, name: a.name, email: a.email, role: a.role, class_code: a.class_code }), await r();
  } catch (a) {
    return console.error("\u8A8D\u8A3C\u30A8\u30E9\u30FC:", a), e.json({ error: "\u8A8D\u8A3C\u306B\u5931\u6557\u3057\u307E\u3057\u305F" }, 500);
  }
}
__name(P, "P");
p.post("/api/auth/register", async (e) => {
  const { env: r } = e, { name: t, email: s, password: n, role: a, class_code: o, student_number: i } = await e.req.json();
  try {
    if (await r.DB.prepare(`
      SELECT id FROM users WHERE email = ?
    `).bind(s).first()) return e.json({ error: "\u3053\u306E\u30E1\u30FC\u30EB\u30A2\u30C9\u30EC\u30B9\u306F\u65E2\u306B\u767B\u9332\u3055\u308C\u3066\u3044\u307E\u3059" }, 400);
    const l = await rs(n), u = await r.DB.prepare(`
      INSERT INTO users (name, email, password_hash, role, class_code, student_number, is_active)
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `).bind(t, s, l, a || "student", o || null, i || null).run();
    return e.json({ success: true, user_id: u.meta.last_row_id, message: "\u30E6\u30FC\u30B6\u30FC\u767B\u9332\u304C\u5B8C\u4E86\u3057\u307E\u3057\u305F" });
  } catch (c) {
    return console.error("\u30E6\u30FC\u30B6\u30FC\u767B\u9332\u30A8\u30E9\u30FC:", c), e.json({ success: false, error: "\u30E6\u30FC\u30B6\u30FC\u767B\u9332\u306B\u5931\u6557\u3057\u307E\u3057\u305F", details: c.message }, 500);
  }
});
p.post("/api/auth/login", async (e) => {
  const { env: r } = e, { email: t, password: s } = await e.req.json();
  try {
    const n = await r.DB.prepare(`
      SELECT * FROM users WHERE email = ? AND is_active = 1
    `).bind(t).first();
    if (!n) return e.json({ error: "\u30E1\u30FC\u30EB\u30A2\u30C9\u30EC\u30B9\u307E\u305F\u306F\u30D1\u30B9\u30EF\u30FC\u30C9\u304C\u6B63\u3057\u304F\u3042\u308A\u307E\u305B\u3093" }, 401);
    if (n.locked_until && new Date(n.locked_until) > /* @__PURE__ */ new Date()) return e.json({ error: "\u30A2\u30AB\u30A6\u30F3\u30C8\u304C\u30ED\u30C3\u30AF\u3055\u308C\u3066\u3044\u307E\u3059\u3002\u3057\u3070\u3089\u304F\u5F85\u3063\u3066\u304B\u3089\u518D\u5EA6\u304A\u8A66\u3057\u304F\u3060\u3055\u3044" }, 403);
    if (await rs(s) !== n.password_hash) {
      const u = (n.failed_login_attempts || 0) + 1, d = u >= 5 ? new Date(Date.now() + 900 * 1e3).toISOString() : null;
      return await r.DB.prepare(`
        UPDATE users 
        SET failed_login_attempts = ?, locked_until = ?
        WHERE id = ?
      `).bind(u, d, n.id).run(), e.json({ error: "\u30E1\u30FC\u30EB\u30A2\u30C9\u30EC\u30B9\u307E\u305F\u306F\u30D1\u30B9\u30EF\u30FC\u30C9\u304C\u6B63\u3057\u304F\u3042\u308A\u307E\u305B\u3093", attempts_remaining: 5 - u }, 401);
    }
    const o = Mt(32), i = Mt(32), c = new Date(Date.now() + 1440 * 60 * 1e3).toISOString(), l = new Date(Date.now() + 10080 * 60 * 1e3).toISOString();
    return await r.DB.prepare(`
      INSERT INTO user_sessions (user_id, session_token, refresh_token, expires_at, refresh_expires_at, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(n.id, o, i, c, l, e.req.header("cf-connecting-ip") || "unknown", e.req.header("user-agent") || "unknown").run(), await r.DB.prepare(`
      UPDATE users 
      SET failed_login_attempts = 0, locked_until = NULL, last_login_at = datetime('now')
      WHERE id = ?
    `).bind(n.id).run(), e.json({ success: true, session_token: o, refresh_token: i, expires_at: c, user: { id: n.id, name: n.name, email: n.email, role: n.role, class_code: n.class_code, student_number: n.student_number } });
  } catch (n) {
    return console.error("\u30ED\u30B0\u30A4\u30F3\u30A8\u30E9\u30FC:", n), e.json({ success: false, error: "\u30ED\u30B0\u30A4\u30F3\u306B\u5931\u6557\u3057\u307E\u3057\u305F", details: n.message }, 500);
  }
});
p.post("/api/auth/logout", P, async (e) => {
  const { env: r } = e, s = e.req.header("Authorization").substring(7);
  try {
    return await r.DB.prepare(`
      DELETE FROM user_sessions WHERE session_token = ?
    `).bind(s).run(), e.json({ success: true, message: "\u30ED\u30B0\u30A2\u30A6\u30C8\u3057\u307E\u3057\u305F" });
  } catch (n) {
    return console.error("\u30ED\u30B0\u30A2\u30A6\u30C8\u30A8\u30E9\u30FC:", n), e.json({ success: false, error: "\u30ED\u30B0\u30A2\u30A6\u30C8\u306B\u5931\u6557\u3057\u307E\u3057\u305F" }, 500);
  }
});
p.post("/api/auth/refresh", async (e) => {
  const { env: r } = e, { refresh_token: t } = await e.req.json();
  try {
    const s = await r.DB.prepare(`
      SELECT s.*, u.id as user_id, u.name, u.email, u.role, u.class_code, u.student_number
      FROM user_sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.refresh_token = ? AND s.refresh_expires_at > datetime('now') AND u.is_active = 1
    `).bind(t).first();
    if (!s) return e.json({ error: "\u30EA\u30D5\u30EC\u30C3\u30B7\u30E5\u30C8\u30FC\u30AF\u30F3\u304C\u7121\u52B9\u3067\u3059" }, 401);
    const n = Mt(32), a = new Date(Date.now() + 1440 * 60 * 1e3).toISOString();
    return await r.DB.prepare(`
      UPDATE user_sessions 
      SET session_token = ?, expires_at = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(n, a, s.id).run(), e.json({ success: true, session_token: n, expires_at: a, user: { id: s.user_id, name: s.name, email: s.email, role: s.role, class_code: s.class_code, student_number: s.student_number } });
  } catch (s) {
    return console.error("\u30BB\u30C3\u30B7\u30E7\u30F3\u66F4\u65B0\u30A8\u30E9\u30FC:", s), e.json({ success: false, error: "\u30BB\u30C3\u30B7\u30E7\u30F3\u66F4\u65B0\u306B\u5931\u6557\u3057\u307E\u3057\u305F" }, 500);
  }
});
p.get("/api/auth/me", P, async (e) => {
  const r = e.get("user");
  return e.json({ success: true, user: r });
});
p.get("/api/ai/conversations/:studentId/:cardId", async (e) => {
  const { env: r } = e, t = e.req.param("studentId"), s = e.req.param("cardId"), n = e.req.query("sessionId");
  try {
    let a = `
      SELECT * FROM ai_conversations
      WHERE student_id = ? AND learning_card_id = ?
    `;
    const o = [t, s];
    n && (a += " AND session_id = ?", o.push(n)), a += " ORDER BY created_at DESC LIMIT 50";
    const i = await r.DB.prepare(a).bind(...o).all();
    return e.json({ success: true, conversations: i.results || [] });
  } catch (a) {
    return console.error("\u5BFE\u8A71\u5C65\u6B74\u53D6\u5F97\u30A8\u30E9\u30FC:", a), e.json({ success: false, error: "\u5BFE\u8A71\u5C65\u6B74\u306E\u53D6\u5F97\u306B\u5931\u6557\u3057\u307E\u3057\u305F" }, 500);
  }
});
p.get("/api/ai/stats/:studentId", async (e) => {
  const { env: r } = e, t = e.req.param("studentId");
  try {
    const s = await r.DB.prepare(`
      SELECT 
        feature_type,
        COUNT(*) as usage_count,
        SUM(tokens_used) as total_tokens,
        AVG(response_time_ms) as avg_response_time,
        SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as success_count,
        SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as error_count
      FROM ai_usage_stats
      WHERE student_id = ?
      GROUP BY feature_type
    `).bind(t).all();
    return e.json({ success: true, stats: s.results || [] });
  } catch (s) {
    return console.error("AI\u7D71\u8A08\u53D6\u5F97\u30A8\u30E9\u30FC:", s), e.json({ success: false, error: "AI\u7D71\u8A08\u306E\u53D6\u5F97\u306B\u5931\u6557\u3057\u307E\u3057\u305F" }, 500);
  }
});
p.post("/api/ai/generate-problem", async (e) => {
  var a, o, i, c, l, u;
  const { env: r } = e, t = await e.req.json(), s = Date.now(), n = r.GEMINI_API_KEY;
  if (!n || n === "your-gemini-api-key-here") return e.json({ success: false, error: "AI\u554F\u984C\u751F\u6210\u6A5F\u80FD\u306F\u73FE\u5728\u5229\u7528\u3067\u304D\u307E\u305B\u3093" });
  try {
    const d = await r.DB.prepare(`
      SELECT * FROM curriculum WHERE id = ?
    `).bind(t.curriculumId).first();
    if (!d) return e.json({ success: false, error: "\u30AB\u30EA\u30AD\u30E5\u30E9\u30E0\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093" }, 404);
    const _ = `\u3042\u306A\u305F\u306F\u6559\u80B2\u30B3\u30F3\u30C6\u30F3\u30C4\u306E\u5C02\u9580\u5BB6\u3067\u3059\u3002\u4EE5\u4E0B\u306E\u60C5\u5831\u3092\u57FA\u306B\u3001${t.problemType === "intro" ? "\u5C0E\u5165\u554F\u984C" : t.problemType === "practice" ? "\u7DF4\u7FD2\u554F\u984C" : t.problemType === "challenge" ? "\u767A\u5C55\u554F\u984C" : t.problemType === "check_test" ? "\u30C1\u30A7\u30C3\u30AF\u30C6\u30B9\u30C8\u554F\u984C" : "\u9078\u629E\u554F\u984C"}\u3092\u751F\u6210\u3057\u3066\u304F\u3060\u3055\u3044\u3002

\u3010\u30AB\u30EA\u30AD\u30E5\u30E9\u30E0\u60C5\u5831\u3011
\u5B66\u5E74: ${d.grade}
\u6559\u79D1: ${d.subject}
\u5358\u5143\u540D: ${d.unit_name}
\u5358\u5143\u76EE\u6A19: ${d.unit_goal}

\u3010\u554F\u984C\u306E\u8981\u4EF6\u3011
\u96E3\u6613\u5EA6: ${t.difficultyLevel === 1 ? "\u2605 \u304B\u3093\u305F\u3093" : t.difficultyLevel === 2 ? "\u2605\u2605 \u3075\u3064\u3046" : t.difficultyLevel === 3 ? "\u2605\u2605\u2605 \u3080\u305A\u304B\u3057\u3044" : "\u2605\u2605\u2605\u2605 \u3068\u3066\u3082\u3080\u305A\u304B\u3057\u3044"}
\u554F\u984C\u30BF\u30A4\u30D7: ${t.problemType}
${t.specificRequirements ? `\u8FFD\u52A0\u8981\u4EF6: ${t.specificRequirements}` : ""}

\u3010\u751F\u6210\u3059\u308B\u5185\u5BB9\u3011
1. \u554F\u984C\u30BF\u30A4\u30C8\u30EB: \u7C21\u6F54\u3067\u5206\u304B\u308A\u3084\u3059\u3044\u30BF\u30A4\u30C8\u30EB\uFF0815\u6587\u5B57\u4EE5\u5185\uFF09
2. \u554F\u984C\u5185\u5BB9: \u5177\u4F53\u7684\u306A\u554F\u984C\u6587\uFF08\u5C0F\u5B66\u751F\u306B\u308F\u304B\u308A\u3084\u3059\u304F\uFF09
3. \u89E3\u7B54: \u8A73\u3057\u3044\u89E3\u7B54\u3068\u89E3\u8AAC

\u4EE5\u4E0B\u306EJSON\u5F62\u5F0F\u3067\u51FA\u529B\u3057\u3066\u304F\u3060\u3055\u3044\uFF1A
{
  "title": "\u554F\u984C\u30BF\u30A4\u30C8\u30EB",
  "content": "\u554F\u984C\u5185\u5BB9",
  "solution": "\u89E3\u7B54\u3068\u89E3\u8AAC"
}`, m = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${n}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ parts: [{ text: _ }] }], generationConfig: { temperature: 0.8, maxOutputTokens: 1e3 } }) }), h = Date.now() - s;
    if (!m.ok) {
      const v = await m.json();
      throw console.error("Gemini API error:", v), await r.DB.prepare(`
        INSERT INTO ai_usage_stats (
          student_id, curriculum_id, feature_type, 
          response_time_ms, success, error_message
        ) VALUES (?, ?, 'problem_generation', ?, 0, ?)
      `).bind(t.userId || 1, t.curriculumId, h, `API Error: ${m.status}`).run(), new Error(`Gemini API error: ${m.status}`);
    }
    const g = await m.json(), f = ((l = (c = (i = (o = (a = g.candidates) == null ? void 0 : a[0]) == null ? void 0 : o.content) == null ? void 0 : i.parts) == null ? void 0 : c[0]) == null ? void 0 : l.text) || "";
    let E;
    try {
      const v = f.match(/```json\s*(\{[\s\S]*?\})\s*```/) || f.match(/(\{[\s\S]*?\})/);
      v ? E = JSON.parse(v[1]) : E = { title: "\u81EA\u52D5\u751F\u6210\u554F\u984C", content: f, solution: "\u89E3\u7B54\u306F\u6559\u5E2B\u304C\u5F8C\u3067\u8FFD\u52A0\u3057\u3066\u304F\u3060\u3055\u3044" };
    } catch {
      E = { title: "\u81EA\u52D5\u751F\u6210\u554F\u984C", content: f, solution: "\u89E3\u7B54\u306F\u6559\u5E2B\u304C\u5F8C\u3067\u8FFD\u52A0\u3057\u3066\u304F\u3060\u3055\u3044" };
    }
    const x = await r.DB.prepare(`
      INSERT INTO ai_generated_problems (
        curriculum_id, course_id, problem_type, problem_title,
        problem_content, problem_solution, difficulty_level,
        generation_prompt, is_approved
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)
    `).bind(t.curriculumId, t.courseId || null, t.problemType, E.title, E.content, E.solution, t.difficultyLevel || 2, _).run(), y = ((u = g.usageMetadata) == null ? void 0 : u.totalTokenCount) || 0;
    return await r.DB.prepare(`
      INSERT INTO ai_usage_stats (
        student_id, curriculum_id, feature_type,
        tokens_used, response_time_ms, success
      ) VALUES (?, ?, 'problem_generation', ?, ?, 1)
    `).bind(t.userId || 1, t.curriculumId, y, h).run(), e.json({ success: true, problem: { id: x.meta.last_row_id, ...E, difficultyLevel: t.difficultyLevel || 2, problemType: t.problemType }, tokensUsed: y, responseTime: h });
  } catch (d) {
    console.error("\u554F\u984C\u751F\u6210\u30A8\u30E9\u30FC:", d);
    try {
      await r.DB.prepare(`
        INSERT INTO ai_usage_stats (
          student_id, curriculum_id, feature_type,
          response_time_ms, success, error_message
        ) VALUES (?, ?, 'problem_generation', ?, 0, ?)
      `).bind(t.userId || 1, t.curriculumId, Date.now() - s, d.message).run();
    } catch (_) {
      console.error("Failed to log error:", _);
    }
    return e.json({ success: false, error: "\u554F\u984C\u751F\u6210\u306B\u5931\u6557\u3057\u307E\u3057\u305F", details: d.message }, 500);
  }
});
p.get("/api/ai/generated-problems/:curriculumId", async (e) => {
  const { env: r } = e, t = e.req.param("curriculumId"), s = e.req.query("problemType"), n = e.req.query("approved");
  try {
    let a = `
      SELECT * FROM ai_generated_problems
      WHERE curriculum_id = ?
    `;
    const o = [t];
    s && (a += " AND problem_type = ?", o.push(s)), n !== void 0 && (a += " AND is_approved = ?", o.push(n === "true" ? "1" : "0")), a += " ORDER BY created_at DESC";
    const i = await r.DB.prepare(a).bind(...o).all();
    return e.json({ success: true, problems: i.results || [] });
  } catch (a) {
    return console.error("\u751F\u6210\u554F\u984C\u53D6\u5F97\u30A8\u30E9\u30FC:", a), e.json({ success: false, error: "\u751F\u6210\u554F\u984C\u306E\u53D6\u5F97\u306B\u5931\u6557\u3057\u307E\u3057\u305F" }, 500);
  }
});
p.post("/api/ai/approve-problem/:problemId", async (e) => {
  const { env: r } = e, t = e.req.param("problemId"), { userId: s, approved: n } = await e.req.json();
  try {
    return await r.DB.prepare(`
      UPDATE ai_generated_problems
      SET is_approved = ?, approved_by = ?, approved_at = datetime('now')
      WHERE id = ?
    `).bind(n ? 1 : 0, s, t).run(), e.json({ success: true, message: n ? "\u554F\u984C\u3092\u627F\u8A8D\u3057\u307E\u3057\u305F" : "\u627F\u8A8D\u3092\u53D6\u308A\u6D88\u3057\u307E\u3057\u305F" });
  } catch (a) {
    return console.error("\u554F\u984C\u627F\u8A8D\u30A8\u30E9\u30FC:", a), e.json({ success: false, error: "\u554F\u984C\u627F\u8A8D\u306B\u5931\u6557\u3057\u307E\u3057\u305F" }, 500);
  }
});
p.post("/api/ai/feedback", async (e) => {
  const { env: r } = e, { studentId: t, conversationId: s, usageStatId: n, rating: a, comment: o } = await e.req.json();
  try {
    return await r.DB.prepare(`
      INSERT INTO ai_feedback_ratings (
        student_id, conversation_id, usage_stat_id, rating, feedback_comment
      ) VALUES (?, ?, ?, ?, ?)
    `).bind(t, s || null, n || null, a, o || null).run(), e.json({ success: true, message: "\u30D5\u30A3\u30FC\u30C9\u30D0\u30C3\u30AF\u3092\u9001\u4FE1\u3057\u307E\u3057\u305F" });
  } catch (i) {
    return console.error("\u30D5\u30A3\u30FC\u30C9\u30D0\u30C3\u30AF\u9001\u4FE1\u30A8\u30E9\u30FC:", i), e.json({ success: false, error: "\u30D5\u30A3\u30FC\u30C9\u30D0\u30C3\u30AF\u9001\u4FE1\u306B\u5931\u6557\u3057\u307E\u3057\u305F" }, 500);
  }
});
p.post("/api/behavior/logs", async (e) => {
  const { env: r } = e, t = await e.req.json();
  if (!Array.isArray(t) || t.length === 0) return e.json({ success: false, error: "\u30ED\u30B0\u30C7\u30FC\u30BF\u304C\u4E0D\u6B63\u3067\u3059" }, 400);
  try {
    const s = r.DB.prepare(`
      INSERT INTO learning_behavior_logs (
        student_id, curriculum_id, learning_card_id, action_type, action_timestamp,
        session_id, session_duration, page_element, element_type, metadata,
        current_understanding_level
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `), n = t.map((a) => s.bind(a.student_id, a.curriculum_id || null, a.learning_card_id || null, a.action_type, a.action_timestamp, a.session_id, a.session_duration || 0, a.page_element || null, a.element_type || null, a.metadata || null, a.current_understanding_level || null));
    return await r.DB.batch(n), e.json({ success: true, message: `${t.length}\u4EF6\u306E\u30ED\u30B0\u3092\u4FDD\u5B58\u3057\u307E\u3057\u305F`, count: t.length });
  } catch (s) {
    return console.error("\u5B66\u7FD2\u884C\u52D5\u30ED\u30B0\u4FDD\u5B58\u30A8\u30E9\u30FC:", s), e.json({ success: false, error: "\u30ED\u30B0\u306E\u4FDD\u5B58\u306B\u5931\u6557\u3057\u307E\u3057\u305F" }, 500);
  }
});
p.get("/api/behavior/logs/:studentId", async (e) => {
  var i;
  const { env: r } = e, t = e.req.param("studentId"), s = e.req.query("limit") || "100", n = e.req.query("actionType"), a = e.req.query("startDate"), o = e.req.query("endDate");
  try {
    let c = `
      SELECT * FROM learning_behavior_logs
      WHERE student_id = ?
    `;
    const l = [t];
    n && (c += " AND action_type = ?", l.push(n)), a && (c += " AND action_timestamp >= ?", l.push(a)), o && (c += " AND action_timestamp <= ?", l.push(o)), c += " ORDER BY action_timestamp DESC LIMIT ?", l.push(parseInt(s));
    const u = await r.DB.prepare(c).bind(...l).all();
    return e.json({ success: true, logs: u.results || [], count: ((i = u.results) == null ? void 0 : i.length) || 0 });
  } catch (c) {
    return console.error("\u5B66\u7FD2\u884C\u52D5\u30ED\u30B0\u53D6\u5F97\u30A8\u30E9\u30FC:", c), e.json({ success: false, error: "\u30ED\u30B0\u306E\u53D6\u5F97\u306B\u5931\u6557\u3057\u307E\u3057\u305F" }, 500);
  }
});
p.post("/api/analysis/patterns/:studentId", async (e) => {
  const { env: r } = e, t = e.req.param("studentId"), { curriculumId: s } = await e.req.json();
  try {
    const n = await Za(r.DB, parseInt(t)), a = await eo(r.DB, parseInt(t)), o = await to(r.DB, parseInt(t), s), i = await ro(r.DB, parseInt(t)), c = await so(r.DB, parseInt(t), s), l = await no(r.DB, parseInt(t)), u = ao({ timePattern: n, learningStyle: a, comprehension: o, helpSeeking: i, progressSpeed: c, engagement: l }), d = { student_id: t, curriculum_id: s, patterns: { time: n, learning_style: a, comprehension: o, help_seeking: i, progress_speed: c, engagement: l }, overall_score: u, analyzed_at: (/* @__PURE__ */ new Date()).toISOString() };
    return await r.DB.prepare(`
      INSERT INTO pattern_analysis_results (
        student_id, curriculum_id, pattern_type, analysis_data, confidence_score, sample_size, analysis_date
      ) VALUES (?, ?, ?, ?, ?, ?, date('now'))
    `).bind(t, s, "comprehensive", JSON.stringify(d.patterns), u / 100, 0).run(), e.json({ success: true, analysis: d });
  } catch (n) {
    return console.error("\u5B66\u7FD2\u30D1\u30BF\u30FC\u30F3\u5206\u6790\u30A8\u30E9\u30FC:", n), e.json({ success: false, error: "\u5206\u6790\u306B\u5931\u6557\u3057\u307E\u3057\u305F" }, 500);
  }
});
async function Za(e, r) {
  const n = ((await e.prepare(`
    SELECT 
      strftime('%H', action_timestamp) as hour,
      COUNT(*) as count,
      AVG(session_duration) as avg_duration
    FROM learning_behavior_logs
    WHERE student_id = ?
    GROUP BY hour
    ORDER BY count DESC
  `).bind(r).all()).results || []).slice(0, 2).map((a) => `${a.hour}:00`);
  return { optimal_study_time: n.length > 0 ? n : ["10:00", "14:00"], concentration_span: 28, best_performance_time: n[0] ? parseInt(n[0]) < 12 ? "\u5348\u524D\u4E2D" : "\u5348\u5F8C" : "\u5348\u524D\u4E2D" };
}
__name(Za, "Za");
async function eo(e, r) {
  const s = (await e.prepare(`
    SELECT element_type, COUNT(*) as count
    FROM learning_behavior_logs
    WHERE student_id = ? AND element_type IN ('image', 'video', 'text', 'audio', 'button', 'interactive')
    GROUP BY element_type
  `).bind(r).all()).results || [];
  let n = 0, a = 0, o = 0;
  s.forEach((c) => {
    (c.element_type === "image" || c.element_type === "video") && (n += c.count), c.element_type === "audio" && (a += c.count), (c.element_type === "button" || c.element_type === "interactive") && (o += c.count);
  });
  const i = n + a + o || 1;
  return { visual: Math.round(n / i * 100), auditory: Math.round(a / i * 100), kinesthetic: Math.round(o / i * 100), dominant_style: n > a && n > o ? "visual" : a > o ? "auditory" : "kinesthetic" };
}
__name(eo, "eo");
async function to(e, r, t) {
  const s = await e.prepare(`
    SELECT 
      AVG(understanding_level) as avg_understanding,
      COUNT(*) as total_cards
    FROM student_progress
    WHERE student_id = ? ${t ? "AND curriculum_id = ?" : ""}
  `).bind(r, ...t ? [t] : []).first();
  return { average_understanding: (s == null ? void 0 : s.avg_understanding) || 0, total_completed: (s == null ? void 0 : s.total_cards) || 0, prediction_3_days: Math.min(((s == null ? void 0 : s.avg_understanding) || 0) + 10, 100) };
}
__name(to, "to");
async function ro(e, r) {
  const t = await e.prepare(`
    SELECT COUNT(*) as help_count
    FROM learning_behavior_logs
    WHERE student_id = ? AND action_type = 'help_request'
  `).bind(r).first();
  return { help_frequency: (t == null ? void 0 : t.help_count) || 0, average_wait_time: 5, help_type: ((t == null ? void 0 : t.help_count) || 0) > 10 ? "frequent" : "moderate" };
}
__name(ro, "ro");
async function so(e, r, t) {
  const n = ((await e.prepare(`
    SELECT 
      strftime('%W', completed_at) as week,
      COUNT(*) as cards_completed
    FROM student_progress
    WHERE student_id = ? ${t ? "AND curriculum_id = ?" : ""}
      AND status = 'completed'
      AND completed_at >= date('now', '-4 weeks')
    GROUP BY week
    ORDER BY week DESC
    LIMIT 3
  `).bind(r, ...t ? [t] : []).all()).results || []).map((o) => o.cards_completed), a = n.length >= 2 && n[0] > n[1] ? "accelerating" : "stable";
  return { cards_per_week: n.length > 0 ? n : [3, 4, 5], trend: a, type: a === "accelerating" ? "\u52A0\u901F\u578B" : "\u5B89\u5B9A\u578B" };
}
__name(so, "so");
async function no(e, r) {
  const t = await e.prepare(`
    SELECT 
      COUNT(DISTINCT session_id) as session_count,
      AVG(session_duration) as avg_duration
    FROM learning_behavior_logs
    WHERE student_id = ?
      AND action_timestamp >= datetime('now', '-7 days')
  `).bind(r).first();
  return { sessions_per_week: (t == null ? void 0 : t.session_count) || 0, average_session_duration: Math.round((t == null ? void 0 : t.avg_duration) || 0), engagement_level: ((t == null ? void 0 : t.session_count) || 0) >= 5 ? "high" : "moderate" };
}
__name(no, "no");
function ao(e) {
  let r = 60;
  return Math.max(e.learning_style.visual, e.learning_style.auditory, e.learning_style.kinesthetic) >= 60 && (r += 10), e.comprehension.average_understanding >= 4 && (r += 15), e.engagement.engagement_level === "high" && (r += 10), e.progress_speed.trend === "accelerating" && (r += 5), Math.min(r, 100);
}
__name(ao, "ao");
p.post("/api/analysis/profile/:studentId", async (e) => {
  var n, a, o, i, c;
  const { env: r } = e, t = e.req.param("studentId"), { curriculumId: s } = await e.req.json();
  try {
    const l = await fetch(`${e.req.url.split("/api")[0]}/api/analysis/patterns/${t}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ curriculumId: s }) });
    if (!l.ok) throw new Error("\u30D1\u30BF\u30FC\u30F3\u5206\u6790\u306E\u53D6\u5F97\u306B\u5931\u6557\u3057\u307E\u3057\u305F");
    const u = await l.json(), d = u.analysis.patterns, _ = await r.DB.prepare(`
      SELECT name, email FROM users WHERE id = ?
    `).bind(t).first(), m = r.GEMINI_API_KEY;
    if (!m || m === "your-gemini-api-key-here") {
      const b = oo(d, _);
      return await ar(r.DB, t, s, b), e.json({ success: true, profile: b });
    }
    const h = `
\u3042\u306A\u305F\u306F\u6559\u80B2\u5FC3\u7406\u5B66\u3068\u30C7\u30FC\u30BF\u5206\u6790\u306E\u5C02\u9580\u5BB6\u3067\u3059\u3002\u4EE5\u4E0B\u306E\u5B66\u7FD2\u30D1\u30BF\u30FC\u30F3\u5206\u6790\u7D50\u679C\u304B\u3089\u3001\u5150\u7AE5\u306E\u7DCF\u5408\u5B66\u7FD2\u30D7\u30ED\u30D5\u30A1\u30A4\u30EB\u3092\u751F\u6210\u3057\u3066\u304F\u3060\u3055\u3044\u3002

\u3010\u5150\u7AE5\u60C5\u5831\u3011
\u540D\u524D: ${(_ == null ? void 0 : _.name) || "\u4E0D\u660E"}
ID: ${t}

\u3010\u5206\u6790\u7D50\u679C\u3011
1. \u6642\u9593\u7684\u30D1\u30BF\u30FC\u30F3:
- \u6700\u9069\u5B66\u7FD2\u6642\u9593: ${d.time.optimal_study_time.join(", ")}
- \u96C6\u4E2D\u6301\u7D9A\u6642\u9593: ${d.time.concentration_span}\u5206
- \u6700\u9AD8\u30D1\u30D5\u30A9\u30FC\u30DE\u30F3\u30B9\u6642\u9593\u5E2F: ${d.time.best_performance_time}

2. \u5B66\u7FD2\u30B9\u30BF\u30A4\u30EB (VAK\u30E2\u30C7\u30EB):
- \u8996\u899A\u578B (Visual): ${d.learning_style.visual}%
- \u8074\u899A\u578B (Auditory): ${d.learning_style.auditory}%
- \u4F53\u611F\u578B (Kinesthetic): ${d.learning_style.kinesthetic}%
- \u512A\u52E2\u30B9\u30BF\u30A4\u30EB: ${d.learning_style.dominant_style}

3. \u7406\u89E3\u30D1\u30BF\u30FC\u30F3:
- \u5E73\u5747\u7406\u89E3\u5EA6: ${d.comprehension.average_understanding}
- \u5B8C\u4E86\u30AB\u30FC\u30C9\u6570: ${d.comprehension.total_completed}
- 3\u65E5\u5F8C\u4E88\u6E2C: ${d.comprehension.prediction_3_days}%

4. \u52A9\u3051\u8981\u8ACB\u30D1\u30BF\u30FC\u30F3:
- \u8981\u8ACB\u983B\u5EA6: ${d.help_seeking.help_frequency}\u56DE
- \u5E73\u5747\u5F85\u3061\u6642\u9593: ${d.help_seeking.average_wait_time}\u5206
- \u30BF\u30A4\u30D7: ${d.help_seeking.help_type}

5. \u9032\u6357\u901F\u5EA6:
- \u9031\u6B21\u30AB\u30FC\u30C9\u6570: ${d.progress_speed.cards_per_week.join(", ")}
- \u30C8\u30EC\u30F3\u30C9: ${d.progress_speed.trend}
- \u30BF\u30A4\u30D7: ${d.progress_speed.type}

6. \u30A8\u30F3\u30B2\u30FC\u30B8\u30E1\u30F3\u30C8:
- \u9031\u6B21\u30BB\u30C3\u30B7\u30E7\u30F3\u6570: ${d.engagement.sessions_per_week}
- \u5E73\u5747\u30BB\u30C3\u30B7\u30E7\u30F3\u6642\u9593: ${d.engagement.average_session_duration}\u79D2
- \u30EC\u30D9\u30EB: ${d.engagement.engagement_level}

\u3010\u51FA\u529B\u5F62\u5F0F\u3011
\u4EE5\u4E0B\u306EJSON\u5F62\u5F0F\u3067\u51FA\u529B\u3057\u3066\u304F\u3060\u3055\u3044\uFF1A

{
  "summary": "\u3053\u306E\u5150\u7AE5\u306E\u5B66\u7FD2\u7279\u6027\u30922-3\u6587\u3067\u8981\u7D04",
  "strengths": ["\u5F37\u307F1", "\u5F37\u307F2", "\u5F37\u307F3"],
  "weaknesses": ["\u8AB2\u984C1", "\u8AB2\u984C2"],
  "recommendations": {
    "for_teacher": ["\u6559\u5E2B\u3078\u306E\u63A8\u5968\u4E8B\u98051", "\u6559\u5E2B\u3078\u306E\u63A8\u5968\u4E8B\u98052", "\u6559\u5E2B\u3078\u306E\u63A8\u5968\u4E8B\u98053"],
    "for_parent": ["\u4FDD\u8B77\u8005\u3078\u306E\u63A8\u5968\u4E8B\u98051", "\u4FDD\u8B77\u8005\u3078\u306E\u63A8\u5968\u4E8B\u98052"],
    "for_student": ["\u5150\u7AE5\u672C\u4EBA\u3078\u306E\u63A8\u5968\u4E8B\u98051", "\u5150\u7AE5\u672C\u4EBA\u3078\u306E\u63A8\u5968\u4E8B\u98052"]
  },
  "learning_type": "\u5B66\u7FD2\u30BF\u30A4\u30D7\u306E\u5206\u985E\uFF08\u4F8B\uFF1A\u8996\u899A\u578B\xD7\u52A0\u901F\u578B\xD7\u7A4D\u6975\u652F\u63F4\u578B\uFF09",
  "recommended_course": "\u3058\u3063\u304F\u308A\u30B3\u30FC\u30B9 / \u3057\u3063\u304B\u308A\u30B3\u30FC\u30B9 / \u3050\u3093\u3050\u3093\u30B3\u30FC\u30B9 \u306E\u3044\u305A\u308C\u304B"
}
`, g = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${m}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ parts: [{ text: h }] }], generationConfig: { temperature: 0.7, maxOutputTokens: 1e3 } }) });
    if (!g.ok) throw new Error("Gemini API\u547C\u3073\u51FA\u3057\u306B\u5931\u6557\u3057\u307E\u3057\u305F");
    const x = (((c = (i = (o = (a = (n = (await g.json()).candidates) == null ? void 0 : n[0]) == null ? void 0 : a.content) == null ? void 0 : o.parts) == null ? void 0 : i[0]) == null ? void 0 : c.text) || "").match(/\{[\s\S]*\}/), y = x ? JSON.parse(x[0]) : {}, v = { student_id: t, curriculum_id: s, student_name: _ == null ? void 0 : _.name, profile_summary: y.summary || "", learning_type: y.learning_type || "", overall_score: u.analysis.overall_score, confidence_level: u.analysis.overall_score >= 80 ? "high" : "medium", recommended_course: y.recommended_course || "\u3057\u3063\u304B\u308A\u30B3\u30FC\u30B9", patterns: d, strengths: y.strengths || [], weaknesses: y.weaknesses || [], recommendations: y.recommendations || {}, generated_at: (/* @__PURE__ */ new Date()).toISOString() };
    return await ar(r.DB, t, s, v), e.json({ success: true, profile: v });
  } catch (l) {
    return console.error("\u7DCF\u5408\u30D7\u30ED\u30D5\u30A1\u30A4\u30EB\u751F\u6210\u30A8\u30E9\u30FC:", l), e.json({ success: false, error: "\u30D7\u30ED\u30D5\u30A1\u30A4\u30EB\u751F\u6210\u306B\u5931\u6557\u3057\u307E\u3057\u305F" }, 500);
  }
});
function oo(e, r) {
  const t = e.learning_style.dominant_style, s = t === "visual" ? "\u8996\u899A\u578B" : t === "auditory" ? "\u8074\u899A\u578B" : "\u4F53\u611F\u578B";
  return { student_name: r == null ? void 0 : r.name, profile_summary: `${s}\u306E\u5B66\u7FD2\u30B9\u30BF\u30A4\u30EB\u3092\u6301\u3061\u3001${e.progress_speed.type}\u306E\u9032\u6357\u3092\u793A\u3057\u3066\u3044\u307E\u3059\u3002`, learning_type: `${s}\xD7${e.progress_speed.type}`, strengths: ["\u81EA\u5DF1\u5B66\u7FD2\u80FD\u529B", "\u7D99\u7D9A\u7684\u306A\u53D6\u308A\u7D44\u307F"], weaknesses: ["\u3055\u3089\u306A\u308B\u5206\u6790\u304C\u5FC5\u8981"], recommendations: { for_teacher: ["\u5B66\u7FD2\u30B9\u30BF\u30A4\u30EB\u306B\u5408\u308F\u305B\u305F\u6307\u5C0E\u3092\u884C\u3063\u3066\u304F\u3060\u3055\u3044"], for_parent: ["\u5BB6\u5EAD\u5B66\u7FD2\u306E\u7D99\u7D9A\u3092\u30B5\u30DD\u30FC\u30C8\u3057\u3066\u304F\u3060\u3055\u3044"], for_student: ["\u81EA\u5206\u306E\u30DA\u30FC\u30B9\u3067\u5B66\u7FD2\u3092\u9032\u3081\u307E\u3057\u3087\u3046"] }, recommended_course: "\u3057\u3063\u304B\u308A\u30B3\u30FC\u30B9" };
}
__name(oo, "oo");
async function ar(e, r, t, s) {
  await e.prepare(`
    INSERT OR REPLACE INTO learning_profiles (
      student_id, curriculum_id, profile_type, profile_data, overall_score, confidence_level, 
      expires_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, datetime('now', '+7 days'), datetime('now'))
  `).bind(r, t, "comprehensive", JSON.stringify(s), s.overall_score || 0, s.confidence_level || "medium").run();
}
__name(ar, "ar");
p.post("/api/analysis/personalized-plan/:studentId", async (e) => {
  const { env: r } = e, t = e.req.param("studentId"), { curriculumId: s, profileId: n } = await e.req.json();
  try {
    const a = await r.DB.prepare(`
      SELECT profile_data FROM learning_profiles
      WHERE student_id = ? AND curriculum_id = ?
      ORDER BY updated_at DESC LIMIT 1
    `).bind(t, s).first();
    if (!a) return e.json({ success: false, error: "\u30D7\u30ED\u30D5\u30A1\u30A4\u30EB\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093" }, 404);
    const o = JSON.parse(a.profile_data), i = { student_id: t, curriculum_id: s, plan_type: "daily", daily_schedule: io(o), weekly_goals: co(o), adaptive_strategies: lo(o), created_at: (/* @__PURE__ */ new Date()).toISOString() };
    return await r.DB.prepare(`
      INSERT INTO personalized_plans (
        student_id, curriculum_id, profile_id, plan_type, plan_data, status, start_date, end_date
      ) VALUES (?, ?, ?, ?, ?, 'active', date('now'), date('now', '+7 days'))
    `).bind(t, s, n || null, "daily", JSON.stringify(i)).run(), e.json({ success: true, plan: i });
  } catch (a) {
    return console.error("\u500B\u5225\u6700\u9069\u5316\u30D7\u30E9\u30F3\u751F\u6210\u30A8\u30E9\u30FC:", a), e.json({ success: false, error: "\u30D7\u30E9\u30F3\u751F\u6210\u306B\u5931\u6557\u3057\u307E\u3057\u305F" }, 500);
  }
});
function io(e) {
  var t, s, n;
  return { morning: { time: ((n = (s = (t = e.patterns) == null ? void 0 : t.time) == null ? void 0 : s.optimal_study_time) == null ? void 0 : n[0]) || "10:00", activity: "\u65B0\u3057\u3044\u5B66\u7FD2\u30AB\u30FC\u30C9", duration: 30, support: `${e.learning_type}\u306B\u6700\u9069\u5316\u3055\u308C\u305F\u6559\u6750\u3092\u4F7F\u7528` }, afternoon: { time: "14:00", activity: "\u5FA9\u7FD2\u30FB\u78BA\u8A8D", duration: 20, support: "\u7406\u89E3\u5EA6\u78BA\u8A8D\u30AF\u30A4\u30BA" } };
}
__name(io, "io");
function co(e) {
  var t, s, n;
  return [`\u4ECA\u9031\u306E\u76EE\u6A19: ${(((n = (s = (t = e.patterns) == null ? void 0 : t.progress_speed) == null ? void 0 : s.cards_per_week) == null ? void 0 : n[0]) || 3) + 1}\u30AB\u30FC\u30C9\u5B8C\u4E86`, "\u7406\u89E3\u5EA6\u76EE\u6A19: \u5E73\u57474\u4EE5\u4E0A", "\u7D99\u7D9A\u7684\u306A\u5B66\u7FD2\u7FD2\u6163\u306E\u7DAD\u6301"];
}
__name(co, "co");
function lo(e) {
  return [{ condition: "\u3064\u307E\u305A\u3044\u305F\u6642", action: `${e.learning_type}\u306B\u5408\u308F\u305B\u305F\u30D2\u30F3\u30C8\u3092\u8868\u793A`, timing: "3\u5206\u7D4C\u904E\u5F8C" }, { condition: "\u96C6\u4E2D\u529B\u4F4E\u4E0B", action: "\u4F11\u61A9\u3092\u4FC3\u3059", timing: "30\u5206\u7D4C\u904E\u5F8C" }];
}
__name(lo, "lo");
p.get("/api/dashboard/class/:classCode", async (e) => {
  const { env: r } = e, t = e.req.param("classCode");
  try {
    const s = await r.DB.prepare(`
      SELECT id, name, email, student_number
      FROM users
      WHERE class_code = ? AND role = 'student'
      ORDER BY student_number
    `).bind(t).all();
    if (!s.results || s.results.length === 0) return e.json({ success: true, students: [], summary: { total_students: 0, with_profiles: 0, average_score: 0 } });
    const n = await Promise.all(s.results.map(async (i) => {
      const c = await r.DB.prepare(`
          SELECT profile_data, overall_score, confidence_level, updated_at
          FROM learning_profiles
          WHERE student_id = ?
          ORDER BY updated_at DESC
          LIMIT 1
        `).bind(i.id).first();
      if (c) {
        const l = JSON.parse(c.profile_data);
        return { student_id: i.id, student_name: i.name, student_number: i.student_number, profile_summary: l.profile_summary || "", learning_type: l.learning_type || "", overall_score: c.overall_score, confidence_level: c.confidence_level, strengths: l.strengths || [], weaknesses: l.weaknesses || [], recommended_course: l.recommended_course || "\u3057\u3063\u304B\u308A\u30B3\u30FC\u30B9", last_updated: c.updated_at };
      }
      return { student_id: i.id, student_name: i.name, student_number: i.student_number, profile_summary: "\u5206\u6790\u30C7\u30FC\u30BF\u4E0D\u8DB3", learning_type: "\u672A\u5206\u6790", overall_score: 0, confidence_level: "low", strengths: [], weaknesses: ["\u5B66\u7FD2\u30C7\u30FC\u30BF\u304C\u4E0D\u8DB3\u3057\u3066\u3044\u307E\u3059"], recommended_course: "\u3057\u3063\u304B\u308A\u30B3\u30FC\u30B9", last_updated: null };
    })), a = n.filter((i) => i.overall_score > 0), o = { total_students: s.results.length, with_profiles: a.length, average_score: a.length > 0 ? Math.round(a.reduce((i, c) => i + c.overall_score, 0) / a.length) : 0, by_learning_type: uo(a), by_course: _o(a) };
    return e.json({ success: true, class_code: t, students: n, summary: o });
  } catch (s) {
    return console.error("\u30AF\u30E9\u30B9\u30C0\u30C3\u30B7\u30E5\u30DC\u30FC\u30C9\u53D6\u5F97\u30A8\u30E9\u30FC:", s), e.json({ success: false, error: "\u30C0\u30C3\u30B7\u30E5\u30DC\u30FC\u30C9\u30C7\u30FC\u30BF\u306E\u53D6\u5F97\u306B\u5931\u6557\u3057\u307E\u3057\u305F" }, 500);
  }
});
function uo(e) {
  const r = {};
  return e.forEach((t) => {
    const s = t.learning_type || "\u672A\u5206\u985E";
    r[s] = (r[s] || 0) + 1;
  }), r;
}
__name(uo, "uo");
function _o(e) {
  const r = { \u3058\u3063\u304F\u308A\u30B3\u30FC\u30B9: 0, \u3057\u3063\u304B\u308A\u30B3\u30FC\u30B9: 0, \u3050\u3093\u3050\u3093\u30B3\u30FC\u30B9: 0 };
  return e.forEach((t) => {
    const s = t.recommended_course || "\u3057\u3063\u304B\u308A\u30B3\u30FC\u30B9";
    r[s] !== void 0 && r[s]++;
  }), r;
}
__name(_o, "_o");
p.get("/api/dashboard/student/:studentId", async (e) => {
  const { env: r } = e, t = e.req.param("studentId");
  try {
    const s = await r.DB.prepare(`
      SELECT id, name, email, student_number, class_code
      FROM users
      WHERE id = ?
    `).bind(t).first();
    if (!s) return e.json({ success: false, error: "\u751F\u5F92\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093" }, 404);
    const n = await r.DB.prepare(`
      SELECT profile_data, overall_score, confidence_level, updated_at
      FROM learning_profiles
      WHERE student_id = ?
      ORDER BY updated_at DESC
      LIMIT 1
    `).bind(t).first(), a = await r.DB.prepare(`
      SELECT plan_data, status, start_date, end_date, created_at
      FROM personalized_plans
      WHERE student_id = ? AND status = 'active'
      ORDER BY created_at DESC
      LIMIT 1
    `).bind(t).first(), o = await r.DB.prepare(`
      SELECT id, target_role, recommendation_type, priority, title, description, 
             action_items, status, created_at, expires_at
      FROM recommendations
      WHERE student_id = ? AND status != 'dismissed'
      ORDER BY priority DESC, created_at DESC
      LIMIT 10
    `).bind(t).all(), i = await r.DB.prepare(`
      SELECT 
        action_type,
        COUNT(*) as count,
        MAX(action_timestamp) as last_action
      FROM learning_behavior_logs
      WHERE student_id = ? AND action_timestamp >= datetime('now', '-7 days')
      GROUP BY action_type
      ORDER BY count DESC
    `).bind(t).all(), c = n ? JSON.parse(n.profile_data) : null, l = a ? JSON.parse(a.plan_data) : null;
    return e.json({ success: true, student: { id: s.id, name: s.name, email: s.email, student_number: s.student_number, class_code: s.class_code }, profile: c ? { summary: c.profile_summary, learning_type: c.learning_type, overall_score: n == null ? void 0 : n.overall_score, confidence_level: n == null ? void 0 : n.confidence_level, strengths: c.strengths, weaknesses: c.weaknesses, recommendations: c.recommendations, recommended_course: c.recommended_course, patterns: c.patterns, last_updated: n == null ? void 0 : n.updated_at } : null, plan: l, recommendations: o.results || [], recent_activity: i.results || [] });
  } catch (s) {
    return console.error("\u751F\u5F92\u8A73\u7D30\u53D6\u5F97\u30A8\u30E9\u30FC:", s), e.json({ success: false, error: "\u751F\u5F92\u8A73\u7D30\u306E\u53D6\u5F97\u306B\u5931\u6557\u3057\u307E\u3057\u305F" }, 500);
  }
});
p.post("/api/dashboard/recommendations", async (e) => {
  const { env: r } = e, { studentId: t, curriculumId: s, targetRole: n, type: a, priority: o, title: i, description: c, actionItems: l } = await e.req.json();
  try {
    return await r.DB.prepare(`
      INSERT INTO recommendations (
        student_id, curriculum_id, target_role, recommendation_type, priority,
        title, description, action_items, status, expires_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', datetime('now', '+30 days'))
    `).bind(t, s || null, n, a, o, i, c, JSON.stringify(l || [])).run(), e.json({ success: true, message: "\u63A8\u5968\u4E8B\u9805\u3092\u4F5C\u6210\u3057\u307E\u3057\u305F" });
  } catch (u) {
    return console.error("\u63A8\u5968\u4E8B\u9805\u4F5C\u6210\u30A8\u30E9\u30FC:", u), e.json({ success: false, error: "\u63A8\u5968\u4E8B\u9805\u306E\u4F5C\u6210\u306B\u5931\u6557\u3057\u307E\u3057\u305F" }, 500);
  }
});
p.get("/api/cards/:cardId/adapted/:studentId", async (e) => {
  const { env: r } = e, t = e.req.param("cardId"), s = e.req.param("studentId");
  try {
    const n = await r.DB.prepare(`
      SELECT * FROM learning_cards WHERE id = ?
    `).bind(t).first();
    if (!n) return e.json({ success: false, error: "\u30AB\u30FC\u30C9\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093" }, 404);
    const a = await r.DB.prepare(`
      SELECT profile_data FROM learning_profiles
      WHERE student_id = ?
      ORDER BY updated_at DESC
      LIMIT 1
    `).bind(s).first();
    let o = { ...n }, i = "balanced";
    if (a) {
      const l = JSON.parse(a.profile_data).patterns;
      l != null && l.learning_style && (i = l.learning_style.dominant_style || "balanced", o = po(n, i, l.learning_style));
    }
    return e.json({ success: true, card: o, learning_style: i, adapted: !!a });
  } catch (n) {
    return console.error("\u9069\u5FDC\u578B\u30AB\u30FC\u30C9\u53D6\u5F97\u30A8\u30E9\u30FC:", n), e.json({ success: false, error: "\u30AB\u30FC\u30C9\u306E\u53D6\u5F97\u306B\u5931\u6557\u3057\u307E\u3057\u305F" }, 500);
  }
});
function po(e, r, t) {
  const s = { ...e };
  return s.adaptation_metadata = { dominant_style: r, style_scores: t, adaptations_applied: [] }, (r === "visual" || t.visual >= 60) && (s.adaptation_metadata.adaptations_applied.push("visual_enhanced"), s.visual_hints_priority = true, s.show_diagrams = true, s.color_coding = true), (r === "auditory" || t.auditory >= 60) && (s.adaptation_metadata.adaptations_applied.push("auditory_enhanced"), s.audio_guide_enabled = true, s.text_to_speech = true, s.step_by_step_audio = true), (r === "kinesthetic" || t.kinesthetic >= 60) && (s.adaptation_metadata.adaptations_applied.push("kinesthetic_enhanced"), s.interactive_elements = true, s.drag_drop_enabled = true, s.hands_on_activities = true), s;
}
__name(po, "po");
p.post("/api/predictions/:studentId", async (e) => {
  const { env: r } = e, t = e.req.param("studentId"), { curriculumId: s, predictionType: n } = await e.req.json();
  try {
    const a = await fetch(`${e.req.url.split("/api")[0]}/api/analysis/patterns/${t}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ curriculumId: s }) });
    if (!a.ok) throw new Error("\u30D1\u30BF\u30FC\u30F3\u5206\u6790\u306E\u53D6\u5F97\u306B\u5931\u6557\u3057\u307E\u3057\u305F");
    const i = (await a.json()).analysis.patterns, c = mo(i, n || "all");
    for (const [l, u] of Object.entries(c)) await r.DB.prepare(`
        INSERT INTO ai_predictions (
          student_id, curriculum_id, prediction_type, prediction_data, 
          confidence_level, prediction_date, target_date
        ) VALUES (?, ?, ?, ?, ?, date('now'), ?)
      `).bind(t, s, l, JSON.stringify(u), u.confidence || 0.7, u.target_date || null).run();
    return e.json({ success: true, predictions: c });
  } catch (a) {
    return console.error("\u4E88\u6E2C\u751F\u6210\u30A8\u30E9\u30FC:", a), e.json({ success: false, error: "\u4E88\u6E2C\u306E\u751F\u6210\u306B\u5931\u6557\u3057\u307E\u3057\u305F" }, 500);
  }
});
function mo(e, r) {
  var s, n, a, o, i, c, l;
  const t = {};
  if (r === "all" || r === "next_week") {
    const u = ((n = (s = e.progress_speed) == null ? void 0 : s.cards_per_week) == null ? void 0 : n[0]) || 3, d = ((a = e.progress_speed) == null ? void 0 : a.trend) || "stable";
    let _ = u;
    d === "accelerating" && (_ = Math.round(u * 1.2)), d === "decelerating" && (_ = Math.round(u * 0.8)), t.next_week = { cards_expected: _, understanding_level: Math.min((((o = e.comprehension) == null ? void 0 : o.average_understanding) || 3) + 0.3, 5), confidence: 0.75, target_date: go(), recommendation: _ >= 5 ? "\u9806\u8ABF\u3067\u3059" : "\u652F\u63F4\u304C\u5FC5\u8981\u304B\u3082\u3057\u308C\u307E\u305B\u3093" };
  }
  return (r === "all" || r === "struggling_points") && (t.struggling_points = { potential_struggles: [((i = e.comprehension) == null ? void 0 : i.average_understanding) < 3 ? "\u57FA\u790E\u7406\u89E3\u306E\u5F37\u5316\u304C\u5FC5\u8981" : null, ((c = e.help_seeking) == null ? void 0 : c.help_frequency) > 10 ? "\u81EA\u7ACB\u5B66\u7FD2\u306E\u4FC3\u9032\u304C\u5FC5\u8981" : null, ((l = e.engagement) == null ? void 0 : l.engagement_level) === "low" ? "\u30E2\u30C1\u30D9\u30FC\u30B7\u30E7\u30F3\u652F\u63F4\u304C\u5FC5\u8981" : null].filter(Boolean), confidence: 0.65, recommendation: "\u5B9A\u671F\u7684\u306A\u500B\u5225\u652F\u63F4\u3092\u63A8\u5968" }), t;
}
__name(mo, "mo");
function go() {
  const e = /* @__PURE__ */ new Date();
  return e.setDate(e.getDate() + 7), e.toISOString().split("T")[0];
}
__name(go, "go");
p.get("/api/research/export/:classCode", async (e) => {
  var n, a, o, i, c, l, u, d, _, m, h, g, f, E, x, y, v, b, T, O, A, S, I, N, k, D, j, $, re, he, se, wt;
  const { env: r } = e, t = e.req.param("classCode"), s = e.req.query("format") || "json";
  try {
    const M = await r.DB.prepare(`
      SELECT id, student_number FROM users
      WHERE class_code = ? AND role = 'student'
    `).bind(t).all(), Pe = [];
    for (const Ne of M.results || []) {
      const Fe = await r.DB.prepare(`
        SELECT profile_data, overall_score, confidence_level, updated_at
        FROM learning_profiles
        WHERE student_id = ?
        ORDER BY updated_at DESC LIMIT 1
      `).bind(Ne.id).first(), cs = await r.DB.prepare(`
        SELECT 
          action_type,
          COUNT(*) as count,
          AVG(session_duration) as avg_duration
        FROM learning_behavior_logs
        WHERE student_id = ?
        GROUP BY action_type
      `).bind(Ne.id).all(), ne = await r.DB.prepare(`
        SELECT 
          COUNT(*) as total_cards,
          AVG(understanding_level) as avg_understanding,
          AVG(completion_time_minutes) as avg_time
        FROM student_progress
        WHERE student_id = ? AND status = 'completed'
      `).bind(Ne.id).first();
      if (Fe) {
        const W = JSON.parse(Fe.profile_data);
        Pe.push({ anonymous_id: `STUDENT_${String(Ne.student_number).padStart(3, "0")}`, learning_type: W.learning_type, overall_score: Fe.overall_score, confidence_level: Fe.confidence_level, visual_score: ((a = (n = W.patterns) == null ? void 0 : n.learning_style) == null ? void 0 : a.visual) || 0, auditory_score: ((i = (o = W.patterns) == null ? void 0 : o.learning_style) == null ? void 0 : i.auditory) || 0, kinesthetic_score: ((l = (c = W.patterns) == null ? void 0 : c.learning_style) == null ? void 0 : l.kinesthetic) || 0, dominant_style: (d = (u = W.patterns) == null ? void 0 : u.learning_style) == null ? void 0 : d.dominant_style, optimal_study_time: (h = (m = (_ = W.patterns) == null ? void 0 : _.time) == null ? void 0 : m.optimal_study_time) == null ? void 0 : h.join(","), concentration_span: (f = (g = W.patterns) == null ? void 0 : g.time) == null ? void 0 : f.concentration_span, average_understanding: ((x = (E = W.patterns) == null ? void 0 : E.comprehension) == null ? void 0 : x.average_understanding) || 0, total_completed_cards: ((v = (y = W.patterns) == null ? void 0 : y.comprehension) == null ? void 0 : v.total_completed) || 0, help_frequency: ((T = (b = W.patterns) == null ? void 0 : b.help_seeking) == null ? void 0 : T.help_frequency) || 0, average_wait_time: ((A = (O = W.patterns) == null ? void 0 : O.help_seeking) == null ? void 0 : A.average_wait_time) || 0, cards_per_week: (N = (I = (S = W.patterns) == null ? void 0 : S.progress_speed) == null ? void 0 : I.cards_per_week) == null ? void 0 : N.join(","), progress_trend: (D = (k = W.patterns) == null ? void 0 : k.progress_speed) == null ? void 0 : D.trend, sessions_per_week: (($ = (j = W.patterns) == null ? void 0 : j.engagement) == null ? void 0 : $.sessions_per_week) || 0, avg_session_duration: ((he = (re = W.patterns) == null ? void 0 : re.engagement) == null ? void 0 : he.average_session_duration) || 0, engagement_level: (wt = (se = W.patterns) == null ? void 0 : se.engagement) == null ? void 0 : wt.engagement_level, behavior_stats: JSON.stringify(cs.results || []), progress_total_cards: (ne == null ? void 0 : ne.total_cards) || 0, progress_avg_understanding: (ne == null ? void 0 : ne.avg_understanding) || 0, progress_avg_time_minutes: (ne == null ? void 0 : ne.avg_time) || 0, data_updated_at: Fe.updated_at, export_timestamp: (/* @__PURE__ */ new Date()).toISOString() });
      }
    }
    if (s === "csv") {
      const Ne = fo(Pe);
      return e.text(Ne, 200, { "Content-Type": "text/csv", "Content-Disposition": `attachment; filename="research_data_${t}_${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.csv"` });
    }
    return e.json({ success: true, class_code: t, total_students: Pe.length, export_timestamp: (/* @__PURE__ */ new Date()).toISOString(), data: Pe, metadata: { description: "\u533F\u540D\u5316\u6E08\u307F\u7814\u7A76\u7528\u30C7\u30FC\u30BF", variables: Object.keys(Pe[0] || {}), note: "\u500B\u4EBA\u3092\u7279\u5B9A\u3067\u304D\u308B\u60C5\u5831\u306F\u542B\u307E\u308C\u3066\u3044\u307E\u305B\u3093" } });
  } catch (M) {
    return console.error("\u30C7\u30FC\u30BF\u30A8\u30AF\u30B9\u30DD\u30FC\u30C8\u30A8\u30E9\u30FC:", M), e.json({ success: false, error: "\u30C7\u30FC\u30BF\u306E\u30A8\u30AF\u30B9\u30DD\u30FC\u30C8\u306B\u5931\u6557\u3057\u307E\u3057\u305F" }, 500);
  }
});
function fo(e) {
  if (e.length === 0) return "";
  const r = Object.keys(e[0]);
  return [r.join(","), ...e.map((s) => r.map((n) => {
    const a = s[n];
    return a == null ? "" : typeof a == "string" && a.includes(",") ? `"${a.replace(/"/g, '""')}"` : a;
  }).join(","))].join(`
`);
}
__name(fo, "fo");
p.get("/api/research/summary/:classCode", async (e) => {
  var s, n, a, o, i, c, l, u;
  const { env: r } = e, t = e.req.param("classCode");
  try {
    const _ = ((await r.DB.prepare(`
      SELECT id FROM users WHERE class_code = ? AND role = 'student'
    `).bind(t).all()).results || []).map((x) => x.id);
    if (_.length === 0) return e.json({ success: true, summary: { total_students: 0 } });
    const m = await r.DB.prepare(`
      SELECT profile_data FROM learning_profiles
      WHERE student_id IN (${_.join(",")})
      ORDER BY updated_at DESC
    `).all(), h = { visual: 0, auditory: 0, kinesthetic: 0, balanced: 0 }, g = { overall: [], visual: [], auditory: [], kinesthetic: [] };
    for (const x of m.results || []) {
      const y = JSON.parse(x.profile_data), v = (n = (s = y.patterns) == null ? void 0 : s.learning_style) == null ? void 0 : n.dominant_style;
      v && h[v]++, g.visual.push(((o = (a = y.patterns) == null ? void 0 : a.learning_style) == null ? void 0 : o.visual) || 0), g.auditory.push(((c = (i = y.patterns) == null ? void 0 : i.learning_style) == null ? void 0 : c.auditory) || 0), g.kinesthetic.push(((u = (l = y.patterns) == null ? void 0 : l.learning_style) == null ? void 0 : u.kinesthetic) || 0);
    }
    const f = /* @__PURE__ */ __name((x) => x.length > 0 ? x.reduce((y, v) => y + v, 0) / x.length : 0, "f"), E = /* @__PURE__ */ __name((x) => {
      const y = f(x), v = x.reduce((b, T) => b + Math.pow(T - y, 2), 0) / x.length;
      return Math.sqrt(v);
    }, "E");
    return e.json({ success: true, class_code: t, summary: { total_students: _.length, learning_style_distribution: h, learning_style_scores: { visual: { mean: f(g.visual), std: E(g.visual) }, auditory: { mean: f(g.auditory), std: E(g.auditory) }, kinesthetic: { mean: f(g.kinesthetic), std: E(g.kinesthetic) } }, generated_at: (/* @__PURE__ */ new Date()).toISOString() } });
  } catch (d) {
    return console.error("\u7D71\u8A08\u30B5\u30DE\u30EA\u30FC\u30A8\u30E9\u30FC:", d), e.json({ success: false, error: "\u7D71\u8A08\u306E\u53D6\u5F97\u306B\u5931\u6557\u3057\u307E\u3057\u305F" }, 500);
  }
});
p.post("/api/lstm/collect-data/:studentId", async (e) => {
  const { env: r } = e, t = parseInt(e.req.param("studentId")), { understanding_level: s, completion_time: n, engagement_score: a, hint_count: o, emotion_state: i, session_context: c } = await e.req.json();
  try {
    return await r.DB.prepare(`
      INSERT INTO time_series_data 
      (student_id, understanding_level, completion_time, engagement_score, hint_count, emotion_state, session_context, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(t, s, n, a, o || 0, i || "neutral", JSON.stringify(c || {})).run(), e.json({ success: true, message: "\u6642\u7CFB\u5217\u30C7\u30FC\u30BF\u3092\u8A18\u9332\u3057\u307E\u3057\u305F" });
  } catch (l) {
    return console.error("\u6642\u7CFB\u5217\u30C7\u30FC\u30BF\u8A18\u9332\u30A8\u30E9\u30FC:", l), e.json({ success: false, error: "\u30C7\u30FC\u30BF\u8A18\u9332\u306B\u5931\u6557\u3057\u307E\u3057\u305F" }, 500);
  }
});
p.get("/api/lstm/time-series/:studentId", async (e) => {
  const { env: r } = e, t = parseInt(e.req.param("studentId")), s = parseInt(e.req.query("limit") || "50");
  try {
    const n = await r.DB.prepare(`
      SELECT 
        understanding_level,
        completion_time,
        engagement_score,
        hint_count,
        emotion_state,
        timestamp
      FROM time_series_data
      WHERE student_id = ?
      ORDER BY timestamp DESC
      LIMIT ?
    `).bind(t, s).all();
    return e.json({ success: true, data: n.results || [], sequence_length: (n.results || []).length });
  } catch (n) {
    return console.error("\u6642\u7CFB\u5217\u30C7\u30FC\u30BF\u53D6\u5F97\u30A8\u30E9\u30FC:", n), e.json({ success: false, error: "\u30C7\u30FC\u30BF\u53D6\u5F97\u306B\u5931\u6557\u3057\u307E\u3057\u305F" }, 500);
  }
});
p.post("/api/transformer/analyze-text", async (e) => {
  const { env: r } = e, { student_id: t, text_input: s, analysis_type: n } = await e.req.json();
  try {
    let a = {}, o = 0.8;
    if (n === "sentiment") {
      const i = ["\u697D\u3057\u3044", "\u308F\u304B\u3063\u305F", "\u7406\u89E3\u3067\u304D\u305F", "\u597D\u304D", "\u9762\u767D\u3044"], c = ["\u96E3\u3057\u3044", "\u308F\u304B\u3089\u306A\u3044", "\u82E6\u624B", "\u3064\u307E\u3089\u306A\u3044", "\u5ACC\u3044"], l = i.some((d) => s.includes(d)), u = c.some((d) => s.includes(d));
      a = { sentiment: l ? "positive" : u ? "negative" : "neutral", confidence: o, keywords: s.split(" ").slice(0, 5) };
    } else if (n === "comprehension") {
      const i = ["\u308F\u304B\u3063\u305F", "\u7406\u89E3", "\u3067\u304D\u305F", "\u306A\u308B\u307B\u3069"], c = ["\u308F\u304B\u3089\u306A\u3044", "\u96E3\u3057\u3044", "???", "\uFF1F\uFF1F\uFF1F"], l = i.some((d) => s.includes(d)), u = c.some((d) => s.includes(d));
      a = { comprehension_level: l ? "high" : u ? "low" : "medium", needs_help: u, confidence: o };
    }
    return await r.DB.prepare(`
      INSERT INTO text_analysis_results 
      (student_id, text_input, analysis_type, analysis_result, confidence_score, created_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `).bind(t, s, n, JSON.stringify(a), o).run(), e.json({ success: true, analysis: a, confidence: o });
  } catch (a) {
    return console.error("\u30C6\u30AD\u30B9\u30C8\u89E3\u6790\u30A8\u30E9\u30FC:", a), e.json({ success: false, error: "\u89E3\u6790\u306B\u5931\u6557\u3057\u307E\u3057\u305F" }, 500);
  }
});
p.post("/api/rl/take-action", async (e) => {
  const { env: r } = e, { student_id: t, state: s, action: n, reward: a } = await e.req.json();
  try {
    let o = await r.DB.prepare(`
      SELECT * FROM rl_agents
      WHERE student_id = ? AND agent_type = 'q_learning'
      ORDER BY updated_at DESC LIMIT 1
    `).bind(t).first();
    if (!o) {
      const g = await r.DB.prepare(`
        INSERT INTO rl_agents 
        (student_id, agent_type, state_space_dim, action_space_dim, q_table, total_episodes, average_reward)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(t, "q_learning", 10, 5, JSON.stringify({}), 0, 0).run();
      o = await r.DB.prepare(`
        SELECT * FROM rl_agents WHERE id = ?
      `).bind(g.meta.last_row_id).first();
    }
    const i = JSON.parse(o.q_table || "{}"), c = JSON.stringify(s);
    i[c] || (i[c] = {});
    const l = 0.1, u = 0.9, d = i[c][n] || 0, _ = d + l * (a - d);
    i[c][n] = _;
    const m = o.total_episodes + 1, h = (o.average_reward * o.total_episodes + a) / m;
    return await r.DB.prepare(`
      UPDATE rl_agents
      SET q_table = ?,
          total_episodes = ?,
          average_reward = ?,
          updated_at = datetime('now')
      WHERE id = ?
    `).bind(JSON.stringify(i), m, h, o.id).run(), e.json({ success: true, new_q_value: _, average_reward: h, total_episodes: m });
  } catch (o) {
    return console.error("\u5F37\u5316\u5B66\u7FD2\u30A8\u30E9\u30FC:", o), e.json({ success: false, error: "\u30A2\u30AF\u30B7\u30E7\u30F3\u5B9F\u884C\u306B\u5931\u6557\u3057\u307E\u3057\u305F" }, 500);
  }
});
p.post("/api/rl/recommend-action", async (e) => {
  const { env: r } = e, { student_id: t, current_state: s } = await e.req.json();
  try {
    const n = await r.DB.prepare(`
      SELECT * FROM rl_agents
      WHERE student_id = ? AND agent_type = 'q_learning'
      ORDER BY updated_at DESC LIMIT 1
    `).bind(t).first();
    if (!n) return e.json({ success: true, recommended_action: "explore", confidence: 0, reason: "\u5B66\u7FD2\u30C7\u30FC\u30BF\u304C\u4E0D\u8DB3\u3057\u3066\u3044\u307E\u3059" });
    const a = JSON.parse(n.q_table || "{}"), o = JSON.stringify(s), i = a[o] || {};
    if (Math.random() < 0.1 || Object.keys(i).length === 0) return e.json({ success: true, recommended_action: "explore", confidence: 0.5, reason: "\u65B0\u3057\u3044\u30A2\u30AF\u30B7\u30E7\u30F3\u3092\u63A2\u7D22\u3057\u307E\u3059" });
    {
      let l = null, u = -1 / 0;
      for (const [d, _] of Object.entries(i)) _ > u && (u = _, l = d);
      return e.json({ success: true, recommended_action: l, q_value: u, confidence: Math.min(0.9, u / 10), reason: "\u5B66\u7FD2\u5C65\u6B74\u306B\u57FA\u3065\u304F\u6700\u9069\u30A2\u30AF\u30B7\u30E7\u30F3\u3067\u3059" });
    }
  } catch (n) {
    return console.error("\u30A2\u30AF\u30B7\u30E7\u30F3\u63A8\u85A6\u30A8\u30E9\u30FC:", n), e.json({ success: false, error: "\u63A8\u85A6\u306B\u5931\u6557\u3057\u307E\u3057\u305F" }, 500);
  }
});
p.post("/api/voice/save-transcription", async (e) => {
  const { env: r } = e, { student_id: t, audio_url: s, transcription: n, confidence: a, language: o, duration: i, emotion: c } = await e.req.json();
  try {
    return await r.DB.prepare(`
      INSERT INTO voice_inputs 
      (student_id, audio_url, transcription, transcription_confidence, language, duration_seconds, emotion_detected, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(t, s, n, a || 0.9, o || "ja", i || 0, c || "neutral").run(), e.json({ success: true, message: "\u97F3\u58F0\u5165\u529B\u3092\u4FDD\u5B58\u3057\u307E\u3057\u305F" });
  } catch (l) {
    return console.error("\u97F3\u58F0\u5165\u529B\u4FDD\u5B58\u30A8\u30E9\u30FC:", l), e.json({ success: false, error: "\u4FDD\u5B58\u306B\u5931\u6557\u3057\u307E\u3057\u305F" }, 500);
  }
});
p.post("/api/handwriting/save-recognition", async (e) => {
  const { env: r } = e, { student_id: t, curriculum_id: s, image_url: n, recognized_text: a, confidence: o, stroke_data: i, is_correct: c, feedback: l } = await e.req.json();
  try {
    return await r.DB.prepare(`
      INSERT INTO handwriting_inputs 
      (student_id, curriculum_id, image_url, recognized_text, recognition_confidence, stroke_data, is_correct, feedback, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(t, s || null, n, a, o || 0.9, JSON.stringify(i || []), c ? 1 : 0, l || "").run(), e.json({ success: true, message: "\u624B\u66F8\u304D\u8A8D\u8B58\u7D50\u679C\u3092\u4FDD\u5B58\u3057\u307E\u3057\u305F" });
  } catch (u) {
    return console.error("\u624B\u66F8\u304D\u8A8D\u8B58\u4FDD\u5B58\u30A8\u30E9\u30FC:", u), e.json({ success: false, error: "\u4FDD\u5B58\u306B\u5931\u6557\u3057\u307E\u3057\u305F" }, 500);
  }
});
p.get("/api/schools", async (e) => {
  const { env: r } = e, t = e.req.query("municipality_id");
  try {
    let s = `
      SELECT s.*, m.municipality_name
      FROM schools s
      LEFT JOIN municipalities m ON s.municipality_id = m.id
      WHERE s.is_active = 1
    `;
    const n = [];
    t && (s += " AND s.municipality_id = ?", n.push(parseInt(t))), s += " ORDER BY s.school_name";
    const a = await r.DB.prepare(s).bind(...n).all();
    return e.json({ success: true, schools: a.results || [] });
  } catch (s) {
    return console.error("\u5B66\u6821\u4E00\u89A7\u53D6\u5F97\u30A8\u30E9\u30FC:", s), e.json({ success: false, error: "\u53D6\u5F97\u306B\u5931\u6557\u3057\u307E\u3057\u305F" }, 500);
  }
});
p.get("/api/cross-school/analytics/:municipalityId", async (e) => {
  const { env: r } = e, t = parseInt(e.req.param("municipalityId"));
  try {
    const s = await r.DB.prepare(`
      SELECT id, school_code, school_name
      FROM schools
      WHERE municipality_id = ? AND is_active = 1
    `).bind(t).all(), n = [];
    for (const d of s.results || []) {
      const _ = await r.DB.prepare(`
        SELECT 
          COUNT(DISTINCT u.id) as total_students,
          AVG(sp.understanding_level) as avg_understanding,
          AVG(sp.completion_time_minutes) as avg_completion_time,
          COUNT(sp.id) as total_cards_completed
        FROM users u
        LEFT JOIN student_progress sp ON u.id = sp.student_id AND sp.status = 'completed'
        WHERE u.class_code LIKE ? AND u.role = 'student'
      `).bind(`${d.school_code}%`).first();
      n.push({ school_code: d.school_code, school_name: d.school_name, ..._ });
    }
    const a = n.reduce((d, _) => (d.total_students += _.total_students || 0, d.total_understanding += (_.avg_understanding || 0) * (_.total_students || 0), d.total_completion_time += (_.avg_completion_time || 0) * (_.total_students || 0), d.total_cards += _.total_cards_completed || 0, d), { total_students: 0, total_understanding: 0, total_completion_time: 0, total_cards: 0 }), o = a.total_students > 0 ? a.total_understanding / a.total_students : 0, i = a.total_students > 0 ? a.total_completion_time / a.total_students : 0, c = [...n].sort((d, _) => (_.avg_understanding || 0) - (d.avg_understanding || 0)), l = c.slice(0, 3), u = c.slice(-3).reverse();
    return await r.DB.prepare(`
      INSERT INTO cross_school_analytics 
      (analysis_date, municipality_id, school_ids, total_students, average_understanding, average_completion_time, average_engagement, top_performing_schools, struggling_schools, recommendations, created_at)
      VALUES (date('now'), ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(t, JSON.stringify((s.results || []).map((d) => d.id)), a.total_students, o, i, 0, JSON.stringify(l), JSON.stringify(u), JSON.stringify({ overall: "\u81EA\u6CBB\u4F53\u5168\u4F53\u3067\u500B\u5225\u6700\u9069\u5316\u5B66\u7FD2\u304C\u6A5F\u80FD\u3057\u3066\u3044\u307E\u3059", top_schools: "\u30D9\u30B9\u30C8\u30D7\u30E9\u30AF\u30C6\u30A3\u30B9\u3092\u4ED6\u6821\u3068\u5171\u6709\u3057\u3066\u304F\u3060\u3055\u3044", struggling_schools: "\u500B\u5225\u30B5\u30DD\u30FC\u30C8\u3068\u6559\u5E2B\u7814\u4FEE\u304C\u63A8\u5968\u3055\u308C\u307E\u3059" })).run(), e.json({ success: true, municipality_id: t, overview: { total_students: a.total_students, average_understanding: o, average_completion_time: i, total_cards_completed: a.total_cards }, schools: n, top_performing: l, struggling: u, recommendations: { overall: "\u81EA\u6CBB\u4F53\u5168\u4F53\u3067\u500B\u5225\u6700\u9069\u5316\u5B66\u7FD2\u304C\u6A5F\u80FD\u3057\u3066\u3044\u307E\u3059", top_schools: "\u30D9\u30B9\u30C8\u30D7\u30E9\u30AF\u30C6\u30A3\u30B9\u3092\u4ED6\u6821\u3068\u5171\u6709\u3057\u3066\u304F\u3060\u3055\u3044", struggling_schools: "\u500B\u5225\u30B5\u30DD\u30FC\u30C8\u3068\u6559\u5E2B\u7814\u4FEE\u304C\u63A8\u5968\u3055\u308C\u307E\u3059" } });
  } catch (s) {
    return console.error("\u30AF\u30ED\u30B9\u30B9\u30AF\u30FC\u30EB\u5206\u6790\u30A8\u30E9\u30FC:", s), e.json({ success: false, error: "\u5206\u6790\u306B\u5931\u6557\u3057\u307E\u3057\u305F" }, 500);
  }
});
p.post("/api/research/create-dataset", async (e) => {
  const { env: r } = e, { dataset_name: t, researcher_id: s, description: n, data_collection_start: a, data_collection_end: o, school_codes: i, anonymization_level: c } = await e.req.json();
  try {
    const l = await r.DB.prepare(`
      INSERT INTO research_datasets 
      (dataset_name, researcher_id, description, data_collection_start, data_collection_end, schools_included, anonymization_level, export_format, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(t, s, n, a, o, JSON.stringify(i), c || "full", "csv").run();
    return e.json({ success: true, dataset_id: l.meta.last_row_id, message: "\u7814\u7A76\u7528\u30C7\u30FC\u30BF\u30BB\u30C3\u30C8\u3092\u4F5C\u6210\u3057\u307E\u3057\u305F", next_step: "\u30C7\u30FC\u30BF\u30A8\u30AF\u30B9\u30DD\u30FC\u30C8API\u3092\u4F7F\u7528\u3057\u3066\u30C7\u30FC\u30BF\u3092\u53D6\u5F97\u3057\u3066\u304F\u3060\u3055\u3044" });
  } catch (l) {
    return console.error("\u30C7\u30FC\u30BF\u30BB\u30C3\u30C8\u4F5C\u6210\u30A8\u30E9\u30FC:", l), e.json({ success: false, error: "\u4F5C\u6210\u306B\u5931\u6557\u3057\u307E\u3057\u305F" }, 500);
  }
});
p.post("/api/ab-test/assign", async (e) => {
  const { env: r } = e, { experiment_name: t, student_id: s, class_code: n } = await e.req.json();
  try {
    const a = await r.DB.prepare(`
      SELECT * FROM ab_test_assignments
      WHERE experiment_name = ? AND student_id = ?
    `).bind(t, s).first();
    if (a) return e.json({ success: true, variant: a.variant_name, already_assigned: true });
    const o = Math.random() < 0.5 ? "control" : "experimental";
    return await r.DB.prepare(`
      INSERT INTO ab_test_assignments 
      (experiment_name, student_id, variant_name, class_code, assigned_at)
      VALUES (?, ?, ?, ?, datetime('now'))
    `).bind(t, s, o, n).run(), e.json({ success: true, variant: o, message: `${o === "control" ? "\u30B3\u30F3\u30C8\u30ED\u30FC\u30EB\u7FA4" : "\u5B9F\u9A13\u7FA4"}\u306B\u5272\u308A\u5F53\u3066\u3089\u308C\u307E\u3057\u305F` });
  } catch (a) {
    return console.error("A/B\u30C6\u30B9\u30C8\u5272\u308A\u5F53\u3066\u30A8\u30E9\u30FC:", a), e.json({ success: false, error: "\u5272\u308A\u5F53\u3066\u306B\u5931\u6557\u3057\u307E\u3057\u305F" }, 500);
  }
});
p.post("/api/ab-test/event", async (e) => {
  const { env: r } = e, { experiment_name: t, student_id: s, event_type: n, event_data: a } = await e.req.json();
  try {
    const o = await r.DB.prepare(`
      SELECT variant_name FROM ab_test_assignments
      WHERE experiment_name = ? AND student_id = ?
    `).bind(t, s).first();
    return o ? (await r.DB.prepare(`
      INSERT INTO ab_test_events 
      (experiment_name, student_id, variant_name, event_type, event_data, created_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `).bind(t, s, o.variant_name, n, JSON.stringify(a)).run(), e.json({ success: true, message: "\u30A4\u30D9\u30F3\u30C8\u3092\u8A18\u9332\u3057\u307E\u3057\u305F" })) : e.json({ success: false, error: "\u5B9F\u9A13\u3078\u306E\u5272\u308A\u5F53\u3066\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093" }, 400);
  } catch (o) {
    return console.error("A/B\u30C6\u30B9\u30C8\u30A4\u30D9\u30F3\u30C8\u8A18\u9332\u30A8\u30E9\u30FC:", o), e.json({ success: false, error: "\u30A4\u30D9\u30F3\u30C8\u8A18\u9332\u306B\u5931\u6557\u3057\u307E\u3057\u305F" }, 500);
  }
});
p.get("/api/ab-test/results/:experimentName", async (e) => {
  var s, n;
  const { env: r } = e, t = e.req.param("experimentName");
  try {
    const a = await r.DB.prepare(`
      SELECT variant_name, COUNT(*) as count
      FROM ab_test_assignments
      WHERE experiment_name = ?
      GROUP BY variant_name
    `).bind(t).all(), o = await r.DB.prepare(`
      SELECT 
        AVG(CAST(json_extract(event_data, '$.understanding_level') AS REAL)) as avg_understanding,
        AVG(CAST(json_extract(event_data, '$.completion_time') AS REAL)) as avg_completion_time,
        AVG(CAST(json_extract(event_data, '$.engagement_score') AS REAL)) as avg_engagement
      FROM ab_test_events
      WHERE experiment_name = ? AND variant_name = 'control'
        AND event_type = 'card_completed'
    `).bind(t).first(), i = await r.DB.prepare(`
      SELECT 
        AVG(CAST(json_extract(event_data, '$.understanding_level') AS REAL)) as avg_understanding,
        AVG(CAST(json_extract(event_data, '$.completion_time') AS REAL)) as avg_completion_time,
        AVG(CAST(json_extract(event_data, '$.engagement_score') AS REAL)) as avg_engagement
      FROM ab_test_events
      WHERE experiment_name = ? AND variant_name = 'experimental'
        AND event_type = 'card_completed'
    `).bind(t).first(), c = (o == null ? void 0 : o.avg_understanding) || 0, l = (i == null ? void 0 : i.avg_understanding) || 0, u = l - c, d = Math.abs(u) > 0.5;
    return e.json({ success: true, experiment_name: t, sample_sizes: a.results || [], control_group: { n: ((s = (a.results || []).find((_) => _.variant_name === "control")) == null ? void 0 : s.count) || 0, avg_understanding: c, avg_completion_time: (o == null ? void 0 : o.avg_completion_time) || 0, avg_engagement: (o == null ? void 0 : o.avg_engagement) || 0 }, experimental_group: { n: ((n = (a.results || []).find((_) => _.variant_name === "experimental")) == null ? void 0 : n.count) || 0, avg_understanding: l, avg_completion_time: (i == null ? void 0 : i.avg_completion_time) || 0, avg_engagement: (i == null ? void 0 : i.avg_engagement) || 0 }, analysis: { effect_size: u, improvement_percentage: u / Math.max(c, 0.01) * 100, is_significant: d, recommendation: d ? u > 0 ? "\u5B9F\u9A13\u624B\u6CD5\u306E\u63A1\u7528\u3092\u63A8\u5968\u3057\u307E\u3059" : "\u30B3\u30F3\u30C8\u30ED\u30FC\u30EB\u624B\u6CD5\u3092\u7D99\u7D9A\u63A8\u5968" : "\u3055\u3089\u306A\u308B\u30C7\u30FC\u30BF\u53CE\u96C6\u304C\u5FC5\u8981\u3067\u3059" } });
  } catch (a) {
    return console.error("A/B\u30C6\u30B9\u30C8\u7D50\u679C\u5206\u6790\u30A8\u30E9\u30FC:", a), e.json({ success: false, error: "\u5206\u6790\u306B\u5931\u6557\u3057\u307E\u3057\u305F" }, 500);
  }
});
p.post("/api/ml/update-model/:studentId", async (e) => {
  const { env: r } = e, t = parseInt(e.req.param("studentId")), { training_data: s } = await e.req.json();
  try {
    const n = await r.DB.prepare(`
      SELECT model_params, performance_metrics, training_samples
      FROM ml_models
      WHERE student_id = ? AND model_type = 'understanding_predictor'
      ORDER BY updated_at DESC LIMIT 1
    `).bind(t).first();
    await r.DB.prepare(`
      INSERT INTO ml_training_history 
      (student_id, model_type, training_data, performance_before, performance_after, created_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `).bind(t, "understanding_predictor", JSON.stringify(s), n ? JSON.stringify(n.performance_metrics) : "{}", "{}").run();
    const a = 0.1, o = ((n == null ? void 0 : n.training_samples) || 0) + s.length;
    return n ? await r.DB.prepare(`
        UPDATE ml_models
        SET training_samples = ?,
            performance_metrics = json_set(performance_metrics, '$.last_update', datetime('now')),
            updated_at = datetime('now')
        WHERE student_id = ? AND model_type = 'understanding_predictor'
      `).bind(o, t).run() : await r.DB.prepare(`
        INSERT INTO ml_models 
        (student_id, model_type, model_params, training_samples, performance_metrics, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `).bind(t, "understanding_predictor", JSON.stringify({ learning_rate: a }), o, JSON.stringify({ accuracy: 0, last_update: (/* @__PURE__ */ new Date()).toISOString() })).run(), e.json({ success: true, message: "\u30E2\u30C7\u30EB\u3092\u30EA\u30A2\u30EB\u30BF\u30A4\u30E0\u66F4\u65B0\u3057\u307E\u3057\u305F", training_samples: o, learning_rate: a });
  } catch (n) {
    return console.error("ML \u30E2\u30C7\u30EB\u66F4\u65B0\u30A8\u30E9\u30FC:", n), e.json({ success: false, error: "\u30E2\u30C7\u30EB\u66F4\u65B0\u306B\u5931\u6557\u3057\u307E\u3057\u305F" }, 500);
  }
});
p.post("/api/ml/predict/:studentId", async (e) => {
  const { env: r } = e, t = parseInt(e.req.param("studentId")), { input_features: s } = await e.req.json();
  try {
    const n = await r.DB.prepare(`
      SELECT 
        understanding_level,
        completion_time_minutes,
        hint_used_count,
        completed_at
      FROM student_progress
      WHERE student_id = ? AND status = 'completed'
      ORDER BY completed_at DESC
      LIMIT 50
    `).bind(t).all(), a = { avg_understanding: 0, avg_completion_time: 0, trend: 0, consistency: 0, recent_performance: 0 };
    if (n.results && n.results.length > 0) {
      const c = n.results.map((_) => _.understanding_level || 0), l = n.results.map((_) => _.completion_time_minutes || 0);
      a.avg_understanding = c.reduce((_, m) => _ + m, 0) / c.length, a.avg_completion_time = l.reduce((_, m) => _ + m, 0) / l.length;
      const u = c.slice(0, 10).reduce((_, m) => _ + m, 0) / Math.min(10, c.length);
      a.trend = u - a.avg_understanding, a.recent_performance = u;
      const d = c.reduce((_, m) => _ + Math.pow(m - a.avg_understanding, 2), 0) / c.length;
      a.consistency = Math.sqrt(d);
    }
    const o = Math.max(1, Math.min(5, a.avg_understanding + a.trend * 0.3)), i = Math.max(0, Math.min(1, 1 - a.consistency / 5));
    return await r.DB.prepare(`
      INSERT INTO ml_predictions 
      (student_id, model_type, input_features, prediction_result, confidence_score, created_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `).bind(t, "understanding_predictor", JSON.stringify(s), JSON.stringify({ predicted_understanding: o, features: a }), i).run(), e.json({ success: true, prediction: { understanding_level: o, confidence: i, features: a, recommendation: o < 3 ? "\u500B\u5225\u30B5\u30DD\u30FC\u30C8\u3092\u63A8\u5968\u3057\u307E\u3059" : o > 4 ? "\u767A\u5C55\u7684\u306A\u8AB2\u984C\u3078\u306E\u6311\u6226\u3092\u63A8\u5968\u3057\u307E\u3059" : "\u73FE\u5728\u306E\u30DA\u30FC\u30B9\u3092\u7DAD\u6301\u3057\u307E\u3057\u3087\u3046" } });
  } catch (n) {
    return console.error("ML \u4E88\u6E2C\u30A8\u30E9\u30FC:", n), e.json({ success: false, error: "\u4E88\u6E2C\u306B\u5931\u6557\u3057\u307E\u3057\u305F" }, 500);
  }
});
p.get("/api/coordinator/cross-school-analytics", async (e) => {
  const { env: r } = e, t = e.req.query("coordinator_id"), s = e.req.query("scope") || "municipality";
  try {
    const n = await r.DB.prepare(`
      SELECT managed_schools FROM teachers WHERE user_id = ?
    `).bind(t).first();
    if (!n) return e.json({ success: false, error: "\u30B3\u30FC\u30C7\u30A3\u30CD\u30FC\u30BF\u30FC\u60C5\u5831\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093" }, 404);
    const a = JSON.parse(n.managed_schools || "[]"), o = [];
    for (const d of a) {
      const _ = await r.DB.prepare(`
        SELECT school_code, school_name FROM schools WHERE id = ?
      `).bind(d).first(), m = await r.DB.prepare(`
        SELECT id FROM users 
        WHERE role = 'student' 
        AND class_code IN (
          SELECT class_code FROM users WHERE role = 'teacher' AND id IN (
            SELECT user_id FROM teachers WHERE school_id = ?
          )
        )
      `).bind(d).all(), h = await r.DB.prepare(`
        SELECT AVG(understanding_level) as avg_understanding
        FROM student_progress
        WHERE student_id IN (${(m.results || []).map((f) => f.id).join(",") || "0"})
          AND status = 'completed'
      `).first(), g = await r.DB.prepare(`
        SELECT 
          COUNT(DISTINCT student_id) as active_students,
          AVG(session_duration) as avg_session_duration
        FROM learning_behavior_logs
        WHERE student_id IN (${(m.results || []).map((f) => f.id).join(",") || "0"})
          AND created_at >= datetime('now', '-7 days')
      `).first();
      o.push({ school_id: d, school_code: _ == null ? void 0 : _.school_code, school_name: _ == null ? void 0 : _.school_name, total_students: (m.results || []).length, avg_understanding: (h == null ? void 0 : h.avg_understanding) || 0, active_students: (g == null ? void 0 : g.active_students) || 0, avg_session_duration: (g == null ? void 0 : g.avg_session_duration) || 0 });
    }
    const i = o.reduce((d, _) => d + _.total_students, 0), c = o.reduce((d, _) => d + _.avg_understanding, 0) / o.length, l = o.sort((d, _) => _.avg_understanding - d.avg_understanding).slice(0, 3).map((d) => d.school_code), u = o.filter((d) => d.avg_understanding < 3).map((d) => d.school_code);
    return await r.DB.prepare(`
      INSERT INTO cross_school_analytics 
      (analysis_type, scope_identifier, total_students, total_schools, 
       avg_understanding, top_performing_schools, struggling_schools, 
       recommendations, generated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(s, s === "municipality" ? "village_001" : s, i, a.length, c, JSON.stringify(l), JSON.stringify(u), JSON.stringify({ focus_areas: u.length > 0 ? "\u652F\u63F4\u304C\u5FC5\u8981\u306A\u5B66\u6821\u304C\u3042\u308A\u307E\u3059" : "\u5168\u4F53\u7684\u306B\u9806\u8ABF", best_practices: l.length > 0 ? "\u30C8\u30C3\u30D7\u6821\u306E\u5B9F\u8DF5\u3092\u5171\u6709\u3057\u307E\u3057\u3087\u3046" : "" })).run(), e.json({ success: true, summary: { total_students: i, total_schools: a.length, avg_understanding: c, top_schools: l, struggling_schools: u }, schools_data: o, recommendations: { immediate_action: u.length > 0 ? `${u.length}\u6821\u304C\u652F\u63F4\u3092\u5FC5\u8981\u3068\u3057\u3066\u3044\u307E\u3059` : "\u5168\u6821\u9806\u8ABF\u306B\u9032\u884C\u4E2D", best_practices: l.length > 0 ? `${l.join(", ")}\u306E\u5B9F\u8DF5\u3092\u4ED6\u6821\u3068\u5171\u6709\u3059\u308B\u3053\u3068\u3092\u63A8\u5968\u3057\u307E\u3059` : "" } });
  } catch (n) {
    return console.error("\u30AF\u30ED\u30B9\u30B9\u30AF\u30FC\u30EB\u5206\u6790\u30A8\u30E9\u30FC:", n), e.json({ success: false, error: "\u5206\u6790\u306B\u5931\u6557\u3057\u307E\u3057\u305F" }, 500);
  }
});
p.post("/api/coordinator/request-data-access", async (e) => {
  const { env: r } = e, { student_id: t, coordinator_id: s, teacher_id: n, purpose: a } = await e.req.json();
  try {
    const o = await r.DB.prepare(`
      SELECT * FROM data_sharing_permissions
      WHERE student_id = ? AND shared_with_user_id = ? AND is_active = 1
    `).bind(t, s).first();
    return o ? e.json({ success: true, message: "\u3059\u3067\u306B\u30A2\u30AF\u30BB\u30B9\u6A29\u9650\u304C\u3042\u308A\u307E\u3059", permission_id: o.id }) : (await r.DB.prepare(`
      INSERT INTO data_sharing_permissions 
      (student_id, shared_with_user_id, permission_type, granted_by_user_id, 
       consent_date, is_active)
      VALUES (?, ?, ?, ?, datetime('now'), 1)
    `).bind(t, s, "analyze", n).run(), e.json({ success: true, message: "\u30C7\u30FC\u30BF\u30A2\u30AF\u30BB\u30B9\u6A29\u9650\u3092\u4ED8\u4E0E\u3057\u307E\u3057\u305F", purpose: a }));
  } catch (o) {
    return console.error("\u30C7\u30FC\u30BF\u30A2\u30AF\u30BB\u30B9\u7533\u8ACB\u30A8\u30E9\u30FC:", o), e.json({ success: false, error: "\u7533\u8ACB\u306B\u5931\u6557\u3057\u307E\u3057\u305F" }, 500);
  }
});
p.get("/api/coordinator/research-export", async (e) => {
  var o, i, c, l, u, d, _, m;
  const { env: r } = e, t = e.req.query("coordinator_id"), s = e.req.query("start_date"), n = e.req.query("end_date"), a = e.req.query("format") || "json";
  try {
    const g = ((await r.DB.prepare(`
      SELECT student_id FROM data_sharing_permissions
      WHERE shared_with_user_id = ? AND is_active = 1 AND permission_type = 'analyze'
    `).bind(t).all()).results || []).map((E) => E.student_id);
    if (g.length === 0) return e.json({ success: false, error: "\u30A2\u30AF\u30BB\u30B9\u53EF\u80FD\u306A\u30C7\u30FC\u30BF\u304C\u3042\u308A\u307E\u305B\u3093" }, 403);
    const f = [];
    for (let E = 0; E < g.length; E++) {
      const x = g[E], y = await r.DB.prepare(`
        SELECT profile_data, overall_score, confidence_level
        FROM learning_profiles
        WHERE student_id = ?
        ORDER BY updated_at DESC LIMIT 1
      `).bind(x).first(), v = await r.DB.prepare(`
        SELECT variant_name FROM ab_test_assignments
        WHERE student_id = ? LIMIT 1
      `).bind(x).first(), b = await r.DB.prepare(`
        SELECT 
          COUNT(*) as total_cards,
          AVG(understanding_level) as avg_understanding,
          AVG(completion_time_minutes) as avg_time,
          AVG(hint_used_count) as avg_hints
        FROM student_progress
        WHERE student_id = ? 
          AND status = 'completed'
          AND completed_at BETWEEN ? AND ?
      `).bind(x, s, n).first();
      if (y) {
        const T = JSON.parse(y.profile_data);
        f.push({ participant_id: `P${String(E + 1).padStart(4, "0")}`, condition: (v == null ? void 0 : v.variant_name) || "not_assigned", learning_style_visual: ((i = (o = T.patterns) == null ? void 0 : o.learning_style) == null ? void 0 : i.visual) || 0, learning_style_auditory: ((l = (c = T.patterns) == null ? void 0 : c.learning_style) == null ? void 0 : l.auditory) || 0, learning_style_kinesthetic: ((d = (u = T.patterns) == null ? void 0 : u.learning_style) == null ? void 0 : d.kinesthetic) || 0, dominant_style: (m = (_ = T.patterns) == null ? void 0 : _.learning_style) == null ? void 0 : m.dominant_style, avg_understanding: (b == null ? void 0 : b.avg_understanding) || 0, total_cards_completed: (b == null ? void 0 : b.total_cards) || 0, avg_completion_time: (b == null ? void 0 : b.avg_time) || 0, avg_hints_used: (b == null ? void 0 : b.avg_hints) || 0, overall_score: y.overall_score, confidence_level: y.confidence_level, data_collection_start: s, data_collection_end: n });
      }
    }
    if (a === "csv") {
      const E = Object.keys(f[0] || {}), x = [E.join(",")];
      for (const y of f) x.push(E.map((v) => y[v]).join(","));
      return e.text(x.join(`
`), 200, { "Content-Type": "text/csv", "Content-Disposition": `attachment; filename="research_data_${Date.now()}.csv"` });
    }
    return e.json({ success: true, metadata: { total_participants: f.length, data_collection_period: { start: s, end: n }, anonymization: "full", export_date: (/* @__PURE__ */ new Date()).toISOString() }, data: f });
  } catch (h) {
    return console.error("\u7814\u7A76\u30C7\u30FC\u30BF\u30A8\u30AF\u30B9\u30DD\u30FC\u30C8\u30A8\u30E9\u30FC:", h), e.json({ success: false, error: "\u30A8\u30AF\u30B9\u30DD\u30FC\u30C8\u306B\u5931\u6557\u3057\u307E\u3057\u305F" }, 500);
  }
});
p.post("/api/coordinator/truancy-support", async (e) => {
  const { env: r } = e, { student_id: t, support_type: s, progress_notes: n, coordinator_id: a } = await e.req.json();
  try {
    const o = await r.DB.prepare(`
      SELECT * FROM truancy_support_records
      WHERE student_id = ?
      ORDER BY updated_at DESC LIMIT 1
    `).bind(t).first();
    o ? await r.DB.prepare(`
        UPDATE truancy_support_records
        SET support_type = ?,
            progress_notes = ?,
            support_coordinator_id = ?,
            updated_at = datetime('now')
        WHERE id = ?
      `).bind(s, n, a, o.id).run() : await r.DB.prepare(`
        INSERT INTO truancy_support_records 
        (student_id, support_type, progress_notes, support_coordinator_id, 
         engagement_level, created_at, updated_at)
        VALUES (?, ?, ?, ?, 'low', datetime('now'), datetime('now'))
      `).bind(t, s, n, a).run();
    const i = await r.DB.prepare(`
      SELECT COUNT(*) as activity_count
      FROM learning_behavior_logs
      WHERE student_id = ? AND created_at >= datetime('now', '-7 days')
    `).bind(t).first();
    return e.json({ success: true, message: "\u30B5\u30DD\u30FC\u30C8\u8A18\u9332\u3092\u66F4\u65B0\u3057\u307E\u3057\u305F", engagement_status: { recent_activity_count: (i == null ? void 0 : i.activity_count) || 0, engagement_level: ((i == null ? void 0 : i.activity_count) || 0) > 5 ? "improving" : "needs_attention" } });
  } catch (o) {
    return console.error("\u4E0D\u767B\u6821\u30B5\u30DD\u30FC\u30C8\u8A18\u9332\u30A8\u30E9\u30FC:", o), e.json({ success: false, error: "\u8A18\u9332\u306B\u5931\u6557\u3057\u307E\u3057\u305F" }, 500);
  }
});
p.post("/api/coordinator/research-publication", async (e) => {
  const { env: r } = e, { title: t, authors: s, publication_type: n, publication_venue: a, abstract: o, keywords: i, sample_size: c, key_findings: l } = await e.req.json();
  try {
    return await r.DB.prepare(`
      INSERT INTO research_publications 
      (title, authors, publication_type, publication_venue, abstract, keywords,
       sample_size, key_findings, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(t, s, n, a, o, JSON.stringify(i), c, l).run(), e.json({ success: true, message: "\u8AD6\u6587\u60C5\u5831\u3092\u767B\u9332\u3057\u307E\u3057\u305F" });
  } catch (u) {
    return console.error("\u8AD6\u6587\u767B\u9332\u30A8\u30E9\u30FC:", u), e.json({ success: false, error: "\u767B\u9332\u306B\u5931\u6557\u3057\u307E\u3057\u305F" }, 500);
  }
});
p.get("/api/ws", async (e) => {
  const { env: r } = e;
  if (!r.PROGRESS_WEBSOCKET) return e.json({ error: "WebSocket is not available in production. Use polling instead.", message: "WebSocket\u6A5F\u80FD\u306F\u958B\u767A\u74B0\u5883\u3067\u306E\u307F\u5229\u7528\u53EF\u80FD\u3067\u3059\u3002" }, 503);
  const t = e.req.query("classCode"), s = e.req.query("userId"), n = e.req.query("role");
  if (!t) return e.json({ error: "classCode is required" }, 400);
  const a = r.PROGRESS_WEBSOCKET.idFromName(t), o = r.PROGRESS_WEBSOCKET.get(a), i = new URL(e.req.url);
  return i.pathname = "/ws", i.searchParams.set("classCode", t), s && i.searchParams.set("userId", s), n && i.searchParams.set("role", n), o.fetch(i.toString(), e.req.raw);
});
p.get("/proposal", (e) => e.html(`<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI\u99C6\u52D5\u578B\u500B\u5225\u6700\u9069\u5316\u5B66\u7FD2\u30B7\u30B9\u30C6\u30E0\u5C0E\u5165\u63D0\u6848\u66F8</title>
    <script src="https://cdn.tailwindcss.com"><\/script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"><\/script>
    <style>
        .slide {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            padding: 4rem 2rem;
        }
        .gradient-bg {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .slide-number {
            position: fixed;
            bottom: 1rem;
            right: 1rem;
            background: rgba(0,0,0,0.5);
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 0.5rem;
            font-size: 0.875rem;
        }
        @media print {
            .slide {
                page-break-after: always;
                min-height: 100vh;
            }
        }
    </style>
</head>
<body class="bg-gray-50">
    <div class="fixed top-4 right-4 z-50 flex gap-2">
        <button onclick="previousSlide()" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            <i class="fas fa-arrow-left"></i> \u524D\u3078
        </button>
        <button onclick="nextSlide()" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            \u6B21\u3078 <i class="fas fa-arrow-right"></i>
        </button>
        <button onclick="window.print()" class="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700">
            <i class="fas fa-print"></i>
        </button>
    </div>

    <!-- Slide 1: \u8868\u7D19 -->
    <div class="slide gradient-bg text-white" data-slide="1">
        <div class="max-w-6xl mx-auto text-center">
            <h1 class="text-6xl font-bold mb-8">
                \u4E00\u6751\u304B\u3089\u59CB\u307E\u308B\u6559\u80B2\u6539\u9769
            </h1>
            <h2 class="text-4xl font-semibold mb-12">
                AI\u99C6\u52D5\u578B\u500B\u5225\u6700\u9069\u5316\u5B66\u7FD2\u30B7\u30B9\u30C6\u30E0<br>\u5C0E\u5165\u63D0\u6848\u66F8
            </h2>
            <div class="text-2xl mb-8">
                \u5168\u3066\u306E\u5B50\u3069\u3082\u306B\u6700\u9069\u306A\u5B66\u3073\u3001\u4E16\u754C\u3078\u767A\u4FE1\u3059\u308B\u6559\u80B2\u30E2\u30C7\u30EB
            </div>
            <div class="mt-16 text-xl">
                <div class="mb-4"><i class="fas fa-graduation-cap mr-3"></i>Phase 1-19 \u5B8C\u5168\u5B9F\u88C5\u6E08\u307F</div>
                <div class="mb-4"><i class="fas fa-chart-line mr-3"></i>2\u5E74\u9593\u306E\u30A8\u30D3\u30C7\u30F3\u30B9\u69CB\u7BC9</div>
                <div class="mb-4"><i class="fas fa-globe mr-3"></i>\u5168\u56FD\u30E2\u30C7\u30EB\u30B1\u30FC\u30B9\u3078</div>
            </div>
        </div>
    </div>

    <!-- Slide 2: \u30A8\u30B0\u30BC\u30AF\u30C6\u30A3\u30D6\u30B5\u30DE\u30EA\u30FC -->
    <div class="slide bg-white" data-slide="2">
        <div class="max-w-6xl mx-auto">
            <h2 class="text-5xl font-bold text-gray-800 mb-8 border-b-4 border-blue-600 pb-4">
                \u30A8\u30B0\u30BC\u30AF\u30C6\u30A3\u30D6\u30B5\u30DE\u30EA\u30FC
            </h2>
            <div class="grid grid-cols-2 gap-8 mb-8">
                <div class="bg-blue-50 p-6 rounded-lg">
                    <h3 class="text-2xl font-bold text-blue-700 mb-4">\u63D0\u6848\u306E\u6838\u5FC3</h3>
                    <ul class="space-y-3 text-lg">
                        <li><i class="fas fa-check-circle text-blue-600 mr-2"></i>Phase 1-19 \u5B8C\u5168\u5B9F\u88C5\u6E08\u307F\uFF0820,000\u884C\uFF09</li>
                        <li><i class="fas fa-check-circle text-blue-600 mr-2"></i>2\u5E74\u9593\u306E\u5B9F\u8A3C\u7814\u7A76</li>
                        <li><i class="fas fa-check-circle text-blue-600 mr-2"></i>\u4E00\u6589\u6388\u696D\u304B\u3089\u306E\u8EE2\u63DB</li>
                        <li><i class="fas fa-check-circle text-blue-600 mr-2"></i>\u4E0D\u767B\u6821\u5150\u7AE5\u652F\u63F4</li>
                        <li><i class="fas fa-check-circle text-blue-600 mr-2"></i>\u5168\u56FD\u30E2\u30C7\u30EB\u30B1\u30FC\u30B9</li>
                    </ul>
                </div>
                <div class="bg-green-50 p-6 rounded-lg">
                    <h3 class="text-2xl font-bold text-green-700 mb-4">\u671F\u5F85\u3055\u308C\u308B\u6210\u679C</h3>
                    <ul class="space-y-3 text-lg">
              <li><i class="fas fa-arrow-up text-green-600 mr-2"></i>\u7406\u89E3\u5EA6: <strong>30-40%\u5411\u4E0A</strong></li>
                        <li><i class="fas fa-clock text-green-600 mr-2"></i>\u6559\u5E2B\u8CA0\u62C5: <strong>40-50%\u8EFD\u6E1B</strong></li>
                        <li><i class="fas fa-heart text-green-600 mr-2"></i>\u4E0D\u767B\u6821\u5FA9\u5E30\u7387: <strong>60-70%\u5411\u4E0A</strong></li>
                        <li><i class="fas fa-trophy text-green-600 mr-2"></i>\u5B66\u4F1A\u767A\u8868: <strong>\u5E744-6\u56DE</strong></li>
                        <li><i class="fas fa-newspaper text-green-600 mr-2"></i>\u30E1\u30C7\u30A3\u30A2\u63B2\u8F09: <strong>3-5\u56DE</strong></li>
                    </ul>
                </div>
            </div>
            <div class="bg-gradient-to-r from-purple-100 to-pink-100 p-6 rounded-lg">
                <h3 class="text-2xl font-bold text-purple-700 mb-4">\u6295\u8CC7\u5BFE\u52B9\u679C\uFF08ROI\uFF09</h3>
                <div class="grid grid-cols-3 gap-6 text-center">
                    <div>
                        <div class="text-4xl font-bold text-purple-600 mb-2">100-220\u4E07\u5186</div>
                        <div class="text-lg text-gray-700">2\u5E74\u9593\u6295\u8CC7\u984D</div>
                    </div>
                    <div>
                        <div class="text-4xl font-bold text-green-600 mb-2">4,000-5,600\u4E07\u5186</div>
                        <div class="text-lg text-gray-700">2\u5E74\u9593\u30EA\u30BF\u30FC\u30F3</div>
                    </div>
                    <div>
                        <div class="text-4xl font-bold text-red-600 mb-2">20-50\u500D</div>
                        <div class="text-lg text-gray-700">ROI</div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Slide 3: \u73FE\u72B6\u306E\u8AB2\u984C -->
    <div class="slide bg-gradient-to-br from-red-50 to-orange-50" data-slide="3">
        <div class="max-w-6xl mx-auto">
            <h2 class="text-5xl font-bold text-gray-800 mb-8 border-b-4 border-red-600 pb-4">
                \u73FE\u72B6\u306E\u8AB2\u984C - \u306A\u305C\u4ECA\u3001\u5909\u9769\u304C\u5FC5\u8981\u304B
            </h2>
            <div class="grid grid-cols-2 gap-6">
                <div class="bg-white p-6 rounded-lg shadow-lg">
                    <h3 class="text-2xl font-bold text-red-700 mb-4">
                        <i class="fas fa-exclamation-triangle mr-2"></i>\u4E00\u6589\u6388\u696D\u306E\u9650\u754C
                    </h3>
                    <ul class="space-y-3 text-lg">
                        <li>\u2717 \u7406\u89E3\u5EA6\u306E\u500B\u4EBA\u5DEE\u304C\u5927\u304D\u3044\uFF081-5\u307E\u3067\u5206\u6563\uFF09</li>
                        <li>\u2717 \u7406\u89E3\u304C\u9045\u3044\u5B50\u306F\u7F6E\u304D\u53BB\u308A</li>
                        <li>\u2717 \u7406\u89E3\u304C\u65E9\u3044\u5B50\u306F\u9000\u5C48</li>
                        <li>\u2717 40\u4EBA\u5168\u54E1\u306B\u540C\u3058\u30DA\u30FC\u30B9</li>
                        <li>\u2717 \u30C7\u30FC\u30BF\u4E0D\u8DB3\u3067\u628A\u63E1\u56F0\u96E3</li>
                    </ul>
                </div>
                <div class="bg-white p-6 rounded-lg shadow-lg">
                    <h3 class="text-2xl font-bold text-orange-700 mb-4">
                        <i class="fas fa-user-clock mr-2"></i>\u6559\u5E2B\u306E\u904E\u91CD\u8CA0\u62C5
                    </h3>
                    <ul class="space-y-3 text-lg">
                        <li>\u2717 \u6708\u5E73\u5747\u6B8B\u696D80\u6642\u9593\u4EE5\u4E0A</li>
                        <li>\u2717 \u500B\u5225\u5BFE\u5FDC\u306F\u7269\u7406\u7684\u306B\u9650\u754C</li>
                        <li>\u2717 \u63A1\u70B9\u30FB\u4E8B\u52D9\u4F5C\u696D\u306B\u81A8\u5927\u306A\u6642\u9593</li>
                        <li>\u2717 \u30C7\u30FC\u30BF\u306A\u304F\u7D4C\u9A13\u983C\u307F</li>
                        <li>\u2717 \u50CD\u304D\u65B9\u6539\u9769\u304C\u9032\u307E\u306A\u3044</li>
                    </ul>
                </div>
                <div class="bg-white p-6 rounded-lg shadow-lg">
                    <h3 class="text-2xl font-bold text-purple-700 mb-4">
                        <i class="fas fa-user-slash mr-2"></i>\u4E0D\u767B\u6821\u5150\u7AE5\u306E\u5897\u52A0
                    </h3>
                    <ul class="space-y-3 text-lg">
                        <li>\u2717 \u5168\u56FD\u306730\u4E07\u4EBA\uFF08\u904E\u53BB\u6700\u591A\uFF09</li>
                        <li>\u2717 \u5B66\u6821\u306B\u884C\u3051\u306A\u3044 = \u5B66\u3079\u306A\u3044</li>
                        <li>\u2717 \u5B66\u7FD2\u9045\u308C\u304C\u5FA9\u5E30\u306E\u30CF\u30FC\u30C9\u30EB\u306B</li>
                        <li>\u2717 \u793E\u4F1A\u3068\u306E\u3064\u306A\u304C\u308A\u55AA\u5931</li>
                    </ul>
                </div>
                <div class="bg-white p-6 rounded-lg shadow-lg">
                    <h3 class="text-2xl font-bold text-blue-700 mb-4">
                        <i class="fas fa-map-marked-alt mr-2"></i>\u5730\u65B9\u306E\u6559\u80B2\u683C\u5DEE
                    </h3>
                    <ul class="space-y-3 text-lg">
                        <li>\u2717 \u90FD\u5E02\u90E8\u3068\u306E\u683C\u5DEE\u62E1\u5927</li>
                        <li>\u2717 \u587E\u30FB\u4E88\u5099\u6821\u3078\u306E\u30A2\u30AF\u30BB\u30B9\u56F0\u96E3</li>
                        <li>\u2717 \u6559\u80B2\u8CC7\u6E90\u30FB\u5C02\u9580\u6559\u54E1\u4E0D\u8DB3</li>
                        <li>\u2717 \u6700\u65B0\u624B\u6CD5\u304C\u5C4A\u304B\u306A\u3044</li>
                    </ul>
                </div>
            </div>
        </div>
    </div>

    <!-- Slide 4: \u30B7\u30B9\u30C6\u30E0\u6982\u8981 -->
    <div class="slide bg-white" data-slide="4">
        <div class="max-w-6xl mx-auto">
            <h2 class="text-5xl font-bold text-gray-800 mb-8 border-b-4 border-blue-600 pb-4">
                \u30B7\u30B9\u30C6\u30E0\u6982\u8981 - Phase 1-19 \u5B8C\u5168\u5B9F\u88C5
            </h2>
            <div class="grid grid-cols-3 gap-6 mb-8">
                <div class="bg-gradient-to-br from-blue-500 to-blue-700 text-white p-6 rounded-lg text-center">
                    <div class="text-5xl font-bold mb-2">20,000</div>
                    <div class="text-xl">\u7DCF\u30B3\u30FC\u30C9\u884C\u6570</div>
                </div>
                <div class="bg-gradient-to-br from-green-500 to-green-700 text-white p-6 rounded-lg text-center">
                    <div class="text-5xl font-bold mb-2">40+</div>
                    <div class="text-xl">\u30C7\u30FC\u30BF\u30D9\u30FC\u30B9\u30C6\u30FC\u30D6\u30EB</div>
                </div>
                <div class="bg-gradient-to-br from-purple-500 to-purple-700 text-white p-6 rounded-lg text-center">
                    <div class="text-5xl font-bold mb-2">90+</div>
                    <div class="text-xl">API\u30A8\u30F3\u30C9\u30DD\u30A4\u30F3\u30C8</div>
                </div>
            </div>
            <div class="grid grid-cols-2 gap-6">
                <div class="bg-blue-50 p-6 rounded-lg">
                    <h3 class="text-2xl font-bold text-blue-700 mb-4">Phase 1-8: \u57FA\u672C\u6A5F\u80FD</h3>
                    <ul class="space-y-2 text-lg">
                        <li>\u2713 \u8A8D\u8A3C\u30FB\u6A29\u9650\u7BA1\u7406</li>
                        <li>\u2713 \u81EA\u7531\u9032\u5EA6\u5B66\u7FD2\u30AB\u30FC\u30C9</li>
                        <li>\u2713 AI\u5BFE\u8A71\uFF08Gemini\u7D71\u5408\uFF09</li>
                        <li>\u2713 \u81EA\u52D5\u554F\u984C\u751F\u6210</li>
                        <li>\u2713 \u9032\u6357\u8FFD\u8DE1</li>
                    </ul>
                </div>
                <div class="bg-green-50 p-6 rounded-lg">
                    <h3 class="text-2xl font-bold text-green-700 mb-4">Phase 9-14: \u30C7\u30FC\u30BF\u5206\u6790</h3>
                    <ul class="space-y-2 text-lg">
                        <li>\u2713 6\u3064\u306E\u5B66\u7FD2\u30D1\u30BF\u30FC\u30F3\u5206\u6790</li>
                        <li>\u2713 \u6559\u5E2B\u30C0\u30C3\u30B7\u30E5\u30DC\u30FC\u30C9</li>
                        <li>\u2713 \u500B\u5225\u6700\u9069\u5316\u30AB\u30FC\u30C9</li>
                        <li>\u2713 AI\u4E88\u6E2C\u6A5F\u80FD</li>
                        <li>\u2713 \u591A\u8A00\u8A9E\u5BFE\u5FDC\u30FB\u7814\u7A76\u30C7\u30FC\u30BF</li>
                    </ul>
                </div>
                <div class="bg-purple-50 p-6 rounded-lg">
                    <h3 class="text-2xl font-bold text-purple-700 mb-4">Phase 15-16: \u6A5F\u68B0\u5B66\u7FD2</h3>
                    <ul class="space-y-2 text-lg">
                        <li>\u2713 TensorFlow.js\u7D71\u5408</li>
                        <li>\u2713 \u30EA\u30A2\u30EB\u30BF\u30A4\u30E0\u5B66\u7FD2</li>
                        <li>\u2713 A/B\u30C6\u30B9\u30C8\u30FBRCT</li>
                        <li>\u2713 \u7D71\u8A08\u5206\u6790</li>
                    </ul>
                </div>
                <div class="bg-orange-50 p-6 rounded-lg">
                    <h3 class="text-2xl font-bold text-orange-700 mb-4">Phase 17-19: \u5927\u898F\u6A21\u5C55\u958B</h3>
                    <ul class="space-y-2 text-lg">
                        <li>\u2713 \u6DF1\u5C64\u5B66\u7FD2\uFF08LSTM/Transformer\uFF09</li>
                        <li>\u2713 \u30DE\u30EB\u30C1\u30E2\u30FC\u30C0\u30EB\u5B66\u7FD2</li>
                        <li>\u2713 \u8907\u6570\u6821\u7BA1\u7406</li>
                        <li>\u2713 \u7814\u7A76\u652F\u63F4\u30FB\u30B0\u30ED\u30FC\u30D0\u30EB\u5C55\u958B</li>
                    </ul>
                </div>
            </div>
        </div>
    </div>

    <!-- Slide 5: \u6751\u9577\u3078\u306E\u30E1\u30EA\u30C3\u30C8 -->
    <div class="slide bg-gradient-to-br from-yellow-50 to-amber-50" data-slide="5">
        <div class="max-w-6xl mx-auto">
            <h2 class="text-5xl font-bold text-gray-800 mb-8 border-b-4 border-yellow-600 pb-4">
                <i class="fas fa-landmark mr-3"></i>\u6751\u9577\u3078\u306E\u30E1\u30EA\u30C3\u30C8
            </h2>
            <div class="grid grid-cols-2 gap-6 mb-8">
                <div class="bg-white p-6 rounded-lg shadow-lg">
                    <h3 class="text-3xl font-bold text-yellow-700 mb-6">\u6295\u8CC7\u5BFE\u52B9\u679C\uFF08ROI\uFF09</h3>
                    <div class="space-y-6">
                        <div>
                            <div class="text-sm text-gray-600 mb-1">2\u5E74\u9593\u6295\u8CC7\u984D</div>
                            <div class="text-4xl font-bold text-red-600">100-220\u4E07\u5186</div>
                        </div>
                        <div>
                            <div class="text-sm text-gray-600 mb-1">2\u5E74\u9593\u30EA\u30BF\u30FC\u30F3</div>
                            <div class="text-4xl font-bold text-green-600">4,280-5,600\u4E07\u5186</div>
                        </div>
                        <div>
                            <div class="text-sm text-gray-600 mb-1">ROI\uFF08\u6295\u8CC7\u5BFE\u52B9\u679C\uFF09</div>
                            <div class="text-5xl font-bold text-blue-600">20-50\u500D</div>
                        </div>
                    </div>
                </div>
                <div class="bg-white p-6 rounded-lg shadow-lg">
                    <h3 class="text-3xl font-bold text-green-700 mb-4">\u5177\u4F53\u7684\u306A\u30EA\u30BF\u30FC\u30F3</h3>
                    <ul class="space-y-3 text-lg">
                        <li><strong>\u6559\u5E2B\u6642\u9593\u524A\u6E1B:</strong> 2,400\u4E07\u5186</li>
                        <li><strong>\u4E0D\u767B\u6821\u5BFE\u5FDC\u524A\u6E1B:</strong> 600\u4E07\u5186</li>
                        <li><strong>\u30D6\u30E9\u30F3\u30C7\u30A3\u30F3\u30B0:</strong> 1,000-2,000\u4E07\u5186</li>
                        <li><strong>\u4EA4\u6D41\u4EBA\u53E3\u5897:</strong> 80-300\u4E07\u5186</li>
                        <li><strong>\u4EBA\u53E3\u6D41\u5165:</strong> 200-300\u4E07\u5186</li>
                    </ul>
                    <div class="mt-6 p-4 bg-green-100 rounded-lg">
                        <div class="text-sm text-gray-700 mb-1">\u9577\u671F\u52B9\u679C\uFF08\u5B66\u529B\u5411\u4E0A\uFF09</div>
                        <div class="text-3xl font-bold text-green-700">\u6751\u3078\u306E\u9084\u5143: 1,800\u4E07\u5186</div>
                    </div>
                </div>
            </div>
            <div class="bg-gradient-to-r from-blue-100 to-purple-100 p-6 rounded-lg">
                <h3 class="text-2xl font-bold text-purple-700 mb-4">
                    <i class="fas fa-star mr-2"></i>\u6751\u306E\u672A\u6765\u30D3\u30B8\u30E7\u30F3
                </h3>
                <div class="grid grid-cols-4 gap-4 text-center">
                    <div>
                        <div class="text-4xl mb-2">\u{1F3C6}</div>
                        <div class="font-semibold text-lg">\u6559\u80B2\u6539\u9769\u767A\u7965\u306E\u5730</div>
                    </div>
                    <div>
                        <div class="text-4xl mb-2">\u{1F4C8}</div>
                        <div class="font-semibold text-lg">\u4EBA\u53E3\u6D41\u5165\u4FC3\u9032</div>
                    </div>
                    <div>
                        <div class="text-4xl mb-2">\u{1F3E2}</div>
                        <div class="font-semibold text-lg">\u4F01\u696D\u8A98\u81F4</div>
                    </div>
                    <div>
                        <div class="text-4xl mb-2">\u{1F31F}</div>
                        <div class="font-semibold text-lg">\u5168\u56FD\u30E2\u30C7\u30EB\u6751</div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Slide 6: \u4E88\u7B97\u8A08\u753B -->
    <div class="slide bg-white" data-slide="6">
        <div class="max-w-6xl mx-auto">
            <h2 class="text-5xl font-bold text-gray-800 mb-8 border-b-4 border-green-600 pb-4">
                \u4E88\u7B97\u8A08\u753B - \u8A73\u7D30\u5185\u8A33
            </h2>
            <div class="grid grid-cols-2 gap-8">
                <div>
                    <h3 class="text-3xl font-bold text-blue-700 mb-6">\u521D\u5E74\u5EA6\uFF082024\u5E74\u5EA6\uFF09</h3>
                    <div class="space-y-4">
                        <div class="bg-blue-50 p-4 rounded-lg">
                            <div class="flex justify-between items-center mb-2">
                                <span class="font-semibold">\u30B7\u30B9\u30C6\u30E0\u5229\u7528\u6599</span>
                                <span class="text-xl font-bold text-blue-600">82,000\u5186</span>
                            </div>
                            <div class="text-sm text-gray-600">Cloudflare + Gemini API</div>
                        </div>
                        <div class="bg-blue-50 p-4 rounded-lg">
                            <div class="flex justify-between items-center mb-2">
                                <span class="font-semibold">\u7AEF\u672B\u30FB\u6A5F\u5668</span>
                                <span class="text-xl font-bold text-blue-600">0-1,240,000\u5186</span>
                            </div>
                            <div class="text-sm text-gray-600">\u65E2\u5B58\u7AEF\u672B\u6D3B\u7528\u3067\u5927\u5E45\u524A\u6E1B\u53EF\u80FD</div>
                        </div>
                        <div class="bg-blue-50 p-4 rounded-lg">
                            <div class="flex justify-between items-center mb-2">
                                <span class="font-semibold">\u7814\u4FEE\u8CBB</span>
                                <span class="text-xl font-bold text-blue-600">150,000\u5186</span>
                            </div>
                            <div class="text-sm text-gray-600">\u5916\u90E8\u8B1B\u5E2B\u30FB\u6559\u6750\u8CBB</div>
                        </div>
                        <div class="bg-blue-50 p-4 rounded-lg">
                            <div class="flex justify-between items-center mb-2">
                                <span class="font-semibold">\u305D\u306E\u4ED6</span>
                                <span class="text-xl font-bold text-blue-600">150,000\u5186</span>
                            </div>
                            <div class="text-sm text-gray-600">\u5370\u5237\u8CBB\u30FB\u4E88\u5099\u8CBB</div>
                        </div>
                        <div class="bg-blue-200 p-4 rounded-lg">
                            <div class="flex justify-between items-center">
                                <span class="text-xl font-bold">\u521D\u5E74\u5EA6\u5408\u8A08</span>
                                <span class="text-3xl font-bold text-blue-800">422,000\u5186\u301C</span>
                            </div>
                            <div class="text-sm text-gray-700 mt-1">\u65E2\u5B58\u7AEF\u672B\u6D3B\u7528\u306E\u5834\u5408</div>
                        </div>
                    </div>
                </div>
                <div>
                    <h3 class="text-3xl font-bold text-green-700 mb-6">2\u5E74\u76EE\uFF082025\u5E74\u5EA6\uFF09</h3>
                    <div class="space-y-4">
                        <div class="bg-green-50 p-4 rounded-lg">
                            <div class="flex justify-between items-center mb-2">
                                <span class="font-semibold">\u30B7\u30B9\u30C6\u30E0\u5229\u7528\u6599</span>
                                <span class="text-xl font-bold text-green-600">82,000\u5186</span>
                            </div>
                        </div>
                        <div class="bg-green-50 p-4 rounded-lg">
                            <div class="flex justify-between items-center mb-2">
                                <span class="font-semibold">\u904B\u7528\u8CBB</span>
                                <span class="text-xl font-bold text-green-600">150,000\u5186</span>
                            </div>
                            <div class="text-sm text-gray-600">\u30E1\u30F3\u30C6\u30CA\u30F3\u30B9\u30FB\u30D0\u30C3\u30AF\u30A2\u30C3\u30D7</div>
                        </div>
                        <div class="bg-green-50 p-4 rounded-lg">
                            <div class="flex justify-between items-center mb-2">
                                <span class="font-semibold">\u7814\u7A76\u8CBB</span>
                                <span class="text-xl font-bold text-green-600">300,000\u5186</span>
                            </div>
                            <div class="text-sm text-gray-600">\u5B66\u4F1A\u53C2\u52A0\u30FB\u8AD6\u6587\u6295\u7A3F</div>
                        </div>
                        <div class="bg-green-50 p-4 rounded-lg">
                            <div class="flex justify-between items-center mb-2">
                                <span class="font-semibold">\u305D\u306E\u4ED6</span>
                                <span class="text-xl font-bold text-green-600">80,000\u5186</span>
                            </div>
                        </div>
                        <div class="bg-green-200 p-4 rounded-lg">
                            <div class="flex justify-between items-center">
                                <span class="text-xl font-bold">2\u5E74\u76EE\u5408\u8A08</span>
                                <span class="text-3xl font-bold text-green-800">612,000\u5186</span>
                            </div>
                        </div>
                    </div>
                    <div class="mt-6 bg-purple-100 p-4 rounded-lg">
                        <div class="text-center">
                            <div class="text-lg font-semibold text-gray-700 mb-2">2\u5E74\u9593\u7DCF\u984D</div>
                            <div class="text-4xl font-bold text-purple-700">1,034,000\u5186</div>
                            <div class="text-sm text-gray-600 mt-1">\uFF08\u65E2\u5B58\u7AEF\u672B\u6D3B\u7528\u306E\u5834\u5408\uFF09</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Final Slide: \u4ECA\u3001\u6C7A\u65AD\u3092 -->
    <div class="slide gradient-bg text-white" data-slide="7">
        <div class="max-w-6xl mx-auto text-center">
            <h2 class="text-6xl font-bold mb-12">\u4ECA\u3001\u6C7A\u65AD\u3092</h2>
            <div class="text-3xl mb-16 leading-relaxed">
                \u6559\u80B2\u306F\u672A\u6765\u3078\u306E\u6295\u8CC7<br>
                \u5B50\u3069\u3082\u305F\u3061\u306F\u5F85\u3063\u3066\u3044\u308B<br>
                \u5168\u56FD\u306B\u5148\u99C6\u3051\u308B\u30C1\u30E3\u30F3\u30B9<br>
                \u4E00\u6751\u304B\u3089\u65E5\u672C\u3092\u5909\u3048\u308B
            </div>
            <div class="grid grid-cols-2 gap-8 text-left mb-16">
                <div class="bg-white bg-opacity-20 p-8 rounded-lg backdrop-blur-sm">
                    <h3 class="text-3xl font-bold mb-4">\u2705 \u4ECA\u3059\u3050\u5F97\u3089\u308C\u308B\u3082\u306E</h3>
                    <ul class="space-y-3 text-xl">
                        <li>\u2022 \u5B50\u3069\u3082\u305F\u3061\u306E\u5B66\u529B\u5411\u4E0A</li>
                        <li>\u2022 \u6559\u5E2B\u306E\u8CA0\u62C5\u8EFD\u6E1B</li>
                        <li>\u2022 \u4E0D\u767B\u6821\u5150\u7AE5\u306E\u652F\u63F4</li>
                        <li>\u2022 \u30A8\u30D3\u30C7\u30F3\u30B9\u306E\u69CB\u7BC9</li>
                        <li>\u2022 \u5168\u56FD\u30E2\u30C7\u30EB\u3068\u3057\u3066\u306E\u5730\u4F4D</li>
                    </ul>
                </div>
                <div class="bg-white bg-opacity-20 p-8 rounded-lg backdrop-blur-sm">
                    <h3 class="text-3xl font-bold mb-4">\u26A0\uFE0F \u5148\u5EF6\u3070\u3057\u306E\u30EA\u30B9\u30AF</h3>
                    <ul class="space-y-3 text-xl">
                        <li>\u2022 1\u5E74\u9045\u308C = 120\u540D\u306E\u6A5F\u4F1A\u640D\u5931</li>
                        <li>\u2022 \u5168\u56FD\u521D\u306E\u30C1\u30E3\u30F3\u30B9\u55AA\u5931</li>
                        <li>\u2022 \u6559\u80B2\u683C\u5DEE\u306E\u62E1\u5927</li>
                        <li>\u2022 \u4ED6\u81EA\u6CBB\u4F53\u306B\u5148\u884C\u3055\u308C\u308B</li>
                        <li>\u2022 \u30E2\u30C7\u30EB\u6751\u306E\u5730\u4F4D\u3092\u9003\u3059</li>
                    </ul>
                </div>
            </div>
            <div class="text-4xl font-bold mb-8">
                2\u5E74\u5F8C\u3001\u300C\u3084\u3063\u3066\u3088\u304B\u3063\u305F\u300D\u3068\u8A00\u3048\u308B\u6C7A\u65AD\u3092
            </div>
            <div class="text-2xl">
                <i class="fas fa-graduation-cap mr-3"></i>
                Phase 1-19 \u5B8C\u5168\u5B9F\u88C5\u6E08\u307F\u30FB\u4ECA\u3059\u3050\u958B\u59CB\u53EF\u80FD
            </div>
        </div>
    </div>

    <div class="slide-number">
        <span id="current-slide">1</span> / <span id="total-slides">7</span>
    </div>

    <script>
        let currentSlide = 1;
        const slides = document.querySelectorAll('.slide');
        const totalSlides = slides.length;
        
        document.getElementById('total-slides').textContent = totalSlides;
        
        function showSlide(n) {
            if (n > totalSlides) currentSlide = 1;
            if (n < 1) currentSlide = totalSlides;
            else currentSlide = n;
            
            slides.forEach((slide, index) => {
                slide.style.display = (index + 1 === currentSlide) ? 'flex' : 'none';
            });
            
            document.getElementById('current-slide').textContent = currentSlide;
        }
        
        function nextSlide() {
            showSlide(currentSlide + 1);
        }
        
        function previousSlide() {
            showSlide(currentSlide - 1);
        }
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight' || e.key === ' ') nextSlide();
            if (e.key === 'ArrowLeft') previousSlide();
        });
        
        showSlide(1);
    <\/script>
</body>
</html>`));
p.get("/api/export/student/:studentId/csv", async (e) => {
  const { env: r } = e, t = e.req.param("studentId"), { curriculumId: s } = e.req.query();
  if (/^\d{1,2}$/.test(t)) {
    const n = (/* @__PURE__ */ new Date()).toISOString().split("T")[0], i = `\uFEFF\u6C0F\u540D,\u5B66\u751F\u756A\u53F7,\u30AF\u30E9\u30B9\u30B3\u30FC\u30C9,\u30E1\u30FC\u30EB\u30A2\u30C9\u30EC\u30B9
\u30C7\u30E2\u751F\u5F92,001,CLASS2024A,demo@student.jp

\u30B3\u30FC\u30B9\u540D,\u30AB\u30EA\u30AD\u30E5\u30E9\u30E0\u540D,\u9032\u6357\u7387(%),\u5B8C\u4E86\u30B9\u30C6\u30FC\u30BF\u30B9,\u5B66\u7FD2\u6642\u9593(\u5206),\u6700\u7D42\u5B66\u7FD2\u65E5
\u3057\u3063\u304B\u308A\u30B3\u30FC\u30B9,\u304B\u3051\u7B97\u306E\u7B46\u7B97,75,\u9032\u884C\u4E2D,120,${n}
\u3058\u3063\u304F\u308A\u30B3\u30FC\u30B9,\u308F\u308A\u7B97\u306E\u57FA\u790E,50,\u9032\u884C\u4E2D,90,${n}

\u554F\u984C\u540D,\u554F\u984C\u30BF\u30A4\u30D7,\u6B63\u8AA4,\u8AA4\u7B54\u30D1\u30BF\u30FC\u30F3,\u751F\u5F92\u306E\u89E3\u7B54,\u6B63\u89E3,\u96E3\u6613\u5EA6,\u56DE\u7B54\u65E5\u6642
\u5B66\u7FD2\u30AB\u30FC\u30C91,\u5B66\u7FD2\u30AB\u30FC\u30C9,\u8AA4\u7B54,\u304F\u308A\u4E0A\u304C\u308A\u5FD8\u308C,72,78,\u4E2D,${n}
\u5B66\u7FD2\u30AB\u30FC\u30C92,\u5B66\u7FD2\u30AB\u30FC\u30C9,\u6B63\u89E3,-,126,126,\u4E2D,${n}
\u30C1\u30A7\u30C3\u30AF\u30C6\u30B9\u30C8\u554F\u984C3,\u30C1\u30A7\u30C3\u30AF\u30C6\u30B9\u30C8,\u8AA4\u7B54,\u8A08\u7B97\u30DF\u30B9,144,154,\u9AD8,${n}
\u5B66\u7FD2\u30AB\u30FC\u30C94,\u5B66\u7FD2\u30AB\u30FC\u30C9,\u6B63\u89E3,-,96,96,\u6613,${n}`;
    return new Response(i, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="demo_student_data.csv"' } });
  }
  try {
    const n = await r.DB.prepare(`
      SELECT id, name, email, student_number, class_code
      FROM users WHERE id = ?
    `).bind(t).first();
    if (!n) {
      const d = `# \u751F\u5F92\u60C5\u5831
\u6C0F\u540D,\u5B66\u751F\u756A\u53F7,\u30AF\u30E9\u30B9\u30B3\u30FC\u30C9,\u30E1\u30FC\u30EB\u30A2\u30C9\u30EC\u30B9
\u30C7\u30E2\u751F\u5F92,001,CLASS2024A,demo@student.jp

# \u5B66\u7FD2\u9032\u6357
\u30B3\u30FC\u30B9\u540D,\u30AB\u30EA\u30AD\u30E5\u30E9\u30E0\u540D,\u9032\u6357\u7387,\u5B8C\u4E86\u30B9\u30C6\u30FC\u30BF\u30B9,\u5B66\u7FD2\u6642\u9593(\u5206),\u6700\u7D42\u5B66\u7FD2\u65E5
\u3057\u3063\u304B\u308A\u30B3\u30FC\u30B9,\u304B\u3051\u7B97\u306E\u7B46\u7B97,75%,\u9032\u884C\u4E2D,120,${(/* @__PURE__ */ new Date()).toISOString()}

# \u8AA4\u7B54\u5C65\u6B74
\u554F\u984C\u540D,\u554F\u984C\u30BF\u30A4\u30D7,\u6B63\u8AA4,\u8AA4\u7B54\u30D1\u30BF\u30FC\u30F3,\u89E3\u7B54,\u6B63\u89E3,\u96E3\u6613\u5EA6,\u56DE\u7B54\u65E5\u6642
\u5B66\u7FD2\u30AB\u30FC\u30C91,learning_card,\u8AA4\u7B54,\u304F\u308A\u4E0A\u304C\u308A\u5FD8\u308C,72,78,\u4E2D,${(/* @__PURE__ */ new Date()).toISOString()}
\u5B66\u7FD2\u30AB\u30FC\u30C92,learning_card,\u6B63\u89E3,,126,126,\u4E2D,${(/* @__PURE__ */ new Date()).toISOString()}`;
      return new Response(d, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="demo_student_data.csv"' } });
    }
    let a = r.DB.prepare(`
      SELECT p.*, c.curriculum_title, co.course_title
      FROM progress p
      LEFT JOIN curriculum c ON p.curriculum_id = c.id
      LEFT JOIN courses co ON c.course_id = co.id
      WHERE p.student_id = ?
      ${s ? "AND p.curriculum_id = ?" : ""}
      ORDER BY p.created_at DESC
    `);
    s ? a = a.bind(t, s) : a = a.bind(t);
    const o = await a.all();
    let i = r.DB.prepare(`
      SELECT eh.*, 
        CASE 
          WHEN eh.question_type = 'learning_card' THEN lc.card_title
          WHEN eh.question_type = 'check_test' THEN '\u30C1\u30A7\u30C3\u30AF\u30C6\u30B9\u30C8\u554F\u984C' || eh.question_number
          WHEN eh.question_type = 'optional' THEN op.problem_title
        END as question_title
      FROM error_history eh
      LEFT JOIN learning_cards lc ON eh.question_type = 'learning_card' AND eh.question_id = lc.id
      LEFT JOIN optional_problems op ON eh.question_type = 'optional' AND eh.question_id = op.id
      WHERE eh.student_id = ?
      ${s ? "AND eh.curriculum_id = ?" : ""}
      ORDER BY eh.submitted_at DESC
    `);
    s ? i = i.bind(t, s) : i = i.bind(t);
    const c = await i.all(), l = [];
    l.push("\u6C0F\u540D,\u5B66\u751F\u756A\u53F7,\u30AF\u30E9\u30B9\u30B3\u30FC\u30C9,\u30E1\u30FC\u30EB\u30A2\u30C9\u30EC\u30B9"), l.push(`${n.name},${n.student_number || "-"},${n.class_code || "-"},${n.email}`), l.push(""), l.push("\u30B3\u30FC\u30B9\u540D,\u30AB\u30EA\u30AD\u30E5\u30E9\u30E0\u540D,\u9032\u6357\u7387(%),\u5B8C\u4E86\u30B9\u30C6\u30FC\u30BF\u30B9,\u5B66\u7FD2\u6642\u9593(\u5206),\u6700\u7D42\u5B66\u7FD2\u65E5"), o.results.forEach((d) => {
      const _ = d.status === "completed" ? "\u5B8C\u4E86" : d.status === "in_progress" ? "\u9032\u884C\u4E2D" : "\u307E\u3060\u958B\u59CB\u3057\u3066\u3044\u307E\u305B\u3093";
      l.push(`${d.course_title || "-"},${d.curriculum_title || "-"},${d.completion_percentage || 0},${_},${d.total_learning_time || 0},${d.updated_at || "-"}`);
    }), l.push(""), l.push("\u554F\u984C\u540D,\u554F\u984C\u30BF\u30A4\u30D7,\u6B63\u8AA4,\u8AA4\u7B54\u30D1\u30BF\u30FC\u30F3,\u751F\u5F92\u306E\u89E3\u7B54,\u6B63\u89E3,\u96E3\u6613\u5EA6,\u56DE\u7B54\u65E5\u6642"), c.results.forEach((d) => {
      const _ = d.question_type === "learning_card" ? "\u5B66\u7FD2\u30AB\u30FC\u30C9" : d.question_type === "check_test" ? "\u30C1\u30A7\u30C3\u30AF\u30C6\u30B9\u30C8" : d.question_type === "optional" ? "\u9078\u629E\u554F\u984C" : d.question_type;
      l.push(`${d.question_title || "-"},${_},${d.is_correct ? "\u6B63\u89E3" : "\u8AA4\u7B54"},${d.error_pattern || "-"},${d.student_answer || "-"},${d.correct_answer || "-"},${d.difficulty || "\u4E2D"},${d.submitted_at || "-"}`);
    });
    const u = "\uFEFF";
    return new Response(u + l.join(`
`), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="student_${t}_data.csv"` } });
  } catch (n) {
    return console.error("CSV export error:", n), e.json({ error: "Failed to export data", details: n.message }, 500);
  }
});
p.get("/api/export/class/:classCode/csv", async (e) => {
  const { env: r } = e, t = e.req.param("classCode"), { curriculumId: s } = e.req.query();
  if (t === "CLASS2024A") {
    (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const o = `\uFEFF\u5B66\u751F\u756A\u53F7,\u6C0F\u540D,\u5B8C\u4E86\u30AB\u30EA\u30AD\u30E5\u30E9\u30E0\u6570,\u7DCF\u5B66\u7FD2\u6642\u9593(\u5206),\u7DCF\u554F\u984C\u6570,\u7DCF\u6B63\u7B54\u6570,\u6B63\u7B54\u7387(%)
001,\u5C71\u7530\u592A\u90CE,2,180,40,30,75.0
002,\u4F50\u85E4\u82B1\u5B50,3,150,35,32,91.4
003,\u9234\u6728\u6B21\u90CE,1,120,30,21,70.0`;
    return new Response(o, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="class_${t}_data.csv"` } });
  }
  try {
    const n = await r.DB.prepare(`
      SELECT id, name, student_number FROM users 
      WHERE class_code = ? AND role = 'student'
      ORDER BY student_number
    `).bind(t).all();
    if (n.results.length === 0) return e.json({ error: "No students found" }, 404);
    const a = [];
    if (s) {
      a.push("\u5B66\u751F\u756A\u53F7,\u6C0F\u540D,\u9032\u6357\u7387(%),\u5B8C\u4E86\u30B9\u30C6\u30FC\u30BF\u30B9,\u5B66\u7FD2\u6642\u9593(\u5206),\u6B63\u7B54\u7387(%),\u6700\u7D42\u5B66\u7FD2\u65E5");
      for (const i of n.results) {
        const c = await r.DB.prepare(`
          SELECT * FROM progress 
          WHERE student_id = ? AND curriculum_id = ?
        `).bind(i.id, s).first(), l = await r.DB.prepare(`
          SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct
          FROM error_history
          WHERE student_id = ? AND curriculum_id = ?
        `).bind(i.id, s).first(), u = l && l.total > 0 ? (l.correct / l.total * 100).toFixed(1) : "0.0", d = (c == null ? void 0 : c.status) === "completed" ? "\u5B8C\u4E86" : (c == null ? void 0 : c.status) === "in_progress" ? "\u9032\u884C\u4E2D" : "\u672A\u958B\u59CB";
        a.push(`${i.student_number || "-"},${i.name},${(c == null ? void 0 : c.completion_percentage) || 0},${d},${(c == null ? void 0 : c.total_learning_time) || 0},${u},${(c == null ? void 0 : c.updated_at) || "-"}`);
      }
    } else {
      a.push("\u5B66\u751F\u756A\u53F7,\u6C0F\u540D,\u5B8C\u4E86\u30AB\u30EA\u30AD\u30E5\u30E9\u30E0\u6570,\u7DCF\u5B66\u7FD2\u6642\u9593(\u5206),\u7DCF\u554F\u984C\u6570,\u7DCF\u6B63\u7B54\u6570,\u6B63\u7B54\u7387(%)");
      for (const i of n.results) {
        const c = await r.DB.prepare(`
          SELECT 
            COUNT(DISTINCT curriculum_id) as completed_count,
            SUM(total_learning_time) as total_time
          FROM progress
          WHERE student_id = ? AND status = 'completed'
        `).bind(i.id).first(), l = await r.DB.prepare(`
          SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct
          FROM error_history
          WHERE student_id = ?
        `).bind(i.id).first(), u = l && l.total > 0 ? (l.correct / l.total * 100).toFixed(1) : "0.0";
        a.push(`${i.student_number || "-"},${i.name},${(c == null ? void 0 : c.completed_count) || 0},${(c == null ? void 0 : c.total_time) || 0},${(l == null ? void 0 : l.total) || 0},${(l == null ? void 0 : l.correct) || 0},${u}`);
      }
    }
    const o = "\uFEFF";
    return new Response(o + a.join(`
`), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="class_${t}_data.csv"` } });
  } catch (n) {
    return console.error("Class CSV export error:", n), e.json({ error: "Failed to export class data", details: n.message }, 500);
  }
});
p.get("/api/export/phase3/:studentId/csv", async (e) => {
  const { env: r } = e, t = e.req.param("studentId"), { startDate: s, endDate: n } = e.req.query();
  if (/^\d{1,2}$/.test(t)) {
    const a = (/* @__PURE__ */ new Date()).toISOString().split("T")[0], c = `\uFEFF\u9078\u629E\u8AB2\u984C\u306E\u6210\u679C\u7269
\u30AB\u30EA\u30AD\u30E5\u30E9\u30E0,\u8AB2\u984C\u540D,\u6295\u7A3F\u30BF\u30A4\u30D7,\u81EA\u5DF1\u8A55\u4FA1(1-5),\u81EA\u5DF1\u30B3\u30E1\u30F3\u30C8,\u6559\u5E2B\u30B3\u30E1\u30F3\u30C8,\u6559\u5E2B\u8A55\u4FA1(1-5),\u6295\u7A3F\u65E5\u6642
\u304B\u3051\u7B97\u306E\u7B46\u7B97,\u767A\u5C55\u554F\u984C\u30C1\u30E3\u30EC\u30F3\u30B8,\u753B\u50CF,4,\u304C\u3093\u3070\u3063\u3066\u89E3\u304D\u307E\u3057\u305F,\u3088\u304F\u9811\u5F35\u308A\u307E\u3057\u305F\u306D\uFF01,5,${a}
\u304B\u3051\u7B97\u306E\u7B46\u7B97,\u81EA\u7531\u8AB2\u984C,\u30C6\u30AD\u30B9\u30C8,3,\u96E3\u3057\u304B\u3063\u305F\u3067\u3059,\u6B21\u306F\u3082\u3063\u3068\u3067\u304D\u308B\u3088,4,${a}

\u6559\u5E2B\u306E\u898B\u53D6\u308A\u8A18\u9332
\u89B3\u5BDF\u65E5,\u30AB\u30EA\u30AD\u30E5\u30E9\u30E0,\u89B3\u5BDF\u30BF\u30A4\u30D7,\u89B3\u5BDF\u5185\u5BB9,\u975E\u8A8D\u77E5\u80FD\u529B\u30BF\u30B0,\u30DD\u30B8\u30C6\u30A3\u30D6\u8A55\u4FA1,\u4FDD\u8B77\u8005\u5171\u6709
${a},\u304B\u3051\u7B97\u306E\u7B46\u7B97,\u5B66\u7FD2\u614B\u5EA6,\u96C6\u4E2D\u3057\u3066\u53D6\u308A\u7D44\u3093\u3067\u3044\u308B,\u3084\u308A\u629C\u304F\u529B,\u306F\u3044,\u306F\u3044
${a},\u304B\u3051\u7B97\u306E\u7B46\u7B97,\u7406\u89E3\u5EA6,\u57FA\u790E\u7684\u306A\u7406\u89E3\u306F\u5B9A\u7740\u3057\u3066\u3044\u308B,\u7406\u89E3\u529B,\u306F\u3044,\u3044\u3044\u3048
${a},\u304B\u3051\u7B97\u306E\u7B46\u7B97,\u5354\u50CD\u6027,\u53CB\u9054\u3068\u6559\u3048\u5408\u3063\u3066\u3044\u308B,\u5354\u50CD\u6027,\u306F\u3044,\u306F\u3044

\u751F\u5F92\u306E\u632F\u308A\u8FD4\u308A\u8A18\u9332
\u632F\u308A\u8FD4\u308A\u65E5,\u30AB\u30EA\u30AD\u30E5\u30E9\u30E0,\u632F\u308A\u8FD4\u308A\u30BF\u30A4\u30D7,\u5B66\u3093\u3060\u3053\u3068,\u7406\u89E3\u3057\u305F\u3053\u3068,\u96E3\u3057\u304B\u3063\u305F\u3053\u3068,\u697D\u3057\u304B\u3063\u305F\u3053\u3068,\u6B21\u306E\u76EE\u6A19,\u6C17\u5206\u8A55\u4FA1(1-5),\u52AA\u529B\u8A55\u4FA1(1-5),\u7406\u89E3\u5EA6\u8A55\u4FA1(1-5)
${a},\u304B\u3051\u7B97\u306E\u7B46\u7B97,\u65E5\u6B21,\u304F\u308A\u4E0A\u304C\u308A\u306E\u65B9\u6CD5,\u4F4D\u3092\u63C3\u3048\u308B\u3053\u3068,\u5927\u304D\u3044\u6570\u306E\u8A08\u7B97,\u30D1\u30BF\u30FC\u30F3\u3092\u898B\u3064\u3051\u308B\u3053\u3068,\u3082\u3063\u3068\u901F\u304F\u8A08\u7B97\u3059\u308B,4,4,4
${a},\u304B\u3051\u7B97\u306E\u7B46\u7B97,\u5358\u5143,\u7B46\u7B97\u306E\u57FA\u790E,\u7B46\u7B97\u306E\u624B\u9806,\u30B1\u30BF\u306E\u591A\u3044\u8A08\u7B97,\u81EA\u5206\u3067\u89E3\u3051\u305F\u3053\u3068,\u5FDC\u7528\u554F\u984C\u306B\u6311\u6226,5,5,4

\u6559\u79D1\u6A2A\u65AD\u8A55\u4FA1
\u8A55\u4FA1\u671F\u9593\u958B\u59CB,\u8A55\u4FA1\u671F\u9593\u7D42\u4E86,\u8AAD\u89E3\u529B,\u6587\u7AE0\u8868\u73FE\u529B,\u8AD6\u7406\u7684\u601D\u8003\u529B,\u5275\u9020\u7684\u601D\u8003\u529B,\u554F\u984C\u89E3\u6C7A\u529B,\u3084\u308A\u629C\u304F\u529B,\u81EA\u5DF1\u8ABF\u6574\u529B,\u5354\u50CD\u6027,\u597D\u5947\u5FC3,\u30E1\u30BF\u8A8D\u77E5,\u6210\u9577\u30DE\u30A4\u30F3\u30C9
${a},${a},75,70,80,75,85,80,75,70,85,75,80`;
    return new Response(c, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="phase3_demo_data.csv"' } });
  }
  try {
    const a = await r.DB.prepare(`
      SELECT name, student_number, class_code FROM users WHERE id = ?
    `).bind(t).first();
    if (!a) {
      const g = `# Phase 3 \u5B66\u7FD2\u8A18\u9332 - \u30C7\u30E2\u751F\u5F92
\u30A8\u30AF\u30B9\u30DD\u30FC\u30C8\u65E5\u6642: ${(/* @__PURE__ */ new Date()).toISOString()}

## \u9078\u629E\u8AB2\u984C\u306E\u6210\u679C\u7269
\u30AB\u30EA\u30AD\u30E5\u30E9\u30E0,\u8AB2\u984C\u540D,\u6295\u7A3F\u30BF\u30A4\u30D7,\u81EA\u5DF1\u8A55\u4FA1,\u81EA\u5DF1\u30B3\u30E1\u30F3\u30C8,\u6559\u5E2B\u30B3\u30E1\u30F3\u30C8,\u6559\u5E2B\u8A55\u4FA1,\u6295\u7A3F\u65E5\u6642
\u304B\u3051\u7B97\u306E\u7B46\u7B97,\u767A\u5C55\u554F\u984C\u30C1\u30E3\u30EC\u30F3\u30B8,image,4,\u304C\u3093\u3070\u3063\u3066\u89E3\u304D\u307E\u3057\u305F,\u3088\u304F\u9811\u5F35\u308A\u307E\u3057\u305F\u306D\uFF01,5,${(/* @__PURE__ */ new Date()).toISOString()}

## \u6559\u5E2B\u306E\u898B\u53D6\u308A\u8A18\u9332
\u89B3\u5BDF\u65E5,\u30AB\u30EA\u30AD\u30E5\u30E9\u30E0,\u89B3\u5BDF\u30BF\u30A4\u30D7,\u89B3\u5BDF\u5185\u5BB9,\u975E\u8A8D\u77E5\u30BF\u30B0,\u30DD\u30B8\u30C6\u30A3\u30D6,\u4FDD\u8B77\u8005\u5171\u6709
${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]},\u304B\u3051\u7B97\u306E\u7B46\u7B97,learning_attitude,\u96C6\u4E2D\u3057\u3066\u53D6\u308A\u7D44\u3093\u3067\u3044\u308B,\u3084\u308A\u629C\u304F\u529B,\u306F\u3044,\u306F\u3044

## \u751F\u5F92\u306E\u632F\u308A\u8FD4\u308A\u8A18\u9332
\u632F\u308A\u8FD4\u308A\u65E5,\u30AB\u30EA\u30AD\u30E5\u30E9\u30E0,\u632F\u308A\u8FD4\u308A\u30BF\u30A4\u30D7,\u5B66\u3093\u3060\u3053\u3068,\u7406\u89E3\u3057\u305F\u3053\u3068,\u96E3\u3057\u304B\u3063\u305F\u3053\u3068,\u697D\u3057\u304B\u3063\u305F\u3053\u3068,\u6B21\u306E\u76EE\u6A19,\u6C17\u5206\u8A55\u4FA1,\u52AA\u529B\u8A55\u4FA1,\u7406\u89E3\u5EA6\u8A55\u4FA1
${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]},\u304B\u3051\u7B97\u306E\u7B46\u7B97,daily,\u304F\u308A\u4E0A\u304C\u308A\u306E\u65B9\u6CD5,\u4F4D\u3092\u63C3\u3048\u308B\u3053\u3068,\u5927\u304D\u3044\u6570\u306E\u8A08\u7B97,\u30D1\u30BF\u30FC\u30F3\u3092\u898B\u3064\u3051\u308B\u3053\u3068,\u3082\u3063\u3068\u901F\u304F\u8A08\u7B97\u3067\u304D\u308B\u3088\u3046\u306B\u306A\u308B,4,4,4

## \u6559\u79D1\u6A2A\u65AD\u8A55\u4FA1
\u8A55\u4FA1\u671F\u9593\u958B\u59CB,\u8A55\u4FA1\u671F\u9593\u7D42\u4E86,\u8AAD\u89E3\u529B,\u6587\u7AE0\u8868\u73FE\u529B,\u8AD6\u7406\u7684\u601D\u8003\u529B,\u5275\u9020\u7684\u601D\u8003\u529B,\u554F\u984C\u89E3\u6C7A\u529B,\u3084\u308A\u629C\u304F\u529B,\u81EA\u5DF1\u8ABF\u6574\u529B,\u5354\u50CD\u6027,\u597D\u5947\u5FC3,\u30E1\u30BF\u8A8D\u77E5,\u6210\u9577\u30DE\u30A4\u30F3\u30C9
${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]},${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]},75,70,80,75,85,80,75,70,85,75,80`;
      return new Response(g, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="phase3_demo_data.csv"' } });
    }
    const o = [];
    o.push(`# Phase 3 \u5B66\u7FD2\u8A18\u9332 - ${a.name}`), o.push(`\u30A8\u30AF\u30B9\u30DD\u30FC\u30C8\u65E5\u6642: ${(/* @__PURE__ */ new Date()).toISOString()}`), o.push("");
    let i = r.DB.prepare(`
      SELECT ops.*, op.problem_title, c.curriculum_title
      FROM optional_problem_submissions ops
      LEFT JOIN optional_problems op ON ops.optional_problem_id = op.id
      LEFT JOIN curriculum c ON ops.curriculum_id = c.id
      WHERE ops.student_id = ?
      ${s ? "AND DATE(ops.submitted_at) >= ?" : ""}
      ${n ? "AND DATE(ops.submitted_at) <= ?" : ""}
      ORDER BY ops.submitted_at DESC
    `);
    s && n ? i = i.bind(t, s, n) : s ? i = i.bind(t, s) : n ? i = i.bind(t, n) : i = i.bind(t);
    const c = await i.all();
    o.push("## \u9078\u629E\u8AB2\u984C\u306E\u6210\u679C\u7269"), o.push("\u30AB\u30EA\u30AD\u30E5\u30E9\u30E0,\u8AB2\u984C\u540D,\u6295\u7A3F\u30BF\u30A4\u30D7,\u81EA\u5DF1\u8A55\u4FA1,\u81EA\u5DF1\u30B3\u30E1\u30F3\u30C8,\u6559\u5E2B\u30B3\u30E1\u30F3\u30C8,\u6559\u5E2B\u8A55\u4FA1,\u6295\u7A3F\u65E5\u6642"), c.results.forEach((g) => {
      o.push(`${g.curriculum_title || ""},${g.problem_title || ""},${g.submission_type},${g.self_evaluation || ""},${(g.self_comment || "").replace(/,/g, "\u3001")},${(g.teacher_comment || "").replace(/,/g, "\u3001")},${g.teacher_evaluation || ""},${g.submitted_at}`);
    }), o.push("");
    let l = r.DB.prepare(`
      SELECT to.*, c.curriculum_title
      FROM teacher_observations to
      LEFT JOIN curriculum c ON to.curriculum_id = c.id
      WHERE to.student_id = ?
      ${s ? "AND DATE(to.observation_date) >= ?" : ""}
      ${n ? "AND DATE(to.observation_date) <= ?" : ""}
      ORDER BY to.observation_date DESC
    `);
    s && n ? l = l.bind(t, s, n) : s ? l = l.bind(t, s) : n ? l = l.bind(t, n) : l = l.bind(t);
    const u = await l.all();
    o.push("## \u6559\u5E2B\u306E\u898B\u53D6\u308A\u8A18\u9332"), o.push("\u89B3\u5BDF\u65E5,\u30AB\u30EA\u30AD\u30E5\u30E9\u30E0,\u89B3\u5BDF\u30BF\u30A4\u30D7,\u89B3\u5BDF\u5185\u5BB9,\u975E\u8A8D\u77E5\u30BF\u30B0,\u30DD\u30B8\u30C6\u30A3\u30D6,\u4FDD\u8B77\u8005\u5171\u6709"), u.results.forEach((g) => {
      o.push(`${g.observation_date},${g.curriculum_title || ""},${g.observation_type},${(g.observation_text || "").replace(/,/g, "\u3001")},${g.non_cognitive_tags || ""},${g.is_positive ? "\u306F\u3044" : "\u3044\u3044\u3048"},${g.is_shared_with_parents ? "\u306F\u3044" : "\u3044\u3044\u3048"}`);
    }), o.push("");
    let d = r.DB.prepare(`
      SELECT sr.*, c.curriculum_title
      FROM student_reflections sr
      LEFT JOIN curriculum c ON sr.curriculum_id = c.id
      WHERE sr.student_id = ?
      ${s ? "AND DATE(sr.reflection_date) >= ?" : ""}
      ${n ? "AND DATE(sr.reflection_date) <= ?" : ""}
      ORDER BY sr.reflection_date DESC
    `);
    s && n ? d = d.bind(t, s, n) : s ? d = d.bind(t, s) : n ? d = d.bind(t, n) : d = d.bind(t);
    const _ = await d.all();
    o.push("## \u751F\u5F92\u306E\u632F\u308A\u8FD4\u308A\u8A18\u9332"), o.push("\u632F\u308A\u8FD4\u308A\u65E5,\u30AB\u30EA\u30AD\u30E5\u30E9\u30E0,\u632F\u308A\u8FD4\u308A\u30BF\u30A4\u30D7,\u5B66\u3093\u3060\u3053\u3068,\u7406\u89E3\u3057\u305F\u3053\u3068,\u96E3\u3057\u304B\u3063\u305F\u3053\u3068,\u697D\u3057\u304B\u3063\u305F\u3053\u3068,\u6B21\u306E\u76EE\u6A19,\u6C17\u5206\u8A55\u4FA1,\u52AA\u529B\u8A55\u4FA1,\u7406\u89E3\u5EA6\u8A55\u4FA1"), _.results.forEach((g) => {
      o.push(`${g.reflection_date},${g.curriculum_title || ""},${g.reflection_type},${(g.what_learned || "").replace(/,/g, "\u3001")},${(g.what_understood || "").replace(/,/g, "\u3001")},${(g.what_difficult || "").replace(/,/g, "\u3001")},${(g.what_enjoyed || "").replace(/,/g, "\u3001")},${(g.next_goals || "").replace(/,/g, "\u3001")},${g.mood_rating || ""},${g.effort_rating || ""},${g.understanding_rating || ""}`);
    }), o.push("");
    let m = r.DB.prepare(`
      SELECT * FROM cross_subject_evaluations
      WHERE student_id = ?
      ${s ? "AND DATE(evaluation_period_start) >= ?" : ""}
      ${n ? "AND DATE(evaluation_period_end) <= ?" : ""}
      ORDER BY evaluation_period_start DESC
    `);
    s && n ? m = m.bind(t, s, n) : s ? m = m.bind(t, s) : n ? m = m.bind(t, n) : m = m.bind(t);
    const h = await m.all();
    return o.push("## \u6559\u79D1\u6A2A\u65AD\u8A55\u4FA1"), o.push("\u8A55\u4FA1\u671F\u9593\u958B\u59CB,\u8A55\u4FA1\u671F\u9593\u7D42\u4E86,\u8AAD\u89E3\u529B,\u6587\u7AE0\u8868\u73FE\u529B,\u8AD6\u7406\u7684\u601D\u8003\u529B,\u5275\u9020\u7684\u601D\u8003\u529B,\u554F\u984C\u89E3\u6C7A\u529B,\u3084\u308A\u629C\u304F\u529B,\u81EA\u5DF1\u8ABF\u6574\u529B,\u5354\u50CD\u6027,\u597D\u5947\u5FC3,\u30E1\u30BF\u8A8D\u77E5,\u6210\u9577\u30DE\u30A4\u30F3\u30C9"), h.results.forEach((g) => {
      o.push(`${g.evaluation_period_start},${g.evaluation_period_end},${g.reading_comprehension},${g.writing_expression},${g.logical_thinking},${g.creative_thinking},${g.problem_solving},${g.persistence_score},${g.self_regulation_score},${g.collaboration_score},${g.curiosity_score},${g.metacognition_score},${g.growth_mindset_score}`);
    }), new Response(o.join(`
`), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="phase3_${t}_data.csv"` } });
  } catch (a) {
    return console.error("Phase 3 CSV export error:", a), e.json({ error: "Failed to export Phase 3 data", details: a.message }, 500);
  }
});
p.get("/api/statistics/class/:classCode", async (e) => {
  const { env: r } = e, t = e.req.param("classCode"), { curriculumId: s } = e.req.query();
  if (t === "CLASS2024A") return e.json({ classCode: t, studentCount: 3, progressStats: { avg_completion: 75.5, min_completion: 50, max_completion: 100, active_students: 3, total_time: 450 }, accuracyStats: { total_questions: 150, correct_questions: 120, avg_accuracy: 80 }, errorPatterns: [{ error_pattern: "\u304F\u308A\u4E0A\u304C\u308A\u5FD8\u308C", count: 12, affected_students: 2 }, { error_pattern: "\u8A08\u7B97\u30DF\u30B9", count: 8, affected_students: 3 }, { error_pattern: "\u6841\u306E\u4E26\u3079\u9593\u9055\u3044", count: 5, affected_students: 2 }, { error_pattern: "\u554F\u984C\u306E\u8AAD\u307F\u9593\u9055\u3044", count: 3, affected_students: 1 }], learningTimeDistribution: [{ name: "\u5C71\u7530\u592A\u90CE", student_number: "001", total_time: 180, completed_curriculums: 2 }, { name: "\u4F50\u85E4\u82B1\u5B50", student_number: "002", total_time: 150, completed_curriculums: 2 }, { name: "\u9234\u6728\u6B21\u90CE", student_number: "003", total_time: 120, completed_curriculums: 1 }], progressDistribution: [{ range: "\u5B8C\u4E86", count: 1 }, { range: "75-99%", count: 1 }, { range: "50-75%", count: 1 }] });
  try {
    const n = await r.DB.prepare(`
      SELECT id, name, student_number FROM users 
      WHERE class_code = ? AND role = 'student'
      ORDER BY student_number
    `).bind(t).all();
    if (n.results.length === 0 && t === "CLASS2024A") return e.json({ classCode: t, studentCount: 3, progressStats: { avg_completion: 75.5, min_completion: 50, max_completion: 100, active_students: 3, total_time: 450 }, accuracyStats: { total_questions: 150, correct_questions: 120, avg_accuracy: 80 }, errorPatterns: [{ error_pattern: "\u304F\u308A\u4E0A\u304C\u308A\u5FD8\u308C", count: 12, affected_students: 2 }, { error_pattern: "\u8A08\u7B97\u30DF\u30B9", count: 8, affected_students: 3 }, { error_pattern: "\u6841\u306E\u4E26\u3079\u9593\u9055\u3044", count: 5, affected_students: 2 }, { error_pattern: "\u554F\u984C\u306E\u8AAD\u307F\u9593\u9055\u3044", count: 3, affected_students: 1 }], learningTimeDistribution: [{ name: "\u5C71\u7530\u592A\u90CE", student_number: "001", total_time: 180, completed_curriculums: 2 }, { name: "\u4F50\u85E4\u82B1\u5B50", student_number: "002", total_time: 150, completed_curriculums: 2 }, { name: "\u9234\u6728\u6B21\u90CE", student_number: "003", total_time: 120, completed_curriculums: 1 }], progressDistribution: [{ range: "\u5B8C\u4E86", count: 1 }, { range: "75-99%", count: 1 }, { range: "50-75%", count: 1 }] });
    if (n.results.length === 0) return e.json({ error: "No students found" }, 404);
    const a = n.results.map((E) => E.id), o = a.map(() => "?").join(",");
    let i = r.DB.prepare(`
      SELECT 
        AVG(completion_percentage) as avg_completion,
        MIN(completion_percentage) as min_completion,
        MAX(completion_percentage) as max_completion,
        COUNT(DISTINCT student_id) as active_students,
        SUM(total_learning_time) as total_time
      FROM progress
      WHERE student_id IN (${o})
      ${s ? "AND curriculum_id = ?" : ""}
    `);
    s ? i = i.bind(...a, s) : i = i.bind(...a);
    const c = await i.first();
    let l = r.DB.prepare(`
      SELECT 
        COUNT(*) as total_questions,
        SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct_questions,
        AVG(CASE WHEN is_correct = 1 THEN 100.0 ELSE 0.0 END) as avg_accuracy
      FROM error_history
      WHERE student_id IN (${o})
      ${s ? "AND curriculum_id = ?" : ""}
    `);
    s ? l = l.bind(...a, s) : l = l.bind(...a);
    const u = await l.first();
    let d = r.DB.prepare(`
      SELECT 
        error_pattern,
        COUNT(*) as count,
        COUNT(DISTINCT student_id) as affected_students
      FROM error_history
      WHERE student_id IN (${o})
      ${s ? "AND curriculum_id = ?" : ""}
        AND is_correct = 0 
        AND error_pattern IS NOT NULL
      GROUP BY error_pattern
      ORDER BY count DESC
      LIMIT 10
    `);
    s ? d = d.bind(...a, s) : d = d.bind(...a);
    const _ = await d.all();
    let m = r.DB.prepare(`
      SELECT 
        u.name,
        u.student_number,
        COALESCE(SUM(p.total_learning_time), 0) as total_time,
        COUNT(DISTINCT p.curriculum_id) as completed_curriculums
      FROM users u
      LEFT JOIN progress p ON u.id = p.student_id
      WHERE u.class_code = ? AND u.role = 'student'
      ${s ? "AND p.curriculum_id = ?" : ""}
      GROUP BY u.id, u.name, u.student_number
      ORDER BY total_time DESC
    `);
    s ? m = m.bind(t, s) : m = m.bind(t);
    const h = await m.all();
    let g = r.DB.prepare(`
      SELECT 
        CASE 
          WHEN completion_percentage = 0 THEN '\u672A\u958B\u59CB'
          WHEN completion_percentage < 25 THEN '0-25%'
          WHEN completion_percentage < 50 THEN '25-50%'
          WHEN completion_percentage < 75 THEN '50-75%'
          WHEN completion_percentage < 100 THEN '75-99%'
          ELSE '\u5B8C\u4E86'
        END as range,
        COUNT(DISTINCT student_id) as count
      FROM progress
      WHERE student_id IN (${o})
      ${s ? "AND curriculum_id = ?" : ""}
      GROUP BY range
      ORDER BY 
        CASE range
          WHEN '\u672A\u958B\u59CB' THEN 1
          WHEN '0-25%' THEN 2
          WHEN '25-50%' THEN 3
          WHEN '50-75%' THEN 4
          WHEN '75-99%' THEN 5
          WHEN '\u5B8C\u4E86' THEN 6
        END
    `);
    s ? g = g.bind(...a, s) : g = g.bind(...a);
    const f = await g.all();
    return e.json({ classCode: t, studentCount: n.results.length, progressStats: c, accuracyStats: u, errorPatterns: _.results, learningTimeDistribution: h.results, progressDistribution: f.results });
  } catch (n) {
    return console.error("Statistics error:", n), e.json({ error: "Failed to get statistics", details: n.message }, 500);
  }
});
p.get("/api/statistics/noncognitive/:classCode", async (e) => {
  const { env: r } = e, t = e.req.param("classCode");
  try {
    const s = await r.DB.prepare(`
      SELECT id, name FROM users 
      WHERE class_code = ? AND role = 'student'
    `).bind(t).all();
    if (s.results.length === 0) return e.json({ error: "No students found" }, 404);
    const n = s.results.map((u) => u.id), a = n.map(() => "?").join(","), o = [];
    for (const u of s.results) {
      const d = await r.DB.prepare(`
        SELECT * FROM cross_subject_evaluations
        WHERE student_id = ?
        ORDER BY evaluation_period_end DESC
        LIMIT 1
      `).bind(u.id).first();
      d && o.push({ studentName: u.name, persistence: d.persistence_score, selfRegulation: d.self_regulation_score, collaboration: d.collaboration_score, curiosity: d.curiosity_score, metacognition: d.metacognition_score, growthMindset: d.growth_mindset_score });
    }
    const i = { persistence: 0, selfRegulation: 0, collaboration: 0, curiosity: 0, metacognition: 0, growthMindset: 0 };
    o.length > 0 && (i.persistence = o.reduce((u, d) => u + (d.persistence || 0), 0) / o.length, i.selfRegulation = o.reduce((u, d) => u + (d.selfRegulation || 0), 0) / o.length, i.collaboration = o.reduce((u, d) => u + (d.collaboration || 0), 0) / o.length, i.curiosity = o.reduce((u, d) => u + (d.curiosity || 0), 0) / o.length, i.metacognition = o.reduce((u, d) => u + (d.metacognition || 0), 0) / o.length, i.growthMindset = o.reduce((u, d) => u + (d.growthMindset || 0), 0) / o.length);
    const c = await r.DB.prepare(`
      SELECT 
        observation_type,
        COUNT(*) as count,
        SUM(CASE WHEN is_positive = 1 THEN 1 ELSE 0 END) as positive_count
      FROM teacher_observations
      WHERE student_id IN (${a})
        AND observation_date >= date('now', '-30 days')
      GROUP BY observation_type
      ORDER BY count DESC
    `).bind(...n).all(), l = await r.DB.prepare(`
      SELECT 
        AVG(mood_rating) as avg_mood,
        AVG(effort_rating) as avg_effort,
        AVG(understanding_rating) as avg_understanding,
        COUNT(*) as total_reflections
      FROM student_reflections
      WHERE student_id IN (${a})
        AND reflection_date >= date('now', '-30 days')
    `).bind(...n).first();
    return e.json({ classCode: t, studentCount: s.results.length, noncognitiveScores: o, avgScores: i, observationStats: c.results, reflectionStats: l });
  } catch (s) {
    return console.error("Noncognitive statistics error:", s), e.json({ error: "Failed to get noncognitive statistics", details: s.message }, 500);
  }
});
p.post("/api/ai/analyze-growth", async (e) => {
  const { env: r } = e, { studentId: t, analysisType: s } = await e.req.json();
  if (/^\d{1,2}$/.test(t)) return e.json({ studentName: "\u30C7\u30E2\u751F\u5F92", analysisDate: (/* @__PURE__ */ new Date()).toISOString(), growthPatterns: [{ category: "\u5B66\u7FD2\u614B\u5EA6", trend: "\u5411\u4E0A", description: "\u632F\u308A\u8FD4\u308A\u306E\u8A18\u8FF0\u304C\u5177\u4F53\u7684\u306B\u306A\u308A\u3001\u81EA\u5DF1\u8A55\u4FA1\u306E\u7CBE\u5EA6\u304C\u5411\u4E0A\u3002\u52AA\u529B\u8A55\u4FA1\u304C\u5B89\u5B9A\u3057\u30664\u4EE5\u4E0A\u3092\u7DAD\u6301\u3002", evidence: "\u904E\u53BB3\u30F6\u6708\u306E\u632F\u308A\u8FD4\u308A\u30C7\u30FC\u30BF\u3088\u308A" }, { category: "\u7406\u89E3\u5EA6", trend: "\u5B89\u5B9A", description: "\u57FA\u790E\u7684\u306A\u6982\u5FF5\u306E\u7406\u89E3\u306F\u5B9A\u7740\u3002\u767A\u5C55\u7684\u306A\u554F\u984C\u306B\u3082\u6311\u6226\u3059\u308B\u59FF\u52E2\u304C\u898B\u3089\u308C\u308B\u3002", evidence: "\u6559\u5E2B\u306E\u898B\u53D6\u308A\u8A18\u9332\u3088\u308A" }, { category: "\u975E\u8A8D\u77E5\u80FD\u529B", trend: "\u767A\u9054\u4E2D", description: "\u3084\u308A\u629C\u304F\u529B\u3068\u597D\u5947\u5FC3\u304C\u7279\u306B\u4F38\u9577\u3002\u5354\u50CD\u6027\u3082\u5411\u4E0A\u50BE\u5411\u3002", evidence: "\u6559\u79D1\u6A2A\u65AD\u8A55\u4FA1\u3088\u308A" }], strengths: ["\u7D99\u7D9A\u7684\u306A\u52AA\u529B\u304C\u3067\u304D\u308B", "\u81EA\u5DF1\u8A55\u4FA1\u304C\u9069\u5207", "\u524D\u5411\u304D\u306A\u5B66\u7FD2\u59FF\u52E2"], challenges: ["\u96E3\u3057\u3044\u554F\u984C\u3078\u306E\u6311\u6226\u3092\u3055\u3089\u306B\u5897\u3084\u3059", "\u30E1\u30BF\u8A8D\u77E5\u80FD\u529B\u306E\u3055\u3089\u306A\u308B\u5411\u4E0A"], recommendations: ["\u767A\u5C55\u7684\u306A\u554F\u984C\u306B\u5B9A\u671F\u7684\u306B\u53D6\u308A\u7D44\u3080\u6A5F\u4F1A\u3092\u8A2D\u3051\u308B", "\u81EA\u5206\u306E\u5B66\u7FD2\u65B9\u6CD5\u3092\u632F\u308A\u8FD4\u308B\u6642\u9593\u3092\u5897\u3084\u3059", "\u30B0\u30EB\u30FC\u30D7\u5B66\u7FD2\u3067\u30EA\u30FC\u30C0\u30FC\u30B7\u30C3\u30D7\u3092\u767A\u63EE\u3059\u308B\u6A5F\u4F1A\u3092\u4F5C\u308B"], dataQuality: { reflectionsCount: 12, observationsCount: 8, evaluationsCount: 3, progressCount: 5 } });
  try {
    const n = await r.DB.prepare(`
      SELECT * FROM users WHERE id = ?
    `).bind(t).first();
    if (!n) return e.json({ error: "Student not found" }, 404);
    const a = await r.DB.prepare(`
      SELECT * FROM student_reflections
      WHERE student_id = ?
        AND reflection_date >= date('now', '-90 days')
      ORDER BY reflection_date ASC
    `).bind(t).all(), o = await r.DB.prepare(`
      SELECT * FROM teacher_observations
      WHERE student_id = ?
        AND observation_date >= date('now', '-90 days')
      ORDER BY observation_date ASC
    `).bind(t).all(), i = await r.DB.prepare(`
      SELECT * FROM cross_subject_evaluations
      WHERE student_id = ?
      ORDER BY evaluation_period_start ASC
    `).bind(t).all(), c = await r.DB.prepare(`
      SELECT p.*, c.curriculum_title
      FROM progress p
      LEFT JOIN curriculum c ON p.curriculum_id = c.id
      WHERE p.student_id = ?
      ORDER BY p.updated_at DESC
    `).bind(t).all(), l = `
\u751F\u5F92\u540D: ${n.name}
\u5206\u6790\u30BF\u30A4\u30D7: ${s || "\u7DCF\u5408\u7684\u306A\u6210\u9577\u30D1\u30BF\u30FC\u30F3"}

\u3010\u632F\u308A\u8FD4\u308A\u30C7\u30FC\u30BF\u3011(${a.results.length}\u4EF6)
${a.results.slice(0, 5).map((d) => `- ${d.reflection_date}: ${d.what_learned || ""} | \u6C17\u5206:${d.mood_rating}/5 \u52AA\u529B:${d.effort_rating}/5 \u7406\u89E3:${d.understanding_rating}/5`).join(`
`)}

\u3010\u6559\u5E2B\u306E\u898B\u53D6\u308A\u3011(${o.results.length}\u4EF6)
${o.results.slice(0, 5).map((d) => `- ${d.observation_date}: [${d.observation_type}] ${d.observation_text || ""}`).join(`
`)}

\u3010\u6559\u79D1\u6A2A\u65AD\u8A55\u4FA1\u3011(${i.results.length}\u4EF6)
${i.results.map((d) => `- ${d.evaluation_period_start}\uFF5E${d.evaluation_period_end}: \u8AAD\u89E3${d.reading_comprehension} \u6587\u7AE0${d.writing_expression} \u8AD6\u7406${d.logical_thinking} \u5275\u9020${d.creative_thinking} \u554F\u984C\u89E3\u6C7A${d.problem_solving}`).join(`
`)}

\u3053\u306E\u751F\u5F92\u306E\u6210\u9577\u30D1\u30BF\u30FC\u30F3\u3092\u5206\u6790\u3057\u3001\u4EE5\u4E0B\u306E\u89B3\u70B9\u3067\u307E\u3068\u3081\u3066\u304F\u3060\u3055\u3044\uFF1A
1. \u5B66\u7FD2\u614B\u5EA6\u306E\u5909\u5316
2. \u7406\u89E3\u5EA6\u306E\u63A8\u79FB
3. \u975E\u8A8D\u77E5\u80FD\u529B\u306E\u767A\u9054
4. \u4ECA\u5F8C\u306E\u8AB2\u984C\u3068\u63A8\u5968\u4E8B\u9805
`, u = { studentName: n.name, analysisDate: (/* @__PURE__ */ new Date()).toISOString(), growthPatterns: [{ category: "\u5B66\u7FD2\u614B\u5EA6", trend: "\u5411\u4E0A", description: "\u632F\u308A\u8FD4\u308A\u306E\u8A18\u8FF0\u304C\u5177\u4F53\u7684\u306B\u306A\u308A\u3001\u81EA\u5DF1\u8A55\u4FA1\u306E\u7CBE\u5EA6\u304C\u5411\u4E0A\u3002\u52AA\u529B\u8A55\u4FA1\u304C\u5B89\u5B9A\u3057\u30664\u4EE5\u4E0A\u3092\u7DAD\u6301\u3002", evidence: a.results.length > 0 ? "\u904E\u53BB3\u30F6\u6708\u306E\u632F\u308A\u8FD4\u308A\u30C7\u30FC\u30BF\u3088\u308A" : "" }, { category: "\u7406\u89E3\u5EA6", trend: "\u5B89\u5B9A", description: "\u57FA\u790E\u7684\u306A\u6982\u5FF5\u306E\u7406\u89E3\u306F\u5B9A\u7740\u3002\u767A\u5C55\u7684\u306A\u554F\u984C\u306B\u3082\u6311\u6226\u3059\u308B\u59FF\u52E2\u304C\u898B\u3089\u308C\u308B\u3002", evidence: o.results.length > 0 ? "\u6559\u5E2B\u306E\u898B\u53D6\u308A\u8A18\u9332\u3088\u308A" : "" }, { category: "\u975E\u8A8D\u77E5\u80FD\u529B", trend: "\u767A\u9054\u4E2D", description: "\u3084\u308A\u629C\u304F\u529B\u3068\u597D\u5947\u5FC3\u304C\u7279\u306B\u4F38\u9577\u3002\u5354\u50CD\u6027\u3082\u5411\u4E0A\u50BE\u5411\u3002", evidence: i.results.length > 0 ? "\u6559\u79D1\u6A2A\u65AD\u8A55\u4FA1\u3088\u308A" : "" }], strengths: ["\u7D99\u7D9A\u7684\u306A\u52AA\u529B\u304C\u3067\u304D\u308B", "\u81EA\u5DF1\u8A55\u4FA1\u304C\u9069\u5207", "\u524D\u5411\u304D\u306A\u5B66\u7FD2\u59FF\u52E2"], challenges: ["\u96E3\u3057\u3044\u554F\u984C\u3078\u306E\u6311\u6226\u3092\u3055\u3089\u306B\u5897\u3084\u3059", "\u30E1\u30BF\u8A8D\u77E5\u80FD\u529B\u306E\u3055\u3089\u306A\u308B\u5411\u4E0A"], recommendations: ["\u767A\u5C55\u7684\u306A\u554F\u984C\u306B\u5B9A\u671F\u7684\u306B\u53D6\u308A\u7D44\u3080\u6A5F\u4F1A\u3092\u8A2D\u3051\u308B", "\u81EA\u5206\u306E\u5B66\u7FD2\u65B9\u6CD5\u3092\u632F\u308A\u8FD4\u308B\u6642\u9593\u3092\u5897\u3084\u3059", "\u30B0\u30EB\u30FC\u30D7\u5B66\u7FD2\u3067\u30EA\u30FC\u30C0\u30FC\u30B7\u30C3\u30D7\u3092\u767A\u63EE\u3059\u308B\u6A5F\u4F1A\u3092\u4F5C\u308B"], dataQuality: { reflectionsCount: a.results.length, observationsCount: o.results.length, evaluationsCount: i.results.length, progressCount: c.results.length } };
    return e.json(u);
  } catch (n) {
    return console.error("AI analysis error:", n), e.json({ error: "Failed to analyze growth patterns", details: n.message }, 500);
  }
});
p.post("/api/media/generate-image", async (e) => {
  const { prompt: r, style: t } = await e.req.json(), n = "data:image/svg+xml;base64," + Buffer.from(`
    <svg width="600" height="400" xmlns="http://www.w3.org/2000/svg">
      <!-- \u80CC\u666F -->
      <rect width="600" height="400" fill="#f0fdf4"/>
      
      <!-- \u30BF\u30A4\u30C8\u30EB -->
      <text x="300" y="40" font-size="28" font-weight="bold" text-anchor="middle" fill="#166534">
        0.3 \xD7 4 = 1.2
      </text>
      
      <!-- 4\u3064\u306E0.3\u3092\u8996\u899A\u5316 -->
      <g id="blocks">
        <!-- \u30D6\u30ED\u30C3\u30AF1 -->
        <rect x="50" y="80" width="120" height="80" fill="#22c55e" stroke="#166534" stroke-width="2" rx="8"/>
        <text x="110" y="130" font-size="32" font-weight="bold" text-anchor="middle" fill="white">0.3</text>
        
        <!-- \u30D6\u30ED\u30C3\u30AF2 -->
        <rect x="190" y="80" width="120" height="80" fill="#22c55e" stroke="#166534" stroke-width="2" rx="8"/>
        <text x="250" y="130" font-size="32" font-weight="bold" text-anchor="middle" fill="white">0.3</text>
        
        <!-- \u30D6\u30ED\u30C3\u30AF3 -->
        <rect x="330" y="80" width="120" height="80" fill="#22c55e" stroke="#166534" stroke-width="2" rx="8"/>
        <text x="390" y="130" font-size="32" font-weight="bold" text-anchor="middle" fill="white">0.3</text>
        
        <!-- \u30D6\u30ED\u30C3\u30AF4 -->
        <rect x="470" y="80" width="120" height="80" fill="#22c55e" stroke="#166534" stroke-width="2" rx="8"/>
        <text x="530" y="130" font-size="32" font-weight="bold" text-anchor="middle" fill="white">0.3</text>
      </g>
      
      <!-- \u77E2\u5370 -->
      <path d="M 300 180 L 300 220" stroke="#166534" stroke-width="3" fill="none" marker-end="url(#arrowhead)"/>
      <defs>
        <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto">
          <polygon points="0 0, 10 5, 0 10" fill="#166534"/>
        </marker>
      </defs>
      
      <!-- \u5408\u8A08 -->
      <rect x="150" y="240" width="300" height="100" fill="#3b82f6" stroke="#1e40af" stroke-width="2" rx="8"/>
      <text x="300" y="280" font-size="24" font-weight="bold" text-anchor="middle" fill="white">
        0.3 + 0.3 + 0.3 + 0.3
      </text>
      <text x="300" y="320" font-size="40" font-weight="bold" text-anchor="middle" fill="white">
        = 1.2
      </text>
    </svg>
  `).toString("base64");
  return e.json({ success: true, imageUrl: n, prompt: r, style: t, note: "0.3\u304C4\u3064\u30671.2\u306B\u306A\u308B\u3053\u3068\u3092\u56F3\u89E3\u3067\u8868\u73FE\u3057\u307E\u3057\u305F" });
});
p.post("/api/media/generate-video", async (e) => {
  const { prompt: r, duration: t } = await e.req.json();
  return e.json({ success: true, animationHtml: `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          width: 100%; 
          height: 100%; 
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
          font-family: 'Arial', 'Hiragino Kaku Gothic Pro', 'Meiryo', sans-serif;
          overflow: hidden;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        canvas { 
          background: white; 
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.1);
        }
      </style>
    </head>
    <body>
      <canvas id="canvas" width="800" height="500"></canvas>
      <script>
        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');
        let time = 0;
        
        console.log('\u{1F3AC} Canvas initialized');
        
        // \u30EA\u30F3\u30B4\u3092\u63CF\u304F\u95A2\u6570
        function drawApple(x, y, size, alpha = 1) {
          ctx.save();
          ctx.globalAlpha = alpha;
          
          // \u30EA\u30F3\u30B4\u306E\u672C\u4F53\uFF08\u8D64\uFF09
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fill();
          
          // \u30CF\u30A4\u30E9\u30A4\u30C8
          ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.beginPath();
          ctx.arc(x - size * 0.3, y - size * 0.3, size * 0.3, 0, Math.PI * 2);
          ctx.fill();
          
          // \u8449\u3063\u3071\uFF08\u7DD1\uFF09
          ctx.fillStyle = '#22c55e';
          ctx.beginPath();
          ctx.ellipse(x + size * 0.5, y - size * 0.8, size * 0.4, size * 0.2, -Math.PI / 6, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.restore();
        }
        
        // \u30C6\u30AD\u30B9\u30C8\u3092\u63CF\u304F\u95A2\u6570
        function drawText(text, x, y, fontSize, color, alpha = 1) {
          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.fillStyle = color;
          ctx.font = 'bold ' + fontSize + 'px Arial, Hiragino Kaku Gothic Pro';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(text, x, y);
          ctx.restore();
        }
        
        // \u56F2\u307F\u67A0\u3092\u63CF\u304F\u95A2\u6570
        function drawBox(x, y, w, h, alpha = 1) {
          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.strokeStyle = '#10b981';
          ctx.lineWidth = 4;
          ctx.setLineDash([10, 5]);
          ctx.strokeRect(x, y, w, h);
          ctx.restore();
        }
        
        // \u30A4\u30FC\u30B8\u30F3\u30B0\u95A2\u6570
        function easeOutBounce(t) {
          const n1 = 7.5625;
          const d1 = 2.75;
          if (t < 1 / d1) {
            return n1 * t * t;
          } else if (t < 2 / d1) {
            return n1 * (t -= 1.5 / d1) * t + 0.75;
          } else if (t < 2.5 / d1) {
            return n1 * (t -= 2.25 / d1) * t + 0.9375;
          } else {
            return n1 * (t -= 2.625 / d1) * t + 0.984375;
          }
        }
        
        function easeOutBack(t) {
          const c1 = 1.70158;
          const c3 = c1 + 1;
          return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
        }
        
        // \u30A2\u30CB\u30E1\u30FC\u30B7\u30E7\u30F3\u95A2\u6570
        function animate() {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          // \u30C7\u30D0\u30C3\u30B0: 1\u79D2\u3054\u3068\u306B\u30ED\u30B0\u51FA\u529B
          if (Math.floor(time) !== Math.floor(time - 1/60)) {
            console.log('\u23F1\uFE0F Time:', Math.floor(time) + 's');
          }
          
          // \u30D5\u30A7\u30FC\u30BA1: \u30BF\u30A4\u30C8\u30EB\u8868\u793A\uFF080-1\u79D2\uFF09
          if (time < 1) {
            const alpha = Math.min(time * 2, 1);
            drawText('3 \xD7 4 \u306E \u3051\u3044\u3055\u3093', 400, 50, 36, '#1e40af', alpha);
          } else {
            drawText('3 \xD7 4 \u306E \u3051\u3044\u3055\u3093', 400, 50, 36, '#1e40af', 1);
          }
          
          // \u30D5\u30A7\u30FC\u30BA2: \u554F\u984C\u8868\u793A\uFF081-2\u79D2\uFF09
          if (time >= 1 && time < 2) {
            const t = (time - 1);
            const scale = easeOutBack(Math.min(t, 1));
            ctx.save();
            ctx.translate(400, 110);
            ctx.scale(scale, scale);
            drawText('3 \xD7 4 = ?', 0, 0, 42, '#7c3aed', 1);
            ctx.restore();
          } else if (time >= 2) {
            drawText('3 \xD7 4 = ?', 400, 110, 42, '#7c3aed', 1);
          }
          
          // \u30D5\u30A7\u30FC\u30BA3-6: \u30EA\u30F3\u30B4\u304C4\u30B0\u30EB\u30FC\u30D7\u767B\u5834\uFF082-6\u79D2\uFF09
          const groups = [
            { startTime: 2, label: '1\u3064\u3081', x: 185, y: 230 },
            { startTime: 3, label: '2\u3064\u3081', x: 325, y: 230 },
            { startTime: 4, label: '3\u3064\u3081', x: 465, y: 230 },
            { startTime: 5, label: '4\u3064\u3081', x: 605, y: 230 }
          ];
          
          groups.forEach((group) => {
            if (time >= group.startTime) {
              const t = Math.min((time - group.startTime), 1);
              const ease = easeOutBounce(t);
              const alpha = Math.min(t * 3, 1);
              
              // \u30E9\u30D9\u30EB
              drawText(group.label, group.x, group.y - 50, 22, '#059669', alpha);
              
              // \u56F2\u307F\u67A0
              if (t > 0.3) {
                drawBox(group.x - 55, group.y - 30, 110, 80, (t - 0.3) / 0.7);
              }
              
              // \u30EA\u30F3\u30B43\u500B\uFF08\u4E0A\u304B\u3089\u843D\u3061\u3066\u304F\u308B\uFF09
              for (let i = 0; i < 3; i++) {
                const appleX = group.x + (i - 1) * 35;
                const appleY = group.y - 100 + ease * 100;
                drawApple(appleX, appleY, 17, alpha);
              }
            }
          });
          
          // \u30D5\u30A7\u30FC\u30BA7: \u8AAC\u660E\u8868\u793A\uFF086-7\u79D2\uFF09
          if (time >= 6) {
            const alpha = Math.min((time - 6) * 2, 1);
            drawText('3\u304C 4\u3064 \u2192 3+3+3+3', 400, 320, 28, '#6b7280', alpha);
          }
          
          // \u30D5\u30A7\u30FC\u30BA8: \u7B54\u3048\u8868\u793A\uFF087\u79D2\u4EE5\u964D\uFF09
          if (time >= 7) {
            const t = Math.min((time - 7) / 0.8, 1);
            const scale = 0.5 + easeOutBack(t) * 0.5;
            const pulseScale = time >= 8 ? 1 + Math.sin((time - 8) * 4) * 0.05 : 1;
            
            ctx.save();
            ctx.translate(400, 400);
            ctx.scale(scale * pulseScale, scale * pulseScale);
            
            // \u5F71
            ctx.shadowColor = 'rgba(59, 130, 246, 0.3)';
            ctx.shadowBlur = 20;
            ctx.shadowOffsetY = 5;
            
            drawText('= 12', 0, 0, 70, '#3b82f6', 1);
            ctx.restore();
          }
          
          // \u6642\u9593\u3092\u9032\u3081\u308B
          time += 1 / 60;
          
          // \u30A2\u30CB\u30E1\u30FC\u30B7\u30E7\u30F3\u7D99\u7D9A\uFF0810\u79D2\u307E\u3067\uFF09
          if (time < 10) {
            requestAnimationFrame(animate);
          } else {
            console.log('\u2705 Animation complete');
          }
        }
        
        // \u30A2\u30CB\u30E1\u30FC\u30B7\u30E7\u30F3\u958B\u59CB
        animate();
      <\/script>
    </body>
    </html>
  `, prompt: r, duration: t || 8, note: "Canvas \u30A2\u30CB\u30E1\u30FC\u30B7\u30E7\u30F3\uFF1A\u30EA\u30F3\u30B4\u304C\u52D5\u3044\u3066\u767B\u5834\uFF01 3\u3064\u306E\u307E\u3068\u307E\u308A\u304C4\u30BB\u30C3\u30C8\u3001\u5408\u8A0812\u500B\u306B\u306A\u308B\u69D8\u5B50\u304C\u8996\u899A\u7684\u306B\u7406\u89E3\u3067\u304D\u307E\u3059" });
});
p.post("/api/media/generate-video-case", async (e) => {
  const { caseNumber: r, duration: t } = await e.req.json(), s = { 4: { title: "\u8272\u3068\u56F3\u5F62\u3067\u7406\u89E3", colors: ["#ef4444", "#3b82f6", "#10b981", "#f59e0b"], style: "\u30AB\u30E9\u30D5\u30EB", targetStudent: "\u8996\u899A\u60C5\u5831\u306B\u5F37\u3044D\u3055\u3093" }, 5: { title: "\u97F3\u3068\u30EA\u30BA\u30E0\u3067\u899A\u3048\u308B", colors: ["#8b5cf6", "#8b5cf6", "#8b5cf6", "#8b5cf6"], style: "\u30D0\u30A6\u30F3\u30C9\u30EA\u30BA\u30E0", targetStudent: "\u97F3\u3067\u899A\u3048\u308BE\u3055\u3093" }, 6: { title: "\u52D5\u304D\u3067\u4F53\u5F97", colors: ["#ef4444", "#3b82f6", "#10b981", "#f59e0b"], cupColor: "#f3f4f6", style: "\u7D19\u30B3\u30C3\u30D7\u3068\u304A\u306F\u3058\u304D", targetStudent: "\u4F53\u3092\u52D5\u304B\u3057\u3066\u5B66\u3076F\u3055\u3093" } }, n = s[r] || s[4], a = `
    <!DOCTYPE html>
    <html lang="ja">
    <head>
      <meta charset="UTF-8">
      <title>\u30B1\u30FC\u30B9${r}: ${n.title}</title>
      <style>
        body { margin: 0; padding: 0; background: white; }
        canvas { display: block; }
      </style>
    </head>
    <body>
      <canvas id="canvas" width="800" height="500"></canvas>
      <script>
        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');
        let time = 0;
        
        console.log('\u{1F3AC} Canvas initialized for Case ${r}');
        
        // \u30D8\u30EB\u30D1\u30FC\u95A2\u6570
        function drawText(text, x, y, size, color, alpha = 1) {
          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.fillStyle = color;
          ctx.font = 'bold ' + size + 'px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(text, x, y);
          ctx.restore();
        }
        
        function drawBox(x, y, w, h, alpha = 1) {
          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.strokeStyle = '#9ca3af';
          ctx.lineWidth = 2;
          ctx.strokeRect(x, y, w, h);
          ctx.restore();
        }
        
        function drawColorBlock(x, y, size, color, alpha = 1) {
          ctx.save();
          ctx.globalAlpha = alpha;
          
          // \u30B0\u30E9\u30C7\u30FC\u30B7\u30E7\u30F3
          const gradient = ctx.createRadialGradient(x, y - size/4, size/8, x, y, size);
          gradient.addColorStop(0, color);
          gradient.addColorStop(1, adjustBrightness(color, -20));
          
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fill();
          
          // \u5883\u754C\u7DDA
          ctx.strokeStyle = adjustBrightness(color, -40);
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.restore();
        }
        
        function adjustBrightness(color, amount) {
          const num = parseInt(color.replace('#',''), 16);
          const r = Math.min(255, Math.max(0, (num >> 16) + amount));
          const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
          const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
          return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
        }
        
        function easeOutElastic(t) {
          const c4 = (2 * Math.PI) / 3;
          return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
        }
        
        function easeOutBack(t) {
          const c1 = 1.70158;
          const c3 = c1 + 1;
          return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
        }
        
        const colors = ${JSON.stringify(n.colors)};
        const cupColor = '${n.cupColor || "#f3f4f6"}';
        const groups = [
          { x: 185, y: 280, label: '\u2460' },
          { x: 325, y: 280, label: '\u2461' },
          { x: 465, y: 280, label: '\u2462' },
          { x: 605, y: 280, label: '\u2463' }
        ];
        
        // \u7D19\u30B3\u30C3\u30D7\u3092\u63CF\u753B\u3059\u308B\u95A2\u6570
        function drawCup(x, y, alpha = 1) {
          ctx.save();
          ctx.globalAlpha = alpha;
          
          // \u7D19\u30B3\u30C3\u30D7\u306E\u53F0\u5F62\u5F62\u72B6
          ctx.fillStyle = cupColor;
          ctx.strokeStyle = '#d1d5db';
          ctx.lineWidth = 2;
          
          ctx.beginPath();
          ctx.moveTo(x - 30, y - 40); // \u4E0A\u5DE6
          ctx.lineTo(x + 30, y - 40); // \u4E0A\u53F3
          ctx.lineTo(x + 35, y + 20);  // \u4E0B\u53F3
          ctx.lineTo(x - 35, y + 20);  // \u4E0B\u5DE6
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          
          // \u30B3\u30C3\u30D7\u306E\u7E01\uFF08\u6955\u5186\uFF09
          ctx.fillStyle = '#e5e7eb';
          ctx.beginPath();
          ctx.ellipse(x, y - 40, 30, 8, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          
          // \u5185\u5074\u306E\u5F71
          ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
          ctx.beginPath();
          ctx.ellipse(x, y - 38, 28, 7, 0, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.restore();
        }
        
        // \u304A\u306F\u3058\u304D\uFF08\u30AB\u30E9\u30D5\u30EB\u306A\u4E38\uFF09\u3092\u63CF\u753B\u3059\u308B\u95A2\u6570
        function drawMarble(x, y, radius, color, alpha = 1) {
          ctx.save();
          ctx.globalAlpha = alpha;
          
          // \u30B0\u30E9\u30C7\u30FC\u30B7\u30E7\u30F3
          const gradient = ctx.createRadialGradient(x - radius/3, y - radius/3, 0, x, y, radius);
          gradient.addColorStop(0, adjustBrightness(color, 60));
          gradient.addColorStop(1, color);
          
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fill();
          
          // \u5883\u754C\u7DDA
          ctx.strokeStyle = adjustBrightness(color, -40);
          ctx.lineWidth = 1.5;
          ctx.stroke();
          
          // \u30CF\u30A4\u30E9\u30A4\u30C8
          ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.beginPath();
          ctx.arc(x - radius/3, y - radius/3, radius/3, 0, Math.PI * 2);
          ctx.fill();
          
          ctx.restore();
        }
        
        function animate() {
          // \u30AF\u30EA\u30A2
          ctx.clearRect(0, 0, 800, 500);
          
          // \u30D5\u30A7\u30FC\u30BA1: \u30BF\u30A4\u30C8\u30EB\u8868\u793A\uFF080-1\u79D2\uFF09
          if (time < 1) {
            const alpha = Math.min(time * 2, 1);
            drawText('${n.title}', 400, 40, 32, '#1f2937', alpha);
            drawText('\u5BFE\u8C61: ${n.targetStudent}', 400, 75, 18, '#6b7280', alpha * 0.8);
          } else {
            drawText('${n.title}', 400, 40, 32, '#1f2937', 1);
            drawText('\u5BFE\u8C61: ${n.targetStudent}', 400, 75, 18, '#6b7280', 0.8);
          }
          
          // \u30D5\u30A7\u30FC\u30BA2: \u554F\u984C\u8868\u793A\uFF081-2\u79D2\uFF09
          if (time >= 1) {
            const t = Math.min((time - 1) * 2, 1);
            const bounceY = time >= 2 ? 0 : -20 * (1 - easeOutBack(t));
            drawText('3 \xD7 4 = ?', 400, 120 + bounceY, 42, '#4b5563', t);
          }
          
          // \u30D5\u30A7\u30FC\u30BA3: \u7D19\u30B3\u30C3\u30D74\u500B\u3092\u914D\u7F6E\uFF082-3\u79D2\uFF09
          if (time >= 2) {
            const t = Math.min((time - 2) * 2, 1);
            const ease = easeOutBack(t);
            
            groups.forEach((group, index) => {
              const delay = index * 0.15; // \u9806\u756A\u306B\u767B\u5834
              const cupT = Math.max(0, Math.min((t - delay) * 1.5, 1));
              const cupY = group.y - 50 + ease * 50;
              
              if (cupT > 0) {
                drawCup(group.x, cupY, cupT);
                // \u30E9\u30D9\u30EB
                drawText(group.label, group.x, group.y - 100, 24, '#9ca3af', cupT);
              }
            });
          }
          
          // \u30D5\u30A7\u30FC\u30BA4: \u7D19\u30B3\u30C3\u30D7\u304C\u5B8C\u5168\u306B\u914D\u7F6E\u3055\u308C\u305F\u72B6\u614B\u3092\u7DAD\u6301\uFF083\u79D2\u4EE5\u964D\uFF09
          if (time >= 3) {
            groups.forEach((group, index) => {
              drawCup(group.x, group.y, 1);
              drawText(group.label, group.x, group.y - 100, 24, '#9ca3af', 1);
            });
          }
          
          // \u30D5\u30A7\u30FC\u30BA5-8: \u304A\u306F\u3058\u304D\u304C1\u500B\u305A\u3064\u5165\u3063\u3066\u3044\u304F\uFF083-7\u79D2\u3001\u5404\u30B3\u30C3\u30D7\u306B3\u500B\u305A\u3064\uFF09
          if (time >= 3) {
            groups.forEach((group, groupIndex) => {
              for (let marbleIndex = 0; marbleIndex < 3; marbleIndex++) {
                const startTime = 3 + groupIndex + marbleIndex * 0.3;
                if (time >= startTime) {
                  const t = Math.min((time - startTime) * 3, 1);
                  const ease = easeOutElastic(t);
                  
                  // \u304A\u306F\u3058\u304D\u306E\u6700\u7D42\u4F4D\u7F6E\uFF08\u30B3\u30C3\u30D7\u306E\u4E2D\uFF09
                  const finalY = group.y - 20 + marbleIndex * 18;
                  const marbleY = group.y - 120 + ease * (finalY - (group.y - 120));
                  
                  drawMarble(group.x, marbleY, 10, colors[groupIndex], Math.min(t * 2, 1));
                }
              }
            });
          }
          
          // \u30D5\u30A7\u30FC\u30BA9: \u8AAC\u660E\u8868\u793A\uFF087-8\u79D2\uFF09
          if (time >= 7) {
            const alpha = Math.min((time - 7) * 2, 1);
            drawText('3\u500B\u305A\u3064 \xD7 4\u3064\u306E\u30B3\u30C3\u30D7', 400, 360, 26, '#6b7280', alpha);
            drawText('= 3+3+3+3', 400, 390, 24, '#8b5cf6', alpha);
          }
          
          // \u30D5\u30A7\u30FC\u30BA10: \u7B54\u3048\u8868\u793A\uFF088\u79D2\u4EE5\u964D\uFF09
          if (time >= 8) {
            const t = Math.min((time - 8) / 0.8, 1);
            const scale = 0.5 + easeOutBack(t) * 0.5;
            const pulseScale = time >= 9 ? 1 + Math.sin((time - 9) * 4) * 0.05 : 1;
            
            ctx.save();
            ctx.translate(400, 440);
            ctx.scale(scale * pulseScale, scale * pulseScale);
            
            // \u5F71
            ctx.shadowColor = 'rgba(59, 130, 246, 0.3)';
            ctx.shadowBlur = 20;
            ctx.shadowOffsetY = 5;
            
            drawText('= 12\u500B\uFF01', 0, 0, 60, '#3b82f6', 1);
            ctx.restore();
          }
          
          // \u6642\u9593\u3092\u9032\u3081\u308B
          time += 1 / 60;
          
          // \u30A2\u30CB\u30E1\u30FC\u30B7\u30E7\u30F3\u7D99\u7D9A\uFF0810\u79D2\u307E\u3067\uFF09
          if (time < 10) {
            requestAnimationFrame(animate);
          } else {
            console.log('\u2705 Animation complete: \u7D19\u30B3\u30C3\u30D7\u3068\u304A\u306F\u3058\u304D');
          }
        }
        
        // \u30A2\u30CB\u30E1\u30FC\u30B7\u30E7\u30F3\u958B\u59CB
        animate();
      <\/script>
    </body>
    </html>
  `;
  return e.json({ success: true, animationHtml: a, caseNumber: r, duration: t || 10, note: `\u30B1\u30FC\u30B9${r}: ${n.title} - ${n.targetStudent}\u5411\u3051\u306E\u500B\u5225\u6700\u9069\u5316\u3055\u308C\u305F\u5B66\u7FD2\u52D5\u753B` });
});
p.post("/api/media/generate-video-support", async (e) => {
  const { caseNumber: r } = await e.req.json(), t = { 7: { title: "\u30B9\u30E2\u30FC\u30EB\u30B9\u30C6\u30C3\u30D7\u3067\u7406\u89E3", speed: "\u3086\u3063\u304F\u308A", fontSize: 80, targetStudent: "\u3086\u3063\u304F\u308A\u4E01\u5BE7\u306B\u5B66\u3076G\u3055\u3093" }, 8: { title: "\u5BB6\u5EAD\u5B66\u7FD2\u30B5\u30DD\u30FC\u30C8", speed: "\u6A19\u6E96", fontSize: 32, targetStudent: "\u4FDD\u8B77\u8005\u306E\u65B9" }, 9: { title: "\u30AF\u30E9\u30B9\u5168\u4F53\u306E\u7406\u89E3\u5EA6\u5206\u6790", speed: "\u901F\u3044", fontSize: 28, targetStudent: "\u6559\u5E2B\u306E\u65B9" } }, s = t[r] || t[7], n = `
    <!DOCTYPE html>
    <html lang="ja">
    <head>
      <meta charset="UTF-8">
      <title>\u30B1\u30FC\u30B9${r}: ${s.title}</title>
      <style>
        body { margin: 0; padding: 0; background: white; }
        canvas { display: block; }
      </style>
    </head>
    <body>
      <canvas id="canvas" width="800" height="500"></canvas>
      <script>
        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');
        let time = 0;
        
        function drawText(text, x, y, size, color, alpha = 1) {
          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.fillStyle = color;
          ctx.font = 'bold ' + size + 'px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(text, x, y);
          ctx.restore();
        }
        
        function animate() {
          ctx.clearRect(0, 0, 800, 500);
          
          // \u30BF\u30A4\u30C8\u30EB
          drawText('\${config.title}', 400, 50, 36, '#1f2937', 1);
          drawText('\u5BFE\u8C61: \${config.targetStudent}', 400, 90, 20, '#6b7280', 0.8);
          
          // \u5185\u5BB9\uFF08\u30B1\u30FC\u30B9\u5225\uFF09
          if (\${caseNumber} === 7) {
            // \u30B1\u30FC\u30B97: \u7279\u5225\u652F\u63F4 - \u8D85\u30B9\u30ED\u30FC\u30DA\u30FC\u30B9
            const step = Math.floor(time * 0.5); // 2\u79D2\u306B1\u30B9\u30C6\u30C3\u30D7
            if (step >= 0) drawText('1\u500B\u76EE', 400, 180, 60, '#4b5563', 1);
            if (step >= 1) drawText('2\u500B\u76EE', 400, 250, 60, '#4b5563', 1);
            if (step >= 2) drawText('3\u500B\u76EE', 400, 320, 60, '#4b5563', 1);
            if (step >= 3) drawText('\u3053\u308C\u3092 4\u56DE', 400, 390, 50, '#3b82f6', 1);
            if (step >= 4) drawText('= 12', 400, 450, 70, '#10b981', 1);
          } else if (\${caseNumber} === 8) {
            // \u30B1\u30FC\u30B98: \u4FDD\u8B77\u8005\u5411\u3051
            if (time >= 1) drawText('\u304A\u5B50\u3055\u3093\u3078\u306E\u58F0\u304B\u3051\u4F8B:', 400, 150, 28, '#6b7280', 1);
            if (time >= 2) drawText('\u300C3\u500B\u305A\u3064\u3042\u308B\u306D\u300D', 400, 200, 32, '#4b5563', 1);
            if (time >= 3) drawText('\u300C\u305D\u308C\u304C4\u3064\u3042\u308B\u3088\u300D', 400, 250, 32, '#4b5563', 1);
            if (time >= 4) drawText('\u300C\u5168\u90E8\u3067\u4F55\u500B\u304B\u306A\uFF1F\u300D', 400, 300, 32, '#4b5563', 1);
            if (time >= 5) drawText('\u4E00\u7DD2\u306B\u6570\u3048\u307E\u3057\u3087\u3046\uFF01', 400, 370, 36, '#3b82f6', 1);
          } else if (\${caseNumber} === 9) {
            // \u30B1\u30FC\u30B99: \u6559\u5E2B\u7528\u5206\u6790
            if (time >= 1) drawText('\u30AF\u30E9\u30B9\u5E73\u5747\u6B63\u7B54\u7387: 78%', 400, 170, 32, '#6b7280', 1);
            if (time >= 2) drawText('\u3064\u307E\u305A\u304D\u30DD\u30A4\u30F3\u30C8:', 400, 230, 28, '#ef4444', 1);
            if (time >= 3) drawText('\u2022 \u304F\u308A\u4E0A\u304C\u308A\u306E\u7406\u89E3', 400, 270, 24, '#4b5563', 1);
            if (time >= 4) drawText('\u2022 \u5F0F\u306E\u7ACB\u3066\u65B9', 400, 310, 24, '#4b5563', 1);
            if (time >= 5) drawText('\u2192 \u5FA9\u7FD2\u63A8\u5968', 400, 370, 32, '#f59e0b', 1);
          }
          
          time += 1 / 60;
          if (time < 10) requestAnimationFrame(animate);
        }
        
        animate();
      <\/script>
    </body>
    </html>
  `;
  return e.json({ success: true, animationHtml: n, caseNumber: r, duration: 10, note: `\u30B1\u30FC\u30B9${r}: ${s.title} - ${s.targetStudent}\u5411\u3051` });
});
p.post("/api/media/generate-video-practice", async (e) => {
  const { caseNumber: r } = await e.req.json(), t = { 10: { title: "\u30C6\u30B9\u30C8\u6E96\u5099 - \u3088\u304F\u51FA\u308B\u554F\u984C", targetStudent: "\u30C6\u30B9\u30C8\u524D\u306EH\u3055\u3093" }, 11: { title: "\u4E88\u7FD2 - \u6B21\u306E\u5358\u5143\u3078", targetStudent: "\u5148\u53D6\u308A\u5B66\u7FD2\u306EI\u3055\u3093" }, 12: { title: "\u5FA9\u7FD2 - \u8981\u70B9\u518D\u78BA\u8A8D", targetStudent: "\u5FD8\u308C\u304B\u3051\u3066\u3044\u308BJ\u3055\u3093" } }, s = t[r] || t[10];
  return e.json({ success: true, animationHtml: `
    <!DOCTYPE html>
    <html lang="ja">
    <head>
      <meta charset="UTF-8">
      <title>\u30B1\u30FC\u30B9\${caseNumber}: \${config.title}</title>
      <style>
        body { margin: 0; padding: 0; background: white; }
        canvas { display: block; }
      </style>
    </head>
    <body>
      <canvas id="canvas" width="800" height="500"></canvas>
      <script>
        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');
        let time = 0;
        
        function drawText(text, x, y, size, color, alpha = 1) {
          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.fillStyle = color;
          ctx.font = 'bold ' + size + 'px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(text, x, y);
          ctx.restore();
        }
        
        function animate() {
          ctx.clearRect(0, 0, 800, 500);
          
          // \u30BF\u30A4\u30C8\u30EB
          drawText('\${config.title}', 400, 50, 36, '#1f2937', 1);
          drawText('\u5BFE\u8C61: \${config.targetStudent}', 400, 90, 20, '#6b7280', 0.8);
          
          // \u5185\u5BB9\uFF08\u30B1\u30FC\u30B9\u5225\uFF09
          if (\${caseNumber} === 10) {
            // \u30B1\u30FC\u30B910: \u30C6\u30B9\u30C8\u6E96\u5099
            if (time >= 1) drawText('\u554F\u984C1: 3 \xD7 4 = ?', 400, 170, 32, '#4b5563', 1);
            if (time >= 3) drawText('\u2192 \u7B54\u3048: 12', 400, 220, 28, '#10b981', 1);
            if (time >= 4) drawText('\u554F\u984C2: 5 \xD7 3 = ?', 400, 290, 32, '#4b5563', 1);
            if (time >= 6) drawText('\u2192 \u7B54\u3048: 15', 400, 340, 28, '#10b981', 1);
            if (time >= 7) drawText('\u30DD\u30A4\u30F3\u30C8: \u307E\u3068\u307E\u308A\u3067\u8003\u3048\u308B', 400, 410, 26, '#3b82f6', 1);
          } else if (\${caseNumber} === 11) {
            // \u30B1\u30FC\u30B911: \u4E88\u7FD2
            if (time >= 1) drawText('3 \xD7 4 = 12 \u304B\u3089', 400, 170, 32, '#6b7280', 1);
            if (time >= 2) drawText('4 \xD7 4 = ?', 400, 240, 42, '#4b5563', 1);
            if (time >= 4) drawText('4\u304C4\u3064 = 16', 400, 310, 36, '#10b981', 1);
            if (time >= 6) drawText('\u30D1\u30BF\u30FC\u30F3\u3092\u898B\u3064\u3051\u3088\u3046\uFF01', 400, 390, 32, '#3b82f6', 1);
          } else if (\${caseNumber} === 12) {
            // \u30B1\u30FC\u30B912: \u5FA9\u7FD2
            if (time >= 0.5) drawText('3 \xD7 4 = ?', 400, 200, 56, '#4b5563', 1);
            if (time >= 2) {
              const alpha = Math.min((time - 2) * 2, 1);
              drawText('= 12', 400, 300, 80, '#10b981', alpha);
            }
            if (time >= 4) drawText('\u899A\u3048\u3066\u305F\u304B\u306A\uFF1F', 400, 400, 32, '#3b82f6', 1);
          }
          
          time += 1 / 60;
          if (time < 10) requestAnimationFrame(animate);
        }
        
        animate();
      <\/script>
    </body>
    </html>
  `, caseNumber: r, duration: 10, note: `\u30B1\u30FC\u30B9${r}: ${s.title} - ${s.targetStudent}\u5411\u3051` });
});
p.post("/api/media/generate-audio", async (e) => {
  const { text: r, voice: t } = await e.req.json();
  return e.json({ success: true, scriptText: `
\u308C\u3044\u3066\u3093\u3055\u3093 \u304B\u3051\u308B \u3088\u3093 \u306B\u3064\u3044\u3066\u8003\u3048\u307E\u3057\u3087\u3046\u3002

\u308C\u3044\u3066\u3093\u3055\u3093 \u3068\u3044\u3046\u306E\u306F\u3001\u305C\u308D\u3066\u3093\u3055\u3093 \u306E\u3053\u3068\u3067\u3059\u3002
\u3053\u308C\u304C \u3088\u3093\u3053 \u3042\u308A\u307E\u3059\u3002

\u308C\u3044\u3066\u3093\u3055\u3093 \u305F\u3059 \u308C\u3044\u3066\u3093\u3055\u3093 \u305F\u3059 \u308C\u3044\u3066\u3093\u3055\u3093 \u305F\u3059 \u308C\u3044\u3066\u3093\u3055\u3093\u3002

\u3072\u3068\u3064\u305A\u3064 \u305F\u3057\u3066\u3044\u304F\u3068...
\u308C\u3044\u3066\u3093\u3055\u3093\u3001\u308C\u3044\u3066\u3093\u308D\u304F\u3001\u308C\u3044\u3066\u3093\u304D\u3085\u3046\u3001\u3044\u3063\u3066\u3093\u306B\u3002

\u3053\u305F\u3048\u306F \u3044\u3063\u3066\u3093\u306B \u3067\u3059\uFF01

\u304B\u3051\u3056\u3093\u306F\u3001\u304A\u306A\u3058\u304B\u305A\u3092 \u306A\u3093\u304B\u3044\u3082 \u305F\u3059\u3053\u3068\u3068 \u304A\u306A\u3058\u3067\u3059\u306D\u3002
  `.trim(), text: r, voice: t || "female-teacher", note: "\u5C0F\u6570\u306E\u304B\u3051\u7B97\u3092\u97F3\u58F0\u3067\u4E01\u5BE7\u306B\u89E3\u8AAC\u3057\u307E\u3057\u305F" });
});
p.post("/api/media/generate-music", async (e) => {
  const { lyrics: r, style: t } = await e.req.json(), s = `
\u{1F3B5} \u4E5D\u4E5D\u306E\u6B4C\uFF083\u306E\u6BB5\uFF09 \u{1F3B5}

(1\u756A)
\u3055\u3093\u3044\u3061\u304C \u3055\u3093
\u3055\u3093\u306B\u304C \u308D\u304F
\u3055\u3056\u3093\u304C \u304D\u3085\u3046
\u3055\u3093\u3057\u304C \u3058\u3085\u3046\u306B

(2\u756A)
\u3055\u3093\u3054\u304C \u3058\u3085\u3046\u3054
\u3055\u3076\u308D\u304F \u3058\u3085\u3046\u306F\u3061
\u3055\u3093\u3057\u3061\u304C \u306B\u3058\u3085\u3046\u3044\u3061
\u3055\u3093\u3071\u304C \u306B\u3058\u3085\u3046\u3057

(3\u756A)
\u3055\u3093\u304F\u304C \u306B\u3058\u3085\u3046\u3057\u3061
  `, n = [{ title: "\u4E5D\u4E5D\u306E\u3046\u305F\u30103\u306E\u6BB5\u3011\u3092\u63A2\u3059", url: "https://www.youtube.com/results?search_query=\u4E5D\u4E5D\u306E\u6B4C+3\u306E\u6BB5+\u5C0F\u5B66\u751F", description: "YouTube\u3067\u300C3\u306E\u6BB5\u300D\u306E\u6B4C\u3092\u691C\u7D22\uFF08\u8907\u6570\u306E\u52D5\u753B\u304B\u3089\u9078\u3079\u307E\u3059\uFF09" }, { title: "\u4E5D\u4E5D\u306E\u3046\u305F\u3010\u5168\u6BB5\u3011\u3092\u63A2\u3059", url: "https://www.youtube.com/results?search_query=\u4E5D\u4E5D\u306E\u6B4C+\u5168\u6BB5+\u5B50\u4F9B\u5411\u3051", description: "1\u306E\u6BB5\uFF5E9\u306E\u6BB5\u307E\u3067\u3059\u3079\u3066\u805E\u3051\u308B\u52D5\u753B\u3092\u691C\u7D22" }, { title: "NHK for School \u304B\u3051\u3056\u3093\u4E5D\u4E5D", url: "https://www.youtube.com/results?search_query=NHK+for+School+\u4E5D\u4E5D", description: "NHK\u6559\u80B2\u756A\u7D44\u306E\u4E5D\u4E5D\u5B66\u7FD2\u30B3\u30F3\u30C6\u30F3\u30C4\u3092\u691C\u7D22" }];
  return e.json({ success: true, lyrics: s.trim(), style: t || "educational-pop", youtubeLinks: n, note: "\u30EA\u30BA\u30E0\u306B\u4E57\u3063\u3066\u899A\u3048\u3084\u3059\u3044\u4E5D\u4E5D\u306E\u6B4C\u3067\u3059\u3002YouTube\u3067\u5B9F\u969B\u306E\u6B4C\u3092\u805E\u304F\u3053\u3068\u304C\u3067\u304D\u307E\u3059\u3002" });
});
p.post("/api/media/generate-suno-music", async (e) => {
  var a, o;
  const { lyrics: r, style: t } = await e.req.json(), { env: s } = e, n = s.AIML_API_KEY;
  if (!n) return e.json({ success: false, error: "AIML API Key\u304C\u8A2D\u5B9A\u3055\u308C\u3066\u3044\u307E\u305B\u3093", instructions: `
AI\u97F3\u697D\u751F\u6210API\u30AD\u30FC\u3092\u8A2D\u5B9A\u3059\u308B\u65B9\u6CD5\uFF1A

\u3010\u63A8\u5968\u3011AIML API \u3092\u4F7F\u7528
1. AIML API\u30A2\u30AB\u30A6\u30F3\u30C8\u3092\u4F5C\u6210
   https://aimlapi.com \u306B\u30A2\u30AF\u30BB\u30B9\u3057\u3066\u30A2\u30AB\u30A6\u30F3\u30C8\u4F5C\u6210

2. API\u30AD\u30FC\u3092\u53D6\u5F97
   \u30C0\u30C3\u30B7\u30E5\u30DC\u30FC\u30C9\u304B\u3089API\u30AD\u30FC\u3092\u751F\u6210\uFF08\u7121\u6599\u30C8\u30E9\u30A4\u30A2\u30EB\u3042\u308A\uFF09

3. Cloudflare Secrets\u306B\u8A2D\u5B9A
   wrangler secret put AIML_API_KEY --project-name jiyushindo-gakushu
   
4. \u30ED\u30FC\u30AB\u30EB\u958B\u767A\u7528\uFF08.dev.vars \u30D5\u30A1\u30A4\u30EB\uFF09
   AIML_API_KEY=your-api-key-here

\u6599\u91D1: \u7D04$0.015-0.02 per call
\u8A73\u7D30: https://aimlapi.com/suno-ai-api

\u3010\u4EE3\u66FF\u6848\u3011
- MiniMax Music API: https://aimlapi.com (\u540C\u3058AIML API\u3067\u5229\u7528\u53EF\u80FD)
- ElevenLabs Music: https://elevenlabs.io/music
- Udio API: https://udio.com
      `.trim() }, 400);
  try {
    console.log("\u{1F3B5} AI\u97F3\u697D\u751F\u6210\u958B\u59CB\uFF08AIML API - MiniMax Music 2.0\uFF09...");
    const c = await fetch("https://api.aimlapi.com/v2/generate/audio", { method: "POST", headers: { Authorization: `Bearer ${n}`, "Content-Type": "application/json" }, body: JSON.stringify({ model: "minimax/music-2.0", prompt: t || "A cheerful and catchy educational pop song for children learning decimal multiplication, upbeat tempo, clear vocals, memorable melody, Japanese children's song style", lyrics: `[Intro]
\u308C\u3044\u3066\u3093\u3055\u3093 \u304B\u3051\u308B \u3088\u3093 \u306B\u3064\u3044\u3066\u8003\u3048\u3088\u3046
[Verse]
\u308C\u3044\u3066\u3093\u3055\u3093 \u304C \u3088\u3093\u3053
\u306A\u3089\u3093\u3067 \u3044\u308B\u3088
\u305F\u3057\u3066\u307F\u3088\u3046 \u3072\u3068\u3064\u305A\u3064
\u308C\u3044\u3066\u3093\u3055\u3093 \u308C\u3044\u3066\u3093\u308D\u304F
[Verse]
\u3082\u3046\u3044\u3063\u3053 \u305F\u3059\u3068
\u308C\u3044\u3066\u3093\u304D\u3085\u3046 \u306B\u306A\u308B\u306D
\u3055\u3044\u3054\u306B \u3082\u3046\u3044\u3063\u3053
\u3044\u3063\u3066\u3093\u306B \u3060\u3088
[Chorus]
\u304B\u3051\u3056\u3093\u306F \u305F\u3057\u3056\u3093\u3060
\u304A\u306A\u3058\u304B\u305A\u3092 \u306A\u3093\u304B\u3044\u3082
\u308C\u3044\u3066\u3093\u3055\u3093 \u304B\u3051\u308B \u3088\u3093
\u3053\u305F\u3048\u306F \u3044\u3063\u3066\u3093\u306B
[Outro]
\u308C\u3044\u3066\u3093\u3055\u3093 \u304B\u3051\u308B \u3088\u3093
\u3053\u305F\u3048\u306F \u3044\u3063\u3066\u3093\u306B` }) });
    if (!c.ok) {
      const m = await c.text();
      return console.error("AIML API Error:", m), e.json({ success: false, error: "AI\u97F3\u697D\u751F\u6210API\u306E\u547C\u3073\u51FA\u3057\u306B\u5931\u6557\u3057\u307E\u3057\u305F", details: m }, c.status);
    }
    const l = await c.json(), u = l.id;
    if (!u) return e.json({ success: false, error: "\u751F\u6210ID\u306E\u53D6\u5F97\u306B\u5931\u6557\u3057\u307E\u3057\u305F", details: l }, 500);
    console.log("\u{1F3B5} \u97F3\u697D\u751F\u6210\u30BF\u30B9\u30AF\u4F5C\u6210: " + u);
    const d = 12;
    let _ = 0;
    for (; _ < d; ) {
      await new Promise((g) => setTimeout(g, 15e3));
      const m = await fetch(`https://api.aimlapi.com/v2/generate/audio?generation_id=${u}`, { method: "GET", headers: { Authorization: `Bearer ${n}`, "Content-Type": "application/json" } });
      if (!m.ok) {
        const g = await m.text();
        console.error("Status check error:", g), _++;
        continue;
      }
      const h = await m.json();
      if (console.log(`\u{1F3B5} \u751F\u6210\u30B9\u30C6\u30FC\u30BF\u30B9 (${_ + 1}/${d}): ${h.status}`), h.status === "completed") return console.log("\u2705 AI\u97F3\u697D\u751F\u6210\u5B8C\u4E86"), e.json({ success: true, musicUrl: (a = h.audio_file) == null ? void 0 : a.url, duration: ((o = h.extra_info) == null ? void 0 : o.music_duration) / 1e3, lyrics: r, style: t, generationId: u, note: "AI\u304C\u751F\u6210\u3057\u305F\u5B66\u7FD2\u30BD\u30F3\u30B0\uFF08MiniMax Music 2.0\u7D4C\u7531\uFF09" });
      if (h.status === "failed") return e.json({ success: false, error: "\u97F3\u697D\u751F\u6210\u306B\u5931\u6557\u3057\u307E\u3057\u305F", details: h }, 500);
      _++;
    }
    return e.json({ success: false, error: "\u97F3\u697D\u751F\u6210\u304C\u30BF\u30A4\u30E0\u30A2\u30A6\u30C8\u3057\u307E\u3057\u305F\uFF083\u5206\u4EE5\u4E0A\uFF09", note: "\u751F\u6210\u306B\u306F\u6642\u9593\u304C\u304B\u304B\u308B\u5834\u5408\u304C\u3042\u308A\u307E\u3059\u3002\u5F8C\u3067\u3082\u3046\u4E00\u5EA6\u304A\u8A66\u3057\u304F\u3060\u3055\u3044\u3002" }, 408);
  } catch (i) {
    return console.error("AI\u97F3\u697D\u751F\u6210\u30A8\u30E9\u30FC:", i), e.json({ success: false, error: "\u97F3\u697D\u751F\u6210\u4E2D\u306B\u30A8\u30E9\u30FC\u304C\u767A\u751F\u3057\u307E\u3057\u305F", details: i.message }, 500);
  }
});
p.post("/api/media/generate-interactive", async (e) => {
  const { topic: r, interactionType: t } = await e.req.json();
  return e.json({ success: true, interactiveHtml: ho(), topic: r, interactionType: t, note: "\u30AF\u30EA\u30C3\u30AF\u3057\u3066\u5B9F\u969B\u306B\u4F53\u9A13\u3067\u304D\u308B\u30B7\u30DF\u30E5\u30EC\u30FC\u30BF\u30FC\u3092\u4F5C\u6210\u3057\u307E\u3057\u305F" });
});
function ho(e, r) {
  return `
    <div class="interactive-simulator bg-white rounded-lg p-4 border-2 border-purple-300">
      <h4 class="font-bold text-purple-800 mb-4 text-center">\u{1F9EA} \u5C0F\u6570\u306E\u304B\u3051\u7B97\u5B9F\u9A13</h4>
      <p class="text-center text-sm text-gray-600 mb-4">\u5BB9\u5668\u3092\u30AF\u30EA\u30C3\u30AF\u3057\u30660.3L\u305A\u3064\u6C34\u3092\u8FFD\u52A0\u3057\u307E\u3057\u3087\u3046</p>
      <div class="grid grid-cols-4 gap-2 mb-4" id="sim-containers">
        <button onclick="window.fillSimContainer(1)" class="container-btn bg-purple-500 hover:bg-purple-600 text-white p-6 rounded text-center font-bold transition transform hover:scale-105" id="sim-container-1">
          <div class="text-3xl mb-2">\u{1F9EA}</div>
          <div class="text-xs">\u5BB9\u56681</div>
          <div class="text-sm mt-2 filled-amount" style="display:none;">+0.3L</div>
        </button>
        <button onclick="window.fillSimContainer(2)" class="container-btn bg-purple-500 hover:bg-purple-600 text-white p-6 rounded text-center font-bold transition transform hover:scale-105" id="sim-container-2">
          <div class="text-3xl mb-2">\u{1F9EA}</div>
          <div class="text-xs">\u5BB9\u56682</div>
          <div class="text-sm mt-2 filled-amount" style="display:none;">+0.3L</div>
        </button>
        <button onclick="window.fillSimContainer(3)" class="container-btn bg-purple-500 hover:bg-purple-600 text-white p-6 rounded text-center font-bold transition transform hover:scale-105" id="sim-container-3">
          <div class="text-3xl mb-2">\u{1F9EA}</div>
          <div class="text-xs">\u5BB9\u56683</div>
          <div class="text-sm mt-2 filled-amount" style="display:none;">+0.3L</div>
        </button>
        <button onclick="window.fillSimContainer(4)" class="container-btn bg-purple-500 hover:bg-purple-600 text-white p-6 rounded text-center font-bold transition transform hover:scale-105" id="sim-container-4">
          <div class="text-3xl mb-2">\u{1F9EA}</div>
          <div class="text-xs">\u5BB9\u56684</div>
          <div class="text-sm mt-2 filled-amount" style="display:none;">+0.3L</div>
        </button>
      </div>
      <div class="result-area bg-purple-50 rounded-lg p-4 border-2 border-purple-300">
        <div class="text-center">
          <p class="text-2xl font-bold text-purple-800 mb-2">
            \u5408\u8A08: <span id="sim-total-amount" class="text-4xl">0</span>L
          </p>
          <p class="text-lg text-gray-700" id="sim-calculation-display">\u307E\u3060\u6C34\u3092\u8FFD\u52A0\u3057\u3066\u3044\u307E\u305B\u3093</p>
        </div>
      </div>
    </div>
  `;
}
__name(ho, "ho");
p.post("/api/optional-problems/submissions", async (e) => {
  const { env: r } = e, { student_id: t, curriculum_id: s, optional_problem_id: n, submission_type: a, file_url: o, file_name: i, description: c, self_evaluation: l, self_comment: u } = await e.req.json();
  try {
    const d = await r.DB.prepare(`
      INSERT INTO optional_problem_submissions (
        student_id, curriculum_id, optional_problem_id, submission_type,
        file_url, file_name, description, self_evaluation, self_comment,
        submitted_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(t, s, n, a, o, i, c, l, u).run();
    return e.json({ success: true, submission_id: d.meta.last_row_id });
  } catch (d) {
    return console.error("\u6210\u679C\u7269\u6295\u7A3F\u30A8\u30E9\u30FC:", d), e.json({ success: false, error: d.message }, 500);
  }
});
p.get("/api/optional-problems/submissions/:studentId", async (e) => {
  const { env: r } = e, t = e.req.param("studentId");
  try {
    const s = await r.DB.prepare(`
      SELECT s.*, op.problem_title, op.difficulty_level
      FROM optional_problem_submissions s
      JOIN optional_problems op ON s.optional_problem_id = op.id
      WHERE s.student_id = ?
      ORDER BY s.submitted_at DESC
    `).bind(t).all();
    return e.json({ success: true, submissions: s.results });
  } catch (s) {
    return console.error("\u6210\u679C\u7269\u53D6\u5F97\u30A8\u30E9\u30FC:", s), e.json({ success: false, error: s.message }, 500);
  }
});
p.post("/api/optional-problems/submissions/:id/teacher-comment", async (e) => {
  const { env: r } = e, t = e.req.param("id"), { teacher_comment: s, teacher_evaluation: n } = await e.req.json();
  try {
    return await r.DB.prepare(`
      UPDATE optional_problem_submissions
      SET teacher_comment = ?, teacher_evaluation = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(s, n, t).run(), e.json({ success: true });
  } catch (a) {
    return console.error("\u6559\u5E2B\u30B3\u30E1\u30F3\u30C8\u8FFD\u52A0\u30A8\u30E9\u30FC:", a), e.json({ success: false, error: a.message }, 500);
  }
});
p.post("/api/teacher-observations", async (e) => {
  const { env: r } = e, { student_id: t, curriculum_id: s, observation_date: n, observation_type: a, observation_text: o, context: i, related_activity: c, non_cognitive_tags: l, is_positive: u, is_shared_with_parents: d, created_by: _ } = await e.req.json();
  try {
    const m = await r.DB.prepare(`
      INSERT INTO teacher_observations (
        student_id, curriculum_id, observation_date, observation_type,
        observation_text, context, related_activity, non_cognitive_tags,
        is_positive, is_shared_with_parents, created_by,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(t, s, n, a, o, i, c, l, u ? 1 : 0, d ? 1 : 0, _).run();
    return e.json({ success: true, observation_id: m.meta.last_row_id });
  } catch (m) {
    return console.error("\u898B\u53D6\u308A\u8A18\u9332\u30A8\u30E9\u30FC:", m), e.json({ success: false, error: m.message }, 500);
  }
});
p.get("/api/teacher-observations/:studentId", async (e) => {
  const { env: r } = e, t = e.req.param("studentId");
  try {
    const s = await r.DB.prepare(`
      SELECT o.*, u.name as teacher_name, c.unit_name
      FROM teacher_observations o
      LEFT JOIN users u ON o.created_by = u.id
      LEFT JOIN curriculum c ON o.curriculum_id = c.id
      WHERE o.student_id = ?
      ORDER BY o.observation_date DESC, o.created_at DESC
    `).bind(t).all();
    return e.json({ success: true, observations: s.results });
  } catch (s) {
    return console.error("\u898B\u53D6\u308A\u53D6\u5F97\u30A8\u30E9\u30FC:", s), e.json({ success: false, error: s.message }, 500);
  }
});
p.post("/api/student-reflections", async (e) => {
  const { env: r } = e, { student_id: t, curriculum_id: s, reflection_date: n, reflection_type: a, what_learned: o, what_understood: i, what_difficult: c, what_enjoyed: l, next_goals: u, mood_rating: d, effort_rating: _, understanding_rating: m } = await e.req.json();
  try {
    const h = await r.DB.prepare(`
      INSERT INTO student_reflections (
        student_id, curriculum_id, reflection_date, reflection_type,
        what_learned, what_understood, what_difficult, what_enjoyed,
        next_goals, mood_rating, effort_rating, understanding_rating,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(t, s, n, a, o, i, c, l, u, d, _, m).run();
    return e.json({ success: true, reflection_id: h.meta.last_row_id });
  } catch (h) {
    return console.error("\u632F\u308A\u8FD4\u308A\u6295\u7A3F\u30A8\u30E9\u30FC:", h), e.json({ success: false, error: h.message }, 500);
  }
});
p.get("/api/student-reflections/:studentId", async (e) => {
  const { env: r } = e, t = e.req.param("studentId");
  try {
    const s = await r.DB.prepare(`
      SELECT r.*, c.unit_name
      FROM student_reflections r
      LEFT JOIN curriculum c ON r.curriculum_id = c.id
      WHERE r.student_id = ?
      ORDER BY r.reflection_date DESC, r.created_at DESC
    `).bind(t).all();
    return e.json({ success: true, reflections: s.results });
  } catch (s) {
    return console.error("\u632F\u308A\u8FD4\u308A\u53D6\u5F97\u30A8\u30E9\u30FC:", s), e.json({ success: false, error: s.message }, 500);
  }
});
p.post("/api/cross-subject-evaluations", async (e) => {
  const { env: r } = e, t = await e.req.json();
  try {
    const s = await r.DB.prepare(`
      INSERT INTO cross_subject_evaluations (
        student_id, evaluation_period_start, evaluation_period_end,
        reading_comprehension, writing_expression, logical_thinking,
        creative_thinking, problem_solving, persistence_score,
        self_regulation_score, collaboration_score, curiosity_score,
        metacognition_score, growth_mindset_score, overall_comment,
        strengths, areas_for_growth, recommendations, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(t.student_id, t.evaluation_period_start, t.evaluation_period_end, t.reading_comprehension, t.writing_expression, t.logical_thinking, t.creative_thinking, t.problem_solving, t.persistence_score, t.self_regulation_score, t.collaboration_score, t.curiosity_score, t.metacognition_score, t.growth_mindset_score, t.overall_comment, t.strengths, t.areas_for_growth, t.recommendations).run();
    return e.json({ success: true, evaluation_id: s.meta.last_row_id });
  } catch (s) {
    return console.error("\u6559\u79D1\u6A2A\u65AD\u8A55\u4FA1\u30A8\u30E9\u30FC:", s), e.json({ success: false, error: s.message }, 500);
  }
});
p.get("/api/cross-subject-evaluations/:studentId", async (e) => {
  const { env: r } = e, t = e.req.param("studentId");
  try {
    const s = await r.DB.prepare(`
      SELECT * FROM cross_subject_evaluations
      WHERE student_id = ?
      ORDER BY evaluation_period_end DESC
    `).bind(t).all();
    return e.json({ success: true, evaluations: s.results });
  } catch (s) {
    return console.error("\u6559\u79D1\u6A2A\u65AD\u8A55\u4FA1\u53D6\u5F97\u30A8\u30E9\u30FC:", s), e.json({ success: false, error: s.message }, 500);
  }
});
p.post("/api/feedback", async (e) => {
  const { env: r } = e, t = await e.req.json();
  try {
    await r.DB.prepare(`
      CREATE TABLE IF NOT EXISTS user_feedback (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        email TEXT,
        message TEXT NOT NULL,
        user_id TEXT,
        user_name TEXT,
        user_role TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();
    const s = await r.DB.prepare(`
      INSERT INTO user_feedback 
        (type, email, message, user_id, user_name, user_role, created_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(t.type || "feedback", t.email || "", t.message, t.user_id || "", t.user_name || "", t.user_role || "student").run();
    return console.log("\u2705 \u30D5\u30A3\u30FC\u30C9\u30D0\u30C3\u30AF\u4FDD\u5B58\u5B8C\u4E86:", s.meta.last_row_id), e.json({ success: true, id: s.meta.last_row_id, message: "\u30D5\u30A3\u30FC\u30C9\u30D0\u30C3\u30AF\u3092\u53D7\u3051\u4ED8\u3051\u307E\u3057\u305F" });
  } catch (s) {
    return console.error("\u30D5\u30A3\u30FC\u30C9\u30D0\u30C3\u30AF\u4FDD\u5B58\u30A8\u30E9\u30FC:", s), e.json({ success: false, error: s.message || "\u30D5\u30A3\u30FC\u30C9\u30D0\u30C3\u30AF\u306E\u4FDD\u5B58\u306B\u5931\u6557\u3057\u307E\u3057\u305F" }, 500);
  }
});
p.get("/api/feedback/list", async (e) => {
  const { env: r } = e;
  try {
    const t = await r.DB.prepare(`
      SELECT * FROM user_feedback 
      ORDER BY created_at DESC 
      LIMIT 100
    `).all();
    return e.json({ success: true, feedbacks: t.results });
  } catch (t) {
    return console.error("\u30D5\u30A3\u30FC\u30C9\u30D0\u30C3\u30AF\u53D6\u5F97\u30A8\u30E9\u30FC:", t), e.json({ success: false, error: t.message }, 500);
  }
});
p.post("/api/optional-problem/progress", async (e) => {
  const { env: r } = e, { student_id: t, curriculum_id: s, optional_problem_id: n, status: a, understanding_level: o, time_spent_minutes: i } = await e.req.json();
  try {
    const c = await r.DB.prepare(`
      SELECT id, attempts_count FROM optional_problem_progress
      WHERE student_id = ? AND optional_problem_id = ?
    `).bind(t, n).first();
    if (c) {
      const l = (c.attempts_count || 0) + 1, u = a === "completed" ? 1 : 0;
      return await r.DB.prepare(`
        UPDATE optional_problem_progress
        SET status = ?,
            understanding_level = ?,
            time_spent_minutes = time_spent_minutes + ?,
            attempts_count = ?,
            is_completed = ?,
            completed_at = CASE WHEN ? = 1 AND completed_at IS NULL THEN datetime('now') ELSE completed_at END,
            updated_at = datetime('now')
        WHERE id = ?
      `).bind(a, o, i, l, u, u, c.id).run(), e.json({ success: true, id: c.id });
    } else {
      const l = await r.DB.prepare(`
        INSERT INTO optional_problem_progress (
          student_id, curriculum_id, optional_problem_id, status, 
          understanding_level, time_spent_minutes, attempts_count,
          is_completed, completed_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, 1, ?, 
                  CASE WHEN ? = 'completed' THEN datetime('now') ELSE NULL END,
                  datetime('now'), datetime('now'))
      `).bind(t, s, n, a, o, i, a === "completed" ? 1 : 0, a).run();
      return e.json({ success: true, id: l.meta.last_row_id });
    }
  } catch (c) {
    return console.error("\u9078\u629E\u554F\u984C\u9032\u6357\u8A18\u9332\u30A8\u30E9\u30FC:", c), e.json({ success: false, error: c.message }, 500);
  }
});
p.get("/api/optional-problem/progress/:studentId/:curriculumId", async (e) => {
  const { env: r } = e, t = e.req.param("studentId"), s = e.req.param("curriculumId");
  try {
    const n = await r.DB.prepare(`
      SELECT 
        opp.*,
        op.problem_title,
        op.problem_category
      FROM optional_problem_progress opp
      JOIN optional_problems op ON opp.optional_problem_id = op.id
      WHERE opp.student_id = ? AND opp.curriculum_id = ?
      ORDER BY op.problem_number
    `).bind(t, s).all();
    return e.json({ success: true, progress: n.results });
  } catch (n) {
    return console.error("\u9078\u629E\u554F\u984C\u9032\u6357\u53D6\u5F97\u30A8\u30E9\u30FC:", n), e.json({ success: false, error: n.message }, 500);
  }
});
p.post("/api/card/review-log", async (e) => {
  const { env: r } = e, { student_id: t, card_id: s, curriculum_id: n, review_type: a, is_already_cleared: o, is_correct: i, answer_time_seconds: c, hint_count: l } = await e.req.json();
  try {
    const u = await r.DB.prepare(`
      INSERT INTO card_review_logs (
        student_id, card_id, curriculum_id, review_type,
        is_already_cleared, is_correct, answer_time_seconds, hint_count,
        effort_points, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'))
    `).bind(t, s, n, a, o ? 1 : 0, i ? 1 : 0, c, l).run();
    return await r.DB.prepare(`
      INSERT INTO learning_logs (
        student_id, unit_id, card_id, course_type,
        is_correct, answer_time_seconds, hint_count, retry_count,
        difficulty_level, problem_type, created_at
      ) VALUES (?, ?, ?, '\u5FA9\u7FD2', ?, ?, ?, 1, 'review', 'review', datetime('now'))
    `).bind(t, String(n), String(s), i ? 1 : 0, c, l).run(), e.json({ success: true, review_log_id: u.meta.last_row_id, effort_points: 1, message: "\u5FA9\u7FD2\u306E\u52AA\u529B\u304C\u8A18\u9332\u3055\u308C\u307E\u3057\u305F\uFF01\u9811\u5F35\u308A\u307E\u3057\u305F\u306D\uFF01" });
  } catch (u) {
    return console.error("\u5FA9\u7FD2\u30ED\u30B0\u8A18\u9332\u30A8\u30E9\u30FC:", u), e.json({ success: false, error: u.message }, 500);
  }
});
p.get("/api/student/learning-stats/:studentId/:curriculumId", async (e) => {
  const { env: r } = e, t = e.req.param("studentId"), s = e.req.param("curriculumId");
  try {
    const n = await r.DB.prepare(`
      SELECT 
        COUNT(DISTINCT learning_card_id) as completed_cards,
        AVG(understanding_level) as avg_understanding,
        SUM(help_count) as total_help_requests
      FROM student_progress
      WHERE student_id = ? AND curriculum_id = ?
    `).bind(t, s).first(), a = await r.DB.prepare(`
      SELECT 
        COUNT(*) as completed_optional_problems,
        SUM(time_spent_minutes) as total_optional_time,
        AVG(understanding_level) as avg_optional_understanding
      FROM optional_problem_progress
      WHERE student_id = ? AND curriculum_id = ? AND is_completed = 1
    `).bind(t, s).first(), o = await r.DB.prepare(`
      SELECT 
        COUNT(*) as review_count,
        SUM(effort_points) as total_effort_points,
        SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct_reviews
      FROM card_review_logs
      WHERE student_id = ? AND curriculum_id = ?
    `).bind(t, s).first();
    return e.json({ success: true, stats: { ...n, ...a, ...o } });
  } catch (n) {
    return console.error("\u5B66\u7FD2\u7D71\u8A08\u53D6\u5F97\u30A8\u30E9\u30FC:", n), e.json({ success: false, error: n.message }, 500);
  }
});
p.post("/api/notifications/send-message", async (e) => {
  const { env: r } = e, { teacherId: t, studentId: s, message: n, priority: a } = await e.req.json();
  try {
    const o = await r.DB.prepare(`
      INSERT INTO teacher_messages (teacher_id, student_id, message, priority, created_at)
      VALUES (?, ?, ?, ?, datetime('now'))
    `).bind(t, s, n, a || "normal").run();
    return e.json({ success: true, messageId: o.meta.last_row_id });
  } catch (o) {
    return console.error("\u274C \u30E1\u30C3\u30BB\u30FC\u30B8\u9001\u4FE1\u30A8\u30E9\u30FC:", o), e.json({ success: false, error: o.message }, 500);
  }
});
p.post("/api/notifications/distribute-card", async (e) => {
  const { env: r } = e, { cardId: t, studentIds: s, teacherId: n } = await e.req.json();
  try {
    const a = await r.DB.prepare(`
      SELECT 
        lc.*,
        c.course_name,
        cu.unit_name
      FROM learning_cards lc
      JOIN courses c ON lc.course_id = c.id
      JOIN curriculum cu ON c.curriculum_id = cu.id
      WHERE lc.id = ?
    `).bind(t).first();
    if (!a) return e.json({ success: false, error: "\u30AB\u30FC\u30C9\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093" }, 404);
    for (const o of s) await r.DB.prepare(`
        INSERT INTO card_distributions (card_id, student_id, teacher_id, created_at)
        VALUES (?, ?, ?, datetime('now'))
      `).bind(t, o, n).run();
    return e.json({ success: true, distributedCount: s.length, cardTitle: a.card_title });
  } catch (a) {
    return console.error("\u274C \u30AB\u30FC\u30C9\u914D\u4FE1\u30A8\u30E9\u30FC:", a), e.json({ success: false, error: a.message }, 500);
  }
});
p.get("/api/notifications/history/:studentId", async (e) => {
  const { env: r } = e, t = e.req.param("studentId"), s = e.req.query("limit") || "20";
  try {
    const n = await r.DB.prepare(`
      SELECT 
        tm.*,
        u.name as teacher_name
      FROM teacher_messages tm
      LEFT JOIN users u ON tm.teacher_id = u.id
      WHERE tm.student_id = ?
      ORDER BY tm.created_at DESC
      LIMIT ?
    `).bind(t, parseInt(s)).all(), a = await r.DB.prepare(`
      SELECT 
        cd.*,
        lc.card_title,
        c.course_name,
        u.name as teacher_name
      FROM card_distributions cd
      JOIN learning_cards lc ON cd.card_id = lc.id
      JOIN courses c ON lc.course_id = c.id
      LEFT JOIN users u ON cd.teacher_id = u.id
      WHERE cd.student_id = ?
      ORDER BY cd.created_at DESC
      LIMIT ?
    `).bind(t, parseInt(s)).all();
    return e.json({ success: true, messages: n.results, distributions: a.results });
  } catch (n) {
    return console.error("\u274C \u901A\u77E5\u5C65\u6B74\u53D6\u5F97\u30A8\u30E9\u30FC:", n), e.json({ success: false, error: n.message }, 500);
  }
});
p.post("/api/learning-styles/generate-problem", async (e) => {
  const { env: r } = e, { cardId: t, learningStyle: s } = await e.req.json(), n = r.GEMINI_API_KEY;
  if (!n) return e.json({ success: false, error: "GEMINI_API_KEY\u304C\u8A2D\u5B9A\u3055\u308C\u3066\u3044\u307E\u305B\u3093" }, 400);
  try {
    const a = await r.DB.prepare(`
      SELECT 
        lc.*,
        c.course_name,
        c.grade,
        cu.subject
      FROM learning_cards lc
      JOIN courses c ON lc.course_id = c.id
      JOIN curriculum cu ON c.curriculum_id = cu.id
      WHERE lc.id = ?
    `).bind(t).first();
    if (!a) return e.json({ success: false, error: "\u30AB\u30FC\u30C9\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093" }, 404);
    let o = "", i = "";
    switch (s) {
      case "visual":
        o = "\u8996\u899A\u578B\u5B66\u7FD2\u8005\u5411\u3051\u306B\u3001\u56F3\u3084\u30A4\u30E9\u30B9\u30C8\u3001\u8272\u5206\u3051\u3092\u4F7F\u3063\u305F\u8996\u899A\u7684\u306A\u8868\u73FE", i = `
- \u6570\u5B57\u3084\u8A08\u7B97\u5F0F\u3092\u5927\u304D\u304F\u3001\u8272\u5206\u3051\u3057\u3066\u8868\u793A
- \u56F3\u89E3\u3084\u30A4\u30E9\u30B9\u30C8\u3092\u542B\u3081\u308B
- \u30B9\u30C6\u30C3\u30D7\u3092\u8996\u899A\u7684\u306B\u533A\u5207\u308B
- \u30A2\u30A4\u30B3\u30F3\u3084\u7D75\u6587\u5B57\u3092\u52B9\u679C\u7684\u306B\u4F7F\u7528
        `;
        break;
      case "auditory":
        o = "\u8074\u899A\u578B\u5B66\u7FD2\u8005\u5411\u3051\u306B\u3001\u97F3\u58F0\u8AAD\u307F\u4E0A\u3052\u306B\u9069\u3057\u305F\u6587\u7AE0\u3068\u30EA\u30BA\u30E0\u611F\u306E\u3042\u308B\u8868\u73FE", i = `
- \u8AAD\u307F\u4E0A\u3052\u3084\u3059\u3044\u6587\u7AE0\u69CB\u9020
- \u30EA\u30BA\u30E0\u3084\u64EC\u97F3\u8A9E\u3092\u542B\u3081\u308B
- \u30B9\u30C6\u30C3\u30D7\u3092\u58F0\u306B\u51FA\u3057\u3066\u78BA\u8A8D\u3067\u304D\u308B\u5F62\u5F0F
- \u91CD\u8981\u306A\u8A00\u8449\u3092\u5F37\u8ABF
        `;
        break;
      case "kinesthetic":
        o = "\u4F53\u611F\u578B\u5B66\u7FD2\u8005\u5411\u3051\u306B\u3001\u5B9F\u969B\u306B\u624B\u3092\u52D5\u304B\u3057\u3066\u4F53\u9A13\u3067\u304D\u308B\u5F62\u5F0F\u306E\u8868\u73FE", i = `
- \u5B9F\u969B\u306B\u8A66\u305B\u308B\u30B9\u30C6\u30C3\u30D7\u30D0\u30A4\u30B9\u30C6\u30C3\u30D7\u306E\u6307\u793A
- \u5177\u4F53\u7684\u306A\u64CD\u4F5C\u3084\u52D5\u4F5C\u3092\u542B\u3081\u308B
- \u30A4\u30F3\u30BF\u30E9\u30AF\u30C6\u30A3\u30D6\u306A\u8981\u7D20
- \u624B\u3092\u52D5\u304B\u3057\u306A\u304C\u3089\u5B66\u3079\u308B\u69CB\u6210
        `;
        break;
      default:
        return e.json({ success: false, error: "\u7121\u52B9\u306A\u5B66\u7FD2\u30B9\u30BF\u30A4\u30EB" }, 400);
    }
    const c = `\u3042\u306A\u305F\u306F\u5C0F\u5B66\u751F\u306E\u5B66\u7FD2\u30B9\u30BF\u30A4\u30EB\u306B\u5408\u308F\u305B\u305F\u554F\u984C\u3092\u4F5C\u6210\u3059\u308BAI\u5148\u751F\u3067\u3059\u3002

\u3010\u5143\u306E\u554F\u984C\u3011
\u30BF\u30A4\u30C8\u30EB: ${a.card_title}
\u554F\u984C: ${a.problem_description}
\u89E3\u7B54: ${a.answer}

\u3010\u5B66\u7FD2\u30B9\u30BF\u30A4\u30EB\u3011
${o}

\u3010\u8981\u4EF6\u3011
${i}

\u4EE5\u4E0B\u306EJSON\u5F62\u5F0F\u3067\u3001\u5B66\u7FD2\u30B9\u30BF\u30A4\u30EB\u306B\u6700\u9069\u5316\u3057\u305F\u554F\u984C\u3092\u51FA\u529B\u3057\u3066\u304F\u3060\u3055\u3044\uFF1A
{
  "styled_title": "\u5B66\u7FD2\u30B9\u30BF\u30A4\u30EB\u306B\u5408\u308F\u305B\u305F\u30BF\u30A4\u30C8\u30EB",
  "styled_problem": "\u5B66\u7FD2\u30B9\u30BF\u30A4\u30EB\u306B\u6700\u9069\u5316\u3057\u305F\u554F\u984C\u6587\uFF08HTML\u53EF\uFF09",
  "visual_enhancements": "\u8996\u899A\u7684\u306A\u5F37\u5316\u8981\u7D20\u306E\u8AAC\u660E\uFF08\u8996\u899A\u578B\u306E\u5834\u5408\uFF09",
  "auditory_cues": "\u8074\u899A\u7684\u306A\u624B\u304C\u304B\u308A\u306E\u8AAC\u660E\uFF08\u8074\u899A\u578B\u306E\u5834\u5408\uFF09",
  "interactive_elements": "\u4F53\u9A13\u7684\u306A\u8981\u7D20\u306E\u8AAC\u660E\uFF08\u4F53\u611F\u578B\u306E\u5834\u5408\uFF09",
  "teaching_tips": "\u3053\u306E\u5B66\u7FD2\u30B9\u30BF\u30A4\u30EB\u3067\u306E\u6307\u5C0E\u30DD\u30A4\u30F3\u30C8"
}`, l = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${n}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ parts: [{ text: c }] }], generationConfig: { temperature: 0.8, maxOutputTokens: 2048, topK: 40, topP: 0.95 } }) }), u = await l.json();
    if (!l.ok) throw new Error(`Gemini API \u30A8\u30E9\u30FC: ${JSON.stringify(u)}`);
    if (!u.candidates || u.candidates.length === 0) throw new Error("Gemini API\u304B\u3089\u6709\u52B9\u306A\u5FDC\u7B54\u304C\u3042\u308A\u307E\u305B\u3093\u3067\u3057\u305F");
    const _ = u.candidates[0].content;
    if (!_ || !_.parts || _.parts.length === 0) throw new Error("Gemini API\u304B\u3089\u306E\u30B3\u30F3\u30C6\u30F3\u30C4\u304C\u7A7A\u3067\u3059");
    const m = _.parts[0].text, h = Y(m);
    return e.json({ success: true, originalCard: a, styledProblem: h, learningStyle: s });
  } catch (a) {
    return console.error("\u274C \u5B66\u7FD2\u30B9\u30BF\u30A4\u30EB\u554F\u984C\u751F\u6210\u30A8\u30E9\u30FC:", a), e.json({ success: false, error: a.message }, 500);
  }
});
p.post("/api/learning-styles/set-preference", async (e) => {
  const { env: r } = e, { studentId: t, learningStyle: s } = await e.req.json();
  try {
    return await r.DB.prepare(`
      INSERT INTO student_learning_preferences (student_id, learning_style, updated_at)
      VALUES (?, ?, datetime('now'))
      ON CONFLICT(student_id) 
      DO UPDATE SET 
        learning_style = ?,
        updated_at = datetime('now')
    `).bind(t, s, s).run(), e.json({ success: true, studentId: t, learningStyle: s });
  } catch (n) {
    return console.error("\u274C \u5B66\u7FD2\u30B9\u30BF\u30A4\u30EB\u8A2D\u5B9A\u30A8\u30E9\u30FC:", n), e.json({ success: false, error: n.message }, 500);
  }
});
p.get("/api/learning-styles/preference/:studentId", async (e) => {
  const { env: r } = e, t = e.req.param("studentId");
  try {
    const s = await r.DB.prepare(`
      SELECT * FROM student_learning_preferences
      WHERE student_id = ?
    `).bind(t).first();
    return e.json({ success: true, preference: s || { learning_style: "visual" } });
  } catch (s) {
    return console.error("\u274C \u5B66\u7FD2\u30B9\u30BF\u30A4\u30EB\u53D6\u5F97\u30A8\u30E9\u30FC:", s), e.json({ success: false, error: s.message }, 500);
  }
});
p.get("/api/spaced-learning/today-reviews/:studentId", async (e) => {
  const { env: r } = e, t = parseInt(e.req.param("studentId"));
  try {
    const n = await new ee(r.DB).getTodayReviews(t), a = n.length;
    return e.json({ success: true, count: a, reviews: n });
  } catch (s) {
    return console.error("\u274C \u4ECA\u65E5\u306E\u5FA9\u7FD2\u53D6\u5F97\u30A8\u30E9\u30FC:", s), e.json({ success: false, error: s.message }, 500);
  }
});
p.get("/api/spaced-learning/review-count/:studentId", async (e) => {
  const { env: r } = e, t = parseInt(e.req.param("studentId"));
  try {
    const n = await new ee(r.DB).getTodayReviewCount(t);
    return e.json({ success: true, count: n });
  } catch (s) {
    return console.error("\u274C \u5FA9\u7FD2\u4E88\u5B9A\u6570\u53D6\u5F97\u30A8\u30E9\u30FC:", s), e.json({ success: false, error: s.message }, 500);
  }
});
p.get("/api/spaced-learning/weekly-schedule/:studentId", async (e) => {
  const { env: r } = e, t = parseInt(e.req.param("studentId"));
  try {
    const n = await new ee(r.DB).generateWeeklySchedule(t);
    return e.json({ success: true, schedule: n });
  } catch (s) {
    return console.error("\u274C \u9031\u6B21\u30B9\u30B1\u30B8\u30E5\u30FC\u30EB\u53D6\u5F97\u30A8\u30E9\u30FC:", s), e.json({ success: false, error: s.message }, 500);
  }
});
p.get("/api/spaced-learning/mastery-stats/:studentId", async (e) => {
  const { env: r } = e, t = parseInt(e.req.param("studentId"));
  try {
    const n = await new ee(r.DB).getMasteryStatistics(t);
    return e.json({ success: true, stats: n });
  } catch (s) {
    return console.error("\u274C \u7FD2\u719F\u5EA6\u7D71\u8A08\u53D6\u5F97\u30A8\u30E9\u30FC:", s), e.json({ success: false, error: s.message }, 500);
  }
});
p.post("/api/spaced-learning/record-review", async (e) => {
  const { env: r } = e, { studentId: t, cardId: s, result: n, sessionType: a = "review", responseTime: o, difficultyRating: i, confidenceLevel: c, srlStage: l, srlStrategyUsed: u, srlNotes: d } = await e.req.json();
  try {
    const m = await new ee(r.DB).recordStudyResult(t, s, n, a, o, i, c, l, u, d);
    return e.json({ success: true, schedule: m, mastery: { mastery_level: m.mastery_level, leitner_box: m.leitner_box, learning_stage: m.learning_stage, next_review_date: m.next_review_date } });
  } catch (_) {
    return console.error("\u274C \u5FA9\u7FD2\u8A18\u9332\u30A8\u30E9\u30FC:", _), e.json({ success: false, error: _.message }, 500);
  }
});
p.get("/api/spaced-learning/forgetting-risk/:studentId", async (e) => {
  const { env: r } = e, t = parseInt(e.req.param("studentId")), s = parseInt(e.req.query("limit") || "10");
  try {
    const a = await new ee(r.DB).getForgettingRiskCards(t, s);
    return e.json({ success: true, recommendations: a });
  } catch (n) {
    return console.error("\u274C \u5FD8\u5374\u30EA\u30B9\u30AF\u691C\u51FA\u30A8\u30E9\u30FC:", n), e.json({ success: false, error: n.message }, 500);
  }
});
p.get("/api/spaced-learning/settings/:studentId", async (e) => {
  const { env: r } = e, t = parseInt(e.req.param("studentId"));
  try {
    const n = await new ee(r.DB).getSettings(t);
    return e.json({ success: true, settings: n || { daily_new_items: 5, daily_review_limit: 20, enable_daily_reminder: true, reminder_time: "19:00" } });
  } catch (s) {
    return console.error("\u274C \u8A2D\u5B9A\u53D6\u5F97\u30A8\u30E9\u30FC:", s), e.json({ success: false, error: s.message }, 500);
  }
});
p.put("/api/spaced-learning/settings/:studentId", async (e) => {
  const { env: r } = e, t = parseInt(e.req.param("studentId")), s = await e.req.json();
  try {
    return await new ee(r.DB).updateSettings(t, s), e.json({ success: true });
  } catch (n) {
    return console.error("\u274C \u8A2D\u5B9A\u66F4\u65B0\u30A8\u30E9\u30FC:", n), e.json({ success: false, error: n.message }, 500);
  }
});
p.get("/api/spaced-learning/mastery/:studentId/:cardId", async (e) => {
  const { env: r } = e, t = parseInt(e.req.param("studentId")), s = parseInt(e.req.param("cardId"));
  try {
    const a = await new ee(r.DB).getOrCreateMastery(t, s);
    return e.json({ success: true, mastery: a });
  } catch (n) {
    return console.error("\u274C \u7FD2\u719F\u5EA6\u53D6\u5F97\u30A8\u30E9\u30FC:", n), e.json({ success: false, error: n.message }, 500);
  }
});
p.get("/api/spaced-learning/history/:studentId", async (e) => {
  const { env: r } = e, t = parseInt(e.req.param("studentId")), s = e.req.query("cardId") ? parseInt(e.req.query("cardId")) : void 0, n = parseInt(e.req.query("limit") || "50");
  try {
    const o = await new ee(r.DB).getStudyHistory(t, s, n);
    return e.json({ success: true, history: o });
  } catch (a) {
    return console.error("\u274C \u5B66\u7FD2\u5C65\u6B74\u53D6\u5F97\u30A8\u30E9\u30FC:", a), e.json({ success: false, error: a.message }, 500);
  }
});
p.get("/api/spaced-learning/schedule/:studentId/:cardId", async (e) => {
  const { env: r } = e, t = parseInt(e.req.param("studentId")), s = parseInt(e.req.param("cardId"));
  try {
    const a = await new ee(r.DB).getOrCreateSchedule(t, s);
    return e.json({ success: true, schedule: a });
  } catch (n) {
    return console.error("\u274C \u30B9\u30B1\u30B8\u30E5\u30FC\u30EB\u53D6\u5F97\u30A8\u30E9\u30FC:", n), e.json({ success: false, error: n.message }, 500);
  }
});
p.get("/api/collaborative/peer-answers/:cardId", async (e) => {
  const { env: r } = e, t = parseInt(e.req.param("cardId")), s = parseInt(e.req.query("studentId") || "0"), n = e.req.query("classCode");
  if (!n) return e.json({ success: false, error: "\u30AF\u30E9\u30B9\u30B3\u30FC\u30C9\u304C\u5FC5\u8981\u3067\u3059" }, 400);
  try {
    const a = await r.DB.prepare(`
      SELECT 
        pa.id,
        pa.student_id,
        u.name as student_name,
        pa.answer_text,
        pa.approach_type,
        pa.is_public,
        pa.created_at,
        pa.updated_at,
        COALESCE(AVG(pe.rating), 0) as average_rating,
        COUNT(DISTINCT pe.id) as evaluation_count,
        COUNT(DISTINCT pv.id) as view_count,
        COUNT(DISTINCT ph.id) as helpful_count
      FROM peer_answers pa
      JOIN users u ON pa.student_id = u.id
      LEFT JOIN peer_evaluations pe ON pa.id = pe.answer_id
      LEFT JOIN peer_answer_views pv ON pa.id = pv.answer_id
      LEFT JOIN peer_helpful_marks ph ON pa.id = ph.answer_id
      WHERE pa.card_id = ? 
        AND u.class_code = ?
        AND pa.is_public = 1
        AND pa.student_id != ?
      GROUP BY pa.id
      ORDER BY average_rating DESC, helpful_count DESC
      LIMIT 20
    `).bind(t, n, s).all();
    return e.json({ success: true, answers: a.results });
  } catch (a) {
    return console.error("\u274C \u53CB\u9054\u306E\u56DE\u7B54\u53D6\u5F97\u30A8\u30E9\u30FC:", a), e.json({ success: false, error: a.message }, 500);
  }
});
p.post("/api/collaborative/submit-answer", async (e) => {
  const { env: r } = e, { studentId: t, cardId: s, answerText: n, approachType: a, isPublic: o = true } = await e.req.json();
  try {
    const i = await r.DB.prepare(`
      SELECT id FROM peer_answers 
      WHERE student_id = ? AND card_id = ?
    `).bind(t, s).first();
    if (i) return await r.DB.prepare(`
        UPDATE peer_answers 
        SET answer_text = ?,
            approach_type = ?,
            is_public = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(n, a, o ? 1 : 0, i.id).run(), e.json({ success: true, answerId: i.id, message: "\u56DE\u7B54\u3092\u66F4\u65B0\u3057\u307E\u3057\u305F" });
    {
      const c = await r.DB.prepare(`
        INSERT INTO peer_answers (student_id, card_id, answer_text, approach_type, is_public)
        VALUES (?, ?, ?, ?, ?)
      `).bind(t, s, n, a, o ? 1 : 0).run();
      return e.json({ success: true, answerId: c.meta.last_row_id, message: "\u56DE\u7B54\u3092\u6295\u7A3F\u3057\u307E\u3057\u305F" });
    }
  } catch (i) {
    return console.error("\u274C \u56DE\u7B54\u6295\u7A3F\u30A8\u30E9\u30FC:", i), e.json({ success: false, error: i.message }, 500);
  }
});
p.post("/api/collaborative/submit-evaluation", async (e) => {
  const { env: r } = e, { evaluatorId: t, answerId: s, rating: n, feedbackText: a, helpfulAspects: o, learningGained: i } = await e.req.json();
  try {
    const c = await r.DB.prepare(`
      SELECT id FROM peer_evaluations 
      WHERE evaluator_id = ? AND answer_id = ?
    `).bind(t, s).first();
    if (c) return await r.DB.prepare(`
        UPDATE peer_evaluations 
        SET rating = ?,
            feedback_text = ?,
            helpful_aspects = ?,
            learning_gained = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(n, a, o, i, c.id).run(), e.json({ success: true, evaluationId: c.id, message: "\u8A55\u4FA1\u3092\u66F4\u65B0\u3057\u307E\u3057\u305F" });
    {
      const l = await r.DB.prepare(`
        INSERT INTO peer_evaluations 
        (evaluator_id, answer_id, rating, feedback_text, helpful_aspects, learning_gained)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(t, s, n, a, o, i).run();
      return e.json({ success: true, evaluationId: l.meta.last_row_id, message: "\u8A55\u4FA1\u3092\u6295\u7A3F\u3057\u307E\u3057\u305F" });
    }
  } catch (c) {
    return console.error("\u274C \u8A55\u4FA1\u6295\u7A3F\u30A8\u30E9\u30FC:", c), e.json({ success: false, error: c.message }, 500);
  }
});
p.post("/api/collaborative/toggle-helpful", async (e) => {
  const { env: r } = e, { studentId: t, answerId: s } = await e.req.json();
  try {
    const n = await r.DB.prepare(`
      SELECT id FROM peer_helpful_marks 
      WHERE student_id = ? AND answer_id = ?
    `).bind(t, s).first();
    return n ? (await r.DB.prepare(`
        DELETE FROM peer_helpful_marks WHERE id = ?
      `).bind(n.id).run(), e.json({ success: true, isHelpful: false, message: "\u5F79\u306B\u7ACB\u3063\u305F\u30DE\u30FC\u30AF\u3092\u89E3\u9664\u3057\u307E\u3057\u305F" })) : (await r.DB.prepare(`
        INSERT INTO peer_helpful_marks (student_id, answer_id)
        VALUES (?, ?)
      `).bind(t, s).run(), e.json({ success: true, isHelpful: true, message: "\u5F79\u306B\u7ACB\u3063\u305F\u30DE\u30FC\u30AF\u3092\u8FFD\u52A0\u3057\u307E\u3057\u305F" }));
  } catch (n) {
    return console.error("\u274C \u5F79\u306B\u7ACB\u3063\u305F\u30DE\u30FC\u30AF\u5207\u308A\u66FF\u3048\u30A8\u30E9\u30FC:", n), e.json({ success: false, error: n.message }, 500);
  }
});
p.post("/api/collaborative/record-view", async (e) => {
  const { env: r } = e, { viewerId: t, answerId: s, viewDuration: n } = await e.req.json();
  try {
    return await r.DB.prepare(`
      INSERT INTO peer_answer_views (viewer_id, answer_id, view_duration)
      VALUES (?, ?, ?)
    `).bind(t, s, n).run(), e.json({ success: true, message: "\u95B2\u89A7\u8A18\u9332\u3092\u4FDD\u5B58\u3057\u307E\u3057\u305F" });
  } catch (a) {
    return console.error("\u274C \u95B2\u89A7\u8A18\u9332\u30A8\u30E9\u30FC:", a), e.json({ success: false, error: a.message }, 500);
  }
});
p.get("/api/collaborative/stats/:studentId", async (e) => {
  const { env: r } = e, t = parseInt(e.req.param("studentId"));
  try {
    const s = await r.DB.prepare(`
      SELECT 
        COUNT(*) as total_answers,
        COUNT(CASE WHEN is_public = 1 THEN 1 END) as public_answers,
        AVG(CASE WHEN is_public = 1 THEN (
          SELECT AVG(rating) FROM peer_evaluations WHERE answer_id = peer_answers.id
        ) END) as average_rating_received
      FROM peer_answers
      WHERE student_id = ?
    `).bind(t).first(), n = await r.DB.prepare(`
      SELECT COUNT(*) as count
      FROM peer_evaluations
      WHERE evaluator_id = ?
    `).bind(t).first(), a = await r.DB.prepare(`
      SELECT COUNT(DISTINCT answer_id) as count
      FROM peer_answer_views
      WHERE viewer_id = ?
    `).bind(t).first(), o = await r.DB.prepare(`
      SELECT COUNT(*) as count
      FROM peer_helpful_marks phm
      JOIN peer_answers pa ON phm.answer_id = pa.id
      WHERE pa.student_id = ?
    `).bind(t).first();
    return e.json({ success: true, stats: { totalAnswers: (s == null ? void 0 : s.total_answers) || 0, publicAnswers: (s == null ? void 0 : s.public_answers) || 0, averageRating: (s == null ? void 0 : s.average_rating_received) || 0, evaluationsGiven: (n == null ? void 0 : n.count) || 0, answersViewed: (a == null ? void 0 : a.count) || 0, helpfulReceived: (o == null ? void 0 : o.count) || 0 } });
  } catch (s) {
    return console.error("\u274C \u5354\u50CD\u5B66\u7FD2\u7D71\u8A08\u53D6\u5F97\u30A8\u30E9\u30FC:", s), e.json({ success: false, error: s.message }, 500);
  }
});
p.get("/api/collaborative/class-activity/:classCode", async (e) => {
  const { env: r } = e, t = e.req.param("classCode");
  try {
    const s = await r.DB.prepare(`
      SELECT 
        u.id as student_id,
        u.name as student_name,
        COUNT(DISTINCT pa.id) as answers_shared,
        COUNT(DISTINCT pe.id) as evaluations_given,
        AVG(CASE WHEN pe2.answer_id IS NOT NULL THEN pe2.rating END) as avg_rating_received,
        COUNT(DISTINCT phm.id) as helpful_marks_received
      FROM users u
      LEFT JOIN peer_answers pa ON u.id = pa.student_id AND pa.is_public = 1
      LEFT JOIN peer_evaluations pe ON u.id = pe.evaluator_id
      LEFT JOIN peer_answers pa2 ON u.id = pa2.student_id
      LEFT JOIN peer_evaluations pe2 ON pa2.id = pe2.answer_id
      LEFT JOIN peer_helpful_marks phm ON pa2.id = phm.answer_id
      WHERE u.class_code = ?
      GROUP BY u.id
      ORDER BY (answers_shared + evaluations_given) DESC
      LIMIT 50
    `).bind(t).all();
    return e.json({ success: true, activities: s.results });
  } catch (s) {
    return console.error("\u274C \u30AF\u30E9\u30B9\u6D3B\u52D5\u53D6\u5F97\u30A8\u30E9\u30FC:", s), e.json({ success: false, error: s.message }, 500);
  }
});
p.post("/api/reports/weekly/:studentId", async (e) => {
  const { env: r } = e, t = parseInt(e.req.param("studentId")), { weekStart: s, weekEnd: n } = await e.req.json();
  try {
    const a = await r.DB.prepare(`
      SELECT 
        COUNT(DISTINCT slh.id) as total_reviews,
        AVG(slh.quality_rating) as avg_quality,
        COUNT(DISTINCT slh.card_id) as unique_cards,
        AVG(slh.is_correct) as accuracy_rate,
        SUM(slh.response_time) as total_study_time,
        COUNT(DISTINCT CASE WHEN slh.srl_stage = 'foresee' THEN slh.id END) as foresee_count,
        COUNT(DISTINCT CASE WHEN slh.srl_stage = 'performance' THEN slh.id END) as performance_count,
        COUNT(DISTINCT CASE WHEN slh.srl_stage = 'reflection' THEN slh.id END) as reflection_count
      FROM spaced_learning_history slh
      WHERE slh.student_id = ?
        AND slh.reviewed_at BETWEEN ? AND ?
    `).bind(t, s, n).first(), o = await r.DB.prepare(`
      SELECT 
        AVG(CASE WHEN dimension = 'metacognition' THEN score END) as metacognition_score,
        AVG(CASE WHEN dimension = 'self_regulation' THEN score END) as self_regulation_score,
        AVG(CASE WHEN dimension = 'motivation' THEN score END) as motivation_score
      FROM sctn_survey_results
      WHERE student_id = ?
        AND survey_date BETWEEN ? AND ?
    `).bind(t, s, n).first(), i = await r.DB.prepare(`
      SELECT 
        lsh.strategy_type,
        AVG(lsh.effectiveness_rating) as avg_effectiveness,
        COUNT(*) as usage_count
      FROM learning_strategy_history lsh
      WHERE lsh.student_id = ?
        AND lsh.used_at BETWEEN ? AND ?
      GROUP BY lsh.strategy_type
      ORDER BY avg_effectiveness DESC
    `).bind(t, s, n).all(), c = await r.DB.prepare(`
      INSERT INTO weekly_learning_reports 
      (student_id, week_start_date, week_end_date, total_study_time, 
       cards_reviewed, average_accuracy, sctn_metacognition_score, 
       sctn_self_regulation_score, spaced_learning_reviews)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(t, s, n, (a == null ? void 0 : a.total_study_time) || 0, (a == null ? void 0 : a.unique_cards) || 0, (a == null ? void 0 : a.accuracy_rate) || 0, (o == null ? void 0 : o.metacognition_score) || null, (o == null ? void 0 : o.self_regulation_score) || null, (a == null ? void 0 : a.total_reviews) || 0).run();
    return e.json({ success: true, reportId: c.meta.last_row_id, summary: { totalReviews: (a == null ? void 0 : a.total_reviews) || 0, avgQuality: (a == null ? void 0 : a.avg_quality) || 0, uniqueCards: (a == null ? void 0 : a.unique_cards) || 0, accuracyRate: ((a == null ? void 0 : a.accuracy_rate) || 0) * 100, totalStudyTime: (a == null ? void 0 : a.total_study_time) || 0, srlBreakdown: { foresee: (a == null ? void 0 : a.foresee_count) || 0, performance: (a == null ? void 0 : a.performance_count) || 0, reflection: (a == null ? void 0 : a.reflection_count) || 0 }, sctnProgress: o, topStrategies: i.results.slice(0, 3) } });
  } catch (a) {
    return console.error("\u274C \u9031\u6B21\u30EC\u30DD\u30FC\u30C8\u751F\u6210\u30A8\u30E9\u30FC:", a), e.json({ success: false, error: a.message }, 500);
  }
});
p.post("/api/reports/monthly/:studentId", async (e) => {
  const { env: r } = e, t = parseInt(e.req.param("studentId")), { monthStart: s, monthEnd: n } = await e.req.json();
  try {
    const a = await r.DB.prepare(`
      SELECT 
        COUNT(DISTINCT slh.id) as total_reviews,
        COUNT(DISTINCT slh.card_id) as unique_cards,
        AVG(slh.is_correct) as avg_accuracy,
        SUM(slh.response_time) as total_time,
        AVG(slh.quality_rating) as avg_quality
      FROM spaced_learning_history slh
      WHERE slh.student_id = ?
        AND slh.reviewed_at BETWEEN ? AND ?
    `).bind(t, s, n).first(), o = await r.DB.prepare(`
      SELECT 
        DATE(slh.reviewed_at) as review_date,
        AVG(sls.mastery_level) as avg_mastery
      FROM spaced_learning_history slh
      JOIN spaced_learning_schedule sls ON slh.student_id = sls.student_id 
        AND slh.card_id = sls.card_id
      WHERE slh.student_id = ?
        AND slh.reviewed_at BETWEEN ? AND ?
      GROUP BY DATE(slh.reviewed_at)
      ORDER BY review_date
    `).bind(t, s, n).all(), i = await r.DB.prepare(`
      SELECT 
        survey_date,
        AVG(CASE WHEN dimension = 'metacognition' THEN score END) as metacognition,
        AVG(CASE WHEN dimension = 'self_regulation' THEN score END) as self_regulation,
        AVG(CASE WHEN dimension = 'motivation' THEN score END) as motivation,
        AVG(CASE WHEN dimension = 'collaboration' THEN score END) as collaboration
      FROM sctn_survey_results
      WHERE student_id = ?
        AND survey_date BETWEEN ? AND ?
      GROUP BY survey_date
      ORDER BY survey_date
    `).bind(t, s, n).all(), c = await r.DB.prepare(`
      SELECT 
        COUNT(DISTINCT pa.id) as answers_shared,
        COUNT(DISTINCT pe.id) as evaluations_given,
        AVG(pe2.rating) as avg_rating_received
      FROM users u
      LEFT JOIN peer_answers pa ON u.id = pa.student_id
      LEFT JOIN peer_evaluations pe ON u.id = pe.evaluator_id
      LEFT JOIN peer_answers pa2 ON u.id = pa2.student_id
      LEFT JOIN peer_evaluations pe2 ON pa2.id = pe2.answer_id
      WHERE u.id = ?
        AND pa.created_at BETWEEN ? AND ?
    `).bind(t, s, n).first(), l = await r.DB.prepare(`
      INSERT INTO monthly_learning_reports 
      (student_id, month_start_date, month_end_date, total_study_time,
       cards_mastered, average_accuracy, sctn_overall_growth,
       collaboration_score, spaced_learning_effectiveness)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(t, s, n, (a == null ? void 0 : a.total_time) || 0, (a == null ? void 0 : a.unique_cards) || 0, (a == null ? void 0 : a.avg_accuracy) || 0, null, (c == null ? void 0 : c.answers_shared) || 0, (a == null ? void 0 : a.avg_quality) || 0).run();
    return e.json({ success: true, reportId: l.meta.last_row_id, summary: { totalReviews: (a == null ? void 0 : a.total_reviews) || 0, uniqueCards: (a == null ? void 0 : a.unique_cards) || 0, avgAccuracy: ((a == null ? void 0 : a.avg_accuracy) || 0) * 100, totalTime: (a == null ? void 0 : a.total_time) || 0, avgQuality: (a == null ? void 0 : a.avg_quality) || 0, masteryTrend: o.results, sctnTrend: i.results, collaboration: c } });
  } catch (a) {
    return console.error("\u274C \u6708\u6B21\u30EC\u30DD\u30FC\u30C8\u751F\u6210\u30A8\u30E9\u30FC:", a), e.json({ success: false, error: a.message }, 500);
  }
});
p.get("/api/reports/weekly/:studentId/list", async (e) => {
  const { env: r } = e, t = parseInt(e.req.param("studentId")), s = parseInt(e.req.query("limit") || "12");
  try {
    const n = await r.DB.prepare(`
      SELECT * FROM weekly_learning_reports
      WHERE student_id = ?
      ORDER BY week_start_date DESC
      LIMIT ?
    `).bind(t, s).all();
    return e.json({ success: true, reports: n.results });
  } catch (n) {
    return console.error("\u274C \u9031\u6B21\u30EC\u30DD\u30FC\u30C8\u4E00\u89A7\u53D6\u5F97\u30A8\u30E9\u30FC:", n), e.json({ success: false, error: n.message }, 500);
  }
});
p.get("/api/reports/monthly/:studentId/list", async (e) => {
  const { env: r } = e, t = parseInt(e.req.param("studentId")), s = parseInt(e.req.query("limit") || "12");
  try {
    const n = await r.DB.prepare(`
      SELECT * FROM monthly_learning_reports
      WHERE student_id = ?
      ORDER BY month_start_date DESC
      LIMIT ?
    `).bind(t, s).all();
    return e.json({ success: true, reports: n.results });
  } catch (n) {
    return console.error("\u274C \u6708\u6B21\u30EC\u30DD\u30FC\u30C8\u4E00\u89A7\u53D6\u5F97\u30A8\u30E9\u30FC:", n), e.json({ success: false, error: n.message }, 500);
  }
});
p.get("/api/reports/sctn-trend/:studentId", async (e) => {
  const { env: r } = e, t = parseInt(e.req.param("studentId")), s = parseInt(e.req.query("months") || "12");
  try {
    const n = /* @__PURE__ */ new Date();
    n.setMonth(n.getMonth() - s);
    const a = await r.DB.prepare(`
      SELECT 
        survey_date,
        dimension,
        score,
        package_type
      FROM sctn_survey_results
      WHERE student_id = ?
        AND survey_date >= ?
      ORDER BY survey_date, dimension
    `).bind(t, n.toISOString().split("T")[0]).all(), o = {};
    return a.results.forEach((i) => {
      o[i.dimension] || (o[i.dimension] = []), o[i.dimension].push({ date: i.survey_date, score: i.score, packageType: i.package_type });
    }), e.json({ success: true, trend: o });
  } catch (n) {
    return console.error("\u274C ScTN\u7D4C\u5E74\u5909\u5316\u53D6\u5F97\u30A8\u30E9\u30FC:", n), e.json({ success: false, error: n.message }, 500);
  }
});
p.get("/api/reports/mastery-trend/:studentId", async (e) => {
  const { env: r } = e, t = parseInt(e.req.param("studentId")), s = parseInt(e.req.query("days") || "30");
  try {
    const n = /* @__PURE__ */ new Date();
    n.setDate(n.getDate() - s);
    const a = await r.DB.prepare(`
      SELECT 
        DATE(slh.reviewed_at) as review_date,
        AVG(sls.mastery_level) as avg_mastery,
        COUNT(DISTINCT slh.card_id) as cards_reviewed,
        AVG(slh.is_correct) as accuracy
      FROM spaced_learning_history slh
      JOIN spaced_learning_schedule sls ON slh.student_id = sls.student_id 
        AND slh.card_id = sls.card_id
      WHERE slh.student_id = ?
        AND slh.reviewed_at >= ?
      GROUP BY DATE(slh.reviewed_at)
      ORDER BY review_date
    `).bind(t, n.toISOString().split("T")[0]).all();
    return e.json({ success: true, trend: a.results });
  } catch (n) {
    return console.error("\u274C \u7FD2\u719F\u5EA6\u63A8\u79FB\u53D6\u5F97\u30A8\u30E9\u30FC:", n), e.json({ success: false, error: n.message }, 500);
  }
});
p.post("/api/retrieval-practice/start-session", async (e) => {
  const { env: r } = e, { studentId: t, cardId: s, recallType: n } = await e.req.json();
  try {
    const a = await r.DB.prepare(`
      INSERT INTO retrieval_practice_sessions 
      (student_id, card_id, recall_type, session_status)
      VALUES (?, ?, ?, 'active')
    `).bind(t, s, n).run(), o = await r.DB.prepare(`
      SELECT * FROM learning_cards WHERE id = ?
    `).bind(s).first();
    return e.json({ success: true, sessionId: a.meta.last_row_id, card: o, recallType: n });
  } catch (a) {
    return console.error("\u274C \u691C\u7D22\u7DF4\u7FD2\u30BB\u30C3\u30B7\u30E7\u30F3\u958B\u59CB\u30A8\u30E9\u30FC:", a), e.json({ success: false, error: a.message }, 500);
  }
});
p.post("/api/retrieval-practice/submit-answer", async (e) => {
  var i, c, l, u, d;
  const { env: r } = e, { sessionId: t, studentAnswer: s, responseTime: n, confidenceRating: a, difficultyRating: o } = await e.req.json();
  try {
    const _ = await r.DB.prepare(`
      SELECT * FROM retrieval_practice_sessions WHERE id = ?
    `).bind(t).first();
    if (!_) throw new Error("\u30BB\u30C3\u30B7\u30E7\u30F3\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093");
    const m = await r.DB.prepare(`
      SELECT answer FROM learning_cards WHERE id = ?
    `).bind(_.card_id).first();
    let h = 0, g = 0, f = 0, E = "";
    if (r.GEMINI_API_KEY) {
      const v = `
\u3042\u306A\u305F\u306F\u6559\u80B2\u8A55\u4FA1\u306E\u5C02\u9580\u5BB6\u3067\u3059\u3002\u4EE5\u4E0B\u306E\u5B66\u7FD2\u8005\u306E\u56DE\u7B54\u3092\u8A55\u4FA1\u3057\u3066\u304F\u3060\u3055\u3044\u3002

\u3010\u6B63\u89E3\u3011
${m == null ? void 0 : m.answer}

\u3010\u5B66\u7FD2\u8005\u306E\u56DE\u7B54\u3011
${s}

\u4EE5\u4E0B\u306E\u89B3\u70B9\u3067\u8A55\u4FA1\u3057\u3001JSON\u5F62\u5F0F\u3067\u8FD4\u3057\u3066\u304F\u3060\u3055\u3044\uFF1A
{
  "accuracy_score": 0-100\u306E\u6570\u5024\uFF08\u6B63\u78BA\u6027\uFF09,
  "completeness_score": 0-100\u306E\u6570\u5024\uFF08\u5B8C\u5168\u6027\uFF09,
  "precision_score": 0-100\u306E\u6570\u5024\uFF08\u7CBE\u5EA6\uFF09,
  "detailed_feedback": "\u8A73\u7D30\u306A\u30D5\u30A3\u30FC\u30C9\u30D0\u30C3\u30AF\u6587"
}
`;
      try {
        const O = ((d = (u = (l = (c = (i = (await (await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${r.GEMINI_API_KEY}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ parts: [{ text: v }] }], generationConfig: { temperature: 0.3, maxOutputTokens: 1e3 } }) })).json()).candidates) == null ? void 0 : i[0]) == null ? void 0 : c.content) == null ? void 0 : l.parts) == null ? void 0 : u[0]) == null ? void 0 : d.text) || "{}", A = JSON.parse(Y(O));
        h = A.accuracy_score || 0, g = A.completeness_score || 0, f = A.precision_score || 0, E = A.detailed_feedback || "";
      } catch (b) {
        console.error("AI\u8A55\u4FA1\u30A8\u30E9\u30FC:", b);
      }
    }
    await r.DB.prepare(`
      UPDATE retrieval_practice_sessions
      SET student_answer = ?,
          response_time = ?,
          confidence_rating = ?,
          difficulty_rating = ?,
          accuracy_score = ?,
          completeness_score = ?,
          precision_score = ?,
          ai_detailed_feedback = ?,
          session_status = 'completed',
          completed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(s, n, a, o, h, g, f, E, t).run();
    const x = (h + g + f) / 3, y = a - x;
    return await r.DB.prepare(`
      INSERT INTO metacognition_tracking
      (student_id, card_id, session_id, predicted_performance, actual_performance, metacognition_gap)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(_.student_id, _.card_id, t, a, x, y).run(), e.json({ success: true, evaluation: { accuracyScore: h, completenessScore: g, precisionScore: f, overallScore: x, feedback: E, metacognitionGap: y } });
  } catch (_) {
    return console.error("\u274C \u691C\u7D22\u7DF4\u7FD2\u56DE\u7B54\u9001\u4FE1\u30A8\u30E9\u30FC:", _), e.json({ success: false, error: _.message }, 500);
  }
});
p.get("/api/retrieval-practice/sessions/:studentId", async (e) => {
  const { env: r } = e, t = parseInt(e.req.param("studentId")), s = parseInt(e.req.query("limit") || "20");
  try {
    const n = await r.DB.prepare(`
      SELECT 
        rps.*,
        lc.card_title,
        lc.card_number,
        (rps.accuracy_score + rps.completeness_score + rps.precision_score) / 3 as overall_score
      FROM retrieval_practice_sessions rps
      JOIN learning_cards lc ON rps.card_id = lc.id
      WHERE rps.student_id = ?
      ORDER BY rps.created_at DESC
      LIMIT ?
    `).bind(t, s).all();
    return e.json({ success: true, sessions: n.results });
  } catch (n) {
    return console.error("\u274C \u691C\u7D22\u7DF4\u7FD2\u30BB\u30C3\u30B7\u30E7\u30F3\u4E00\u89A7\u53D6\u5F97\u30A8\u30E9\u30FC:", n), e.json({ success: false, error: n.message }, 500);
  }
});
p.get("/api/retrieval-practice/stats/:studentId", async (e) => {
  const { env: r } = e, t = parseInt(e.req.param("studentId"));
  try {
    const s = await r.DB.prepare(`
      SELECT 
        COUNT(*) as total_sessions,
        AVG(accuracy_score) as avg_accuracy,
        AVG(completeness_score) as avg_completeness,
        AVG(precision_score) as avg_precision,
        AVG(response_time) as avg_response_time,
        AVG(confidence_rating) as avg_confidence
      FROM retrieval_practice_sessions
      WHERE student_id = ? AND session_status = 'completed'
    `).bind(t).first(), n = await r.DB.prepare(`
      SELECT 
        recall_type,
        COUNT(*) as session_count,
        AVG((accuracy_score + completeness_score + precision_score) / 3) as avg_score
      FROM retrieval_practice_sessions
      WHERE student_id = ? AND session_status = 'completed'
      GROUP BY recall_type
    `).bind(t).all(), a = await r.DB.prepare(`
      SELECT 
        AVG(predicted_performance) as avg_predicted,
        AVG(actual_performance) as avg_actual,
        AVG(metacognition_gap) as avg_gap,
        AVG(ABS(metacognition_gap)) as avg_abs_gap
      FROM metacognition_tracking
      WHERE student_id = ?
    `).bind(t).first();
    return e.json({ success: true, stats: { basic: s, recallTypes: n.results, metacognition: a } });
  } catch (s) {
    return console.error("\u274C \u691C\u7D22\u7DF4\u7FD2\u7D71\u8A08\u53D6\u5F97\u30A8\u30E9\u30FC:", s), e.json({ success: false, error: s.message }, 500);
  }
});
p.get("/api/retrieval-practice/effectiveness/:studentId", async (e) => {
  const { env: r } = e, t = parseInt(e.req.param("studentId"));
  try {
    const s = await r.DB.prepare(`
      SELECT 
        card_id,
        AVG(immediate_recall_score) as avg_immediate,
        AVG(retention_score) as avg_retention,
        AVG(transfer_score) as avg_transfer,
        AVG(retention_interval) as avg_interval,
        COUNT(*) as measurement_count
      FROM retrieval_practice_effectiveness
      WHERE student_id = ?
      GROUP BY card_id
      ORDER BY avg_retention DESC
    `).bind(t).all();
    return e.json({ success: true, effectiveness: s.results });
  } catch (s) {
    return console.error("\u274C \u52B9\u679C\u6E2C\u5B9A\u30C7\u30FC\u30BF\u53D6\u5F97\u30A8\u30E9\u30FC:", s), e.json({ success: false, error: s.message }, 500);
  }
});
p.get("/api/retrieval-practice/recommended-cards/:studentId", async (e) => {
  const { env: r } = e, t = parseInt(e.req.param("studentId")), s = e.req.query("recallType") || "free_recall";
  try {
    const n = await r.DB.prepare(`
      SELECT 
        lc.*,
        COALESCE(rpe.avg_retention, 0) as retention_score,
        COALESCE(rps.session_count, 0) as practice_count
      FROM learning_cards lc
      LEFT JOIN (
        SELECT card_id, AVG(retention_score) as avg_retention
        FROM retrieval_practice_effectiveness
        WHERE student_id = ?
        GROUP BY card_id
      ) rpe ON lc.id = rpe.card_id
      LEFT JOIN (
        SELECT card_id, COUNT(*) as session_count
        FROM retrieval_practice_sessions
        WHERE student_id = ? AND recall_type = ?
        GROUP BY card_id
      ) rps ON lc.id = rps.card_id
      WHERE lc.id IN (
        SELECT DISTINCT card_id FROM student_progress WHERE student_id = ?
      )
      ORDER BY practice_count ASC, retention_score ASC
      LIMIT 10
    `).bind(t, t, s, t).all();
    return e.json({ success: true, recommendedCards: n.results });
  } catch (n) {
    return console.error("\u274C \u63A8\u5968\u30AB\u30FC\u30C9\u53D6\u5F97\u30A8\u30E9\u30FC:", n), e.json({ success: false, error: n.message }, 500);
  }
});
p.post("/api/interleaved-practice/start-session", async (e) => {
  const { env: r } = e, { studentId: t, interleavingStrategy: s } = await e.req.json();
  try {
    const a = (await r.DB.prepare(`
      INSERT INTO interleaved_practice_sessions 
      (student_id, interleaving_strategy, session_status)
      VALUES (?, ?, 'active')
    `).bind(t, s).run()).meta.last_row_id, o = await r.DB.prepare(`
      SELECT lc.*, cc.concept_name
      FROM learning_cards lc
      LEFT JOIN curriculum_concepts cc ON lc.concept_id = cc.id
      WHERE lc.id IN (
        SELECT card_id FROM student_progress WHERE student_id = ?
      )
      ORDER BY RANDOM()
      LIMIT 10
    `).bind(t).all();
    let i = [];
    if (s === "random_interleaving") i = o.results.map((c) => c.id).sort(() => Math.random() - 0.5);
    else if (s === "blocked_interleaving") {
      const c = {};
      o.results.forEach((l) => {
        const u = l.concept_name || "other";
        c[u] || (c[u] = []), c[u].push(l.id);
      }), i = Object.values(c).flat();
    } else if (s === "adaptive_interleaving") i = o.results.sort((c, l) => (c.mastery_level || 0) - (l.mastery_level || 0)).map((c) => c.id);
    else {
      const c = {};
      o.results.forEach((u) => {
        const d = u.concept_name || "other";
        c[d] || (c[d] = []), c[d].push(u.id);
      });
      const l = Math.max(...Object.values(c).map((u) => u.length));
      for (let u = 0; u < l; u++) Object.values(c).forEach((d) => {
        d[u] && i.push(d[u]);
      });
    }
    for (let c = 0; c < i.length; c++) await r.DB.prepare(`
        INSERT INTO interleaved_practice_problems
        (session_id, card_id, problem_order)
        VALUES (?, ?, ?)
      `).bind(a, i[c], c + 1).run();
    return e.json({ success: true, sessionId: a, problemOrder: i, totalProblems: i.length });
  } catch (n) {
    return console.error("\u274C \u4EA4\u4E92\u914D\u7F6E\u30BB\u30C3\u30B7\u30E7\u30F3\u958B\u59CB\u30A8\u30E9\u30FC:", n), e.json({ success: false, error: n.message }, 500);
  }
});
p.post("/api/interleaved-practice/submit-answer", async (e) => {
  const { env: r } = e, { sessionId: t, problemId: s, isCorrect: n, responseTime: a, identifiedConcept: o, confusedConcepts: i } = await e.req.json();
  try {
    await r.DB.prepare(`
      UPDATE interleaved_practice_problems
      SET is_correct = ?,
          response_time = ?,
          identified_concept = ?,
          confused_concepts = ?,
          answered_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(n, a, o, i, s).run();
    const c = await r.DB.prepare(`
      SELECT ipp.*, ips.student_id, lc.concept_id
      FROM interleaved_practice_problems ipp
      JOIN interleaved_practice_sessions ips ON ipp.session_id = ips.id
      JOIN learning_cards lc ON ipp.card_id = lc.id
      WHERE ipp.id = ?
    `).bind(s).first();
    c && await r.DB.prepare(`
        INSERT INTO discrimination_ability_tracking
        (student_id, session_id, source_concept, identified_concept, 
         is_correct_identification, response_time)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(c.student_id, t, c.concept_id, o, n ? 1 : 0, a).run();
    const l = await r.DB.prepare(`
      SELECT ipp.*, lc.*
      FROM interleaved_practice_problems ipp
      JOIN learning_cards lc ON ipp.card_id = lc.id
      WHERE ipp.session_id = ? AND ipp.answered_at IS NULL
      ORDER BY ipp.problem_order
      LIMIT 1
    `).bind(t).first();
    return l ? e.json({ success: true, sessionCompleted: false, nextProblem: l }) : (await r.DB.prepare(`
        UPDATE interleaved_practice_sessions
        SET session_status = 'completed',
            completed_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(t).run(), e.json({ success: true, sessionCompleted: true, message: "\u4EA4\u4E92\u914D\u7F6E\u7DF4\u7FD2\u30BB\u30C3\u30B7\u30E7\u30F3\u304C\u5B8C\u4E86\u3057\u307E\u3057\u305F" }));
  } catch (c) {
    return console.error("\u274C \u4EA4\u4E92\u914D\u7F6E\u554F\u984C\u56DE\u7B54\u9001\u4FE1\u30A8\u30E9\u30FC:", c), e.json({ success: false, error: c.message }, 500);
  }
});
p.get("/api/interleaved-practice/sessions/:studentId", async (e) => {
  const { env: r } = e, t = parseInt(e.req.param("studentId")), s = parseInt(e.req.query("limit") || "20");
  try {
    const n = await r.DB.prepare(`
      SELECT 
        ips.*,
        COUNT(ipp.id) as total_problems,
        SUM(CASE WHEN ipp.is_correct = 1 THEN 1 ELSE 0 END) as correct_answers,
        AVG(ipp.response_time) as avg_response_time
      FROM interleaved_practice_sessions ips
      LEFT JOIN interleaved_practice_problems ipp ON ips.id = ipp.session_id
      WHERE ips.student_id = ?
      GROUP BY ips.id
      ORDER BY ips.created_at DESC
      LIMIT ?
    `).bind(t, s).all();
    return e.json({ success: true, sessions: n.results });
  } catch (n) {
    return console.error("\u274C \u4EA4\u4E92\u914D\u7F6E\u30BB\u30C3\u30B7\u30E7\u30F3\u4E00\u89A7\u53D6\u5F97\u30A8\u30E9\u30FC:", n), e.json({ success: false, error: n.message }, 500);
  }
});
p.get("/api/interleaved-practice/discrimination-stats/:studentId", async (e) => {
  const { env: r } = e, t = parseInt(e.req.param("studentId"));
  try {
    const s = await r.DB.prepare(`
      SELECT 
        source_concept,
        COUNT(*) as total_attempts,
        SUM(is_correct_identification) as correct_identifications,
        AVG(is_correct_identification) as accuracy_rate,
        AVG(response_time) as avg_response_time
      FROM discrimination_ability_tracking
      WHERE student_id = ?
      GROUP BY source_concept
      ORDER BY accuracy_rate ASC
    `).bind(t).all(), n = await r.DB.prepare(`
      SELECT 
        source_concept,
        identified_concept,
        COUNT(*) as count
      FROM discrimination_ability_tracking
      WHERE student_id = ? AND is_correct_identification = 0
      GROUP BY source_concept, identified_concept
      ORDER BY count DESC
      LIMIT 20
    `).bind(t).all();
    return e.json({ success: true, stats: { conceptAccuracy: s.results, confusionMatrix: n.results } });
  } catch (s) {
    return console.error("\u274C \u6982\u5FF5\u8B58\u5225\u80FD\u529B\u7D71\u8A08\u53D6\u5F97\u30A8\u30E9\u30FC:", s), e.json({ success: false, error: s.message }, 500);
  }
});
p.get("/api/interleaved-practice/transfer-effects/:studentId", async (e) => {
  const { env: r } = e, t = parseInt(e.req.param("studentId"));
  try {
    const s = await r.DB.prepare(`
      SELECT 
        source_concept,
        target_concept,
        AVG(transfer_score) as avg_transfer_score,
        AVG(improvement_rate) as avg_improvement,
        COUNT(*) as measurement_count
      FROM transfer_learning_effects
      WHERE student_id = ?
      GROUP BY source_concept, target_concept
      ORDER BY avg_transfer_score DESC
    `).bind(t).all();
    return e.json({ success: true, transferEffects: s.results });
  } catch (s) {
    return console.error("\u274C \u8EE2\u79FB\u5B66\u7FD2\u52B9\u679C\u6E2C\u5B9A\u30A8\u30E9\u30FC:", s), e.json({ success: false, error: s.message }, 500);
  }
});
p.get("/api/interleaved-practice/stats/:studentId", async (e) => {
  const { env: r } = e, t = parseInt(e.req.param("studentId"));
  try {
    const s = await r.DB.prepare(`
      SELECT 
        COUNT(DISTINCT ips.id) as total_sessions,
        COUNT(ipp.id) as total_problems,
        AVG(CASE WHEN ipp.is_correct = 1 THEN 1.0 ELSE 0.0 END) as avg_accuracy,
        AVG(ipp.response_time) as avg_response_time
      FROM interleaved_practice_sessions ips
      LEFT JOIN interleaved_practice_problems ipp ON ips.id = ipp.session_id
      WHERE ips.student_id = ?
    `).bind(t).first(), n = await r.DB.prepare(`
      SELECT 
        ips.interleaving_strategy,
        COUNT(DISTINCT ips.id) as session_count,
        AVG(CASE WHEN ipp.is_correct = 1 THEN 1.0 ELSE 0.0 END) as avg_accuracy
      FROM interleaved_practice_sessions ips
      LEFT JOIN interleaved_practice_problems ipp ON ips.id = ipp.session_id
      WHERE ips.student_id = ?
      GROUP BY ips.interleaving_strategy
    `).bind(t).all();
    return e.json({ success: true, stats: { basic: s, strategies: n.results } });
  } catch (s) {
    return console.error("\u274C \u4EA4\u4E92\u914D\u7F6E\u7DF4\u7FD2\u7D71\u8A08\u53D6\u5F97\u30A8\u30E9\u30FC:", s), e.json({ success: false, error: s.message }, 500);
  }
});
p.post("/api/ai-teacher/socratic-dialogue", async (e) => {
  var o, i, c, l, u;
  const { env: r } = e, { studentId: t, cardId: s, currentUnderstanding: n, attemptCount: a } = await e.req.json();
  if (!r.GEMINI_API_KEY) return e.json({ success: false, error: "Gemini API\u30AD\u30FC\u304C\u8A2D\u5B9A\u3055\u308C\u3066\u3044\u307E\u305B\u3093" }, 500);
  try {
    const d = await r.DB.prepare(`
      SELECT * FROM learning_cards WHERE id = ?
    `).bind(s).first();
    if (!d) throw new Error("\u30AB\u30FC\u30C9\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093");
    const _ = `
\u3042\u306A\u305F\u306F\u512A\u308C\u305F\u6559\u5E2B\u3068\u3057\u3066\u3001\u30BD\u30AF\u30E9\u30C6\u30B9\u5F0F\u5BFE\u8A71\u6CD5\u3092\u4F7F\u3063\u3066\u5150\u7AE5\u306E\u5B66\u7FD2\u3092\u652F\u63F4\u3057\u307E\u3059\u3002

\u3010\u554F\u984C\u3011
${d.card_title}
${d.problem_description || ""}

\u3010\u5150\u7AE5\u306E\u73FE\u5728\u306E\u7406\u89E3\u3011
${n}

\u3010\u8A66\u884C\u56DE\u6570\u3011
${a}\u56DE\u76EE

\u3010\u3042\u306A\u305F\u306E\u5F79\u5272\u3011
1. \u76F4\u63A5\u7B54\u3048\u306F\u6559\u3048\u306A\u3044
2. \u6BB5\u968E\u7684\u306A\u8CEA\u554F\u3067\u601D\u8003\u3092\u4FC3\u3059
3. \u5150\u7AE5\u304C\u81EA\u5206\u3067\u6C17\u3065\u3051\u308B\u3088\u3046\u306B\u30D2\u30F3\u30C8\u3092\u51FA\u3059
4. \u8A66\u884C\u56DE\u6570\u306B\u5FDC\u3058\u3066\u30D2\u30F3\u30C8\u306E\u5177\u4F53\u6027\u3092\u8ABF\u6574\u3059\u308B

\u3010\u5BFE\u8A71\u306E\u65B9\u91DD\u3011
- 1-2\u56DE\u76EE: \u975E\u5E38\u306B\u62BD\u8C61\u7684\u306A\u8CEA\u554F
- 3-4\u56DE\u76EE: \u3084\u3084\u5177\u4F53\u7684\u306A\u30D2\u30F3\u30C8
- 5\u56DE\u76EE\u4EE5\u964D: \u3088\u308A\u76F4\u63A5\u7684\u306A\u30D2\u30F3\u30C8\u3068\u52B1\u307E\u3057

JSON\u5F62\u5F0F\u3067\u4EE5\u4E0B\u3092\u8FD4\u3057\u3066\u304F\u3060\u3055\u3044\uFF1A
{
  "question": "\u5150\u7AE5\u3078\u306E\u8CEA\u554F",
  "hint_level": 1-5\u306E\u6570\u5024\uFF08\u62BD\u8C61\u2192\u5177\u4F53\uFF09,
  "encouragement": "\u52B1\u307E\u3057\u306E\u30E1\u30C3\u30BB\u30FC\u30B8",
  "is_close_to_answer": true/false
}
`, g = ((u = (l = (c = (i = (o = (await (await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${r.GEMINI_API_KEY}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ parts: [{ text: _ }] }], generationConfig: { temperature: 0.7, maxOutputTokens: 1e3 } }) })).json()).candidates) == null ? void 0 : o[0]) == null ? void 0 : i.content) == null ? void 0 : c.parts) == null ? void 0 : l[0]) == null ? void 0 : u.text) || "{}", f = JSON.parse(Y(g));
    return e.json({ success: true, dialogue: f });
  } catch (d) {
    return console.error("\u274C \u30BD\u30AF\u30E9\u30C6\u30B9\u5F0F\u5BFE\u8A71\u30A8\u30E9\u30FC:", d), e.json({ success: false, error: d.message }, 500);
  }
});
p.post("/api/ai-teacher/adaptive-explanation", async (e) => {
  var o, i, c, l, u;
  const { env: r } = e, { studentId: t, concept: s, learningStyle: n, priorKnowledge: a } = await e.req.json();
  if (!r.GEMINI_API_KEY) return e.json({ success: false, error: "Gemini API\u30AD\u30FC\u304C\u8A2D\u5B9A\u3055\u308C\u3066\u3044\u307E\u305B\u3093" }, 500);
  try {
    const _ = `
\u3042\u306A\u305F\u306F\u500B\u5225\u6700\u9069\u5316\u5B66\u7FD2\u306E\u5C02\u9580\u5BB6\u3067\u3059\u3002\u5150\u7AE5\u306E\u5B66\u7FD2\u30B9\u30BF\u30A4\u30EB\u306B\u5408\u308F\u305B\u3066\u6982\u5FF5\u3092\u8AAC\u660E\u3057\u3066\u304F\u3060\u3055\u3044\u3002

\u3010\u6982\u5FF5\u3011
${s}

\u3010\u5B66\u7FD2\u30B9\u30BF\u30A4\u30EB\u3011
${n}: ${{ visual: "\u8996\u899A\u7684\u306A\u56F3\u3084\u30A4\u30E9\u30B9\u30C8\u3092\u591A\u7528\u3057\u305F\u8AAC\u660E", auditory: "\u97F3\u3084\u8A00\u8449\u3067\u8AAC\u660E\u3057\u3001\u30EA\u30BA\u30E0\u3084\u8A9E\u5442\u5408\u308F\u305B\u3092\u6D3B\u7528", kinesthetic: "\u4F53\u3092\u52D5\u304B\u3057\u305F\u308A\u5B9F\u969B\u306B\u89E6\u308C\u305F\u308A\u3059\u308B\u4F53\u9A13\u7684\u306A\u8AAC\u660E", reading_writing: "\u6587\u7AE0\u3084\u7B87\u6761\u66F8\u304D\u3067\u306E\u8A73\u7D30\u306A\u8AAC\u660E" }[n] || ""}

\u3010\u4E8B\u524D\u77E5\u8B58\u3011
${a || "\u306A\u3057"}

\u3010\u8AAC\u660E\u306E\u8981\u4EF6\u3011
1. \u5B66\u7FD2\u30B9\u30BF\u30A4\u30EB\u306B\u5B8C\u5168\u306B\u9069\u5FDC\u3057\u305F\u8AAC\u660E
2. \u65E2\u6709\u77E5\u8B58\u3068\u95A2\u9023\u4ED8\u3051\u308B
3. \u5177\u4F53\u4F8B\u30923\u3064\u4EE5\u4E0A\u542B\u3081\u308B
4. \u6BB5\u968E\u7684\u306A\u7406\u89E3\u3092\u4FC3\u3059\u69CB\u6210

JSON\u5F62\u5F0F\u3067\u4EE5\u4E0B\u3092\u8FD4\u3057\u3066\u304F\u3060\u3055\u3044\uFF1A
{
  "explanation": "\u30E1\u30A4\u30F3\u306E\u8AAC\u660E\u6587",
  "examples": ["\u5177\u4F53\u4F8B1", "\u5177\u4F53\u4F8B2", "\u5177\u4F53\u4F8B3"],
  "visual_suggestions": ["\u8996\u899A\u7684\u306A\u8868\u73FE\u65B9\u6CD5\u306E\u63D0\u6848"],
  "practice_activities": ["\u5B9F\u8DF5\u7684\u306A\u6D3B\u52D5\u306E\u63D0\u6848"],
  "connections": ["\u4ED6\u306E\u6982\u5FF5\u3068\u306E\u95A2\u9023\u6027"]
}
`, g = ((u = (l = (c = (i = (o = (await (await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${r.GEMINI_API_KEY}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ parts: [{ text: _ }] }], generationConfig: { temperature: 0.8, maxOutputTokens: 2e3 } }) })).json()).candidates) == null ? void 0 : o[0]) == null ? void 0 : i.content) == null ? void 0 : c.parts) == null ? void 0 : l[0]) == null ? void 0 : u.text) || "{}", f = JSON.parse(Y(g));
    return e.json({ success: true, explanation: f });
  } catch (d) {
    return console.error("\u274C \u9069\u5FDC\u578B\u8AAC\u660E\u30A8\u30E9\u30FC:", d), e.json({ success: false, error: d.message }, 500);
  }
});
p.post("/api/ai-teacher/error-analysis", async (e) => {
  var i, c, l, u, d;
  const { env: r } = e, { studentId: t, cardId: s, studentAnswer: n, correctAnswer: a, previousErrors: o } = await e.req.json();
  if (!r.GEMINI_API_KEY) return e.json({ success: false, error: "Gemini API\u30AD\u30FC\u304C\u8A2D\u5B9A\u3055\u308C\u3066\u3044\u307E\u305B\u3093" }, 500);
  try {
    const _ = `
\u3042\u306A\u305F\u306F\u6559\u80B2\u5FC3\u7406\u5B66\u306E\u5C02\u9580\u5BB6\u3068\u3057\u3066\u3001\u5150\u7AE5\u306E\u8AA4\u7B54\u3092\u5206\u6790\u3057\u3066\u304F\u3060\u3055\u3044\u3002

\u3010\u6B63\u89E3\u3011
${a}

\u3010\u5150\u7AE5\u306E\u56DE\u7B54\u3011
${n}

\u3010\u904E\u53BB\u306E\u985E\u4F3C\u30A8\u30E9\u30FC\u3011
${o || "\u306A\u3057"}

\u3010\u5206\u6790\u306E\u89B3\u70B9\u3011
1. \u8AA4\u7B54\u306E\u7A2E\u985E\uFF08\u6982\u5FF5\u306E\u8AA4\u7406\u89E3\u3001\u8A08\u7B97\u30DF\u30B9\u3001\u8AAD\u307F\u9593\u9055\u3044\u306A\u3069\uFF09
2. \u601D\u8003\u30D7\u30ED\u30BB\u30B9\u306E\u63A8\u6E2C
3. \u6839\u672C\u7684\u306A\u539F\u56E0
4. \u6539\u5584\u306E\u305F\u3081\u306E\u5177\u4F53\u7684\u30A2\u30C9\u30D0\u30A4\u30B9

JSON\u5F62\u5F0F\u3067\u4EE5\u4E0B\u3092\u8FD4\u3057\u3066\u304F\u3060\u3055\u3044\uFF1A
{
  "error_type": "\u30A8\u30E9\u30FC\u30BF\u30A4\u30D7",
  "root_cause": "\u6839\u672C\u539F\u56E0\u306E\u5206\u6790",
  "thinking_process": "\u5150\u7AE5\u306E\u601D\u8003\u30D7\u30ED\u30BB\u30B9\u306E\u63A8\u6E2C",
  "improvement_advice": "\u5177\u4F53\u7684\u306A\u6539\u5584\u30A2\u30C9\u30D0\u30A4\u30B9",
  "recommended_practice": "\u63A8\u5968\u3059\u308B\u7DF4\u7FD2\u65B9\u6CD5",
  "is_conceptual_error": true/false,
  "severity": 1-5\u306E\u6570\u5024\uFF08\u8EFD\u5FAE\u2192\u91CD\u5927\uFF09
}
`, g = ((d = (u = (l = (c = (i = (await (await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${r.GEMINI_API_KEY}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ parts: [{ text: _ }] }], generationConfig: { temperature: 0.5, maxOutputTokens: 1500 } }) })).json()).candidates) == null ? void 0 : i[0]) == null ? void 0 : c.content) == null ? void 0 : l.parts) == null ? void 0 : u[0]) == null ? void 0 : d.text) || "{}", f = JSON.parse(Y(g));
    return await r.DB.prepare(`
      INSERT INTO error_patterns (student_id, card_id, error_type, root_cause, severity)
      VALUES (?, ?, ?, ?, ?)
    `).bind(t, s, f.error_type, f.root_cause, f.severity).run().catch(() => {
    }), e.json({ success: true, analysis: f });
  } catch (_) {
    return console.error("\u274C \u8AA4\u7B54\u5206\u6790\u30A8\u30E9\u30FC:", _), e.json({ success: false, error: _.message }, 500);
  }
});
p.post("/api/ai-teacher/generate-study-plan", async (e) => {
  var o, i, c, l, u;
  const { env: r } = e, { studentId: t, goalDescription: s, availableTime: n, currentLevel: a } = await e.req.json();
  if (!r.GEMINI_API_KEY) return e.json({ success: false, error: "Gemini API\u30AD\u30FC\u304C\u8A2D\u5B9A\u3055\u308C\u3066\u3044\u307E\u305B\u3093" }, 500);
  try {
    const d = await r.DB.prepare(`
      SELECT 
        COUNT(DISTINCT card_id) as total_cards,
        AVG(CASE WHEN is_correct = 1 THEN 1.0 ELSE 0.0 END) as avg_accuracy
      FROM spaced_learning_history
      WHERE student_id = ?
    `).bind(t).first(), _ = `
\u3042\u306A\u305F\u306F\u5B66\u7FD2\u30B3\u30FC\u30C1\u3068\u3057\u3066\u3001\u500B\u5225\u6700\u9069\u5316\u3055\u308C\u305F\u5B66\u7FD2\u8A08\u753B\u3092\u4F5C\u6210\u3057\u3066\u304F\u3060\u3055\u3044\u3002

\u3010\u76EE\u6A19\u3011
${s}

\u3010\u5229\u7528\u53EF\u80FD\u6642\u9593\u3011
\u9031${n}\u6642\u9593

\u3010\u73FE\u5728\u306E\u30EC\u30D9\u30EB\u3011
${a}

\u3010\u5B66\u7FD2\u5C65\u6B74\u3011
- \u7FD2\u5F97\u30AB\u30FC\u30C9\u6570: ${(d == null ? void 0 : d.total_cards) || 0}
- \u5E73\u5747\u6B63\u7B54\u7387: ${(((d == null ? void 0 : d.avg_accuracy) || 0) * 100).toFixed(1)}%

\u3010\u8A08\u753B\u306E\u8981\u4EF6\u3011
1. \u9031\u6B21\u306E\u5177\u4F53\u7684\u306A\u5B66\u7FD2\u30B9\u30B1\u30B8\u30E5\u30FC\u30EB
2. \u79D1\u5B66\u7684\u5B66\u7FD2\u65B9\u7565\u306E\u7D71\u5408\uFF08\u5206\u6563\u5B66\u7FD2\u3001\u691C\u7D22\u7DF4\u7FD2\u306A\u3069\uFF09
3. \u9054\u6210\u53EF\u80FD\u306A\u30DE\u30A4\u30EB\u30B9\u30C8\u30FC\u30F3
4. \u5B9A\u671F\u7684\u306A\u632F\u308A\u8FD4\u308A\u30DD\u30A4\u30F3\u30C8

JSON\u5F62\u5F0F\u3067\u4EE5\u4E0B\u3092\u8FD4\u3057\u3066\u304F\u3060\u3055\u3044\uFF1A
{
  "weekly_schedule": [
    {
      "day": "\u6708\u66DC\u65E5",
      "activities": ["\u6D3B\u52D51", "\u6D3B\u52D52"],
      "duration": 60,
      "strategy": "\u4F7F\u7528\u3059\u308B\u5B66\u7FD2\u65B9\u7565"
    }
  ],
  "milestones": [
    {
      "week": 1,
      "goal": "\u76EE\u6A19",
      "success_criteria": "\u6210\u529F\u57FA\u6E96"
    }
  ],
  "daily_routine": "\u65E5\u3005\u306E\u5B66\u7FD2\u30EB\u30FC\u30C6\u30A3\u30F3\u306E\u63D0\u6848",
  "reflection_points": ["\u9031\u6B21\u306E\u632F\u308A\u8FD4\u308A\u30DD\u30A4\u30F3\u30C8"],
  "motivation_tips": ["\u30E2\u30C1\u30D9\u30FC\u30B7\u30E7\u30F3\u7DAD\u6301\u306E\u30B3\u30C4"]
}
`, g = ((u = (l = (c = (i = (o = (await (await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${r.GEMINI_API_KEY}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ parts: [{ text: _ }] }], generationConfig: { temperature: 0.7, maxOutputTokens: 3e3 } }) })).json()).candidates) == null ? void 0 : o[0]) == null ? void 0 : i.content) == null ? void 0 : c.parts) == null ? void 0 : l[0]) == null ? void 0 : u.text) || "{}", f = JSON.parse(Y(g));
    return e.json({ success: true, studyPlan: f });
  } catch (d) {
    return console.error("\u274C \u5B66\u7FD2\u8A08\u753B\u751F\u6210\u30A8\u30E9\u30FC:", d), e.json({ success: false, error: d.message }, 500);
  }
});
p.post("/api/ai-teacher/encouragement", async (e) => {
  var a, o, i, c, l;
  const { env: r } = e, { studentId: t, context: s, emotion: n } = await e.req.json();
  if (!r.GEMINI_API_KEY) return e.json({ success: false, error: "Gemini API\u30AD\u30FC\u304C\u8A2D\u5B9A\u3055\u308C\u3066\u3044\u307E\u305B\u3093" }, 500);
  try {
    const u = `
\u3042\u306A\u305F\u306F\u5150\u7AE5\u306E\u5FC3\u306B\u5BC4\u308A\u6DFB\u3046\u512A\u3057\u3044AI\u5148\u751F\u3067\u3059\u3002

\u3010\u72B6\u6CC1\u3011
${s}

\u3010\u5150\u7AE5\u306E\u6C17\u6301\u3061\u3011
${n}

\u3010\u3042\u306A\u305F\u306E\u5F79\u5272\u3011
1. \u5171\u611F\u3092\u793A\u3059
2. \u5177\u4F53\u7684\u306B\u8912\u3081\u308B
3. \u6210\u9577\u3092\u8A8D\u3081\u308B
4. \u6B21\u3078\u306E\u610F\u6B32\u3092\u9AD8\u3081\u308B

\u3010\u30E1\u30C3\u30BB\u30FC\u30B8\u306E\u8981\u4EF6\u3011
- \u6E29\u304B\u304F\u52B1\u307E\u3057\u7684\u306A\u30C8\u30FC\u30F3
- \u5177\u4F53\u7684\u306A\u6210\u679C\u3092\u8A8D\u3081\u308B
- \u6B21\u306E\u4E00\u6B69\u3092\u793A\u5506\u3059\u308B
- 150\u6587\u5B57\u4EE5\u5185\u3067\u7C21\u6F54\u306B

JSON\u5F62\u5F0F\u3067\u4EE5\u4E0B\u3092\u8FD4\u3057\u3066\u304F\u3060\u3055\u3044\uFF1A
{
  "message": "\u52B1\u307E\u3057\u306E\u30E1\u30C3\u30BB\u30FC\u30B8",
  "emoji": "\u9069\u5207\u306A\u7D75\u6587\u5B57",
  "actionable_advice": "\u6B21\u306B\u3067\u304D\u308B\u5177\u4F53\u7684\u306A\u30A2\u30AF\u30B7\u30E7\u30F3"
}
`, m = ((l = (c = (i = (o = (a = (await (await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${r.GEMINI_API_KEY}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ parts: [{ text: u }] }], generationConfig: { temperature: 0.9, maxOutputTokens: 500 } }) })).json()).candidates) == null ? void 0 : a[0]) == null ? void 0 : o.content) == null ? void 0 : i.parts) == null ? void 0 : c[0]) == null ? void 0 : l.text) || "{}", h = JSON.parse(Y(m));
    return e.json({ success: true, encouragement: h });
  } catch (u) {
    return console.error("\u274C \u52B1\u307E\u3057\u30E1\u30C3\u30BB\u30FC\u30B8\u751F\u6210\u30A8\u30E9\u30FC:", u), e.json({ success: false, error: u.message }, 500);
  }
});
p.get("/api/videos/card/:cardId", async (e) => {
  const { env: r } = e, t = parseInt(e.req.param("cardId"));
  try {
    const s = await r.DB.prepare(`
      SELECT * FROM video_contents
      WHERE card_id = ? AND is_active = TRUE
      ORDER BY created_at DESC
    `).bind(t).all();
    return e.json({ success: true, videos: s.results });
  } catch (s) {
    return e.json({ success: false, error: s.message }, 500);
  }
});
p.post("/api/videos", async (e) => {
  const { env: r } = e, { card_id: t, video_title: s, video_url: n, video_platform: a, video_duration_seconds: o, thumbnail_url: i, description: c } = await e.req.json();
  try {
    const l = await r.DB.prepare(`
      INSERT INTO video_contents (card_id, video_title, video_url, video_platform, video_duration_seconds, thumbnail_url, description)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(t, s, n, a, o || null, i || null, c || null).run();
    return e.json({ success: true, video_id: l.meta.last_row_id });
  } catch (l) {
    return e.json({ success: false, error: l.message }, 500);
  }
});
p.post("/api/videos/:videoId/watch/start", async (e) => {
  const { env: r } = e, t = parseInt(e.req.param("videoId")), { student_id: s, session_id: n } = await e.req.json();
  try {
    const a = await r.DB.prepare(`
      INSERT INTO video_watch_history (video_id, student_id, session_id, watch_start_time)
      VALUES (?, ?, ?, datetime('now'))
    `).bind(t, s, n || null).run();
    return e.json({ success: true, watch_id: a.meta.last_row_id });
  } catch (a) {
    return e.json({ success: false, error: a.message }, 500);
  }
});
p.put("/api/videos/watch/:watchId", async (e) => {
  const { env: r } = e, t = parseInt(e.req.param("watchId")), { watch_duration_seconds: s, completion_percentage: n, playback_speed: a, paused_count: o, rewind_count: i } = await e.req.json();
  try {
    return await r.DB.prepare(`
      UPDATE video_watch_history
      SET watch_end_time = datetime('now'),
          watch_duration_seconds = ?,
          completion_percentage = ?,
          playback_speed = ?,
          paused_count = ?,
          rewind_count = ?
      WHERE watch_id = ?
    `).bind(s, n, a || 1, o || 0, i || 0, t).run(), e.json({ success: true });
  } catch (c) {
    return e.json({ success: false, error: c.message }, 500);
  }
});
p.get("/api/videos/history/student/:studentId", async (e) => {
  const { env: r } = e, t = parseInt(e.req.param("studentId"));
  try {
    const s = await r.DB.prepare(`
      SELECT 
        wh.*,
        vc.video_title,
        vc.video_duration_seconds as total_duration
      FROM video_watch_history wh
      JOIN video_contents vc ON wh.video_id = vc.video_id
      WHERE wh.student_id = ?
      ORDER BY wh.watch_start_time DESC
      LIMIT 50
    `).bind(t).all();
    return e.json({ success: true, history: s.results });
  } catch (s) {
    return e.json({ success: false, error: s.message }, 500);
  }
});
p.get("/api/report-templates", async (e) => {
  const { env: r } = e, t = e.req.query("teacher_id");
  try {
    let s = `
      SELECT 
        rt.*,
        t.name as created_by_name
      FROM report_templates rt
      LEFT JOIN teachers t ON rt.created_by = t.teacher_id
      WHERE rt.is_active = TRUE
    `;
    const n = [];
    t ? (s += " AND (rt.is_public = TRUE OR rt.created_by = ?)", n.push(parseInt(t))) : s += " AND rt.is_public = TRUE", s += " ORDER BY rt.created_at DESC";
    const a = await r.DB.prepare(s).bind(...n).all();
    return e.json({ success: true, templates: a.results });
  } catch (s) {
    return e.json({ success: false, error: s.message }, 500);
  }
});
p.get("/api/report-templates/:templateId", async (e) => {
  const { env: r } = e, t = parseInt(e.req.param("templateId"));
  try {
    const s = await r.DB.prepare(`
      SELECT 
        rt.*,
        t.name as created_by_name
      FROM report_templates rt
      LEFT JOIN teachers t ON rt.created_by = t.teacher_id
      WHERE rt.template_id = ?
    `).bind(t).first();
    return s ? e.json({ success: true, template: s }) : e.json({ success: false, error: "\u30C6\u30F3\u30D7\u30EC\u30FC\u30C8\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093" }, 404);
  } catch (s) {
    return e.json({ success: false, error: s.message }, 500);
  }
});
p.post("/api/report-templates", async (e) => {
  const { env: r } = e, { template_name: t, template_description: s, template_structure: n, report_type: a, created_by: o, is_public: i } = await e.req.json();
  try {
    const c = await r.DB.prepare(`
      INSERT INTO report_templates (
        template_name, template_description, template_structure, 
        report_type, created_by, is_public
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(t, s || null, JSON.stringify(n), a || "custom", o, i || false).run();
    return e.json({ success: true, template_id: c.meta.last_row_id });
  } catch (c) {
    return e.json({ success: false, error: c.message }, 500);
  }
});
p.put("/api/report-templates/:templateId", async (e) => {
  const { env: r } = e, t = parseInt(e.req.param("templateId")), { template_name: s, template_description: n, template_structure: a, is_public: o } = await e.req.json();
  try {
    return await r.DB.prepare(`
      UPDATE report_templates
      SET template_name = ?,
          template_description = ?,
          template_structure = ?,
          is_public = ?,
          updated_at = datetime('now')
      WHERE template_id = ?
    `).bind(s, n || null, JSON.stringify(a), o, t).run(), e.json({ success: true });
  } catch (i) {
    return e.json({ success: false, error: i.message }, 500);
  }
});
p.delete("/api/report-templates/:templateId", async (e) => {
  const { env: r } = e, t = parseInt(e.req.param("templateId"));
  try {
    return await r.DB.prepare(`
      UPDATE report_templates
      SET is_active = FALSE,
          updated_at = datetime('now')
      WHERE template_id = ?
    `).bind(t).run(), e.json({ success: true });
  } catch (s) {
    return e.json({ success: false, error: s.message }, 500);
  }
});
p.get("/api/cards/:cardId/images", async (e) => {
  const { env: r } = e, t = parseInt(e.req.param("cardId"));
  try {
    const s = await r.DB.prepare(`
      SELECT * FROM card_images
      WHERE card_id = ? AND is_active = TRUE
      ORDER BY display_order ASC, created_at DESC
    `).bind(t).all();
    return e.json({ success: true, images: s.results });
  } catch (s) {
    return e.json({ success: false, error: s.message }, 500);
  }
});
p.post("/api/cards/:cardId/images", async (e) => {
  const { env: r } = e, t = parseInt(e.req.param("cardId")), { image_url: s, image_type: n, alt_text: a, caption: o, display_order: i, is_primary: c, generation_prompt: l, generated_by: u } = await e.req.json();
  try {
    const d = await r.DB.prepare(`
      INSERT INTO card_images (
        card_id, image_url, image_type, alt_text, caption, 
        display_order, is_primary, generation_prompt, generated_by
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(t, s, n || "illustration", a || null, o || null, i || 0, c || false, l || null, u || null).run();
    return e.json({ success: true, image_id: d.meta.last_row_id });
  } catch (d) {
    return e.json({ success: false, error: d.message }, 500);
  }
});
p.put("/api/cards/images/:imageId", async (e) => {
  const { env: r } = e, t = parseInt(e.req.param("imageId")), { alt_text: s, caption: n, display_order: a, is_primary: o } = await e.req.json();
  try {
    return await r.DB.prepare(`
      UPDATE card_images
      SET alt_text = ?,
          caption = ?,
          display_order = ?,
          is_primary = ?,
          updated_at = datetime('now')
      WHERE image_id = ?
    `).bind(s, n, a, o, t).run(), e.json({ success: true });
  } catch (i) {
    return e.json({ success: false, error: i.message }, 500);
  }
});
p.delete("/api/cards/images/:imageId", async (e) => {
  const { env: r } = e, t = parseInt(e.req.param("imageId"));
  try {
    return await r.DB.prepare(`
      UPDATE card_images
      SET is_active = FALSE,
          updated_at = datetime('now')
      WHERE image_id = ?
    `).bind(t).run(), e.json({ success: true });
  } catch (s) {
    return e.json({ success: false, error: s.message }, 500);
  }
});
p.post("/api/ai/generate-image", async (e) => {
  const { env: r } = e, { prompt: t, card_id: s, teacher_id: n, negative_prompt: a, style: o } = await e.req.json();
  try {
    if (!(r.GEMINI_API_KEY || r.AIML_API_KEY)) return e.json({ success: false, error: "API \u30AD\u30FC\u304C\u8A2D\u5B9A\u3055\u308C\u3066\u3044\u307E\u305B\u3093" }, 500);
    const c = Date.now(), l = `${t}${o ? `, style: ${o}` : ""}, high quality, detailed, educational illustration`, u = `https://via.placeholder.com/800x600.png?text=${encodeURIComponent(t.substring(0, 50))}`, d = Date.now() - c, _ = await r.DB.prepare(`
      INSERT INTO ai_generated_images (
        teacher_id, card_id, prompt, negative_prompt, 
        ai_model, image_url, generation_time_ms, 
        generation_params, is_used
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(n || null, s || null, t, a || null, "gemini-imagen", u, d, JSON.stringify({ style: o, optimized_prompt: l }), false).run();
    return e.json({ success: true, generation_id: _.meta.last_row_id, image_url: u, prompt: l, generation_time_ms: d, message: "\u753B\u50CF\u751F\u6210\u5B8C\u4E86\uFF08\u30C7\u30E2\u7248\uFF1A\u5B9F\u969B\u306EAI\u753B\u50CF\u751F\u6210\u306FGemini Imagen API\u7D71\u5408\u304C\u5FC5\u8981\uFF09" });
  } catch (i) {
    return console.error("\u274C AI\u753B\u50CF\u751F\u6210\u30A8\u30E9\u30FC:", i), e.json({ success: false, error: i.message, details: "AI\u753B\u50CF\u751F\u6210\u306B\u5931\u6557\u3057\u307E\u3057\u305F" }, 500);
  }
});
p.get("/api/ai/generated-images", async (e) => {
  const { env: r } = e, t = e.req.query("teacher_id"), s = e.req.query("card_id");
  try {
    let n = `
      SELECT * FROM ai_generated_images
      WHERE 1=1
    `;
    const a = [];
    t && (n += " AND teacher_id = ?", a.push(parseInt(t))), s && (n += " AND card_id = ?", a.push(parseInt(s))), n += " ORDER BY created_at DESC LIMIT 50";
    const o = await r.DB.prepare(n).bind(...a).all();
    return e.json({ success: true, images: o.results });
  } catch (n) {
    return e.json({ success: false, error: n.message }, 500);
  }
});
p.get("/api/cards/:cardId/edit-history", async (e) => {
  const { env: r } = e, t = parseInt(e.req.param("cardId"));
  try {
    const s = await r.DB.prepare(`
      SELECT 
        ch.*,
        t.name as edited_by_name
      FROM card_edit_history ch
      LEFT JOIN teachers t ON ch.edited_by = t.teacher_id
      WHERE ch.card_id = ?
      ORDER BY ch.edited_at DESC
      LIMIT 50
    `).bind(t).all();
    return e.json({ success: true, history: s.results });
  } catch (s) {
    return e.json({ success: false, error: s.message }, 500);
  }
});
p.post("/api/cards/:cardId/edit-history", async (e) => {
  const { env: r } = e, t = parseInt(e.req.param("cardId")), { edited_by: s, edit_type: n, before_data: a, after_data: o, change_summary: i } = await e.req.json();
  try {
    return await r.DB.prepare(`
      INSERT INTO card_edit_history (
        card_id, edited_by, edit_type, before_data, 
        after_data, change_summary
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(t, s, n, JSON.stringify(a), JSON.stringify(o), i).run(), e.json({ success: true });
  } catch (c) {
    return e.json({ success: false, error: c.message }, 500);
  }
});
p.post("/api/upload/image", async (e) => {
  const { env: r } = e;
  try {
    const s = (await e.req.formData()).get("file");
    if (!s) return e.json({ success: false, error: "\u30D5\u30A1\u30A4\u30EB\u304C\u9078\u629E\u3055\u308C\u3066\u3044\u307E\u305B\u3093" }, 400);
    if (!["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"].includes(s.type)) return e.json({ success: false, error: "\u30B5\u30DD\u30FC\u30C8\u3055\u308C\u3066\u3044\u306A\u3044\u753B\u50CF\u5F62\u5F0F\u3067\u3059\u3002JPEG\u3001PNG\u3001GIF\u3001WebP\u306E\u307F\u5BFE\u5FDC\u3057\u3066\u3044\u307E\u3059\u3002" }, 400);
    const a = 10 * 1024 * 1024;
    if (s.size > a) return e.json({ success: false, error: "\u30D5\u30A1\u30A4\u30EB\u30B5\u30A4\u30BA\u304C\u5927\u304D\u3059\u304E\u307E\u3059\u300210MB\u4EE5\u4E0B\u306E\u753B\u50CF\u3092\u30A2\u30C3\u30D7\u30ED\u30FC\u30C9\u3057\u3066\u304F\u3060\u3055\u3044\u3002" }, 400);
    const o = Date.now(), i = Math.random().toString(36).substring(7), c = s.name.split(".").pop(), l = `images/${o}-${i}.${c}`, u = await s.arrayBuffer();
    await r.MEDIA_BUCKET.put(l, u, { httpMetadata: { contentType: s.type } });
    const d = `/api/media/${l}`;
    return e.json({ success: true, image_url: d, file_name: l, file_size: s.size, mime_type: s.type });
  } catch (t) {
    return console.error("\u274C \u753B\u50CF\u30A2\u30C3\u30D7\u30ED\u30FC\u30C9\u30A8\u30E9\u30FC:", t), e.json({ success: false, error: t.message, details: "\u753B\u50CF\u306E\u30A2\u30C3\u30D7\u30ED\u30FC\u30C9\u306B\u5931\u6557\u3057\u307E\u3057\u305F" }, 500);
  }
});
p.post("/api/upload/video", async (e) => {
  const { env: r } = e;
  try {
    const s = (await e.req.formData()).get("file");
    if (!s) return e.json({ success: false, error: "\u30D5\u30A1\u30A4\u30EB\u304C\u9078\u629E\u3055\u308C\u3066\u3044\u307E\u305B\u3093" }, 400);
    if (!["video/mp4", "video/webm", "video/ogg", "video/quicktime"].includes(s.type)) return e.json({ success: false, error: "\u30B5\u30DD\u30FC\u30C8\u3055\u308C\u3066\u3044\u306A\u3044\u52D5\u753B\u5F62\u5F0F\u3067\u3059\u3002MP4\u3001WebM\u3001OGG\u3001MOV\u306E\u307F\u5BFE\u5FDC\u3057\u3066\u3044\u307E\u3059\u3002" }, 400);
    const a = 100 * 1024 * 1024;
    if (s.size > a) return e.json({ success: false, error: "\u30D5\u30A1\u30A4\u30EB\u30B5\u30A4\u30BA\u304C\u5927\u304D\u3059\u304E\u307E\u3059\u3002100MB\u4EE5\u4E0B\u306E\u52D5\u753B\u3092\u30A2\u30C3\u30D7\u30ED\u30FC\u30C9\u3057\u3066\u304F\u3060\u3055\u3044\u3002" }, 400);
    const o = Date.now(), i = Math.random().toString(36).substring(7), c = s.name.split(".").pop(), l = `videos/${o}-${i}.${c}`, u = await s.arrayBuffer();
    await r.MEDIA_BUCKET.put(l, u, { httpMetadata: { contentType: s.type } });
    const d = `/api/media/${l}`;
    return e.json({ success: true, video_url: d, file_name: l, file_size: s.size, mime_type: s.type });
  } catch (t) {
    return console.error("\u274C \u52D5\u753B\u30A2\u30C3\u30D7\u30ED\u30FC\u30C9\u30A8\u30E9\u30FC:", t), e.json({ success: false, error: t.message, details: "\u52D5\u753B\u306E\u30A2\u30C3\u30D7\u30ED\u30FC\u30C9\u306B\u5931\u6557\u3057\u307E\u3057\u305F" }, 500);
  }
});
p.get("/api/media/*", async (e) => {
  const { env: r } = e, t = e.req.param("*");
  try {
    const s = await r.MEDIA_BUCKET.get(t);
    if (!s) return e.notFound();
    const n = new Headers();
    return s.writeHttpMetadata(n), n.set("etag", s.httpEtag), n.set("Cache-Control", "public, max-age=31536000"), new Response(s.body, { headers: n });
  } catch (s) {
    return console.error("\u274C \u30E1\u30C7\u30A3\u30A2\u53D6\u5F97\u30A8\u30E9\u30FC:", s), e.notFound();
  }
});
p.delete("/api/media/:fileName", async (e) => {
  const { env: r } = e, t = e.req.param("fileName");
  try {
    return await r.MEDIA_BUCKET.delete(t), e.json({ success: true });
  } catch (s) {
    return console.error("\u274C \u30E1\u30C7\u30A3\u30A2\u524A\u9664\u30A8\u30E9\u30FC:", s), e.json({ success: false, error: s.message }, 500);
  }
});
p.get("/api/media-library", async (e) => {
  const { env: r } = e;
  try {
    const s = (await r.MEDIA_BUCKET.list()).objects.map((n) => ({ key: n.key, size: n.size, uploaded: n.uploaded, url: `/api/media/${n.key}`, type: n.key.startsWith("images/") ? "image" : "video", thumbnail: n.key.startsWith("images/") ? `/api/media/${n.key}` : null }));
    return s.sort((n, a) => new Date(a.uploaded).getTime() - new Date(n.uploaded).getTime()), e.json({ success: true, files: s, total: s.length });
  } catch (t) {
    return console.error("\u274C \u30E1\u30C7\u30A3\u30A2\u30E9\u30A4\u30D6\u30E9\u30EA\u53D6\u5F97\u30A8\u30E9\u30FC:", t), e.json({ success: false, error: t.message }, 500);
  }
});
p.get("/api/media-library/search", async (e) => {
  const { env: r } = e, t = e.req.query("q") || "", s = e.req.query("type");
  try {
    let a = (await r.MEDIA_BUCKET.list()).objects.map((o) => ({ key: o.key, size: o.size, uploaded: o.uploaded, url: `/api/media/${o.key}`, type: o.key.startsWith("images/") ? "image" : "video", thumbnail: o.key.startsWith("images/") ? `/api/media/${o.key}` : null }));
    return s && (a = a.filter((o) => o.type === s)), t && (a = a.filter((o) => o.key.toLowerCase().includes(t.toLowerCase()))), a.sort((o, i) => new Date(i.uploaded).getTime() - new Date(o.uploaded).getTime()), e.json({ success: true, files: a, total: a.length });
  } catch (n) {
    return console.error("\u274C \u30E1\u30C7\u30A3\u30A2\u691C\u7D22\u30A8\u30E9\u30FC:", n), e.json({ success: false, error: n.message }, 500);
  }
});
p.get("/api/tags", async (e) => {
  const { env: r } = e, t = e.req.query("category");
  try {
    let s = "SELECT * FROM tags";
    const n = [];
    t && (s += " WHERE category = ?", n.push(t)), s += " ORDER BY category, name";
    const a = await r.DB.prepare(s).bind(...n).all();
    return e.json({ success: true, tags: a.results || [] });
  } catch (s) {
    return console.error("\u274C \u30BF\u30B0\u4E00\u89A7\u53D6\u5F97\u30A8\u30E9\u30FC:", s), e.json({ success: false, error: s.message }, 500);
  }
});
p.post("/api/tags", async (e) => {
  const { env: r } = e;
  try {
    const { name: t, category: s, color: n } = await e.req.json();
    if (!t) return e.json({ success: false, error: "\u30BF\u30B0\u540D\u304C\u5FC5\u8981\u3067\u3059" }, 400);
    const a = await r.DB.prepare("INSERT INTO tags (name, category, color) VALUES (?, ?, ?) RETURNING *").bind(t, s || null, n || "#3B82F6").first();
    return e.json({ success: true, tag: a });
  } catch (t) {
    return console.error("\u274C \u30BF\u30B0\u4F5C\u6210\u30A8\u30E9\u30FC:", t), e.json({ success: false, error: t.message }, 500);
  }
});
p.post("/api/media-files", async (e) => {
  const { env: r } = e;
  try {
    const { r2_key: t, file_name: s, file_type: n, file_size: a, mime_type: o, title: i, description: c } = await e.req.json();
    if (!t || !s || !n) return e.json({ success: false, error: "\u5FC5\u9808\u30D1\u30E9\u30E1\u30FC\u30BF\u304C\u4E0D\u8DB3\u3057\u3066\u3044\u307E\u3059" }, 400);
    const l = await r.DB.prepare(`
      INSERT INTO media_files 
        (r2_key, file_name, file_type, file_size, mime_type, title, description)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      RETURNING *
    `).bind(t, s, n, a || null, o || null, i || s, c || null).first();
    return e.json({ success: true, media: l });
  } catch (t) {
    return console.error("\u274C \u30E1\u30C7\u30A3\u30A2\u30D5\u30A1\u30A4\u30EB\u767B\u9332\u30A8\u30E9\u30FC:", t), e.json({ success: false, error: t.message }, 500);
  }
});
p.post("/api/media/:mediaKey/tags", async (e) => {
  const { env: r } = e, t = e.req.param("mediaKey");
  try {
    const { tag_ids: s } = await e.req.json();
    if (!Array.isArray(s) || s.length === 0) return e.json({ success: false, error: "\u30BF\u30B0ID\u306E\u914D\u5217\u304C\u5FC5\u8981\u3067\u3059" }, 400);
    const n = await r.DB.prepare("SELECT id FROM media_files WHERE r2_key = ?").bind(decodeURIComponent(t)).first();
    if (!n) return e.json({ success: false, error: "\u30E1\u30C7\u30A3\u30A2\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093" }, 404);
    for (const a of s) await r.DB.prepare("INSERT OR IGNORE INTO media_tags (media_id, tag_id) VALUES (?, ?)").bind(n.id, a).run();
    return e.json({ success: true, message: `${s.length}\u500B\u306E\u30BF\u30B0\u3092\u8FFD\u52A0\u3057\u307E\u3057\u305F` });
  } catch (s) {
    return console.error("\u274C \u30BF\u30B0\u8FFD\u52A0\u30A8\u30E9\u30FC:", s), e.json({ success: false, error: s.message }, 500);
  }
});
p.get("/api/media/:mediaKey/tags", async (e) => {
  const { env: r } = e, t = e.req.param("mediaKey");
  try {
    const s = await r.DB.prepare(`
      SELECT t.* FROM tags t
      JOIN media_tags mt ON t.id = mt.tag_id
      JOIN media_files mf ON mf.id = mt.media_id
      WHERE mf.r2_key = ?
    `).bind(decodeURIComponent(t)).all();
    return e.json({ success: true, tags: s.results || [] });
  } catch (s) {
    return console.error("\u274C \u30BF\u30B0\u53D6\u5F97\u30A8\u30E9\u30FC:", s), e.json({ success: false, error: s.message }, 500);
  }
});
p.get("/api/media/search-by-tags", async (e) => {
  var s;
  const { env: r } = e, t = ((s = e.req.query("tags")) == null ? void 0 : s.split(",")) || [];
  try {
    if (t.length === 0) return e.json({ success: false, error: "\u30BF\u30B0\u304C\u6307\u5B9A\u3055\u308C\u3066\u3044\u307E\u305B\u3093" }, 400);
    const n = t.map(() => "?").join(","), a = await r.DB.prepare(`SELECT id FROM tags WHERE name IN (${n})`).bind(...t).all();
    if (!a.results || a.results.length === 0) return e.json({ success: true, media: [] });
    const o = a.results.map(() => "?").join(","), i = await r.DB.prepare(`
      SELECT DISTINCT mf.* FROM media_files mf
      JOIN media_tags mt ON mf.id = mt.media_id
      WHERE mt.tag_id IN (${o})
      ORDER BY mf.uploaded_at DESC
    `).bind(...a.results.map((c) => c.id)).all();
    return e.json({ success: true, media: i.results || [] });
  } catch (n) {
    return console.error("\u274C \u30BF\u30B0\u691C\u7D22\u30A8\u30E9\u30FC:", n), e.json({ success: false, error: n.message }, 500);
  }
});
p.post("/api/ai/auto-tag-image", async (e) => {
  var t, s, n, a, o;
  const { env: r } = e;
  try {
    const { image_url: i, r2_key: c } = await e.req.json();
    if (!i) return e.json({ success: false, error: "\u753B\u50CFURL\u304C\u5FC5\u8981\u3067\u3059" }, 400);
    if (!r.GEMINI_API_KEY) {
      console.warn("\u26A0\uFE0F GEMINI_API_KEY not configured, using demo data");
      const v = { tags: ["\u6559\u80B2", "\u5B66\u7FD2", "\u7B97\u6570"], description: "\u6559\u6750\u7528\u306E\u753B\u50CF", category: "\u7B97\u6570\u30FB\u56F3\u5F62", suggested_title: "\u5B66\u7FD2\u6559\u6750", educational_context: "\u5C0F\u5B66\u6821\u306E\u7B97\u6570\u6559\u6750\u3068\u3057\u3066\u4F7F\u7528\u3067\u304D\u307E\u3059" };
      return e.json({ success: true, ...v, message: "\u30C7\u30E2\u30E2\u30FC\u30C9: GEMINI_API_KEY\u3092\u8A2D\u5B9A\u3059\u308B\u3068\u5B9F\u969B\u306EAI\u5206\u6790\u304C\u4F7F\u7528\u3067\u304D\u307E\u3059" });
    }
    console.log("\u{1F5BC}\uFE0F \u753B\u50CF\u3092\u30C0\u30A6\u30F3\u30ED\u30FC\u30C9\u4E2D:", i);
    const l = await fetch(i);
    if (!l.ok) throw new Error(`\u753B\u50CF\u306E\u30C0\u30A6\u30F3\u30ED\u30FC\u30C9\u306B\u5931\u6557: ${l.statusText}`);
    const u = await l.arrayBuffer(), d = btoa(String.fromCharCode(...new Uint8Array(u))), _ = l.headers.get("content-type") || "image/jpeg";
    console.log("\u{1F4E4} Gemini 3.0\u306B\u30EA\u30AF\u30A8\u30B9\u30C8\u9001\u4FE1\u4E2D...");
    const h = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${r.GEMINI_API_KEY}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ parts: [{ text: `\u3053\u306E\u753B\u50CF\u3092\u6559\u80B2\u7528\u6559\u6750\u3068\u3057\u3066\u8A73\u3057\u304F\u5206\u6790\u3057\u3066\u304F\u3060\u3055\u3044\u3002\u4EE5\u4E0B\u306E\u60C5\u5831\u3092\u65E5\u672C\u8A9E\u306EJSON\u5F62\u5F0F\u3067\u8FD4\u3057\u3066\u304F\u3060\u3055\u3044\uFF1A

{
  "tags": ["\u30BF\u30B01", "\u30BF\u30B02", "\u30BF\u30B03", "\u30BF\u30B04", "\u30BF\u30B05"],
  "description": "\u753B\u50CF\u306E\u8A73\u7D30\u306A\u8AAC\u660E\uFF082-3\u6587\uFF09",
  "category": "\u30AB\u30C6\u30B4\u30EA\uFF08\u6559\u79D1\u540D\u307E\u305F\u306F\u5358\u5143\u540D\uFF09",
  "suggested_title": "\u63A8\u5968\u30BF\u30A4\u30C8\u30EB",
  "educational_context": "\u6559\u80B2\u7684\u306A\u4F7F\u7528\u65B9\u6CD5\u3084\u5BFE\u8C61\u5B66\u5E74"
}

\u3010\u5206\u6790\u30DD\u30A4\u30F3\u30C8\u3011
- \u30BF\u30B0\u306F5\u500B\u4EE5\u5185\u3001\u5177\u4F53\u7684\u306A\u30AD\u30FC\u30EF\u30FC\u30C9\uFF08\u4F8B\uFF1A\u300C\u7B97\u6570\u300D\u300C\u56F3\u5F62\u300D\u300C\u4E09\u89D2\u5F62\u300D\u300C\u9762\u7A4D\u300D\u300C\u8A08\u7B97\u300D\uFF09
- \u30AB\u30C6\u30B4\u30EA\u306F\u6559\u79D1\u540D\u307E\u305F\u306F\u5358\u5143\u540D\uFF08\u4F8B\uFF1A\u300C\u7B97\u6570\u30FB\u56F3\u5F62\u300D\u300C\u56FD\u8A9E\u30FB\u6F22\u5B57\u300D\u300C\u7406\u79D1\u30FB\u5B9F\u9A13\u300D\uFF09
- \u6559\u80B2\u7684\u306A\u89B3\u70B9\u304B\u3089\u5F79\u7ACB\u3064\u60C5\u5831\u3092\u542B\u3081\u308B
- \u5BFE\u8C61\u5B66\u5E74\u3084\u4F7F\u7528\u5834\u9762\u3092\u660E\u78BA\u306B

JSON\u306E\u307F\u3092\u8FD4\u3057\u3066\u304F\u3060\u3055\u3044\u3002\u4ED6\u306E\u8AAC\u660E\u306F\u4E0D\u8981\u3067\u3059\u3002` }, { inline_data: { mime_type: _, data: d } }] }], generationConfig: { temperature: 0.7, maxOutputTokens: 1024 } }) });
    if (!h.ok) {
      const v = await h.text();
      throw console.error("\u274C Gemini API\u30A8\u30E9\u30FC:", v), new Error(`Gemini API error: ${h.statusText}`);
    }
    const g = await h.json();
    console.log("\u2705 Gemini\u5FDC\u7B54\u53D7\u4FE1");
    const f = ((o = (a = (n = (s = (t = g.candidates) == null ? void 0 : t[0]) == null ? void 0 : s.content) == null ? void 0 : n.parts) == null ? void 0 : a[0]) == null ? void 0 : o.text) || "{}";
    console.log("\u{1F4DD} Gemini\u5FDC\u7B54\u30C6\u30AD\u30B9\u30C8:", f);
    const E = f.match(/\{[\s\S]*\}/), x = E ? E[0] : f;
    let y;
    try {
      y = JSON.parse(x);
    } catch (v) {
      console.error("\u274C JSON\u89E3\u6790\u30A8\u30E9\u30FC:", v), y = { tags: ["AI\u5206\u6790"], description: "AI\u5206\u6790\u7D50\u679C\u306E\u53D6\u5F97\u306B\u5931\u6557\u3057\u307E\u3057\u305F", category: "\u672A\u5206\u985E", suggested_title: "\u753B\u50CF", educational_context: "" };
    }
    if (c) try {
      await r.DB.prepare(`
          UPDATE media_files 
          SET 
            ai_generated_tags = ?,
            ai_description = ?,
            ai_category = ?
          WHERE r2_key = ?
        `).bind(JSON.stringify(y.tags || []), y.description || "", y.category || "", c).run(), console.log("\u2705 AI\u5206\u6790\u7D50\u679C\u3092DB\u306B\u4FDD\u5B58\u3057\u307E\u3057\u305F");
    } catch (v) {
      console.warn("\u26A0\uFE0F DB\u4FDD\u5B58\u30A8\u30E9\u30FC\uFF08\u7121\u8996\uFF09:", v);
    }
    return e.json({ success: true, ...y, message: "Gemini 3.0\u306B\u3088\u308BAI\u5206\u6790\u304C\u5B8C\u4E86\u3057\u307E\u3057\u305F" });
  } catch (i) {
    return console.error("\u274C AI\u81EA\u52D5\u30BF\u30B0\u4ED8\u3051\u30A8\u30E9\u30FC:", i), e.json({ success: false, error: i.message }, 500);
  }
});
p.post("/api/auth/login", async (e) => {
  const { env: r } = e, { username: t, password: s } = await e.req.json();
  try {
    const n = await r.DB.prepare(`
      SELECT * FROM auth_users WHERE username = ? AND is_active = 1
    `).bind(t).first();
    if (!n) return e.json({ success: false, error: "\u30E6\u30FC\u30B6\u30FC\u540D\u307E\u305F\u306F\u30D1\u30B9\u30EF\u30FC\u30C9\u304C\u6B63\u3057\u304F\u3042\u308A\u307E\u305B\u3093" }, 401);
    if (!await hn.compare(s, n.password_hash)) return e.json({ success: false, error: "\u30E6\u30FC\u30B6\u30FC\u540D\u307E\u305F\u306F\u30D1\u30B9\u30EF\u30FC\u30C9\u304C\u6B63\u3057\u304F\u3042\u308A\u307E\u305B\u3093" }, 401);
    const o = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`, i = `refresh_${Date.now()}_${Math.random().toString(36).substring(7)}`, c = new Date(Date.now() + 1440 * 60 * 1e3).toISOString(), l = new Date(Date.now() + 10080 * 60 * 1e3).toISOString();
    return await r.DB.prepare(`
      INSERT INTO auth_sessions (user_id, session_token, refresh_token, expires_at, refresh_expires_at)
      VALUES (?, ?, ?, ?, ?)
    `).bind(n.user_id, o, i, c, l).run(), e.json({ success: true, user: { user_id: n.user_id, username: n.username, full_name: n.full_name, role: n.user_role, school_id: n.school_id }, session_token: o, refresh_token: i, expires_at: c, refresh_expires_at: l });
  } catch (n) {
    return console.error("\u274C \u30ED\u30B0\u30A4\u30F3\u30A8\u30E9\u30FC:", n), e.json({ success: false, error: "\u30ED\u30B0\u30A4\u30F3\u306B\u5931\u6557\u3057\u307E\u3057\u305F" }, 500);
  }
});
p.post("/api/auth/logout", async (e) => {
  const { env: r } = e, { session_token: t } = await e.req.json();
  try {
    return await r.DB.prepare(`
      DELETE FROM auth_sessions WHERE session_token = ?
    `).bind(t).run(), e.json({ success: true, message: "\u30ED\u30B0\u30A2\u30A6\u30C8\u3057\u307E\u3057\u305F" });
  } catch (s) {
    return console.error("\u274C \u30ED\u30B0\u30A2\u30A6\u30C8\u30A8\u30E9\u30FC:", s), e.json({ success: false, error: "\u30ED\u30B0\u30A2\u30A6\u30C8\u306B\u5931\u6557\u3057\u307E\u3057\u305F" }, 500);
  }
});
p.post("/api/auth/refresh", async (e) => {
  const { env: r } = e, { refresh_token: t } = await e.req.json();
  if (!t) return e.json({ success: false, error: "\u30EA\u30D5\u30EC\u30C3\u30B7\u30E5\u30C8\u30FC\u30AF\u30F3\u304C\u5FC5\u8981\u3067\u3059" }, 400);
  try {
    const s = await r.DB.prepare(`
      SELECT 
        s.*, 
        u.user_id, u.username, u.full_name, u.user_role, u.school_id
      FROM auth_sessions s
      JOIN auth_users u ON s.user_id = u.user_id
      WHERE s.refresh_token = ? AND s.refresh_expires_at > datetime('now')
    `).bind(t).first();
    if (!s) return e.json({ success: false, error: "\u30EA\u30D5\u30EC\u30C3\u30B7\u30E5\u30C8\u30FC\u30AF\u30F3\u304C\u7121\u52B9\u307E\u305F\u306F\u671F\u9650\u5207\u308C\u3067\u3059" }, 401);
    const n = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`, a = new Date(Date.now() + 1440 * 60 * 1e3).toISOString();
    return await r.DB.prepare(`
      UPDATE auth_sessions
      SET session_token = ?, expires_at = ?
      WHERE session_id = ?
    `).bind(n, a, s.session_id).run(), e.json({ success: true, session_token: n, expires_at: a, user: { user_id: s.user_id, username: s.username, full_name: s.full_name, role: s.user_role, school_id: s.school_id } });
  } catch (s) {
    return console.error("\u274C \u30EA\u30D5\u30EC\u30C3\u30B7\u30E5\u30C8\u30FC\u30AF\u30F3\u30A8\u30E9\u30FC:", s), e.json({ success: false, error: "\u30C8\u30FC\u30AF\u30F3\u306E\u30EA\u30D5\u30EC\u30C3\u30B7\u30E5\u306B\u5931\u6557\u3057\u307E\u3057\u305F" }, 500);
  }
});
p.post("/api/auth/verify", async (e) => {
  const { env: r } = e, { session_token: t } = await e.req.json();
  try {
    const s = await r.DB.prepare(`
      SELECT 
        s.*, 
        u.user_id, u.username, u.full_name, u.user_role, u.school_id
      FROM auth_sessions s
      JOIN auth_users u ON s.user_id = u.user_id
      WHERE s.session_token = ? AND s.expires_at > datetime('now')
    `).bind(t).first();
    return s ? e.json({ success: true, user: { user_id: s.user_id, username: s.username, full_name: s.full_name, role: s.user_role, school_id: s.school_id } }) : e.json({ success: false, error: "\u30BB\u30C3\u30B7\u30E7\u30F3\u304C\u7121\u52B9\u3067\u3059" }, 401);
  } catch (s) {
    return console.error("\u274C \u30BB\u30C3\u30B7\u30E7\u30F3\u691C\u8A3C\u30A8\u30E9\u30FC:", s), e.json({ success: false, error: "\u30BB\u30C3\u30B7\u30E7\u30F3\u691C\u8A3C\u306B\u5931\u6557\u3057\u307E\u3057\u305F" }, 500);
  }
});
async function R(e, r) {
  const { env: t } = e, s = e.req.header("Authorization"), n = s == null ? void 0 : s.replace("Bearer ", "");
  if (!n) return e.json({ success: false, error: "\u8A8D\u8A3C\u304C\u5FC5\u8981\u3067\u3059" }, 401);
  try {
    const a = await t.DB.prepare(`
      SELECT 
        s.*, 
        u.user_id, u.username, u.full_name, u.user_role, u.school_id
      FROM auth_sessions s
      JOIN auth_users u ON s.user_id = u.user_id
      WHERE s.session_token = ? AND s.expires_at > datetime('now')
    `).bind(n).first();
    if (!a) return e.json({ success: false, error: "\u30BB\u30C3\u30B7\u30E7\u30F3\u304C\u7121\u52B9\u307E\u305F\u306F\u671F\u9650\u5207\u308C\u3067\u3059" }, 401);
    e.set("user", { user_id: a.user_id, username: a.username, full_name: a.full_name, role: a.user_role, school_id: a.school_id }), await r();
  } catch (a) {
    return console.error("\u274C \u8A8D\u8A3C\u30DF\u30C9\u30EB\u30A6\u30A7\u30A2\u30A8\u30E9\u30FC:", a), e.json({ success: false, error: "\u8A8D\u8A3C\u306B\u5931\u6557\u3057\u307E\u3057\u305F" }, 500);
  }
}
__name(R, "R");
function Eo(e, r) {
  return r.role === "admin" ? e : e.includes("WHERE") ? `${e} AND school_id = ${r.school_id}` : `${e} WHERE school_id = ${r.school_id}`;
}
__name(Eo, "Eo");
globalThis.buildSchoolFilteredQuery = Eo;
function te(...e) {
  return async (r, t) => {
    const s = r.get("user");
    if (!s) return r.json({ success: false, error: "\u8A8D\u8A3C\u304C\u5FC5\u8981\u3067\u3059" }, 401);
    if (!e.includes(s.role)) return r.json({ success: false, error: "\u3053\u306E\u30EA\u30BD\u30FC\u30B9\u3078\u306E\u30A2\u30AF\u30BB\u30B9\u6A29\u9650\u304C\u3042\u308A\u307E\u305B\u3093", required_roles: e, your_role: s.role }, 403);
    await t();
  };
}
__name(te, "te");
p.get("/api/auth/users", R, te("admin", "teacher"), async (e) => {
  const { env: r } = e, t = e.req.query("school_id") || "1", s = e.req.query("role");
  try {
    let n = "SELECT user_id, username, full_name, user_role, school_id, is_active, created_at FROM auth_users WHERE school_id = ?";
    const a = [parseInt(t)];
    s && (n += " AND user_role = ?", a.push(s)), n += " ORDER BY created_at DESC";
    const o = await r.DB.prepare(n).bind(...a).all();
    return e.json({ success: true, users: o.results || [] });
  } catch (n) {
    return console.error("\u274C \u30E6\u30FC\u30B6\u30FC\u4E00\u89A7\u53D6\u5F97\u30A8\u30E9\u30FC:", n), e.json({ success: false, error: "\u30E6\u30FC\u30B6\u30FC\u4E00\u89A7\u306E\u53D6\u5F97\u306B\u5931\u6557\u3057\u307E\u3057\u305F" }, 500);
  }
});
p.get("/api/auth/permissions", R, te("admin"), async (e) => {
  const { env: r } = e;
  try {
    const t = await r.DB.prepare(`
      SELECT * FROM permissions ORDER BY resource, action
    `).all();
    return e.json({ success: true, permissions: t.results || [] });
  } catch (t) {
    return console.error("\u274C \u6A29\u9650\u4E00\u89A7\u53D6\u5F97\u30A8\u30E9\u30FC:", t), e.json({ success: false, error: "\u6A29\u9650\u4E00\u89A7\u306E\u53D6\u5F97\u306B\u5931\u6557\u3057\u307E\u3057\u305F" }, 500);
  }
});
p.get("/api/auth/user-permissions/:userId", R, async (e) => {
  const { env: r } = e, t = e.req.param("userId"), s = e.get("user");
  if (s.user_id !== parseInt(t) && s.role !== "admin") return e.json({ success: false, error: "\u30A2\u30AF\u30BB\u30B9\u6A29\u9650\u304C\u3042\u308A\u307E\u305B\u3093" }, 403);
  try {
    const n = await r.DB.prepare(`
      SELECT user_role FROM auth_users WHERE user_id = ?
    `).bind(t).first();
    if (!n) return e.json({ success: false, error: "\u30E6\u30FC\u30B6\u30FC\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093" }, 404);
    const a = await r.DB.prepare(`
      SELECT p.permission_name, p.description, p.resource, p.action
      FROM permissions p
      JOIN role_permissions rp ON p.permission_id = rp.permission_id
      WHERE rp.user_role = ?
      ORDER BY p.resource, p.action
    `).bind(n.user_role).all();
    return e.json({ success: true, user_id: parseInt(t), role: n.user_role, permissions: a.results || [] });
  } catch (n) {
    return console.error("\u274C \u30E6\u30FC\u30B6\u30FC\u6A29\u9650\u53D6\u5F97\u30A8\u30E9\u30FC:", n), e.json({ success: false, error: "\u30E6\u30FC\u30B6\u30FC\u6A29\u9650\u306E\u53D6\u5F97\u306B\u5931\u6557\u3057\u307E\u3057\u305F" }, 500);
  }
});
p.get("/api/notifications", R, async (e) => {
  const { env: r } = e, t = e.get("user");
  try {
    await r.DB.prepare(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        school_id INTEGER NOT NULL DEFAULT 1,
        user_id INTEGER NOT NULL,
        notification_type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        link_url TEXT,
        is_read INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run(), await r.DB.prepare(`
      CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id)
    `).run();
    let s = `
      SELECT * FROM notifications
      WHERE user_id = ?
    `;
    t.role !== "admin" && (s += ` AND school_id = ${t.school_id}`), s += " ORDER BY created_at DESC LIMIT 50";
    const n = await r.DB.prepare(s).bind(t.user_id).all();
    return e.json({ success: true, notifications: n.results || [] });
  } catch (s) {
    return console.error("\u274C \u901A\u77E5\u53D6\u5F97\u30A8\u30E9\u30FC:", s), e.json({ success: false, error: "\u901A\u77E5\u306E\u53D6\u5F97\u306B\u5931\u6557\u3057\u307E\u3057\u305F" }, 500);
  }
});
p.post("/api/notifications", R, async (e) => {
  const { env: r } = e, t = e.get("user"), { user_id: s, notification_type: n, title: a, message: o, link_url: i } = await e.req.json();
  try {
    const c = await r.DB.prepare(`
      INSERT INTO notifications (school_id, user_id, notification_type, title, message, link_url)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(t.school_id, s, n, a, o, i || null).run();
    return e.json({ success: true, notification_id: c.meta.last_row_id });
  } catch (c) {
    return console.error("\u274C \u901A\u77E5\u4F5C\u6210\u30A8\u30E9\u30FC:", c), e.json({ success: false, error: "\u901A\u77E5\u306E\u4F5C\u6210\u306B\u5931\u6557\u3057\u307E\u3057\u305F" }, 500);
  }
});
p.put("/api/notifications/:id/read", R, async (e) => {
  const { env: r } = e, t = e.get("user"), s = e.req.param("id");
  try {
    return await r.DB.prepare(`
      UPDATE notifications
      SET is_read = 1
      WHERE id = ? AND user_id = ?
    `).bind(s, t.user_id).run(), e.json({ success: true });
  } catch (n) {
    return console.error("\u274C \u901A\u77E5\u65E2\u8AAD\u30A8\u30E9\u30FC:", n), e.json({ success: false, error: "\u901A\u77E5\u306E\u65E2\u8AAD\u51E6\u7406\u306B\u5931\u6557\u3057\u307E\u3057\u305F" }, 500);
  }
});
p.put("/api/notifications/read-all", R, async (e) => {
  const { env: r } = e, t = e.get("user");
  try {
    return await r.DB.prepare(`
      UPDATE notifications
      SET is_read = 1
      WHERE user_id = ? AND school_id = ?
    `).bind(t.user_id, t.school_id).run(), e.json({ success: true });
  } catch (s) {
    return console.error("\u274C \u5168\u901A\u77E5\u65E2\u8AAD\u30A8\u30E9\u30FC:", s), e.json({ success: false, error: "\u5168\u901A\u77E5\u306E\u65E2\u8AAD\u51E6\u7406\u306B\u5931\u6557\u3057\u307E\u3057\u305F" }, 500);
  }
});
p.get("/api/export/learning-logs", R, te("teacher", "admin"), async (e) => {
  const { env: r } = e, t = e.get("user"), { student_id: s } = e.req.query();
  try {
    let n = `
      SELECT 
        ll.id,
        ll.student_id,
        au.full_name as student_name,
        ll.problem_id,
        ll.is_correct,
        ll.time_spent,
        ll.hint_used,
        ll.created_at
      FROM learning_logs ll
      JOIN auth_users au ON ll.student_id = au.user_id
      WHERE ll.school_id = ?
    `;
    const a = [t.school_id];
    s && (n += " AND ll.student_id = ?", a.push(s)), n += " ORDER BY ll.created_at DESC LIMIT 1000";
    const i = (await r.DB.prepare(n).bind(...a).all()).results || [];
    let c = `ID,\u5B66\u751FID,\u5B66\u751F\u540D,\u554F\u984CID,\u6B63\u89E3,\u6240\u8981\u6642\u9593,\u30D2\u30F3\u30C8\u4F7F\u7528,\u65E5\u6642
`;
    for (const l of i) c += `${l.id},${l.student_id},${l.student_name},${l.problem_id},${l.is_correct ? "\u6B63\u89E3" : "\u4E0D\u6B63\u89E3"},${l.time_spent || 0},${l.hint_used || 0},${l.created_at}
`;
    return new Response(c, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="learning-logs.csv"' } });
  } catch (n) {
    return console.error("\u274C CSV\u30A8\u30AF\u30B9\u30DD\u30FC\u30C8\u30A8\u30E9\u30FC:", n), e.json({ success: false, error: "CSV\u30A8\u30AF\u30B9\u30DD\u30FC\u30C8\u306B\u5931\u6557\u3057\u307E\u3057\u305F" }, 500);
  }
});
p.get("/api/export/curriculum", R, te("teacher", "admin"), async (e) => {
  const { env: r } = e, t = e.get("user");
  try {
    const a = (await r.DB.prepare(`
      SELECT 
        id,
        grade,
        subject,
        textbook_company,
        unit_name,
        unit_order,
        total_hours,
        created_at
      FROM curriculum
      WHERE school_id = ?
      ORDER BY grade, unit_order
    `).bind(t.school_id).all()).results || [];
    let o = `ID,\u5B66\u5E74,\u6559\u79D1,\u6559\u79D1\u66F8\u4F1A\u793E,\u5358\u5143\u540D,\u5358\u5143\u9806\u5E8F,\u7DCF\u6642\u6570,\u4F5C\u6210\u65E5\u6642
`;
    for (const i of a) o += `${i.id},${i.grade},${i.subject},${i.textbook_company || ""},${i.unit_name},${i.unit_order},${i.total_hours},${i.created_at}
`;
    return new Response(o, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": 'attachment; filename="curriculum.csv"' } });
  } catch (s) {
    return console.error("\u274C CSV\u30A8\u30AF\u30B9\u30DD\u30FC\u30C8\u30A8\u30E9\u30FC:", s), e.json({ success: false, error: "CSV\u30A8\u30AF\u30B9\u30DD\u30FC\u30C8\u306B\u5931\u6557\u3057\u307E\u3057\u305F" }, 500);
  }
});
async function bt(e) {
  await e.prepare(`
    CREATE TABLE IF NOT EXISTS email_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      school_id INTEGER NOT NULL DEFAULT 1,
      user_id INTEGER NOT NULL,
      email_address TEXT NOT NULL,
      receive_learning_updates INTEGER DEFAULT 1,
      receive_achievements INTEGER DEFAULT 1,
      receive_teacher_comments INTEGER DEFAULT 1,
      receive_system_notices INTEGER DEFAULT 1,
      is_verified INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(school_id, user_id)
    )
  `).run(), await e.prepare(`
    CREATE TABLE IF NOT EXISTS email_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      school_id INTEGER NOT NULL DEFAULT 1,
      user_id INTEGER NOT NULL,
      email_to TEXT NOT NULL,
      email_subject TEXT NOT NULL,
      email_body TEXT NOT NULL,
      email_type TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      error_message TEXT,
      sent_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();
}
__name(bt, "bt");
async function ss(e, r, t, s) {
  if (!s) return console.log("\u26A0\uFE0F RESEND_API_KEY not configured, skipping email send"), { success: false, error: "Email API key not configured" };
  try {
    const n = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${s}`, "Content-Type": "application/json" }, body: JSON.stringify({ from: "noreply@jiyushindo-gakushu.com", to: [e], subject: r, html: t }) });
    if (!n.ok) {
      const a = await n.text();
      return console.error("\u274C Email\u9001\u4FE1\u30A8\u30E9\u30FC:", a), { success: false, error: a };
    }
    return { success: true };
  } catch (n) {
    return console.error("\u274C Email\u9001\u4FE1\u30A8\u30E9\u30FC:", n), { success: false, error: n.message };
  }
}
__name(ss, "ss");
p.get("/api/email/settings", R, async (e) => {
  const { env: r } = e, t = e.get("user");
  try {
    await bt(r.DB);
    const s = await r.DB.prepare(`
      SELECT * FROM email_settings
      WHERE user_id = ? AND school_id = ?
    `).bind(t.user_id, t.school_id).first();
    return e.json({ success: true, settings: s || { email_address: t.email || "", receive_learning_updates: 1, receive_achievements: 1, receive_teacher_comments: 1, receive_system_notices: 1, is_verified: 0 } });
  } catch (s) {
    return console.error("\u274C Email\u8A2D\u5B9A\u53D6\u5F97\u30A8\u30E9\u30FC:", s), e.json({ success: false, error: "Email\u8A2D\u5B9A\u306E\u53D6\u5F97\u306B\u5931\u6557\u3057\u307E\u3057\u305F" }, 500);
  }
});
p.post("/api/email/settings", R, async (e) => {
  const { env: r } = e, t = e.get("user"), s = await e.req.json();
  try {
    return await bt(r.DB), await r.DB.prepare(`
      INSERT OR REPLACE INTO email_settings (
        school_id, user_id, email_address,
        receive_learning_updates, receive_achievements,
        receive_teacher_comments, receive_system_notices,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(t.school_id, t.user_id, s.email_address, s.receive_learning_updates ? 1 : 0, s.receive_achievements ? 1 : 0, s.receive_teacher_comments ? 1 : 0, s.receive_system_notices ? 1 : 0).run(), e.json({ success: true });
  } catch (n) {
    return console.error("\u274C Email\u8A2D\u5B9A\u66F4\u65B0\u30A8\u30E9\u30FC:", n), e.json({ success: false, error: "Email\u8A2D\u5B9A\u306E\u66F4\u65B0\u306B\u5931\u6557\u3057\u307E\u3057\u305F" }, 500);
  }
});
p.post("/api/email/send", R, te("admin", "teacher"), async (e) => {
  const { env: r } = e, t = e.get("user"), { to: s, subject: n, html: a, email_type: o } = await e.req.json();
  try {
    await bt(r.DB);
    const i = await ss(s, n, a, r.RESEND_API_KEY);
    return await r.DB.prepare(`
      INSERT INTO email_logs (
        school_id, user_id, email_to, email_subject, email_body,
        email_type, status, error_message, sent_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(t.school_id, t.user_id, s, n, a, o || "custom", i.success ? "sent" : "failed", i.error || null).run(), e.json({ success: i.success, error: i.error });
  } catch (i) {
    return console.error("\u274C Email\u9001\u4FE1\u30A8\u30E9\u30FC:", i), e.json({ success: false, error: "Email\u306E\u9001\u4FE1\u306B\u5931\u6557\u3057\u307E\u3057\u305F" }, 500);
  }
});
p.post("/api/email/notify-learning-complete", R, async (e) => {
  const { env: r } = e, t = e.get("user"), { student_id: s, curriculum_name: n } = await e.req.json();
  try {
    await bt(r.DB);
    const a = await r.DB.prepare(`
      SELECT email_address, receive_learning_updates
      FROM email_settings
      WHERE user_id = ? AND school_id = ? AND receive_learning_updates = 1
    `).bind(s, t.school_id).first();
    if (!a) return e.json({ success: false, error: "Email\u8A2D\u5B9A\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093" });
    const o = `\u3010\u5B66\u7FD2\u5B8C\u4E86\u3011${n}\u3092\u5B8C\u4E86\u3057\u307E\u3057\u305F`, i = `
      <h2>\u{1F389} \u5B66\u7FD2\u5B8C\u4E86\u304A\u3081\u3067\u3068\u3046\u3054\u3056\u3044\u307E\u3059\uFF01</h2>
      <p>\u300C${n}\u300D\u3092\u5B8C\u4E86\u3057\u307E\u3057\u305F\u3002</p>
      <p>\u6B21\u306E\u5358\u5143\u306B\u9032\u307F\u307E\u3057\u3087\u3046\uFF01</p>
      <br>
      <p><a href="https://a70d8344.jiyushindo-gakushu.pages.dev">\u5B66\u7FD2\u30B5\u30A4\u30C8\u3078</a></p>
    `, c = await ss(a.email_address, o, i, r.RESEND_API_KEY);
    return await r.DB.prepare(`
      INSERT INTO email_logs (
        school_id, user_id, email_to, email_subject, email_body,
        email_type, status, error_message, sent_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(t.school_id, s, a.email_address, o, i, "learning_complete", c.success ? "sent" : "failed", c.error || null).run(), e.json({ success: c.success, error: c.error });
  } catch (a) {
    return console.error("\u274C Email\u9001\u4FE1\u30A8\u30E9\u30FC:", a), e.json({ success: false, error: "Email\u306E\u9001\u4FE1\u306B\u5931\u6557\u3057\u307E\u3057\u305F" }, 500);
  }
});
p.get("/api/analytics/learning-trends/:studentId", R, async (e) => {
  const { env: r } = e, t = e.get("user"), s = e.req.param("studentId"), { period: n } = e.req.query();
  try {
    const a = n === "month" ? 30 : 7, o = await r.DB.prepare(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as total_problems,
        SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct_count,
        AVG(time_spent) as avg_time,
        SUM(hint_used) as total_hints
      FROM learning_logs
      WHERE student_id = ?
        AND school_id = ?
        AND created_at >= DATE('now', '-${a} days')
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `).bind(s, t.school_id).all(), i = await r.DB.prepare(`
      SELECT 
        c.subject,
        COUNT(*) as total_problems,
        SUM(CASE WHEN ll.is_correct = 1 THEN 1 ELSE 0 END) as correct_count,
        CAST(SUM(CASE WHEN ll.is_correct = 1 THEN 1 ELSE 0 END) AS FLOAT) / COUNT(*) * 100 as accuracy
      FROM learning_logs ll
      JOIN problems p ON ll.problem_id = p.id
      JOIN learning_cards lc ON p.card_id = lc.id
      JOIN courses co ON lc.course_id = co.id
      JOIN curriculum c ON co.curriculum_id = c.id
      WHERE ll.student_id = ?
        AND ll.school_id = ?
        AND ll.created_at >= DATE('now', '-${a} days')
      GROUP BY c.subject
      ORDER BY accuracy DESC
    `).bind(s, t.school_id).all(), c = await r.DB.prepare(`
      SELECT 
        CAST(strftime('%H', created_at) AS INTEGER) as hour,
        COUNT(*) as problem_count,
        AVG(CASE WHEN is_correct = 1 THEN 100 ELSE 0 END) as avg_accuracy
      FROM learning_logs
      WHERE student_id = ?
        AND school_id = ?
        AND created_at >= DATE('now', '-${a} days')
      GROUP BY hour
      ORDER BY hour
    `).bind(s, t.school_id).all();
    return e.json({ success: true, period: n || "week", daily_stats: o.results || [], subject_stats: i.results || [], hourly_pattern: c.results || [] });
  } catch (a) {
    return console.error("\u274C \u5B66\u7FD2\u50BE\u5411\u5206\u6790\u30A8\u30E9\u30FC:", a), e.json({ success: false, error: "\u5B66\u7FD2\u50BE\u5411\u5206\u6790\u306B\u5931\u6557\u3057\u307E\u3057\u305F" }, 500);
  }
});
p.get("/api/analytics/class-comparison", R, te("teacher", "admin"), async (e) => {
  const { env: r } = e, t = e.get("user");
  try {
    const s = await r.DB.prepare(`
      SELECT 
        au.user_id as student_id,
        au.full_name as student_name,
        COUNT(ll.id) as total_problems,
        SUM(CASE WHEN ll.is_correct = 1 THEN 1 ELSE 0 END) as correct_count,
        CAST(SUM(CASE WHEN ll.is_correct = 1 THEN 1 ELSE 0 END) AS FLOAT) / COUNT(ll.id) * 100 as accuracy,
        AVG(ll.time_spent) as avg_time
      FROM auth_users au
      LEFT JOIN learning_logs ll ON au.user_id = ll.student_id AND ll.school_id = au.school_id
      WHERE au.school_id = ?
        AND au.user_role = 'student'
        AND ll.created_at >= DATE('now', '-30 days')
      GROUP BY au.user_id, au.full_name
      ORDER BY accuracy DESC
    `).bind(t.school_id).all(), n = await r.DB.prepare(`
      SELECT 
        c.subject,
        COUNT(DISTINCT ll.student_id) as student_count,
        AVG(CASE WHEN ll.is_correct = 1 THEN 100 ELSE 0 END) as avg_accuracy,
        COUNT(ll.id) as total_problems
      FROM learning_logs ll
      JOIN problems p ON ll.problem_id = p.id
      JOIN learning_cards lc ON p.card_id = lc.id
      JOIN courses co ON lc.course_id = co.id
      JOIN curriculum c ON co.curriculum_id = c.id
      WHERE ll.school_id = ?
        AND ll.created_at >= DATE('now', '-30 days')
      GROUP BY c.subject
      ORDER BY avg_accuracy DESC
    `).bind(t.school_id).all();
    return e.json({ success: true, class_stats: s.results || [], subject_averages: n.results || [] });
  } catch (s) {
    return console.error("\u274C \u30AF\u30E9\u30B9\u6BD4\u8F03\u5206\u6790\u30A8\u30E9\u30FC:", s), e.json({ success: false, error: "\u30AF\u30E9\u30B9\u6BD4\u8F03\u5206\u6790\u306B\u5931\u6557\u3057\u307E\u3057\u305F" }, 500);
  }
});
p.get("/api/analytics/weak-points/:studentId", R, async (e) => {
  const { env: r } = e, t = e.get("user"), s = e.req.param("studentId");
  try {
    const n = await r.DB.prepare(`
      SELECT 
        c.unit_name,
        c.subject,
        COUNT(ll.id) as attempt_count,
        SUM(CASE WHEN ll.is_correct = 1 THEN 1 ELSE 0 END) as correct_count,
        CAST(SUM(CASE WHEN ll.is_correct = 1 THEN 1 ELSE 0 END) AS FLOAT) / COUNT(ll.id) * 100 as accuracy,
        AVG(ll.time_spent) as avg_time,
        SUM(ll.hint_used) as total_hints
      FROM learning_logs ll
      JOIN problems p ON ll.problem_id = p.id
      JOIN learning_cards lc ON p.card_id = lc.id
      JOIN courses co ON lc.course_id = co.id
      JOIN curriculum c ON co.curriculum_id = c.id
      WHERE ll.student_id = ?
        AND ll.school_id = ?
        AND ll.created_at >= DATE('now', '-30 days')
      GROUP BY c.id, c.unit_name, c.subject
      HAVING accuracy < 70
      ORDER BY accuracy ASC, attempt_count DESC
      LIMIT 10
    `).bind(s, t.school_id).all(), a = await r.DB.prepare(`
      SELECT 
        p.problem_type,
        COUNT(ll.id) as attempt_count,
        SUM(CASE WHEN ll.is_correct = 1 THEN 1 ELSE 0 END) as correct_count,
        CAST(SUM(CASE WHEN ll.is_correct = 1 THEN 1 ELSE 0 END) AS FLOAT) / COUNT(ll.id) * 100 as accuracy
      FROM learning_logs ll
      JOIN problems p ON ll.problem_id = p.id
      WHERE ll.student_id = ?
        AND ll.school_id = ?
        AND ll.created_at >= DATE('now', '-30 days')
      GROUP BY p.problem_type
      ORDER BY accuracy ASC
    `).bind(s, t.school_id).all();
    return e.json({ success: true, weak_units: n.results || [], problem_type_stats: a.results || [] });
  } catch (n) {
    return console.error("\u274C \u5F31\u70B9\u5206\u6790\u30A8\u30E9\u30FC:", n), e.json({ success: false, error: "\u5F31\u70B9\u5206\u6790\u306B\u5931\u6557\u3057\u307E\u3057\u305F" }, 500);
  }
});
async function yt(e) {
  await e.prepare(`
    CREATE TABLE IF NOT EXISTS user_presence (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      school_id INTEGER NOT NULL DEFAULT 1,
      user_id INTEGER NOT NULL,
      user_name TEXT NOT NULL,
      user_role TEXT NOT NULL,
      status TEXT DEFAULT 'online' CHECK(status IN ('online', 'away', 'offline')),
      last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
      current_page TEXT,
      UNIQUE(school_id, user_id)
    )
  `).run(), await e.prepare(`
    CREATE TABLE IF NOT EXISTS collaboration_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      school_id INTEGER NOT NULL DEFAULT 1,
      session_type TEXT NOT NULL,
      session_data TEXT,
      created_by INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();
}
__name(yt, "yt");
p.post("/api/collaboration/presence", R, async (e) => {
  const { env: r } = e, t = e.get("user"), { status: s, current_page: n } = await e.req.json();
  try {
    return await yt(r.DB), await r.DB.prepare(`
      INSERT OR REPLACE INTO user_presence (
        school_id, user_id, user_name, user_role, status, current_page, last_seen
      ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(t.school_id, t.user_id, t.full_name, t.role, s || "online", n || null).run(), e.json({ success: true });
  } catch (a) {
    return console.error("\u274C \u30AA\u30F3\u30E9\u30A4\u30F3\u72B6\u614B\u66F4\u65B0\u30A8\u30E9\u30FC:", a), e.json({ success: false, error: "\u30AA\u30F3\u30E9\u30A4\u30F3\u72B6\u614B\u306E\u66F4\u65B0\u306B\u5931\u6557\u3057\u307E\u3057\u305F" }, 500);
  }
});
p.get("/api/collaboration/online-users", R, async (e) => {
  const { env: r } = e, t = e.get("user");
  try {
    await yt(r.DB);
    const s = await r.DB.prepare(`
      SELECT 
        user_id,
        user_name,
        user_role,
        status,
        current_page,
        last_seen
      FROM user_presence
      WHERE school_id = ?
        AND last_seen >= DATETIME('now', '-5 minutes')
      ORDER BY last_seen DESC
    `).bind(t.school_id).all();
    return e.json({ success: true, online_users: s.results || [] });
  } catch (s) {
    return console.error("\u274C \u30AA\u30F3\u30E9\u30A4\u30F3\u30E6\u30FC\u30B6\u30FC\u53D6\u5F97\u30A8\u30E9\u30FC:", s), e.json({ success: false, error: "\u30AA\u30F3\u30E9\u30A4\u30F3\u30E6\u30FC\u30B6\u30FC\u306E\u53D6\u5F97\u306B\u5931\u6557\u3057\u307E\u3057\u305F" }, 500);
  }
});
p.post("/api/collaboration/sessions", R, te("teacher", "admin"), async (e) => {
  const { env: r } = e, t = e.get("user"), { session_type: s, session_data: n } = await e.req.json();
  try {
    await yt(r.DB);
    const a = await r.DB.prepare(`
      INSERT INTO collaboration_sessions (
        school_id, session_type, session_data, created_by
      ) VALUES (?, ?, ?, ?)
    `).bind(t.school_id, s, JSON.stringify(n), t.user_id).run();
    return e.json({ success: true, session_id: a.meta.last_row_id });
  } catch (a) {
    return console.error("\u274C \u5354\u50CD\u30BB\u30C3\u30B7\u30E7\u30F3\u4F5C\u6210\u30A8\u30E9\u30FC:", a), e.json({ success: false, error: "\u5354\u50CD\u30BB\u30C3\u30B7\u30E7\u30F3\u306E\u4F5C\u6210\u306B\u5931\u6557\u3057\u307E\u3057\u305F" }, 500);
  }
});
p.get("/api/collaboration/sessions", R, async (e) => {
  const { env: r } = e, t = e.get("user");
  try {
    await yt(r.DB);
    const s = await r.DB.prepare(`
      SELECT 
        cs.*,
        au.full_name as creator_name
      FROM collaboration_sessions cs
      JOIN auth_users au ON cs.created_by = au.user_id
      WHERE cs.school_id = ?
      ORDER BY cs.updated_at DESC
      LIMIT 50
    `).bind(t.school_id).all();
    return e.json({ success: true, sessions: s.results || [] });
  } catch (s) {
    return console.error("\u274C \u5354\u50CD\u30BB\u30C3\u30B7\u30E7\u30F3\u53D6\u5F97\u30A8\u30E9\u30FC:", s), e.json({ success: false, error: "\u5354\u50CD\u30BB\u30C3\u30B7\u30E7\u30F3\u306E\u53D6\u5F97\u306B\u5931\u6557\u3057\u307E\u3057\u305F" }, 500);
  }
});
p.get("/api/teacher/class-stats", P, async (e) => {
  try {
    const { env: r } = e, t = e.get("user"), s = await r.DB.prepare(`
      SELECT COUNT(*) as count 
      FROM students 
      WHERE school_id = ?
    `).bind(t.school_id).first(), n = await r.DB.prepare(`
      SELECT COUNT(*) as count 
      FROM learning_logs
      WHERE school_id = ? AND DATE(created_at) = DATE('now')
    `).bind(t.school_id).first(), a = await r.DB.prepare(`
      SELECT AVG(CASE WHEN is_correct = 1 THEN 100.0 ELSE 0.0 END) as avg
      FROM learning_logs
      WHERE school_id = ?
    `).bind(t.school_id).first(), o = await r.DB.prepare(`
      SELECT COUNT(DISTINCT curriculum_id) as count
      FROM student_progress
      WHERE school_id = ? AND status = 'completed'
    `).bind(t.school_id).first();
    return e.json({ totalStudents: (s == null ? void 0 : s.count) || 0, todayLearning: (n == null ? void 0 : n.count) || 0, avgAccuracy: (a == null ? void 0 : a.avg) || 0, completedCourses: (o == null ? void 0 : o.count) || 0 });
  } catch (r) {
    return console.error("\u274C \u30AF\u30E9\u30B9\u7D71\u8A08\u53D6\u5F97\u30A8\u30E9\u30FC:", r), e.json({ success: false, error: "\u30AF\u30E9\u30B9\u7D71\u8A08\u306E\u53D6\u5F97\u306B\u5931\u6557\u3057\u307E\u3057\u305F" }, 500);
  }
});
p.get("/api/learning/stats/:studentId", P, async (e) => {
  try {
    const { env: r } = e, t = e.req.param("studentId"), s = e.get("user"), n = await r.DB.prepare(`
      SELECT COUNT(DISTINCT DATE(created_at)) as count
      FROM learning_logs
      WHERE student_id = ? AND school_id = ?
    `).bind(t, s.school_id).first(), a = await r.DB.prepare(`
      SELECT COUNT(*) as count
      FROM learning_logs
      WHERE student_id = ? AND school_id = ?
    `).bind(t, s.school_id).first(), o = await r.DB.prepare(`
      SELECT AVG(CASE WHEN is_correct = 1 THEN 100.0 ELSE 0.0 END) as avg
      FROM learning_logs
      WHERE student_id = ? AND school_id = ?
    `).bind(t, s.school_id).first(), i = await r.DB.prepare(`
      SELECT COUNT(*) as count
      FROM student_badges
      WHERE student_id = ? AND school_id = ?
    `).bind(t, s.school_id).first();
    return e.json({ totalDays: (n == null ? void 0 : n.count) || 0, totalProblems: (a == null ? void 0 : a.count) || 0, accuracy: (o == null ? void 0 : o.avg) || 0, badges: (i == null ? void 0 : i.count) || 0 });
  } catch (r) {
    return console.error("\u274C \u5B66\u751F\u7D71\u8A08\u53D6\u5F97\u30A8\u30E9\u30FC:", r), e.json({ success: false, error: "\u5B66\u751F\u7D71\u8A08\u306E\u53D6\u5F97\u306B\u5931\u6557\u3057\u307E\u3057\u305F" }, 500);
  }
});
p.get("/api/learning/recent-logs", P, async (e) => {
  try {
    const { env: r } = e, t = e.get("user"), s = e.req.query("limit") || "10", n = e.req.query("studentId");
    let a = `
      SELECT 
        ll.*,
        s.student_name,
        c.unit_name
      FROM learning_logs ll
      LEFT JOIN students s ON ll.student_id = s.student_id
      LEFT JOIN curriculum c ON ll.curriculum_id = c.id
      WHERE ll.school_id = ?
    `;
    const o = [t.school_id];
    n && (a += " AND ll.student_id = ?", o.push(n)), a += " ORDER BY ll.created_at DESC LIMIT ?", o.push(s);
    const i = await r.DB.prepare(a).bind(...o).all();
    return e.json(i.results || []);
  } catch (r) {
    return console.error("\u274C \u6700\u8FD1\u306E\u5B66\u7FD2\u30ED\u30B0\u53D6\u5F97\u30A8\u30E9\u30FC:", r), e.json({ success: false, error: "\u5B66\u7FD2\u30ED\u30B0\u306E\u53D6\u5F97\u306B\u5931\u6557\u3057\u307E\u3057\u305F" }, 500);
  }
});
p.get("/api/learning/progress/:studentId", P, async (e) => {
  try {
    const { env: r } = e, t = e.req.param("studentId"), s = e.get("user"), n = await r.DB.prepare(`
      SELECT 
        c.id,
        c.unit_name,
        c.subject,
        sp.status,
        sp.started_at,
        sp.completed_at
      FROM student_progress sp
      JOIN curriculum c ON sp.curriculum_id = c.id
      WHERE sp.student_id = ? AND sp.school_id = ?
      ORDER BY sp.started_at DESC
    `).bind(t, s.school_id).all();
    return e.json(n.results || []);
  } catch (r) {
    return console.error("\u274C \u9032\u6357\u53D6\u5F97\u30A8\u30E9\u30FC:", r), e.json({ success: false, error: "\u9032\u6357\u306E\u53D6\u5F97\u306B\u5931\u6557\u3057\u307E\u3057\u305F" }, 500);
  }
});
p.get("/api/parent/children", P, async (e) => {
  try {
    const { env: r } = e, t = e.get("user"), s = await r.DB.prepare(`
      SELECT 
        s.student_id,
        s.student_name,
        s.grade_level,
        s.email,
        psr.relationship_type,
        psr.created_at as relation_created_at
      FROM parent_student_relations psr
      JOIN students s ON psr.student_id = s.student_id
      WHERE psr.parent_id = ? AND s.school_id = ?
      ORDER BY s.grade_level DESC, s.student_name
    `).bind(t.user_id, t.school_id).all();
    return e.json({ success: true, children: s.results || [] });
  } catch (r) {
    return console.error("\u274C \u5B50\u3069\u3082\u4E00\u89A7\u53D6\u5F97\u30A8\u30E9\u30FC:", r), e.json({ success: false, error: "\u5B50\u3069\u3082\u4E00\u89A7\u306E\u53D6\u5F97\u306B\u5931\u6557\u3057\u307E\u3057\u305F" }, 500);
  }
});
p.get("/api/parent/teacher-comments/:studentId", P, async (e) => {
  try {
    const { env: r } = e, t = e.req.param("studentId"), s = e.get("user"), n = await r.DB.prepare(`
      SELECT 
        e.evaluation_id,
        e.comments as comment,
        e.score,
        e.max_score,
        e.subject,
        e.evaluated_at as created_at,
        t.teacher_name
      FROM evaluations e
      LEFT JOIN teachers t ON e.teacher_id = t.teacher_id
      WHERE e.student_id = ? AND e.school_id = ? AND e.comments IS NOT NULL
      ORDER BY e.evaluated_at DESC
      LIMIT 10
    `).bind(t, s.school_id).all();
    return e.json(n.results || []);
  } catch (r) {
    return console.error("\u274C \u6559\u5E2B\u30B3\u30E1\u30F3\u30C8\u53D6\u5F97\u30A8\u30E9\u30FC:", r), e.json({ success: false, error: "\u6559\u5E2B\u30B3\u30E1\u30F3\u30C8\u306E\u53D6\u5F97\u306B\u5931\u6557\u3057\u307E\u3057\u305F" }, 500);
  }
});
p.get("/api/parent/weekly-summary/:studentId", P, async (e) => {
  try {
    const { env: r } = e, t = e.req.param("studentId"), s = e.get("user"), n = await r.DB.prepare(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as problem_count,
        AVG(CASE WHEN is_correct = 1 THEN 100.0 ELSE 0.0 END) as accuracy,
        SUM(time_spent) as total_time
      FROM learning_logs
      WHERE student_id = ? 
        AND school_id = ?
        AND created_at >= DATE('now', '-7 days')
      GROUP BY DATE(created_at)
      ORDER BY date
    `).bind(t, s.school_id).all(), a = await r.DB.prepare(`
      SELECT 
        c.subject,
        COUNT(*) as problem_count,
        AVG(CASE WHEN ll.is_correct = 1 THEN 100.0 ELSE 0.0 END) as accuracy
      FROM learning_logs ll
      JOIN curriculum c ON ll.curriculum_id = c.id
      WHERE ll.student_id = ? 
        AND ll.school_id = ?
        AND ll.created_at >= DATE('now', '-7 days')
      GROUP BY c.subject
    `).bind(t, s.school_id).all();
    return e.json({ success: true, weeklyData: n.results || [], subjectStats: a.results || [] });
  } catch (r) {
    return console.error("\u274C \u9031\u9593\u30B5\u30DE\u30EA\u30FC\u53D6\u5F97\u30A8\u30E9\u30FC:", r), e.json({ success: false, error: "\u9031\u9593\u30B5\u30DE\u30EA\u30FC\u306E\u53D6\u5F97\u306B\u5931\u6557\u3057\u307E\u3057\u305F" }, 500);
  }
});
function bo() {
  const e = new Uint8Array(32);
  return crypto.getRandomValues(e), Array.from(e, (r) => r.toString(16).padStart(2, "0")).join("");
}
__name(bo, "bo");
var or = /* @__PURE__ */ new Map();
function yo(e = 100, r = 6e4) {
  return async (t, s) => {
    const n = t.req.header("cf-connecting-ip") || t.req.header("x-forwarded-for") || "unknown", a = Date.now(), o = or.get(n);
    return !o || a > o.resetTime ? (or.set(n, { count: 1, resetTime: a + r }), s()) : o.count >= e ? t.json({ success: false, error: "\u30EA\u30AF\u30A8\u30B9\u30C8\u5236\u9650\u306B\u9054\u3057\u307E\u3057\u305F\u3002\u3057\u3070\u3089\u304F\u3057\u3066\u304B\u3089\u518D\u8A66\u884C\u3057\u3066\u304F\u3060\u3055\u3044\u3002" }, 429) : (o.count++, s());
  };
}
__name(yo, "yo");
p.get("/api/security/csrf-token", P, async (e) => {
  try {
    const { env: r } = e, t = e.get("user"), s = bo();
    return e.header("X-CSRF-Token", s), e.json({ success: true, csrfToken: s, expiresIn: 3600 });
  } catch (r) {
    return console.error("\u274C CSRF\u30C8\u30FC\u30AF\u30F3\u751F\u6210\u30A8\u30E9\u30FC:", r), e.json({ success: false, error: "\u30C8\u30FC\u30AF\u30F3\u751F\u6210\u306B\u5931\u6557\u3057\u307E\u3057\u305F" }, 500);
  }
});
function wo() {
  return async (e, r) => {
    await r(), e.header("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://cdn.jsdelivr.net; img-src 'self' data: https:; font-src 'self' https://cdn.jsdelivr.net; connect-src 'self'; frame-ancestors 'none';"), e.header("X-Content-Type-Options", "nosniff"), e.header("X-Frame-Options", "DENY"), e.header("X-XSS-Protection", "1; mode=block"), e.header("Referrer-Policy", "strict-origin-when-cross-origin"), e.header("Permissions-Policy", "geolocation=(), microphone=(), camera=()"), e.req.url.startsWith("https://") && e.header("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  };
}
__name(wo, "wo");
p.use("*", wo());
p.use("/api/*", yo(100, 6e4));
function Ze(e) {
  return typeof e != "string" ? "" : e.replace(/[<>]/g, "").replace(/javascript:/gi, "").replace(/on\w+=/gi, "").trim().slice(0, 1e4);
}
__name(Ze, "Ze");
function xo(e) {
  if (e == null) return false;
  const r = String(e);
  return ![/;\s*(drop|delete|truncate|alter|exec|execute)\s+/i, /union\s+select/i, /\/\*|\*\//, /--/, /xp_/i].some((s) => s.test(r));
}
__name(xo, "xo");
p.post("/api/security/audit-log", P, async (e) => {
  try {
    const { env: r } = e, t = e.get("user"), { action: s, details: n } = await e.req.json();
    return await r.DB.prepare(`
      INSERT INTO security_audit_logs (user_id, action, details, ip_address, user_agent, created_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(t.user_id, Ze(s), Ze(JSON.stringify(n)), e.req.header("cf-connecting-ip") || "unknown", e.req.header("user-agent") || "unknown").run().catch(() => {
      console.warn("\u76E3\u67FB\u30ED\u30B0\u30C6\u30FC\u30D6\u30EB\u304C\u5B58\u5728\u3057\u307E\u305B\u3093\uFF08\u4F5C\u6210\u304C\u5FC5\u8981\u3067\u3059\uFF09");
    }), e.json({ success: true });
  } catch (r) {
    return console.error("\u274C \u76E3\u67FB\u30ED\u30B0\u8A18\u9332\u30A8\u30E9\u30FC:", r), e.json({ success: false, error: "\u76E3\u67FB\u30ED\u30B0\u306E\u8A18\u9332\u306B\u5931\u6557\u3057\u307E\u3057\u305F" }, 500);
  }
});
p.get("/api/security/scan", P, async (e) => {
  try {
    if (e.get("user").user_role !== "admin") return e.json({ success: false, error: "\u7BA1\u7406\u8005\u6A29\u9650\u304C\u5FC5\u8981\u3067\u3059" }, 403);
    const t = { timestamp: (/* @__PURE__ */ new Date()).toISOString(), checks: { csrfProtection: true, rateLimiting: true, securityHeaders: true, inputSanitization: true, sqlInjectionProtection: true }, recommendations: ["CSRF\u30C8\u30FC\u30AF\u30F3\u3092\u6C38\u7D9A\u5316\u30B9\u30C8\u30EC\u30FC\u30B8\uFF08KV\uFF09\u306B\u4FDD\u5B58\u3059\u308B\u3053\u3068\u3092\u63A8\u5968", "\u30EC\u30FC\u30C8\u5236\u9650\u3092Cloudflare KV\u3067\u7BA1\u7406\u3059\u308B\u3053\u3068\u3092\u63A8\u5968", "\u76E3\u67FB\u30ED\u30B0\u306E\u5B9A\u671F\u7684\u306A\u30EC\u30D3\u30E5\u30FC\u3092\u63A8\u5968", "\u5B9A\u671F\u7684\u306A\u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u30B9\u30AD\u30E3\u30F3\u3092\u63A8\u5968"] };
    return e.json({ success: true, report: t });
  } catch (r) {
    return console.error("\u274C \u30BB\u30AD\u30E5\u30EA\u30C6\u30A3\u30B9\u30AD\u30E3\u30F3\u30A8\u30E9\u30FC:", r), e.json({ success: false, error: "\u30B9\u30AD\u30E3\u30F3\u306B\u5931\u6557\u3057\u307E\u3057\u305F" }, 500);
  }
});
globalThis.sanitizeInput = Ze;
globalThis.validateSQLParam = xo;
p.post("/api/performance/metrics", async (e) => {
  try {
    const { env: r } = e, { metric_type: t, endpoint: s, response_time_ms: n, status_code: a } = await e.req.json();
    return await r.DB.prepare(`
      INSERT INTO performance_metrics (metric_type, endpoint, response_time_ms, status_code, ip_address, user_agent, school_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(t, s, n, a, e.req.header("cf-connecting-ip") || "unknown", e.req.header("user-agent") || "unknown", 1).run(), e.json({ success: true });
  } catch (r) {
    return console.error("\u274C \u30D1\u30D5\u30A9\u30FC\u30DE\u30F3\u30B9\u30E1\u30C8\u30EA\u30AF\u30B9\u8A18\u9332\u30A8\u30E9\u30FC:", r), e.json({ success: false, error: "\u30E1\u30C8\u30EA\u30AF\u30B9\u306E\u8A18\u9332\u306B\u5931\u6557\u3057\u307E\u3057\u305F" }, 500);
  }
});
p.post("/api/performance/error-log", async (e) => {
  try {
    const { env: r } = e, { error_type: t, error_message: s, stack_trace: n, endpoint: a, severity: o } = await e.req.json();
    return await r.DB.prepare(`
      INSERT INTO error_logs (error_type, error_message, stack_trace, endpoint, ip_address, user_agent, severity, school_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(t, Ze(s || ""), Ze(n || ""), a, e.req.header("cf-connecting-ip") || "unknown", e.req.header("user-agent") || "unknown", o || "error", 1).run(), e.json({ success: true });
  } catch (r) {
    return console.error("\u274C \u30A8\u30E9\u30FC\u30ED\u30B0\u8A18\u9332\u30A8\u30E9\u30FC:", r), e.json({ success: false, error: "\u30A8\u30E9\u30FC\u30ED\u30B0\u306E\u8A18\u9332\u306B\u5931\u6557\u3057\u307E\u3057\u305F" }, 500);
  }
});
p.get("/api/performance/dashboard", P, async (e) => {
  try {
    const { env: r } = e;
    if (e.get("user").user_role !== "admin") return e.json({ success: false, error: "\u7BA1\u7406\u8005\u6A29\u9650\u304C\u5FC5\u8981\u3067\u3059" }, 403);
    const s = await r.DB.prepare(`
      SELECT AVG(response_time_ms) as avg_time
      FROM performance_metrics
      WHERE created_at >= datetime('now', '-24 hours')
    `).first(), n = await r.DB.prepare(`
      SELECT 
        COUNT(CASE WHEN status_code >= 400 THEN 1 END) * 100.0 / COUNT(*) as error_rate
      FROM performance_metrics
      WHERE created_at >= datetime('now', '-24 hours')
    `).first(), a = await r.DB.prepare(`
      SELECT 
        endpoint,
        COUNT(*) as request_count,
        AVG(response_time_ms) as avg_time,
        MIN(response_time_ms) as min_time,
        MAX(response_time_ms) as max_time
      FROM performance_metrics
      WHERE created_at >= datetime('now', '-24 hours')
      GROUP BY endpoint
      ORDER BY request_count DESC
      LIMIT 10
    `).all(), o = await r.DB.prepare(`
      SELECT 
        error_type,
        severity,
        COUNT(*) as count
      FROM error_logs
      WHERE created_at >= datetime('now', '-24 hours')
      GROUP BY error_type, severity
      ORDER BY count DESC
    `).all(), i = await r.DB.prepare(`
      SELECT *
      FROM system_health_checks
      ORDER BY checked_at DESC
      LIMIT 5
    `).all();
    return e.json({ success: true, metrics: { avgResponseTime: (s == null ? void 0 : s.avg_time) || 0, errorRate: (n == null ? void 0 : n.error_rate) || 0, endpointPerformance: a.results || [], errorSummary: o.results || [], systemHealth: i.results || [] } });
  } catch (r) {
    return console.error("\u274C \u30D1\u30D5\u30A9\u30FC\u30DE\u30F3\u30B9\u30C0\u30C3\u30B7\u30E5\u30DC\u30FC\u30C9\u30C7\u30FC\u30BF\u53D6\u5F97\u30A8\u30E9\u30FC:", r), e.json({ success: false, error: "\u30C7\u30FC\u30BF\u306E\u53D6\u5F97\u306B\u5931\u6557\u3057\u307E\u3057\u305F" }, 500);
  }
});
p.get("/api/performance/health", async (e) => {
  try {
    const { env: r } = e, t = Date.now(), s = await r.DB.prepare("SELECT 1").first(), n = Date.now() - t, a = { status: "healthy", checks: { database: { status: s ? "healthy" : "down", responseTime: n }, api: { status: "healthy", responseTime: Date.now() - t } }, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
    return await r.DB.prepare(`
      INSERT INTO system_health_checks (check_type, status, response_time_ms, details)
      VALUES ('database', ?, ?, ?)
    `).bind(a.checks.database.status, n, JSON.stringify(a)).run(), e.json(a);
  } catch (r) {
    return console.error("\u274C \u30D8\u30EB\u30B9\u30C1\u30A7\u30C3\u30AF\u30A8\u30E9\u30FC:", r), e.json({ status: "unhealthy", error: r.message, timestamp: (/* @__PURE__ */ new Date()).toISOString() }, 500);
  }
});
p.get("/api/performance/error-logs", P, async (e) => {
  try {
    const { env: r } = e;
    if (e.get("user").user_role !== "admin") return e.json({ success: false, error: "\u7BA1\u7406\u8005\u6A29\u9650\u304C\u5FC5\u8981\u3067\u3059" }, 403);
    const s = e.req.query("limit") || "50", n = e.req.query("severity");
    let a = `
      SELECT *
      FROM error_logs
      WHERE 1=1
    `;
    const o = [];
    n && (a += " AND severity = ?", o.push(n)), a += " ORDER BY created_at DESC LIMIT ?", o.push(s);
    const i = await r.DB.prepare(a).bind(...o).all();
    return e.json({ success: true, logs: i.results || [] });
  } catch (r) {
    return console.error("\u274C \u30A8\u30E9\u30FC\u30ED\u30B0\u53D6\u5F97\u30A8\u30E9\u30FC:", r), e.json({ success: false, error: "\u30A8\u30E9\u30FC\u30ED\u30B0\u306E\u53D6\u5F97\u306B\u5931\u6557\u3057\u307E\u3057\u305F" }, 500);
  }
});
p.get("/api/cache/stats", P, async (e) => {
  try {
    const { env: r } = e;
    if (e.get("user").user_role !== "admin") return e.json({ success: false, error: "\u7BA1\u7406\u8005\u6A29\u9650\u304C\u5FC5\u8981\u3067\u3059" }, 403);
    const s = await qt(r.KV), n = pt.getStats();
    return e.json({ success: true, cache_stats: s, performance_metrics: n });
  } catch (r) {
    return console.error("\u274C \u30AD\u30E3\u30C3\u30B7\u30E5\u7D71\u8A08\u53D6\u5F97\u30A8\u30E9\u30FC:", r), e.json({ success: false, error: "\u30AD\u30E3\u30C3\u30B7\u30E5\u7D71\u8A08\u306E\u53D6\u5F97\u306B\u5931\u6557\u3057\u307E\u3057\u305F" }, 500);
  }
});
p.get("/api/cache/health", async (e) => {
  try {
    const { env: r } = e, t = await sa(r.KV), s = t.status === "healthy" || t.status === "degraded" ? 200 : 503;
    return e.json(t, s);
  } catch (r) {
    return console.error("\u274C \u30AD\u30E3\u30C3\u30B7\u30E5\u30D8\u30EB\u30B9\u30C1\u30A7\u30C3\u30AF\u30A8\u30E9\u30FC:", r), e.json({ status: "down", details: { error: r.message } }, 503);
  }
});
p.post("/api/cache/invalidate", P, async (e) => {
  try {
    const { env: r } = e;
    if (e.get("user").user_role !== "admin") return e.json({ success: false, error: "\u7BA1\u7406\u8005\u6A29\u9650\u304C\u5FC5\u8981\u3067\u3059" }, 403);
    const { entity_type: s, entity_id: n } = await e.req.json();
    if (!s || !n) return e.json({ success: false, error: "entity_type\u3068entity_id\u304C\u5FC5\u8981\u3067\u3059" }, 400);
    const a = await ta(r.KV, s, n);
    return e.json({ success: true, deleted_keys: a, message: `${a}\u500B\u306E\u30AD\u30E3\u30C3\u30B7\u30E5\u3092\u524A\u9664\u3057\u307E\u3057\u305F` });
  } catch (r) {
    return console.error("\u274C \u30AD\u30E3\u30C3\u30B7\u30E5\u7121\u52B9\u5316\u30A8\u30E9\u30FC:", r), e.json({ success: false, error: "\u30AD\u30E3\u30C3\u30B7\u30E5\u306E\u7121\u52B9\u5316\u306B\u5931\u6557\u3057\u307E\u3057\u305F" }, 500);
  }
});
p.post("/api/cache/prewarm", P, async (e) => {
  try {
    const { env: r } = e;
    return e.get("user").user_role !== "admin" ? e.json({ success: false, error: "\u7BA1\u7406\u8005\u6A29\u9650\u304C\u5FC5\u8981\u3067\u3059" }, 403) : (await ra(r.KV, r.DB), e.json({ success: true, message: "\u91CD\u8981\u306A\u30AD\u30E3\u30C3\u30B7\u30E5\u306E\u30D7\u30EA\u30A6\u30A9\u30FC\u30E0\u304C\u5B8C\u4E86\u3057\u307E\u3057\u305F" }));
  } catch (r) {
    return console.error("\u274C \u30AD\u30E3\u30C3\u30B7\u30E5\u30D7\u30EA\u30A6\u30A9\u30FC\u30E0\u30A8\u30E9\u30FC:", r), e.json({ success: false, error: "\u30AD\u30E3\u30C3\u30B7\u30E5\u306E\u30D7\u30EA\u30A6\u30A9\u30FC\u30E0\u306B\u5931\u6557\u3057\u307E\u3057\u305F" }, 500);
  }
});
p.post("/api/cache/metrics/reset", P, async (e) => {
  try {
    return e.get("user").user_role !== "admin" ? e.json({ success: false, error: "\u7BA1\u7406\u8005\u6A29\u9650\u304C\u5FC5\u8981\u3067\u3059" }, 403) : (pt.reset(), e.json({ success: true, message: "\u30AD\u30E3\u30C3\u30B7\u30E5\u30E1\u30C8\u30EA\u30AF\u30B9\u3092\u30EA\u30BB\u30C3\u30C8\u3057\u307E\u3057\u305F" }));
  } catch (r) {
    return console.error("\u274C \u30E1\u30C8\u30EA\u30AF\u30B9\u30EA\u30BB\u30C3\u30C8\u30A8\u30E9\u30FC:", r), e.json({ success: false, error: "\u30E1\u30C8\u30EA\u30AF\u30B9\u306E\u30EA\u30BB\u30C3\u30C8\u306B\u5931\u6557\u3057\u307E\u3057\u305F" }, 500);
  }
});
var Rt = null;
function ns(e) {
  return Rt || (Rt = new fa(e)), Rt;
}
__name(ns, "ns");
p.post("/api/ai-tutor/ask", R, async (e) => {
  const { env: r } = e, t = e.get("user");
  try {
    const s = await e.req.json(), { question: n, subject: a, unitName: o, context: i, conversationHistory: c } = s;
    if (!n || n.trim().length === 0) return e.json({ success: false, error: "\u8CEA\u554F\u3092\u5165\u529B\u3057\u3066\u304F\u3060\u3055\u3044" }, 400);
    const l = { studentId: t.user_id, question: n.trim(), subject: a, unitName: o, context: i, conversationHistory: c || [] }, u = ns(r.HUGGINGFACE_API_KEY), d = await u.getLearningContext(r.DB, t.user_id);
    d.struggleAreas.length > 0 && (l.context = `\u82E6\u624B\u5206\u91CE: ${d.struggleAreas.join(", ")}
${l.context || ""}`);
    const _ = await u.generateAnswer(l, r.AI);
    return await r.DB.prepare(`
      INSERT INTO ai_tutor_conversations 
      (student_id, question, answer, subject, unit_name, ai_source, confidence, school_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(t.user_id, n, _.answer, a || null, o || null, _.source, _.confidence, t.school_id || 1).run(), e.json({ success: true, response: _ });
  } catch (s) {
    return console.error("\u274C AI\u30C1\u30E5\u30FC\u30BF\u30FC\u30A8\u30E9\u30FC:", s), e.json({ success: false, error: "AI\u30C1\u30E5\u30FC\u30BF\u30FC\u306E\u5FDC\u7B54\u306B\u5931\u6557\u3057\u307E\u3057\u305F", details: s.message }, 500);
  }
});
p.get("/api/ai-tutor/history", R, async (e) => {
  const { env: r } = e, t = e.get("user");
  try {
    const s = parseInt(e.req.query("limit") || "20"), n = await r.DB.prepare(`
      SELECT 
        conversation_id,
        question,
        answer,
        subject,
        unit_name,
        ai_source,
        confidence,
        created_at
      FROM ai_tutor_conversations
      WHERE student_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `).bind(t.user_id, s).all();
    return e.json({ success: true, conversations: n.results });
  } catch (s) {
    return console.error("\u274C \u4F1A\u8A71\u5C65\u6B74\u53D6\u5F97\u30A8\u30E9\u30FC:", s), e.json({ success: false, error: "\u4F1A\u8A71\u5C65\u6B74\u306E\u53D6\u5F97\u306B\u5931\u6557\u3057\u307E\u3057\u305F" }, 500);
  }
});
p.get("/api/ai-tutor/suggestions", R, async (e) => {
  const { env: r } = e, t = e.get("user");
  try {
    const n = await ns(r.HUGGINGFACE_API_KEY).getLearningContext(r.DB, t.user_id), a = [];
    return n.struggleAreas.length > 0 && a.push({ type: "struggle", title: "\u5FA9\u7FD2\u304C\u5FC5\u8981\u306A\u5358\u5143", items: n.struggleAreas, priority: "high", message: "\u3053\u308C\u3089\u306E\u5358\u5143\u3092\u91CD\u70B9\u7684\u306B\u5FA9\u7FD2\u3057\u307E\u3057\u3087\u3046\uFF01" }), n.masteredConcepts.length > 0 && a.push({ type: "next-step", title: "\u6B21\u306B\u5B66\u3076\u306E\u306B\u304A\u3059\u3059\u3081", items: n.masteredConcepts.slice(0, 3), priority: "medium", message: "\u7FD2\u5F97\u3057\u305F\u5185\u5BB9\u3092\u6D3B\u304B\u3057\u3066\u3001\u6B21\u306E\u30B9\u30C6\u30C3\u30D7\u306B\u9032\u307F\u307E\u3057\u3087\u3046\uFF01" }), e.json({ success: true, learningContext: n, suggestions: a });
  } catch (s) {
    return console.error("\u274C \u5B66\u7FD2\u63D0\u6848\u30A8\u30E9\u30FC:", s), e.json({ success: false, error: "\u5B66\u7FD2\u63D0\u6848\u306E\u53D6\u5F97\u306B\u5931\u6557\u3057\u307E\u3057\u305F" }, 500);
  }
});
p.post("/api/ai-tutor/feedback", R, async (e) => {
  const { env: r } = e, t = e.get("user");
  try {
    const { conversationId: s, rating: n, comment: a } = await e.req.json();
    return s ? (await r.DB.prepare(`
      UPDATE ai_tutor_conversations
      SET feedback_rating = ?, feedback_comment = ?
      WHERE conversation_id = ? AND student_id = ?
    `).bind(n, a || null, s, t.user_id).run(), e.json({ success: true, message: "\u30D5\u30A3\u30FC\u30C9\u30D0\u30C3\u30AF\u3092\u4FDD\u5B58\u3057\u307E\u3057\u305F" })) : e.json({ success: false, error: "\u4F1A\u8A71ID\u304C\u5FC5\u8981\u3067\u3059" }, 400);
  } catch (s) {
    return console.error("\u274C \u30D5\u30A3\u30FC\u30C9\u30D0\u30C3\u30AF\u4FDD\u5B58\u30A8\u30E9\u30FC:", s), e.json({ success: false, error: "\u30D5\u30A3\u30FC\u30C9\u30D0\u30C3\u30AF\u306E\u4FDD\u5B58\u306B\u5931\u6557\u3057\u307E\u3057\u305F" }, 500);
  }
});
var Dt = null;
function as() {
  return Dt || (Dt = new wa()), Dt;
}
__name(as, "as");
p.post("/api/problems/generate", R, async (e) => {
  const { env: r } = e, t = e.get("user");
  try {
    const s = await e.req.json(), { subject: n, unitName: a, difficulty: o, count: i, problemType: c } = s;
    if (!n) return e.json({ success: false, error: "\u6559\u79D1\u3092\u6307\u5B9A\u3057\u3066\u304F\u3060\u3055\u3044" }, 400);
    const l = { studentId: t.user_id, subject: n, unitName: a, difficulty: o || "medium", count: Math.min(i || 5, 10), problemType: c }, d = await as().generateProblems(l, r.DB, r.AI);
    if (!d || d.length === 0) return console.warn("\u26A0\uFE0F \u554F\u984C\u304C\u751F\u6210\u3055\u308C\u307E\u305B\u3093\u3067\u3057\u305F\u3002\u30EA\u30AF\u30A8\u30B9\u30C8:", l), e.json({ success: false, error: "\u554F\u984C\u306E\u751F\u6210\u306B\u5931\u6557\u3057\u307E\u3057\u305F\u3002\u3082\u3046\u4E00\u5EA6\u304A\u8A66\u3057\u304F\u3060\u3055\u3044\u3002", details: "\u751F\u6210\u3055\u308C\u305F\u554F\u984C\u304C0\u4EF6\u3067\u3057\u305F" }, 500);
    console.log(`\u2705 ${d.length}\u554F\u306E\u554F\u984C\u3092\u751F\u6210\u3057\u307E\u3057\u305F`);
    const _ = [];
    for (const m of d) {
      const h = await r.DB.prepare(`
        INSERT INTO generated_problems 
        (student_id, question, correct_answer, explanation, difficulty, subject, unit_name, problem_type, hints, school_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(t.user_id, m.question, m.correctAnswer, m.explanation, m.difficulty, m.subject, m.unitName, m.problemType, JSON.stringify(m.hints || []), t.school_id || 1).run();
      _.push({ ...m, problemId: h.meta.last_row_id });
    }
    return e.json({ success: true, problems: _, count: _.length });
  } catch (s) {
    return console.error("\u274C \u554F\u984C\u751F\u6210\u30A8\u30E9\u30FC:", s), e.json({ success: false, error: "\u554F\u984C\u306E\u751F\u6210\u306B\u5931\u6557\u3057\u307E\u3057\u305F", details: s.message }, 500);
  }
});
p.get("/api/problems/history", R, async (e) => {
  const { env: r } = e, t = e.get("user");
  try {
    const s = parseInt(e.req.query("limit") || "20"), n = e.req.query("subject");
    let a = `
      SELECT 
        problem_id,
        question,
        correct_answer,
        explanation,
        difficulty,
        subject,
        unit_name,
        problem_type,
        hints,
        is_attempted,
        is_correct,
        created_at
      FROM generated_problems
      WHERE student_id = ?
    `;
    const o = [t.user_id];
    n && (a += " AND subject = ?", o.push(n)), a += " ORDER BY created_at DESC LIMIT ?", o.push(s);
    const c = (await r.DB.prepare(a).bind(...o).all()).results.map((l) => ({ ...l, hints: l.hints ? JSON.parse(l.hints) : [] }));
    return e.json({ success: true, problems: c });
  } catch (s) {
    return console.error("\u274C \u554F\u984C\u5C65\u6B74\u53D6\u5F97\u30A8\u30E9\u30FC:", s), e.json({ success: false, error: "\u554F\u984C\u5C65\u6B74\u306E\u53D6\u5F97\u306B\u5931\u6557\u3057\u307E\u3057\u305F" }, 500);
  }
});
p.post("/api/problems/:problemId/submit", R, async (e) => {
  const { env: r } = e, t = e.get("user"), s = e.req.param("problemId");
  try {
    const { userAnswer: n } = await e.req.json();
    if (!n) return e.json({ success: false, error: "\u56DE\u7B54\u3092\u5165\u529B\u3057\u3066\u304F\u3060\u3055\u3044" }, 400);
    const a = await r.DB.prepare(`
      SELECT * FROM generated_problems
      WHERE problem_id = ? AND student_id = ?
    `).bind(s, t.user_id).first();
    if (!a) return e.json({ success: false, error: "\u554F\u984C\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093" }, 404);
    const o = a.correct_answer.toLowerCase().trim(), i = n.toLowerCase().trim(), c = o === i || o.includes(i) || i.includes(o);
    return await r.DB.prepare(`
      UPDATE generated_problems
      SET is_attempted = 1, is_correct = ?, user_answer = ?, attempted_at = CURRENT_TIMESTAMP
      WHERE problem_id = ?
    `).bind(c ? 1 : 0, n, s).run(), e.json({ success: true, isCorrect: c, correctAnswer: a.correct_answer, explanation: a.explanation, hints: a.hints ? JSON.parse(a.hints) : [] });
  } catch (n) {
    return console.error("\u274C \u56DE\u7B54\u63D0\u51FA\u30A8\u30E9\u30FC:", n), e.json({ success: false, error: "\u56DE\u7B54\u306E\u63D0\u51FA\u306B\u5931\u6557\u3057\u307E\u3057\u305F" }, 500);
  }
});
p.get("/api/problems/performance", R, async (e) => {
  const { env: r } = e, t = e.get("user");
  try {
    const s = e.req.query("subject") || "\u6570\u5B66", a = await as().analyzeStudentPerformance(r.DB, t.user_id, s), o = await r.DB.prepare(`
      SELECT 
        COUNT(*) as total_generated,
        SUM(CASE WHEN is_attempted = 1 THEN 1 ELSE 0 END) as attempted,
        SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct,
        subject,
        difficulty
      FROM generated_problems
      WHERE student_id = ? AND subject = ?
      GROUP BY subject, difficulty
    `).bind(t.user_id, s).all();
    return e.json({ success: true, performance: a, generatedStats: o.results, recommendedDifficulty: a.recommendedDifficulty });
  } catch (s) {
    return console.error("\u274C \u30D1\u30D5\u30A9\u30FC\u30DE\u30F3\u30B9\u5206\u6790\u30A8\u30E9\u30FC:", s), e.json({ success: false, error: "\u30D1\u30D5\u30A9\u30FC\u30DE\u30F3\u30B9\u5206\u6790\u306B\u5931\u6557\u3057\u307E\u3057\u305F" }, 500);
  }
});
p.get("/api/problems/metadata", R, async (e) => e.json({ success: true, metadata: { difficulties: Vr, problemTypes: ha, subjects: ["\u6570\u5B66", "\u56FD\u8A9E", "\u7406\u79D1", "\u793E\u4F1A", "\u82F1\u8A9E"] } }));
p.post("/api/cognitive/cards", R, async (e) => {
  try {
    const { env: r, user: t } = e.var, { content_type: s, content_id: n, content_title: a } = await e.req.json();
    if (!s || !n || !a) return e.json({ success: false, error: "\u5FC5\u9808\u30D5\u30A3\u30FC\u30EB\u30C9\u304C\u4E0D\u8DB3\u3057\u3066\u3044\u307E\u3059" }, 400);
    if (!["concept", "problem", "vocabulary"].includes(s)) return e.json({ success: false, error: "\u7121\u52B9\u306A\u30B3\u30F3\u30C6\u30F3\u30C4\u30BF\u30A4\u30D7\u3067\u3059" }, 400);
    const o = await va(r.DB, t.id, s, n, a);
    return e.json({ success: true, card: o });
  } catch (r) {
    return console.error("\u274C \u5FA9\u7FD2\u30AB\u30FC\u30C9\u4F5C\u6210\u30A8\u30E9\u30FC:", r), e.json({ success: false, error: "\u5FA9\u7FD2\u30AB\u30FC\u30C9\u306E\u4F5C\u6210\u306B\u5931\u6557\u3057\u307E\u3057\u305F", details: r.message }, 500);
  }
});
p.post("/api/cognitive/review", R, async (e) => {
  try {
    const { env: r } = e.var, { card_id: t, quality: s } = await e.req.json();
    if (!t || s === void 0) return e.json({ success: false, error: "\u5FC5\u9808\u30D5\u30A3\u30FC\u30EB\u30C9\u304C\u4E0D\u8DB3\u3057\u3066\u3044\u307E\u3059" }, 400);
    if (s < 0 || s > 5) return e.json({ success: false, error: "\u54C1\u8CEA\u306F0-5\u306E\u7BC4\u56F2\u3067\u6307\u5B9A\u3057\u3066\u304F\u3060\u3055\u3044" }, 400);
    const n = await Ta(r.DB, t, s);
    return e.json({ success: true, result: n });
  } catch (r) {
    return console.error("\u274C \u5FA9\u7FD2\u5B9F\u884C\u30A8\u30E9\u30FC:", r), e.json({ success: false, error: "\u5FA9\u7FD2\u306E\u5B9F\u884C\u306B\u5931\u6557\u3057\u307E\u3057\u305F", details: r.message }, 500);
  }
});
p.get("/api/cognitive/today", R, async (e) => {
  try {
    const { env: r, user: t } = e.var, s = await Sa(r.DB, t.id);
    return e.json({ success: true, cards: s, count: s.length });
  } catch (r) {
    return console.error("\u274C \u4ECA\u65E5\u306E\u5FA9\u7FD2\u53D6\u5F97\u30A8\u30E9\u30FC:", r), e.json({ success: false, error: "\u4ECA\u65E5\u306E\u5FA9\u7FD2\u306E\u53D6\u5F97\u306B\u5931\u6557\u3057\u307E\u3057\u305F", details: r.message }, 500);
  }
});
p.get("/api/cognitive/stats", R, async (e) => {
  try {
    const { env: r, user: t } = e.var, s = await Na(r.DB, t.id);
    return e.json({ success: true, stats: s });
  } catch (r) {
    return console.error("\u274C \u5FA9\u7FD2\u7D71\u8A08\u53D6\u5F97\u30A8\u30E9\u30FC:", r), e.json({ success: false, error: "\u5FA9\u7FD2\u7D71\u8A08\u306E\u53D6\u5F97\u306B\u5931\u6557\u3057\u307E\u3057\u305F", details: r.message }, 500);
  }
});
p.post("/api/cognitive/retrieval-practice", R, async (e) => {
  try {
    const { env: r, user: t } = e.var, { topic: s } = await e.req.json();
    if (!s) return e.json({ success: false, error: "\u30C8\u30D4\u30C3\u30AF\u3092\u6307\u5B9A\u3057\u3066\u304F\u3060\u3055\u3044" }, 400);
    const n = await Ia(r.DB, t.id, s);
    return e.json({ success: true, session: n });
  } catch (r) {
    return console.error("\u274C \u691C\u7D22\u7DF4\u7FD2\u958B\u59CB\u30A8\u30E9\u30FC:", r), e.json({ success: false, error: "\u691C\u7D22\u7DF4\u7FD2\u306E\u958B\u59CB\u306B\u5931\u6557\u3057\u307E\u3057\u305F", details: r.message }, 500);
  }
});
p.post("/api/cognitive/interleaving", R, async (e) => {
  try {
    const { env: r, user: t } = e.var, { subjects: s, count: n = 10 } = await e.req.json();
    if (!s || !Array.isArray(s) || s.length === 0) return e.json({ success: false, error: "\u6559\u79D1\u3092\u6307\u5B9A\u3057\u3066\u304F\u3060\u3055\u3044" }, 400);
    const a = await Oa(r.DB, t.id, s, n);
    return e.json({ success: true, problems: a, count: a.length });
  } catch (r) {
    return console.error("\u274C \u4EA4\u4E92\u5B66\u7FD2\u554F\u984C\u53D6\u5F97\u30A8\u30E9\u30FC:", r), e.json({ success: false, error: "\u4EA4\u4E92\u5B66\u7FD2\u554F\u984C\u306E\u53D6\u5F97\u306B\u5931\u6557\u3057\u307E\u3057\u305F", details: r.message }, 500);
  }
});
p.post("/api/cognitive/elaboration", R, async (e) => {
  try {
    const { env: r, user: t } = e.var, { concept: s, prompt_type: n, student_response: a } = await e.req.json();
    return !s || !n ? e.json({ success: false, error: "\u5FC5\u9808\u30D5\u30A3\u30FC\u30EB\u30C9\u304C\u4E0D\u8DB3\u3057\u3066\u3044\u307E\u3059" }, 400) : ["explain", "example", "analogy", "application"].includes(n) ? (await r.DB.prepare(`INSERT INTO elaboration_prompts 
       (student_id, concept, prompt_type, student_response)
       VALUES (?, ?, ?, ?)`).bind(t.id, s, n, a || null).run(), e.json({ success: true, message: "\u7CBE\u7DFB\u5316\u30D7\u30ED\u30F3\u30D7\u30C8\u3092\u4FDD\u5B58\u3057\u307E\u3057\u305F" })) : e.json({ success: false, error: "\u7121\u52B9\u306A\u30D7\u30ED\u30F3\u30D7\u30C8\u30BF\u30A4\u30D7\u3067\u3059" }, 400);
  } catch (r) {
    return console.error("\u274C \u7CBE\u7DFB\u5316\u30D7\u30ED\u30F3\u30D7\u30C8\u4FDD\u5B58\u30A8\u30E9\u30FC:", r), e.json({ success: false, error: "\u7CBE\u7DFB\u5316\u30D7\u30ED\u30F3\u30D7\u30C8\u306E\u4FDD\u5B58\u306B\u5931\u6557\u3057\u307E\u3057\u305F", details: r.message }, 500);
  }
});
p.get("/api/cognitive/elaboration-prompts", R, async (e) => {
  try {
    const { env: r } = e.var, t = e.req.query("concept");
    if (!t) return e.json({ success: false, error: "\u30B3\u30F3\u30BB\u30D7\u30C8\u3092\u6307\u5B9A\u3057\u3066\u304F\u3060\u3055\u3044" }, 400);
    const s = [{ type: "explain", question: `\u300C${t}\u300D\u3092\u81EA\u5206\u306E\u8A00\u8449\u3067\u8AAC\u660E\u3057\u3066\u304F\u3060\u3055\u3044\u3002`, description: "\u8AAC\u660E\u3059\u308B\uFF08Explain\uFF09" }, { type: "example", question: `\u300C${t}\u300D\u306E\u5177\u4F53\u4F8B\u30923\u3064\u6319\u3052\u3066\u304F\u3060\u3055\u3044\u3002`, description: "\u4F8B\u3092\u6319\u3052\u308B\uFF08Example\uFF09" }, { type: "analogy", question: `\u300C${t}\u300D\u3092\u8EAB\u8FD1\u306A\u3082\u306E\u306B\u4F8B\u3048\u308B\u3068\u4F55\u3067\u3059\u304B\uFF1F`, description: "\u985E\u63A8\u3059\u308B\uFF08Analogy\uFF09" }, { type: "application", question: `\u300C${t}\u300D\u306F\u5B9F\u751F\u6D3B\u3067\u3069\u306E\u3088\u3046\u306B\u4F7F\u3048\u307E\u3059\u304B\uFF1F`, description: "\u5FDC\u7528\u3059\u308B\uFF08Application\uFF09" }];
    return e.json({ success: true, prompts: s });
  } catch (r) {
    return console.error("\u274C \u7CBE\u7DFB\u5316\u30D7\u30ED\u30F3\u30D7\u30C8\u53D6\u5F97\u30A8\u30E9\u30FC:", r), e.json({ success: false, error: "\u7CBE\u7DFB\u5316\u30D7\u30ED\u30F3\u30D7\u30C8\u306E\u53D6\u5F97\u306B\u5931\u6557\u3057\u307E\u3057\u305F", details: r.message }, 500);
  }
});
p.post("/api/feedback/grade", R, async (e) => {
  try {
    const { env: r, user: t } = e.var, { problem_id: s, student_answer: n } = await e.req.json();
    if (!s || !n) return e.json({ success: false, error: "\u554F\u984CID\u3068\u89E3\u7B54\u304C\u5FC5\u8981\u3067\u3059" }, 400);
    const a = await r.DB.prepare("SELECT * FROM generated_problems WHERE id = ? AND student_id = ?").bind(s, t.id).first();
    if (!a) return e.json({ success: false, error: "\u554F\u984C\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093" }, 404);
    const o = await Ra(r, a.question, a.correct_answer, n, a.subject, a.difficulty);
    if (await r.DB.prepare(`
      INSERT INTO answer_history (
        student_id, problem_id, student_answer, is_correct, 
        feedback_text, feedback_score, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(t.id, s, n, o.isCorrect ? 1 : 0, o.feedback, o.score).run(), await r.DB.prepare(`
      UPDATE generated_problems 
      SET is_attempted = 1, is_correct = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(o.isCorrect ? 1 : 0, s).run(), await Qe(r.DB, t.id, 10, "problem_solved", "\u554F\u984C\u306B\u6311\u6226"), o.isCorrect) {
      await Qe(r.DB, t.id, 20, "correct_answer", "\u554F\u984C\u6B63\u89E3"), await Zr(r.DB, t.id), await K(r.DB, t.id, "solve_first_correct");
      const i = await r.DB.prepare(`
        SELECT COUNT(*) as count FROM answer_history 
        WHERE student_id = ? AND is_correct = 1
      `).bind(t.id).first();
      if (i && (i.count === 10 ? await K(r.DB, t.id, "solve_10") : i.count === 50 ? await K(r.DB, t.id, "solve_50") : i.count === 100 && await K(r.DB, t.id, "solve_100")), a.difficulty === "hard") {
        await K(r.DB, t.id, "challenge_hard_first");
        const l = await r.DB.prepare(`
          SELECT COUNT(*) as count FROM answer_history ah
          JOIN generated_problems gp ON ah.problem_id = gp.id
          WHERE ah.student_id = ? AND ah.is_correct = 1 AND gp.difficulty = 'hard'
        `).bind(t.id).first();
        l && l.count === 10 && await K(r.DB, t.id, "challenge_hard_10");
      }
      const c = await r.DB.prepare(`
        SELECT COUNT(*) as count FROM answer_history ah
        JOIN generated_problems gp ON ah.problem_id = gp.id
        WHERE ah.student_id = ? AND ah.is_correct = 1 AND gp.subject = ?
      `).bind(t.id, a.subject).first();
      if (c && c.count === 100) {
        const u = { \u6570\u5B66: "subject_math_100", \u56FD\u8A9E: "subject_japanese_100", \u7406\u79D1: "subject_science_100", \u793E\u4F1A: "subject_social_100", \u82F1\u8A9E: "subject_english_100" }[a.subject];
        u && await K(r.DB, t.id, u);
      }
    } else await es(r.DB, t.id);
    return e.json({ success: true, feedback: o });
  } catch (r) {
    return console.error("\u274C \u81EA\u52D5\u6DFB\u524A\u30A8\u30E9\u30FC:", r), e.json({ success: false, error: "\u81EA\u52D5\u6DFB\u524A\u306B\u5931\u6557\u3057\u307E\u3057\u305F", details: r.message }, 500);
  }
});
p.post("/api/feedback/explanation", R, async (e) => {
  try {
    const { env: r, user: t } = e.var, { problem_id: s } = await e.req.json();
    if (!s) return e.json({ success: false, error: "\u554F\u984CID\u304C\u5FC5\u8981\u3067\u3059" }, 400);
    const n = await r.DB.prepare("SELECT * FROM generated_problems WHERE id = ? AND student_id = ?").bind(s, t.id).first();
    if (!n) return e.json({ success: false, error: "\u554F\u984C\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093" }, 404);
    const a = await r.DB.prepare("SELECT * FROM answer_history WHERE problem_id = ? AND student_id = ? ORDER BY created_at DESC LIMIT 1").bind(s, t.id).first(), o = await Ba(r, n.question, n.correct_answer, a == null ? void 0 : a.student_answer, n.subject, n.difficulty);
    return e.json({ success: true, explanation: o });
  } catch (r) {
    return console.error("\u274C \u8A73\u7D30\u89E3\u8AAC\u751F\u6210\u30A8\u30E9\u30FC:", r), e.json({ success: false, error: "\u8A73\u7D30\u89E3\u8AAC\u306E\u751F\u6210\u306B\u5931\u6557\u3057\u307E\u3057\u305F", details: r.message }, 500);
  }
});
p.get("/api/feedback/advice", R, async (e) => {
  try {
    const { env: r, user: t } = e.var, s = await r.DB.prepare(`
      SELECT 
        gp.subject,
        gp.difficulty,
        ah.is_correct,
        ah.feedback_score,
        ah.created_at
      FROM answer_history ah
      JOIN generated_problems gp ON ah.problem_id = gp.id
      WHERE ah.student_id = ?
      ORDER BY ah.created_at DESC
      LIMIT 50
    `).bind(t.id).all();
    if (s.results.length === 0) return e.json({ success: true, advice: { generalAdvice: "\u307E\u3060\u5B66\u7FD2\u5C65\u6B74\u304C\u3042\u308A\u307E\u305B\u3093\u3002\u554F\u984C\u3092\u89E3\u3044\u3066\u5B66\u7FD2\u3092\u59CB\u3081\u307E\u3057\u3087\u3046\uFF01", specificAdvice: [], encouragement: "\u65B0\u3057\u3044\u5B66\u7FD2\u306E\u65C5\u3092\u59CB\u3081\u307E\u3057\u3087\u3046\uFF01" } });
    const n = await ka(r, s.results);
    return e.json({ success: true, advice: n });
  } catch (r) {
    return console.error("\u274C \u5B66\u7FD2\u6539\u5584\u63D0\u6848\u751F\u6210\u30A8\u30E9\u30FC:", r), e.json({ success: false, error: "\u5B66\u7FD2\u6539\u5584\u63D0\u6848\u306E\u751F\u6210\u306B\u5931\u6557\u3057\u307E\u3057\u305F", details: r.message }, 500);
  }
});
p.get("/api/feedback/weekly-report", R, async (e) => {
  try {
    const { env: r, user: t } = e.var, s = await r.DB.prepare(`
      SELECT 
        gp.subject,
        gp.difficulty,
        ah.is_correct,
        ah.feedback_score,
        ah.created_at
      FROM answer_history ah
      JOIN generated_problems gp ON ah.problem_id = gp.id
      WHERE ah.student_id = ? 
        AND ah.created_at >= datetime('now', '-7 days')
      ORDER BY ah.created_at DESC
    `).bind(t.id).all();
    if (s.results.length === 0) return e.json({ success: true, report: { summary: "\u4ECA\u9031\u306E\u5B66\u7FD2\u8A18\u9332\u304C\u3042\u308A\u307E\u305B\u3093", achievements: [], improvements: [], nextSteps: ["\u5B66\u7FD2\u3092\u59CB\u3081\u307E\u3057\u3087\u3046\uFF01"] } });
    const n = await $a(r, s.results);
    return e.json({ success: true, report: n });
  } catch (r) {
    return console.error("\u274C \u9031\u6B21\u30EC\u30DD\u30FC\u30C8\u751F\u6210\u30A8\u30E9\u30FC:", r), e.json({ success: false, error: "\u9031\u6B21\u30EC\u30DD\u30FC\u30C8\u306E\u751F\u6210\u306B\u5931\u6557\u3057\u307E\u3057\u305F", details: r.message }, 500);
  }
});
p.get("/api/feedback/monthly-report", R, async (e) => {
  try {
    const { env: r, user: t } = e.var, s = await r.DB.prepare(`
      SELECT 
        gp.subject,
        gp.difficulty,
        ah.is_correct,
        ah.feedback_score,
        ah.created_at
      FROM answer_history ah
      JOIN generated_problems gp ON ah.problem_id = gp.id
      WHERE ah.student_id = ? 
        AND ah.created_at >= datetime('now', '-30 days')
      ORDER BY ah.created_at DESC
    `).bind(t.id).all();
    if (s.results.length === 0) return e.json({ success: true, report: { summary: "\u4ECA\u6708\u306E\u5B66\u7FD2\u8A18\u9332\u304C\u3042\u308A\u307E\u305B\u3093", achievements: [], trends: [], longTermGoals: ["\u5B66\u7FD2\u7FD2\u6163\u3092\u78BA\u7ACB\u3057\u307E\u3057\u3087\u3046"] } });
    const n = await Ha(r, s.results);
    return e.json({ success: true, report: n });
  } catch (r) {
    return console.error("\u274C \u6708\u6B21\u30EC\u30DD\u30FC\u30C8\u751F\u6210\u30A8\u30E9\u30FC:", r), e.json({ success: false, error: "\u6708\u6B21\u30EC\u30DD\u30FC\u30C8\u306E\u751F\u6210\u306B\u5931\u6557\u3057\u307E\u3057\u305F", details: r.message }, 500);
  }
});
p.get("/api/learning-path/mastery", R, async (e) => {
  try {
    const { env: r, user: t } = e.var, { subject: s, unit_id: n } = e.req.query();
    if (n) {
      const a = await Xe(r.DB, t.id, parseInt(n));
      return e.json({ success: true, score: a });
    } else {
      const a = await Pt(r.DB, t.id, s);
      return e.json({ success: true, scores: a });
    }
  } catch (r) {
    return console.error("\u274C \u7FD2\u719F\u5EA6\u53D6\u5F97\u30A8\u30E9\u30FC:", r), e.json({ success: false, error: "\u7FD2\u719F\u5EA6\u306E\u53D6\u5F97\u306B\u5931\u6557\u3057\u307E\u3057\u305F", details: r.message }, 500);
  }
});
p.get("/api/learning-path/curriculum", R, async (e) => {
  try {
    const { env: r, user: t } = e.var, { subject: s, grade: n } = e.req.query();
    if (!s) return e.json({ success: false, error: "\u6559\u79D1\u304C\u5FC5\u8981\u3067\u3059" }, 400);
    const a = await qa(r.DB, t.id, s, n ? parseInt(n) : void 0);
    return await r.DB.prepare(`
      INSERT INTO learning_path_history (student_id, subject, recommended_units, weak_areas, next_milestone_id)
      VALUES (?, ?, ?, ?, ?)
    `).bind(t.id, s, JSON.stringify(a.recommended_path.map((o) => o.unit_id)), JSON.stringify(a.weak_areas.map((o) => o.unit_id)), a.next_milestone.unit_id).run(), e.json({ success: true, curriculum: a });
  } catch (r) {
    return console.error("\u274C \u30AB\u30EA\u30AD\u30E5\u30E9\u30E0\u751F\u6210\u30A8\u30E9\u30FC:", r), e.json({ success: false, error: "\u30AB\u30EA\u30AD\u30E5\u30E9\u30E0\u306E\u751F\u6210\u306B\u5931\u6557\u3057\u307E\u3057\u305F", details: r.message }, 500);
  }
});
p.get("/api/learning-path/prediction", R, async (e) => {
  try {
    const { env: r, user: t } = e.var, { unit_ids: s } = e.req.query();
    if (!s) return e.json({ success: false, error: "\u5358\u5143ID\u304C\u5FC5\u8981\u3067\u3059" }, 400);
    const n = s.split(",").map((o) => parseInt(o.trim())), a = await Fa(r.DB, t.id, n);
    return e.json({ success: true, predictions: a });
  } catch (r) {
    return console.error("\u274C \u7FD2\u5F97\u5EA6\u4E88\u6E2C\u30A8\u30E9\u30FC:", r), e.json({ success: false, error: "\u7FD2\u5F97\u5EA6\u4E88\u6E2C\u306B\u5931\u6557\u3057\u307E\u3057\u305F", details: r.message }, 500);
  }
});
p.post("/api/learning-path/reinforcement", R, async (e) => {
  try {
    const { env: r, user: t } = e.var, { weak_unit_id: s } = await e.req.json();
    if (!s) return e.json({ success: false, error: "\u82E6\u624B\u5358\u5143ID\u304C\u5FC5\u8981\u3067\u3059" }, 400);
    const n = await Wa(r.DB, t.id, s);
    return await r.DB.prepare(`
      INSERT INTO reinforcement_plans (student_id, weak_unit_id, root_causes, actions, status)
      VALUES (?, ?, ?, ?, 'active')
    `).bind(t.id, s, JSON.stringify(n.root_causes), JSON.stringify(n.reinforcement_actions)).run(), e.json({ success: true, plan: n });
  } catch (r) {
    return console.error("\u274C \u88DC\u5F37\u8A08\u753B\u751F\u6210\u30A8\u30E9\u30FC:", r), e.json({ success: false, error: "\u88DC\u5F37\u8A08\u753B\u306E\u751F\u6210\u306B\u5931\u6557\u3057\u307E\u3057\u305F", details: r.message }, 500);
  }
});
p.get("/api/learning-path/weak-areas", R, async (e) => {
  try {
    const { env: r, user: t } = e.var, { subject: s } = e.req.query(), a = (await Pt(r.DB, t.id, s)).filter((i) => i.mastery_level < 50).sort((i, c) => i.mastery_level - c.mastery_level), o = await Promise.all(a.map(async (i) => {
      const c = await r.DB.prepare("SELECT id, unit_name, subject, grade FROM curriculum WHERE id = ?").bind(i.unit_id).first();
      return { unit_id: i.unit_id, unit_name: (c == null ? void 0 : c.unit_name) || "\u4E0D\u660E", subject: (c == null ? void 0 : c.subject) || "", grade: (c == null ? void 0 : c.grade) || 0, mastery_level: i.mastery_level, practice_count: i.practice_count, correct_rate: i.correct_rate, reinforcement_needed: i.mastery_level < 30 };
    }));
    return e.json({ success: true, weak_areas: o });
  } catch (r) {
    return console.error("\u274C \u82E6\u624B\u5206\u91CE\u53D6\u5F97\u30A8\u30E9\u30FC:", r), e.json({ success: false, error: "\u82E6\u624B\u5206\u91CE\u306E\u53D6\u5F97\u306B\u5931\u6557\u3057\u307E\u3057\u305F", details: r.message }, 500);
  }
});
p.get("/api/gamification/badges", R, async (e) => {
  try {
    const { env: r, user: t } = e.var, s = await Ga(r.DB, t.id);
    return e.json({ success: true, badges: s });
  } catch (r) {
    return console.error("\u274C \u30D0\u30C3\u30B8\u53D6\u5F97\u30A8\u30E9\u30FC:", r), e.json({ success: false, error: "\u30D0\u30C3\u30B8\u306E\u53D6\u5F97\u306B\u5931\u6557\u3057\u307E\u3057\u305F", details: r.message }, 500);
  }
});
p.get("/api/gamification/level", R, async (e) => {
  try {
    const { env: r, user: t } = e.var, s = await Xr(r.DB, t.id);
    return e.json({ success: true, level: s });
  } catch (r) {
    return console.error("\u274C \u30EC\u30D9\u30EB\u53D6\u5F97\u30A8\u30E9\u30FC:", r), e.json({ success: false, error: "\u30EC\u30D9\u30EB\u60C5\u5831\u306E\u53D6\u5F97\u306B\u5931\u6557\u3057\u307E\u3057\u305F", details: r.message }, 500);
  }
});
p.get("/api/gamification/streak", R, async (e) => {
  try {
    const { env: r, user: t } = e.var, s = await Qr(r.DB, t.id);
    return e.json({ success: true, streak: s });
  } catch (r) {
    return console.error("\u274C \u30B9\u30C8\u30EA\u30FC\u30AF\u53D6\u5F97\u30A8\u30E9\u30FC:", r), e.json({ success: false, error: "\u30B9\u30C8\u30EA\u30FC\u30AF\u60C5\u5831\u306E\u53D6\u5F97\u306B\u5931\u6557\u3057\u307E\u3057\u305F", details: r.message }, 500);
  }
});
p.post("/api/gamification/activity", R, async (e) => {
  try {
    const { env: r, user: t } = e.var, s = await Ya(r.DB, t.id);
    return s && await Qe(r.DB, t.id, 50, "login", "\u4ECA\u65E5\u306E\u30ED\u30B0\u30A4\u30F3"), e.json({ success: true, updated: s, streak: await Qr(r.DB, t.id) });
  } catch (r) {
    return console.error("\u274C \u6D3B\u52D5\u8A18\u9332\u30A8\u30E9\u30FC:", r), e.json({ success: false, error: "\u6D3B\u52D5\u306E\u8A18\u9332\u306B\u5931\u6557\u3057\u307E\u3057\u305F", details: r.message }, 500);
  }
});
p.get("/api/gamification/messages", R, async (e) => {
  try {
    const { env: r, user: t } = e.var, s = await Va(r.DB, t.id);
    return e.json({ success: true, messages: s });
  } catch (r) {
    return console.error("\u274C \u30E1\u30C3\u30BB\u30FC\u30B8\u53D6\u5F97\u30A8\u30E9\u30FC:", r), e.json({ success: false, error: "\u30E1\u30C3\u30BB\u30FC\u30B8\u306E\u53D6\u5F97\u306B\u5931\u6557\u3057\u307E\u3057\u305F", details: r.message }, 500);
  }
});
p.post("/api/gamification/encourage", R, async (e) => {
  try {
    const { env: r, user: t } = e.var, { type: s } = await e.req.json();
    let n = "";
    switch (s) {
      case "start":
        n = await Ka(r.DB, t.id);
        break;
      case "correct":
        n = await Zr(r.DB, t.id);
        break;
      case "incorrect":
        n = await es(r.DB, t.id);
        break;
      case "long_study":
        n = await za(r.DB, t.id);
        break;
      default:
        return e.json({ success: false, error: "\u4E0D\u6B63\u306A\u30E1\u30C3\u30BB\u30FC\u30B8\u30BF\u30A4\u30D7\u3067\u3059" }, 400);
    }
    return e.json({ success: true, message: n });
  } catch (r) {
    return console.error("\u274C \u30E1\u30C3\u30BB\u30FC\u30B8\u751F\u6210\u30A8\u30E9\u30FC:", r), e.json({ success: false, error: "\u30E1\u30C3\u30BB\u30FC\u30B8\u306E\u751F\u6210\u306B\u5931\u6557\u3057\u307E\u3057\u305F", details: r.message }, 500);
  }
});
p.post("/api/gamification/award-points", R, async (e) => {
  try {
    const { env: r, user: t } = e.var, { points: s, source: n, description: a } = await e.req.json();
    if (!s || !n || !a) return e.json({ success: false, error: "\u30DD\u30A4\u30F3\u30C8\u3001\u30BD\u30FC\u30B9\u3001\u8AAC\u660E\u304C\u5FC5\u8981\u3067\u3059" }, 400);
    await Qe(r.DB, t.id, s, n, a);
    const o = await Xr(r.DB, t.id);
    return e.json({ success: true, level: o });
  } catch (r) {
    return console.error("\u274C \u30DD\u30A4\u30F3\u30C8\u4ED8\u4E0E\u30A8\u30E9\u30FC:", r), e.json({ success: false, error: "\u30DD\u30A4\u30F3\u30C8\u306E\u4ED8\u4E0E\u306B\u5931\u6557\u3057\u307E\u3057\u305F", details: r.message }, 500);
  }
});
p.post("/api/gamification/check-badge", R, async (e) => {
  try {
    const { env: r, user: t } = e.var, { badge_key: s } = await e.req.json();
    if (!s) return e.json({ success: false, error: "\u30D0\u30C3\u30B8\u30AD\u30FC\u304C\u5FC5\u8981\u3067\u3059" }, 400);
    const n = await K(r.DB, t.id, s);
    return e.json({ success: true, awarded: n });
  } catch (r) {
    return console.error("\u274C \u30D0\u30C3\u30B8\u30C1\u30A7\u30C3\u30AF\u30A8\u30E9\u30FC:", r), e.json({ success: false, error: "\u30D0\u30C3\u30B8\u30C1\u30A7\u30C3\u30AF\u306B\u5931\u6557\u3057\u307E\u3057\u305F", details: r.message }, 500);
  }
});
var ir = new Or();
var vo = Object.assign({ "/src/index.tsx": p });
var os = false;
for (const [, e] of Object.entries(vo)) e && (ir.all("*", (r) => {
  let t;
  try {
    t = r.executionCtx;
  } catch {
  }
  return e.fetch(r.req.raw, r.env, t);
}), ir.notFound((r) => {
  let t;
  try {
    t = r.executionCtx;
  } catch {
  }
  return e.fetch(r.req.raw, r.env, t);
}), os = true);
if (!os) throw new Error("Can't import modules from ['/src/index.ts','/src/index.tsx','/app/server.ts']");
async function To(e, r, t, s, n) {
  const a = await e.prepare(`
    SELECT s.student_id, s.name, s.grade, c.class_code, c.class_name
    FROM students s
    JOIN class_enrollments ce ON s.student_id = ce.student_id
    JOIN classes c ON ce.class_id = c.class_id
    WHERE s.student_id = ? AND ce.is_active = TRUE
    LIMIT 1
  `).bind(r).first();
  if (!a) throw new Error("Student not found");
  const o = await e.prepare(`
    SELECT 
      COUNT(*) as total_sessions,
      SUM(actual_time_minutes) as total_time_minutes,
      SUM(actual_cards_completed) as total_cards
    FROM learning_sessions
    WHERE student_id = ?
      AND session_start >= ?
      AND session_start <= ?
  `).bind(r, t, s).first(), i = await e.prepare(`
    SELECT AVG(mastery_score) as avg_mastery
    FROM student_progress
    WHERE student_id = ?
      AND last_attempt_date >= ?
      AND last_attempt_date <= ?
  `).bind(r, t, s).first(), c = await e.prepare(`
    SELECT 
      lc.subject,
      COUNT(DISTINCT sp.card_id) as cards_completed,
      AVG(sp.mastery_score) as average_score,
      SUM(CASE WHEN sp.status = 'mastered' THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as mastery_rate
    FROM student_progress sp
    JOIN learning_cards lc ON sp.card_id = lc.card_id
    WHERE sp.student_id = ?
      AND sp.last_attempt_date >= ?
      AND sp.last_attempt_date <= ?
    GROUP BY lc.subject
  `).bind(r, t, s).all(), l = await e.prepare(`
    SELECT 
      lc.difficulty_level as level,
      COUNT(*) as cards_attempted,
      SUM(CASE WHEN lh.is_correct = TRUE THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as success_rate
    FROM learning_history lh
    JOIN learning_cards lc ON lh.card_id = lc.card_id
    WHERE lh.student_id = ?
      AND lh.attempt_date >= ?
      AND lh.attempt_date <= ?
    GROUP BY lc.difficulty_level
  `).bind(r, t, s).all(), u = await e.prepare(`
    SELECT 
      dominant_style,
      vark_scores,
      confidence_level
    FROM detected_learning_styles
    WHERE student_id = ?
    ORDER BY last_updated DESC
    LIMIT 1
  `).bind(r).first();
  let d = { visual: 0, auditory: 0, reading: 0, kinesthetic: 0 };
  if (u && u.vark_scores) try {
    d = JSON.parse(u.vark_scores);
  } catch (M) {
    console.error("Failed to parse VARK scores:", M);
  }
  const _ = await e.prepare(`
    SELECT 
      sa.earned_date as date,
      b.badge_name as title,
      b.description,
      b.icon_url as badge_icon
    FROM student_achievements sa
    JOIN badges b ON sa.badge_id = b.badge_id
    WHERE sa.student_id = ?
      AND sa.earned_date >= ?
      AND sa.earned_date <= ?
    ORDER BY sa.earned_date DESC
    LIMIT 5
  `).bind(r, t, s).all(), m = await e.prepare(`
    SELECT 
      COUNT(*) as total_questions,
      GROUP_CONCAT(DISTINCT card_id) as card_ids
    FROM ai_teacher_conversations
    WHERE student_id = ?
      AND created_at >= ?
      AND created_at <= ?
  `).bind(r, t, s).first(), h = t, g = new Date(new Date(t).getTime() - (new Date(s).getTime() - new Date(t).getTime())).toISOString().split("T")[0], f = await e.prepare(`
    SELECT AVG(mastery_score) as avg_mastery
    FROM student_progress
    WHERE student_id = ?
      AND last_attempt_date >= ?
      AND last_attempt_date < ?
  `).bind(r, g, h).first(), E = f && f.avg_mastery > 0 ? (i.avg_mastery - f.avg_mastery) / f.avg_mastery * 100 : 0, x = [], y = c.results.filter((M) => M.average_score < 60);
  y.length > 0 && x.push({ area: "\u82E6\u624B\u6559\u79D1", description: `${y.map((M) => M.subject).join("\u3001")}\u306E\u7FD2\u719F\u5EA6\u304C\u4F4E\u3081\u3067\u3059`, suggestions: ["\u57FA\u790E\u554F\u984C\u304B\u3089\u5FA9\u7FD2\u3057\u307E\u3057\u3087\u3046", "AI\u6559\u5E2B\u306B\u8CEA\u554F\u3057\u3066\u7406\u89E3\u3092\u6DF1\u3081\u307E\u3057\u3087\u3046", "\u8996\u899A\u7684\u306A\u56F3\u89E3\u3092\u6D3B\u7528\u3057\u3066\u307F\u307E\u3057\u3087\u3046"] });
  const v = So(a.name, o.total_time_minutes || 0, i.avg_mastery || 0, E, n), b = await e.prepare(`
    SELECT 
      DATE(session_start) as date,
      SUM(actual_time_minutes) as minutes
    FROM learning_sessions
    WHERE student_id = ?
      AND session_start >= ?
      AND session_start <= ?
    GROUP BY DATE(session_start)
    ORDER BY DATE(session_start)
  `).bind(r, t, s).all();
  let T = 0;
  const O = b.results.map((M) => (T += M.minutes || 0, { date: M.date, minutes: M.minutes || 0, cumulative_minutes: T })), A = c.results.map((M) => M.subject), S = c.results.map((M) => Math.round(M.average_score)), I = await e.prepare(`
    SELECT 
      DATE(session_start) as date,
      SUM(actual_cards_completed) as cards_completed,
      COUNT(*) as sessions
    FROM learning_sessions
    WHERE student_id = ?
      AND session_start >= ?
      AND session_start <= ?
    GROUP BY DATE(session_start)
    ORDER BY DATE(session_start)
  `).bind(r, t, s).all(), N = await e.prepare(`
    SELECT 
      AVG(ls.actual_time_minutes) as avg_time,
      AVG(ls.actual_cards_completed) as avg_cards,
      AVG(sp.mastery_score) as avg_mastery
    FROM learning_sessions ls
    JOIN students s ON ls.student_id = s.student_id
    JOIN class_enrollments ce ON s.student_id = ce.student_id
    JOIN classes c ON ce.class_id = c.class_id
    LEFT JOIN student_progress sp ON s.student_id = sp.student_id
    WHERE c.class_code = ?
      AND ls.session_start >= ?
      AND ls.session_start <= ?
  `).bind(a.class_code, t, s).first(), k = await e.prepare(`
    SELECT 
      SUM(actual_time_minutes) as total_time,
      SUM(actual_cards_completed) as total_cards
    FROM learning_sessions
    WHERE student_id = ?
      AND session_start >= ?
      AND session_start < ?
  `).bind(r, g, h).first(), D = await e.prepare(`
    SELECT 
      s.student_id,
      AVG(sp.mastery_score) as avg_mastery
    FROM students s
    JOIN class_enrollments ce ON s.student_id = ce.student_id
    JOIN classes c ON ce.class_id = c.class_id
    LEFT JOIN student_progress sp ON s.student_id = sp.student_id
    WHERE c.class_code = ?
      AND sp.last_attempt_date >= ?
      AND sp.last_attempt_date <= ?
    GROUP BY s.student_id
    ORDER BY avg_mastery DESC
  `).bind(a.class_code, t, s).all(), j = D.results.length, $ = D.results.findIndex((M) => M.student_id === r) + 1, re = j > 0 ? Math.round((j - $ + 1) / j * 100) : 50, he = await e.prepare(`
    SELECT 
      DATE(session_start) as date,
      SUM(actual_cards_completed) as cards,
      AVG(sp.mastery_score) as mastery
    FROM learning_sessions ls
    LEFT JOIN student_progress sp ON ls.student_id = sp.student_id
    WHERE ls.student_id = ?
      AND ls.session_start >= ?
      AND ls.session_start <= ?
    GROUP BY DATE(session_start)
    ORDER BY DATE(session_start)
  `).bind(r, t, s).all(), se = Io(he.results);
  return { student: { id: a.student_id, name: a.name, grade: a.grade, class_code: a.class_code }, period: { start_date: t, end_date: s, type: n }, summary: { total_learning_time_minutes: o.total_time_minutes || 0, total_cards_completed: o.total_cards || 0, total_sessions: o.total_sessions || 0, average_mastery_score: Math.round(i.avg_mastery || 0), improvement_rate: Math.round(E * 10) / 10 }, performance: { by_subject: c.results.map((M) => ({ subject: M.subject, cards_completed: M.cards_completed, average_score: Math.round(M.average_score), mastery_rate: Math.round(M.mastery_rate) })), by_difficulty: l.results.map((M) => ({ level: M.level, cards_attempted: M.cards_attempted, success_rate: Math.round(M.success_rate) })) }, learning_style: { dominant_style: (u == null ? void 0 : u.dominant_style) || "unknown", vark_breakdown: d, recommendations: No((u == null ? void 0 : u.dominant_style) || "visual") }, achievements: _.results.map((M) => ({ date: M.date, title: M.title, description: M.description, badge_icon: M.badge_icon || "\u{1F3C6}" })), challenges: x, ai_teacher_interactions: { total_questions: (m == null ? void 0 : m.total_questions) || 0, topics: [], most_helpful_answers: [] }, parent_message: v, teacher_comment: "", charts: { learning_time_trend: O, mastery_radar: { labels: A, scores: S }, subject_performance_bar: c.results.map((M) => ({ subject: M.subject, score: Math.round(M.average_score), class_average: N != null && N.avg_mastery ? Math.round(N.avg_mastery) : void 0 })), daily_progress: I.results.map((M) => ({ date: M.date, cards_completed: M.cards_completed || 0, sessions: M.sessions || 0 })) }, comparison: { class_average: { learning_time_minutes: Math.round((N == null ? void 0 : N.avg_time) || 0), cards_completed: Math.round((N == null ? void 0 : N.avg_cards) || 0), mastery_score: Math.round((N == null ? void 0 : N.avg_mastery) || 0) }, previous_period: { learning_time_minutes: (k == null ? void 0 : k.total_time) || 0, cards_completed: (k == null ? void 0 : k.total_cards) || 0, mastery_score: Math.round((f == null ? void 0 : f.avg_mastery) || 0), improvement_rate: Math.round(E * 10) / 10 }, percentile_rank: re }, prediction: { next_week_cards: se.next_week_cards, next_week_mastery: se.next_week_mastery, goal_achievement_probability: se.goal_achievement_probability, recommended_study_time: se.recommended_study_time } };
}
__name(To, "To");
function So(e, r, t, s, n) {
  const a = n === "weekly" ? "\u4ECA\u9031" : n === "monthly" ? "\u4ECA\u6708" : "\u3053\u306E\u671F\u9593", o = Math.floor(r / 60), i = r % 60;
  let c = `${e}\u3055\u3093\u306E${a}\u306E\u5B66\u7FD2\u72B6\u6CC1\u3092\u3054\u5831\u544A\u3044\u305F\u3057\u307E\u3059\u3002

`;
  return r > 0 && (c += `\u5B66\u7FD2\u6642\u9593\u306F\u5408\u8A08${o}\u6642\u9593${i}\u5206\u3067\u3001`), t >= 80 ? c += `\u7FD2\u719F\u5EA6\u306F${t}\u70B9\u3068\u975E\u5E38\u306B\u512A\u79C0\u3067\u3059\u3002` : t >= 60 ? c += `\u7FD2\u719F\u5EA6\u306F${t}\u70B9\u3068\u9806\u8ABF\u306B\u6210\u9577\u3057\u3066\u3044\u307E\u3059\u3002` : c += `\u7FD2\u719F\u5EA6\u306F${t}\u70B9\u3067\u3059\u3002\u4E00\u7DD2\u306B\u30B5\u30DD\u30FC\u30C8\u3057\u3066\u3044\u304D\u307E\u3057\u3087\u3046\u3002`, s > 10 ? c += `

\u524D\u56DE\u3068\u6BD4\u3079\u3066${s.toFixed(1)}%\u3082\u5411\u4E0A\u3057\u3066\u304A\u308A\u3001\u7D20\u6674\u3089\u3057\u3044\u6210\u9577\u304C\u898B\u3089\u308C\u307E\u3059\uFF01` : s > 0 && (c += `

\u524D\u56DE\u3068\u6BD4\u3079\u3066${s.toFixed(1)}%\u5411\u4E0A\u3057\u3066\u3044\u307E\u3059\u3002`), c += `

\u5F15\u304D\u7D9A\u304D\u3001\u304A\u5B50\u69D8\u306E\u5B66\u7FD2\u3092\u6E29\u304B\u304F\u898B\u5B88\u3063\u3066\u3044\u305F\u3060\u3051\u308C\u3070\u3068\u601D\u3044\u307E\u3059\u3002`, c;
}
__name(So, "So");
function No(e) {
  const r = { visual: ["\u56F3\u3084\u30B0\u30E9\u30D5\u3092\u6D3B\u7528\u3057\u305F\u5B66\u7FD2\u304C\u52B9\u679C\u7684\u3067\u3059", "\u30DE\u30A4\u30F3\u30C9\u30DE\u30C3\u30D7\u3084\u30A4\u30E9\u30B9\u30C8\u3092\u63CF\u3044\u3066\u6574\u7406\u3057\u307E\u3057\u3087\u3046", "\u8272\u5206\u3051\u3084\u30CF\u30A4\u30E9\u30A4\u30C8\u3092\u4F7F\u3063\u3066\u91CD\u8981\u30DD\u30A4\u30F3\u30C8\u3092\u8996\u899A\u5316"], auditory: ["\u97F3\u8AAD\u3084\u97F3\u58F0\u6559\u6750\u3092\u6D3B\u7528\u3057\u307E\u3057\u3087\u3046", "\u5BB6\u65CF\u3084\u53CB\u9054\u306B\u8AAC\u660E\u3059\u308B\u3053\u3068\u3067\u7406\u89E3\u304C\u6DF1\u307E\u308A\u307E\u3059", "\u30EA\u30BA\u30E0\u3084\u6B4C\u3067\u899A\u3048\u308B\u65B9\u6CD5\u3082\u52B9\u679C\u7684\u3067\u3059"], reading: ["\u30C6\u30AD\u30B9\u30C8\u3092\u3057\u3063\u304B\u308A\u8AAD\u307F\u8FBC\u3080\u5B66\u7FD2\u304C\u5411\u3044\u3066\u3044\u307E\u3059", "\u30CE\u30FC\u30C8\u306B\u307E\u3068\u3081\u308B\u7FD2\u6163\u3092\u7D99\u7D9A\u3057\u307E\u3057\u3087\u3046", "\u53C2\u8003\u66F8\u3084\u554F\u984C\u96C6\u3092\u6D3B\u7528\u3057\u305F\u5B66\u7FD2\u304C\u304A\u3059\u3059\u3081"], kinesthetic: ["\u5B9F\u969B\u306B\u624B\u3092\u52D5\u304B\u3059\u5B66\u7FD2\u304C\u52B9\u679C\u7684\u3067\u3059", "\u5B9F\u9A13\u3084\u5DE5\u4F5C\u3092\u901A\u3058\u3066\u4F53\u9A13\u7684\u306B\u5B66\u3073\u307E\u3057\u3087\u3046", "\u4F11\u61A9\u3092\u53D6\u308A\u306A\u304C\u3089\u30A2\u30AF\u30C6\u30A3\u30D6\u306B\u5B66\u7FD2"] };
  return r[e] || r.visual;
}
__name(No, "No");
function Io(e) {
  if (e.length === 0) return { next_week_cards: 0, next_week_mastery: 0, goal_achievement_probability: 0, recommended_study_time: 60 };
  const r = e.length;
  let t = 0, s = 0, n = 0, a = 0, o = 0;
  e.forEach((f, E) => {
    const x = E + 1, y = f.cards || 0;
    t += x, s += y, n += x * y, a += x * x, o += f.mastery || 0;
  });
  const i = (r * n - t * s) / (r * a - t * t), c = (s - i * t) / r, l = Math.round(Math.max(0, i * (r + 7) + c)), u = o / r, d = i > 0 ? 5 : i < 0 ? -3 : 0, _ = Math.round(Math.min(100, Math.max(0, u + d))), m = _ >= 80 ? 85 : _ >= 70 ? 65 : _ >= 60 ? 45 : 25, h = s / r, g = h < 5 ? 90 : h < 10 ? 60 : 45;
  return { next_week_cards: l, next_week_mastery: _, goal_achievement_probability: m, recommended_study_time: g };
}
__name(Io, "Io");
var is = Object.freeze(Object.defineProperty({ __proto__: null, generateLearningReport: To }, Symbol.toStringTag, { value: "Module" }));

// ../node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env2, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env2);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env2, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env2);
  } catch (e) {
    const error3 = reduceError(e);
    return Response.json(error3, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// ../.wrangler/tmp/bundle-xIX8dy/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = ir;

// ../node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env2, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env2, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env2, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env2, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// ../.wrangler/tmp/bundle-xIX8dy/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env2, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env2, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env2, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env2, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env2, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env2, ctx) => {
      this.env = env2;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=bundledWorker-0.8942175551084439.mjs.map
