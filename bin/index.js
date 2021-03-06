#!/usr/bin/env node
"use strict";

require("core-js/modules/es7.symbol.async-iterator");

require("core-js/modules/es6.symbol");

require("core-js/modules/es6.date.now");

require("core-js/modules/es6.string.starts-with");

require("core-js/modules/es6.array.index-of");

require("core-js/modules/es6.string.bold");

require("core-js/modules/es6.object.assign");

require("core-js/modules/es6.regexp.split");

require("core-js/modules/es7.array.includes");

require("core-js/modules/es6.string.includes");

require("core-js/modules/es6.promise");

require("regenerator-runtime/runtime");

require("core-js/modules/es6.array.is-array");

require("core-js/modules/es6.regexp.replace");

require("core-js/modules/es6.array.iterator");

require("core-js/modules/es6.object.keys");

require("core-js/modules/web.dom.iterable");

require("core-js/modules/es6.array.for-each");

var _fs = _interopRequireDefault(require("fs"));

var _jsYaml = _interopRequireDefault(require("js-yaml"));

var _path = _interopRequireDefault(require("path"));

var _colors = _interopRequireDefault(require("colors"));

var _consoleClear = _interopRequireDefault(require("console-clear"));

var _child_process = require("child_process");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

var argv = require("yargs").option("config", {
  alias: "c",
  demandOption: true,
  type: "string"
}).option("env", {
  type: "string",
  array: true
}).help("h").alias("h", "help").alias('v', 'version').describe('v', 'show version information').argv;

function replaceStringVarsWithEnv(str) {
  Object.keys(process.env).forEach(function (env) {
    str = str.replace("$".concat(env), process.env[env]);
  });
  return str;
}

function replaceAllVarsInConfig(config) {
  if (!config) return null;

  if (Array.isArray(config)) {
    for (var i = 0, length = config.length; i < length; ++i) {
      config[i] = replaceAllVarsInConfig(config[i]);
      console.log("RAVIC", config.length, i, config[i]);
    }
  } else if (_typeof(config) == "object") {
    Object.keys(config).forEach(function (option) {
      config[option] = replaceAllVarsInConfig(config[option]);
    });
  } else if (typeof config == "string") {
    console.log("RAVIC", "String", config, replaceStringVarsWithEnv(config));
    return replaceStringVarsWithEnv(config);
  }

  return config;
}

_asyncToGenerator(
/*#__PURE__*/
regeneratorRuntime.mark(function _callee2() {
  var sleep, draw, waitForThenSpawn, spawnApp, execute, onChanged, watchForEach, onExit, config, OPTION_PATH, OPTION_IGNORE, OPTION_BEFORE, OPTION_EXECUTE, OPTION_ENV, OPTION_ONCE, requiredOptions, allOptions, i, APPS_KEYS, _i, key, filesHistory, execs, appsWithIgnoreChangesFlag, lastChangedFilenameDate, _i6, length, _key;

  return regeneratorRuntime.wrap(function _callee2$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          sleep = function _ref3(ms) {
            return new Promise(function (resolve) {
              setTimeout(resolve, ms);
            });
          };

          try {
            draw = function draw() {
              console.log("".concat(_colors.default.bold(_colors.default.green("XALWatcher")), " v0.1.5 PID").concat(process.pid));
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

              for (var _i2 = 0; _i2 < waitList.length && launch; ++_i2) {
                if (execs[waitList[_i2]]) launch = false;
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
              execs[app] = (0, _child_process.spawn)(appConfig.run, [], {
                env: process.env,
                shell: process.env.XALWATCHER_SHELL || true,
                cwd: process.cwd(),
                detached: true,
                windowsHide: process.env.XALWATCHER_WINDOWSHIDE || true
              });
              console.log(_colors.default.green("Launched app ".concat(app, "[").concat(execs[app].pid, "]: ").concat(appConfig.run)));
              execs[app].stdout.on('data', function (data) {
                var l = "[".concat(app, "][").concat(execs[app] && execs[app].pid, "] ").concat(String(data));
                if (appConfig.color) l = _colors.default[appConfig.color](l);
                process.stdout.write(l);
              });
              execs[app].stderr.on('data', function (data) {
                process.stdout.write(_colors.default.red("[".concat(app, "][").concat(execs[app] && execs[app].pid, "] ").concat(String(data))));
              });
              execs[app].on('close', function (data) {
                if (execs[app].isClosing) return;
                console.log(_colors.default.green("App ".concat(app, " has done...")));
                execs[app] = null;

                if (appsWithIgnoreChangesFlag.includes(app)) {
                  appsWithIgnoreChangesFlag.splice(appsWithIgnoreChangesFlag.indexOf(app), 1);
                }
              });
            };

            execute = function execute(filename, root, eventType) {
              APPS_KEYS.forEach(
              /*#__PURE__*/
              function () {
                var _ref2 = _asyncToGenerator(
                /*#__PURE__*/
                regeneratorRuntime.mark(function _callee(app) {
                  var appConfig, shouldExecute, filePath, _i3, length, _i4, _length, _i5, _length2;

                  return regeneratorRuntime.wrap(function _callee$(_context) {
                    while (1) {
                      switch (_context.prev = _context.next) {
                        case 0:
                          appConfig = config[OPTION_EXECUTE][app];

                          if (!(filename !== undefined && appConfig.when)) {
                            _context.next = 10;
                            break;
                          }

                          shouldExecute = false;
                          filePath = _path.default.join(root, filename);
                          console.log(app, "root", root, "filename", filename);

                          if (appConfig.when.changed) {
                            for (_i3 = 0, length = appConfig.when.changed.length; _i3 < length && !shouldExecute; ++_i3) {
                              console.log(app, "changed", _i3, appConfig.when.changed[_i3], filePath.startsWith(appConfig.when.changed[_i3]));
                              shouldExecute = filePath.startsWith(appConfig.when.changed[_i3]);
                            }
                          }

                          if (!shouldExecute && appConfig.when.addedOrDeleted && eventType == 'rename') {
                            for (_i4 = 0, _length = appConfig.when.addedOrDeleted.length; _i4 < _length && !shouldExecute; ++_i4) {
                              console.log(app, "addedOrDeleted", _i4, appConfig.when.addedOrDeleted[_i4], filePath.startsWith(appConfig.when.addedOrDeleted[_i4]));
                              shouldExecute = filePath.startsWith(appConfig.when.addedOrDeleted[_i4]);
                            }
                          }

                          if (!shouldExecute && appConfig.when.not) {
                            shouldExecute = true;

                            for (_i5 = 0, _length2 = appConfig.when.not.length; _i5 < _length2 && shouldExecute; ++_i5) {
                              console.log(app, "not", _i5, appConfig.when.not[_i5], !filePath.startsWith(appConfig.when.not[_i5]));
                              shouldExecute = !filePath.startsWith(appConfig.when.not[_i5]);
                            }
                          }

                          if (shouldExecute) {
                            _context.next = 10;
                            break;
                          }

                          return _context.abrupt("return");

                        case 10:
                          if (config[OPTION_EXECUTE][app].ignoreChangesWhileRunning) {
                            appsWithIgnoreChangesFlag.push(app);
                          }

                          if (execs[app]) {
                            try {
                              execs[app].isClosing = true;
                              console.log(_colors.default.green("Killing app ".concat(app, "[").concat(execs[app].pid, "]\n")));
                              process.kill(-execs[app].pid);
                            } catch (error) {
                              try {
                                process.kill(execs[app].pid);
                              } catch (error2) {
                                console.error(_colors.default.red("Error while killing ".concat(app, "[").concat(execs[app].pid, "]")));
                                console.log(error);
                                console.log(error2);
                              }
                            }
                          }

                        case 12:
                          if (!true) {
                            _context.next = 25;
                            break;
                          }

                          _context.prev = 13;
                          process.kill(execs[app].pid, 0);
                          _context.next = 17;
                          return sleep(250);

                        case 17:
                          _context.next = 23;
                          break;

                        case 19:
                          _context.prev = 19;
                          _context.t0 = _context["catch"](13);
                          execs[app] = null;
                          return _context.abrupt("break", 25);

                        case 23:
                          _context.next = 12;
                          break;

                        case 25:
                          if (appConfig.waitFor) {
                            console.log(_colors.default.yellow("Before launching ".concat(app, " we are waiting for ").concat(appConfig.waitFor.join(","), " to finish...")));
                            waitForThenSpawn(app, appConfig, appConfig.waitFor);
                          } else {
                            spawnApp(app, appConfig);
                          }

                        case 26:
                        case "end":
                          return _context.stop();
                      }
                    }
                  }, _callee, this, [[13, 19]]);
                }));

                return function (_x) {
                  return _ref2.apply(this, arguments);
                };
              }());
            };

            onChanged = function onChanged(filename, root, eventType) {
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
              if (options.cleanup) {
                APPS_KEYS.forEach(function (app) {
                  if (execs[app]) {
                    try {
                      process.kill(-execs[app].pid);
                    } catch (error) {
                      try {
                        process.kill(execs[app].pid);
                      } catch (error2) {
                        console.error(_colors.default.red("Error while killing ".concat(app, "[").concat(execs[app].pid, "]")));
                        console.log(error);
                        console.log(error2);
                      }
                    }
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
            }); // Replace with env vars

            config = replaceAllVarsInConfig(config);
            console.log(config); // Set the working directory to the directory that contains the config file

            process.chdir(_path.default.dirname(argv.config)); // Check if there are unknown options in the config

            Object.keys(config).forEach(function (option) {
              if (!allOptions.includes(option)) {
                console.error("The option \"".concat(option, "\" from config is unknown"));
                process.exit(1);
              }
            });

            if (argv.env) {
              argv.env.forEach(function (env) {
                var split = env.split("=");
                process.env[split[0]] = split[1];
              });
            } //= Prepare and check options ==================================================================================
            //- OPTION_PATH ---------------------------


            if (!Array.isArray(config[OPTION_PATH])) config[OPTION_PATH] = [config[OPTION_PATH]];

            for (i = 0; i < config[OPTION_PATH].length; ++i) {
              config[OPTION_PATH][i] = replaceStringVarsWithEnv(config[OPTION_PATH][i]);
            } //-----------------------------------------
            // OPTION_BEFORE


            if (config[OPTION_BEFORE] && !Array.isArray(config[OPTION_BEFORE])) config[OPTION_BEFORE] = [config[OPTION_BEFORE]]; //- OPTION_EXECUTE ------------------------

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
            }); //-----------------------------------------
            // OPTION_ENV

            if (config[OPTION_ENV]) {
              if (config[OPTION_ENV].PATH) {
                if (!_path.default.isAbsolute(config[OPTION_ENV].PATH)) config[OPTION_ENV].PATH = _path.default.join(_path.default.dirname(argv.config), config[OPTION_ENV].PATH);
                config[OPTION_ENV].PATH = "".concat(config[OPTION_ENV].PATH, ":").concat(process.env.PATH);
              }

              process.env = Object.assign(process.env, config[OPTION_ENV]);
            } //- OPTION_ONCE ---------------------------


            if (config[OPTION_ONCE]) {
              if (!Array.isArray(config[OPTION_ONCE])) config[OPTION_ONCE] = [config[OPTION_ONCE]];

              for (_i = 0; _i < config[OPTION_ONCE].length; ++_i) {
                key = Object.keys(config[OPTION_ONCE][_i]);
                console.log("ONCE", _i, key, config[OPTION_ONCE][_i]);
                config[OPTION_ONCE][_i][key] = {
                  run: replaceStringVarsWithEnv(config[OPTION_ONCE][_i][key])
                };
              }
            } //-----------------------------------------
            //==============================================================================================================


            filesHistory = [];
            execs = {};
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

            config[OPTION_PATH].forEach(function (path) {
              return watchForEach(path, path);
            });
            draw();

            if (config[OPTION_ONCE]) {
              for (_i6 = 0, length = config[OPTION_ONCE].length; _i6 < length; ++_i6) {
                _key = Object.keys(config[OPTION_ONCE][_i6]);
                spawnApp(_key, config[OPTION_ONCE][_i6][_key]);
              }
            }

            execute();
          } catch (error) {
            console.error(error);
          }

        case 2:
        case "end":
          return _context2.stop();
      }
    }
  }, _callee2, this);
}))();