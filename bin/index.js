#!/usr/bin/env node
"use strict";

require("core-js/modules/es6.promise");

require("core-js/modules/es6.date.now");

require("core-js/modules/es6.string.bold");

require("core-js/modules/es6.regexp.split");

require("core-js/modules/es6.object.assign");

require("core-js/modules/es6.array.is-array");

require("core-js/modules/es7.array.includes");

require("core-js/modules/es6.string.includes");

require("core-js/modules/es6.array.iterator");

require("core-js/modules/es6.object.keys");

require("core-js/modules/web.dom.iterable");

require("core-js/modules/es6.array.for-each");

require("regenerator-runtime/runtime");

var _fs = _interopRequireDefault(require("fs"));

var _jsYaml = _interopRequireDefault(require("js-yaml"));

var _path = _interopRequireDefault(require("path"));

var _colors = _interopRequireDefault(require("colors"));

var _consoleClear = _interopRequireDefault(require("console-clear"));

var _child_process = require("child_process");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

var argv = require("yargs").option("config", {
  alias: "c",
  demandOption: true,
  type: "string"
}).option("env", {
  type: "string",
  array: true
}).help("h").alias("h", "help").argv;

_asyncToGenerator(
/*#__PURE__*/
regeneratorRuntime.mark(function _callee() {
  var config, OPTION_PATH, OPTION_IGNORE, OPTION_BEFORE, OPTION_EXECUTE, OPTION_ENV, OPTION_COLORS, requiredOptions, allOptions, APPS_KEYS, filesHistory, execs, appColors, draw, spawnApp, execute, onChanged, watchForEach;
  return regeneratorRuntime.wrap(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          watchForEach = function _ref6(pathname) {
            var root = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

            if (!_fs.default.existsSync(pathname)) {
              console.error("The path \"".concat(pathname, "\" doesn't exists"));
              process.exit(1);
            }

            if (!_path.default.isAbsolute(pathname)) {
              pathname = _path.default.join(_path.default.dirname(argv.config), pathname);
            }

            _fs.default.watch(pathname, {
              recursive: false,
              persistent: true,
              encoding: 'utf8'
            }, function (eventType, filename) {
              return onChanged(filename, root);
            });

            if (_fs.default.lstatSync(pathname).isDirectory()) {
              _fs.default.readdirSync(pathname).forEach(function (subpath) {
                var subpathname = _path.default.join(pathname, subpath);

                if (_fs.default.lstatSync(subpathname).isDirectory()) watchForEach(subpathname, _path.default.join(root || "", subpath));
              });
            }
          };

          onChanged = function _ref5(filename, root) {
            if (filesHistory.length && Date.now() - filesHistory[0][1].getTime() < 50) return;
            if (config[OPTION_IGNORE] && (config[OPTION_IGNORE].includes(root) || config[OPTION_IGNORE].includes(_path.default.join(root || "", filename)))) return;
            if (filesHistory.length == 3) filesHistory.pop();
            filesHistory.splice(0, 0, [filename, new Date()]);
            execute();
          };

          execute = function _ref4() {
            if (config[OPTION_BEFORE]) {
              config[OPTION_BEFORE].forEach(function (command) {
                try {
                  (0, _child_process.execSync)(command, {
                    env: process.env
                  });
                } catch (error) {
                  console.error(error);
                  process.exit(1);
                }
              });
            }

            APPS_KEYS.forEach(function (app) {
              console.log(app);
              var command = config[OPTION_EXECUTE][app];

              if (execs[app]) {
                (0, _child_process.exec)("kill -9 ".concat(-execs[app].pid));
                spawnApp(app, command);
                console.log(_colors.default.green("There was a change... Killing app ".concat(app, "[").concat(execs[app].pid, "]\n")));
              } else {
                spawnApp(app, command);
              }
            });
          };

          spawnApp = function _ref3(app, command) {
            console.log(_colors.default.green("Launchig app ".concat(app, " - ").concat(command, "\n")));
            execs[app] = (0, _child_process.spawn)(command, [], {
              env: process.env,
              shell: true,
              cwd: process.cwd(),
              detached: true
            });
            execs[app].stdout.on('data', function (data) {
              var l = "[".concat(app, "][").concat(execs[app].pid, "] ").concat(String(data));
              if (appColors[app]) l = _colors.default[appColors[app]](l);
              process.stdout.write(l);
            });
            execs[app].stderr.on('data', function (data) {
              process.stdout.write(_colors.default.bgRed("[".concat(app, "][").concat(execs[app].pid, "] ").concat(String(data))));
            });
          };

          draw = function _ref2() {
            (0, _consoleClear.default)();
            console.log("".concat(_colors.default.bold(_colors.default.green("XALWatcher")), " v0.0.1 PID").concat(process.pid));
            console.log("".concat(_colors.default.bold("Watching"), ": ").concat(config[OPTION_PATH]));
            console.log();
            console.log("".concat(_colors.default.bold("Last changed files:")));
            filesHistory.forEach(function (file) {
              console.log("  - ".concat(file[0], " ").concat(_colors.default.bold(file[1])));
            });
            console.log();
          };

          if (!_fs.default.existsSync(argv.config)) {
            console.error("Path doesn't exists");
            process.exit(1);
          }

          config = null;

          try {
            config = _jsYaml.default.safeLoad(_fs.default.readFileSync(argv.config, "utf8"));
          } catch (error) {
            console.error(error);
            process.exit(1);
          }

          OPTION_PATH = "path";
          OPTION_IGNORE = "ignore";
          OPTION_BEFORE = "before";
          OPTION_EXECUTE = "execute";
          OPTION_ENV = "env";
          OPTION_COLORS = "colors";
          requiredOptions = [OPTION_PATH, OPTION_EXECUTE];
          allOptions = [].concat(requiredOptions, [OPTION_IGNORE, OPTION_BEFORE, OPTION_ENV, OPTION_COLORS]);
          requiredOptions.forEach(function (option) {
            if (!config[option]) {
              console.error("The option \"".concat(option, "\" from config is missing"));
              process.exit(1);
            }
          });
          Object.keys(config).forEach(function (option) {
            if (!allOptions.includes(option)) {
              console.error("The option \"".concat(option, "\" from config is unknown"));
              process.exit(1);
            }
          });
          if (config[OPTION_BEFORE] && !Array.isArray(config[OPTION_BEFORE])) config[OPTION_BEFORE] = [config[OPTION_BEFORE]];
          if (typeof config[OPTION_EXECUTE] === "string") config[OPTION_EXECUTE] = {
            APP: config[OPTION_EXECUTE]
          };
          APPS_KEYS = Object.keys(config[OPTION_EXECUTE]);

          if (config[OPTION_ENV]) {
            if (config[OPTION_ENV].PATH) {
              if (!_path.default.isAbsolute(config[OPTION_ENV].PATH)) config[OPTION_ENV].PATH = _path.default.join(_path.default.dirname(argv.config), config[OPTION_ENV].PATH);
              config[OPTION_ENV].PATH = "".concat(config[OPTION_ENV].PATH, ":").concat(process.env.PATH);
            }

            process.env = Object.assign(process.env, config[OPTION_ENV]);
          }

          if (argv.env) {
            argv.env.forEach(function (env) {
              var split = env.split("=");
              process.env[split[0]] = split[1];
            });
          }

          filesHistory = [];
          execs = {};
          appColors = {};

          if (config[OPTION_COLORS]) {
            Object.keys(config[OPTION_COLORS]).forEach(function (app) {
              return appColors[app] = config[OPTION_COLORS][app];
            });
          }

          watchForEach(config[OPTION_PATH]);
          draw();
          execute();

        case 30:
        case "end":
          return _context.stop();
      }
    }
  }, _callee, this);
}))();