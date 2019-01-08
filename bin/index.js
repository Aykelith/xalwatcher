#!/usr/bin/env node
"use strict";

require("core-js/modules/es6.promise");

require("core-js/modules/es6.date.now");

require("core-js/modules/es6.string.starts-with");

require("core-js/modules/es6.array.index-of");

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
  var draw, waitForThenSpawn, spawnApp, execute, onChanged, watchForEach, onExit, config, OPTION_PATH, OPTION_IGNORE, OPTION_BEFORE, OPTION_EXECUTE, OPTION_ENV, OPTION_ONCE, requiredOptions, allOptions, APPS_KEYS, filesHistory, execs, appColors, appsWithIgnoreChangesFlag, lastChangedFilenameDate;
  return regeneratorRuntime.wrap(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          try {
            //==============================================================================================================
            draw = function draw() {
              // clear();
              console.log("".concat(_colors.default.bold(_colors.default.green("XALWatcher")), " v0.0.3 PID").concat(process.pid));
              console.log("".concat(_colors.default.bold("Watching"), ": ").concat(config[OPTION_PATH]));
              console.log();
              console.log("".concat(_colors.default.bold("Last changed files:")));
              filesHistory.forEach(function (file) {
                console.log("  - ".concat(file[0], " ").concat(_colors.default.bold(file[1])));
              });
              console.log();
            };

            waitForThenSpawn = function waitForThenSpawn(app, appConfig, waitList) {
              var launch = true;

              for (var i = 0; i < waitList.length && launch; ++i) {
                if (execs[waitList[i]]) launch = false;
              }

              if (launch) {
                spawnApp(app, appConfig);
              } else {
                setTimeout(function () {
                  return waitForThenSpawn(app, appConfig, waitList);
                }, 100);
              }
            };

            spawnApp = function spawnApp(app, appConfig) {
              console.log(_colors.default.green("Launchig app ".concat(app, ": ").concat(appConfig.run)));
              execs[app] = (0, _child_process.spawn)(appConfig.run, [], {
                env: process.env,
                shell: true,
                cwd: process.cwd(),
                detached: true
              });
              execs[app].stdout.on('data', function (data) {
                var l = "[".concat(app, "][").concat(execs[app] && execs[app].pid, "] ").concat(String(data));
                if (appConfig.color) l = _colors.default[appConfig.color](l);
                process.stdout.write(l);
              });
              execs[app].stderr.on('data', function (data) {
                process.stdout.write(_colors.default.red("[".concat(app, "][").concat(execs[app].pid, "] ").concat(String(data))));
              });
              execs[app].on('close', function (data) {
                console.log(_colors.default.green("App ".concat(app, " has done...")));
                execs[app] = null;

                if (appsWithIgnoreChangesFlag.includes(app)) {
                  appsWithIgnoreChangesFlag.splice(appsWithIgnoreChangesFlag.indexOf(app), 1);
                }
              });
            };

            execute = function execute(filename, root, eventType) {
              APPS_KEYS.forEach(function (app) {
                if (execs[app]) {
                  (0, _child_process.exec)("kill -9 ".concat(-execs[app].pid));
                  console.log(_colors.default.green("Killing app ".concat(app, "[").concat(execs[app].pid, "]\n")));
                  execs[app] = null;
                }

                console.log("execute()", app, "appsWithIgnoreChangesFlag.length", appsWithIgnoreChangesFlag.length);
              });
              APPS_KEYS.forEach(function (app) {
                var appConfig = config[OPTION_EXECUTE][app];
                var commandToExecute;

                if (typeof command === "string") {
                  commandToExecute = appConfig;
                } else {
                  commandToExecute = appConfig.run;

                  if (filename !== undefined && appConfig.when) {
                    var shouldExecute = false;

                    if (appConfig.when.changed) {
                      for (var i = 0; i < appConfig.when.changed.length && !shouldExecute; ++i) {
                        shouldExecute = root.startsWith(appConfig.when.changed[i]);
                      }
                    }

                    if (!shouldExecute && appConfig.when.addedOrDeleted && eventType == 'rename') {
                      for (var _i = 0; _i < appConfig.when.addedOrDeleted.length && !shouldExecute; ++_i) {
                        shouldExecute = root.startsWith(appConfig.when.addedOrDeleted[_i]);
                      }
                    }

                    if (appConfig.when.not) {}

                    if (!shouldExecute) return;
                  }
                }

                if (config[OPTION_EXECUTE][app].ignoreChangesWhileRunning) {
                  appsWithIgnoreChangesFlag.push(app);
                }

                if (appConfig.waitFor) {
                  console.log(_colors.default.yellow("Before launching ".concat(app, " we are waiting for ").concat(appConfig.waitFor.join(","), " to finish...")));
                  waitForThenSpawn(app, appConfig, appConfig.waitFor);
                } else {
                  spawnApp(app, appConfig);
                }
              });
            };

            onChanged = function onChanged(filename, root, eventType) {
              console.log("appsWithIgnoreChangesFlag.length", appsWithIgnoreChangesFlag.length);
              if (appsWithIgnoreChangesFlag.length != 0) return;
              if (Date.now() - lastChangedFilenameDate < 50) return;
              lastChangedFilenameDate = Date.now();
              if (config[OPTION_IGNORE] && (config[OPTION_IGNORE].includes(root) || config[OPTION_IGNORE].includes(_path.default.join(root || "", filename)))) return;
              if (filesHistory.length == 3) filesHistory.pop();
              filesHistory.splice(0, 0, [filename, new Date()]);
              console.log("There was a change...");
              console.log(filename, root, eventType);
              execute(filename, root, eventType);
            };

            watchForEach = function watchForEach(pathname) {
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
                onChanged(filename, root, eventType);
              });

              if (_fs.default.lstatSync(pathname).isDirectory()) {
                _fs.default.readdirSync(pathname).forEach(function (subpath) {
                  var subpathname = _path.default.join(pathname, subpath);

                  if (_fs.default.lstatSync(subpathname).isDirectory()) watchForEach(subpathname, _path.default.join(root || "", subpath));
                });
              }
            };

            onExit = function onExit(options) {
              console.log("onEXIT", options);

              if (options.cleanup) {
                APPS_KEYS.forEach(function (app) {
                  if (execs[app]) {
                    (0, _child_process.exec)("kill -9 ".concat(-execs[app].pid));
                  }
                });
              }

              if (options.exit) process.exit();
            };

            if (process.env.XAL_DEBUG) {
              console.debug = console.log;
            } else {
              console.debug = {};
            }

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
            } //= Top-level options ==========================================================================================


            OPTION_PATH = "path";
            OPTION_IGNORE = "ignore";
            OPTION_BEFORE = "before";
            OPTION_EXECUTE = "execute";
            OPTION_ENV = "env";
            OPTION_ONCE = "once";
            requiredOptions = [OPTION_PATH, OPTION_EXECUTE];
            allOptions = [].concat(requiredOptions, [OPTION_IGNORE, OPTION_BEFORE, OPTION_ENV, OPTION_ONCE]); //==============================================================================================================
            // Check if an options is missing

            requiredOptions.forEach(function (option) {
              if (!config[option]) {
                console.error("The option \"".concat(option, "\" from config is missing"));
                process.exit(1);
              }
            }); // Set the working directory to the directory that contains the config file

            process.chdir(_path.default.dirname(argv.config)); // Check if there are unknown options in the config

            Object.keys(config).forEach(function (option) {
              if (!allOptions.includes(option)) {
                console.error("The option \"".concat(option, "\" from config is unknown"));
                process.exit(1);
              }
            }); //= Prepare and check options ==================================================================================

            if (config[OPTION_BEFORE] && !Array.isArray(config[OPTION_BEFORE])) config[OPTION_BEFORE] = [config[OPTION_BEFORE]];
            if (typeof config[OPTION_EXECUTE] === "string") config[OPTION_EXECUTE] = {
              APP: {
                run: config[OPTION_EXECUTE]
              }
            };
            APPS_KEYS = Object.keys(config[OPTION_EXECUTE]);
            APPS_KEYS.forEach(function (app) {
              if (typeof config[OPTION_EXECUTE][app] === "string") {
                config[OPTION_EXECUTE][app] = {
                  run: config[OPTION_EXECUTE][app]
                };
              } else {
                if (typeof config[OPTION_EXECUTE][app].waitFor === "string") {
                  config[OPTION_EXECUTE][app].waitFor = [config[OPTION_EXECUTE][app].waitFor];
                }

                if (config[OPTION_EXECUTE][app].when) {
                  var WHEN_KEYS = ["accepted", "changed", "not"];
                  WHEN_KEYS.forEach(function (key) {
                    if (typeof config[OPTION_EXECUTE][app].when[key] === "string") {
                      config[OPTION_EXECUTE][app].when[key] = [config[OPTION_EXECUTE][app].when[key]];
                    }
                  });
                }
              }
            });

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
            appsWithIgnoreChangesFlag = [];
            lastChangedFilenameDate = 0;
            process.on('exit', function () {
              return onExit({
                cleanup: true
              });
            });
            process.on('SIGINT', function () {
              return onExit({
                exit: true,
                from: "SIGINT"
              });
            }); // catches "kill pid" (for example: nodemon restart)

            process.on('SIGUSR1', function () {
              return onExit({
                exit: true,
                from: "SIGUSR1"
              });
            });
            process.on('SIGUSR2', function () {
              return onExit({
                exit: true,
                from: "SIGUSR2"
              });
            }); //catches uncaught exceptions
            // process.on('uncaughtException', () => onExit({ exit: true, from: "uncaughtException" }));

            watchForEach(config[OPTION_PATH]);
            draw();
            execute();
          } catch (error) {
            console.error(error);
          }

        case 1:
        case "end":
          return _context.stop();
      }
    }
  }, _callee, this);
}))();