#!/usr/bin/env node
import fs from "fs";
import yaml from "js-yaml";
import path from "path";
import colors from "colors";
import clear from "console-clear";
import { spawn, execSync } from "child_process"; 

const argv = require("yargs")
    .option("config", { alias: "c", demandOption: true, type: "string" })
    .option("env", { type: "string", array: true })
    .help("h")
    .alias("h", "help")
    .alias('v', 'version')
    .describe('v', 'show version information')
    .argv;

function replaceStringVarsWithEnv(str) {
    Object.keys(process.env).forEach(env => {
        str = str.replace(`$${env}`, process.env[env]);
    });
    
    return str;
}

(async () => {
    function sleep(ms){
        return new Promise(resolve=>{
            setTimeout(resolve,ms)
        })
    }

    try {
        if (process.env.XAL_DEBUG) {
            console.debug = console.log;
        } else {
            console.debug = {};
        }

        if (!fs.existsSync(argv.config)) {
            console.error("Path doesn't exists");
            process.exit(1);
        }
        
        let config = null;
        try {
            config = yaml.safeLoad(fs.readFileSync(argv.config, "utf8"));
        } catch (error) {
            console.error(error);
            process.exit(1);
        }

        //= Top-level options ==========================================================================================
        const OPTION_PATH = "path";
        const OPTION_IGNORE = "ignore";
        const OPTION_BEFORE = "before";
        const OPTION_EXECUTE = "execute";
        const OPTION_ENV = "env";
        const OPTION_ONCE = "once";

        const requiredOptions = [OPTION_PATH, OPTION_EXECUTE];
        const allOptions      = [...requiredOptions, OPTION_IGNORE, OPTION_BEFORE, OPTION_ENV, OPTION_ONCE];
        //==============================================================================================================

        // Check if an options is missing
        requiredOptions.forEach(option => {
            if (!config[option]) {
                console.error(`The option "${option}" from config is missing`);
                process.exit(1);
            }
        });

        // Set the working directory to the directory that contains the config file
        process.chdir(path.dirname(argv.config));

        // Check if there are unknown options in the config
        Object.keys(config).forEach(option => {
            if (!allOptions.includes(option)) {
                console.error(`The option "${option}" from config is unknown`);
                process.exit(1);
            }
        });

        if (argv.env) {
            argv.env.forEach(env => {
                let split = env.split("=");
                process.env[split[0]] = split[1];
            })
        }

        //= Prepare and check options ==================================================================================
        //- OPTION_PATH ---------------------------
        if (!Array.isArray(config[OPTION_PATH])) config[OPTION_PATH] = [ config[OPTION_PATH] ];

        for (let i=0; i < config[OPTION_PATH].length; ++i) {
            config[OPTION_PATH][i] = replaceStringVarsWithEnv(config[OPTION_PATH][i]);
        }
        //-----------------------------------------

        // OPTION_BEFORE
        if (config[OPTION_BEFORE] && !Array.isArray(config[OPTION_BEFORE])) config[OPTION_BEFORE] = [ config[OPTION_BEFORE] ];

        //- OPTION_EXECUTE ------------------------
        if (typeof config[OPTION_EXECUTE] === "string") config[OPTION_EXECUTE] = { APP: { run: config[OPTION_EXECUTE] } };

        const APPS_KEYS = Object.keys(config[OPTION_EXECUTE]);

        APPS_KEYS.forEach(app => {
            if (typeof config[OPTION_EXECUTE][app] === "string") {
                config[OPTION_EXECUTE][app] = { run: config[OPTION_EXECUTE][app] };
            } else {
                if (typeof config[OPTION_EXECUTE][app].waitFor === "string") {
                    config[OPTION_EXECUTE][app].waitFor = [ config[OPTION_EXECUTE][app].waitFor ];
                }

                if (config[OPTION_EXECUTE][app].when) {
                    const WHEN_KEYS = [ "accepted", "changed", "not" ];
                    
                    WHEN_KEYS.forEach(key => {
                        if (typeof config[OPTION_EXECUTE][app].when[key] === "string") {
                            config[OPTION_EXECUTE][app].when[key] = [ config[OPTION_EXECUTE][app].when[key] ];
                        }
                    })
                }
            }
        })
        //-----------------------------------------
        
        // OPTION_ENV
        if (config[OPTION_ENV]) {
            if (config[OPTION_ENV].PATH) {
                if (!path.isAbsolute(config[OPTION_ENV].PATH)) config[OPTION_ENV].PATH = path.join(path.dirname(argv.config), config[OPTION_ENV].PATH);
                config[OPTION_ENV].PATH = `${config[OPTION_ENV].PATH}:${process.env.PATH}`;
            }

            process.env = Object.assign(process.env, config[OPTION_ENV]);
        }

        //- OPTION_ONCE ---------------------------
        if (config[OPTION_ONCE]) {
            if (!Array.isArray(config[OPTION_ONCE])) config[OPTION_ONCE] = [ config[OPTION_ONCE] ];
        
            for (let i=0; i < config[OPTION_ONCE].length; ++i) {
                const key = Object.keys(config[OPTION_ONCE][i]);
                console.log("ONCE",i,key,config[OPTION_ONCE][i]);
                config[OPTION_ONCE][i][key] = { run: replaceStringVarsWithEnv(config[OPTION_ONCE][i][key]) };
            }
        }
        //-----------------------------------------
        //==============================================================================================================

        let filesHistory = [];
        let execs = {};

        let appsWithIgnoreChangesFlag = [];

        function draw() {
            console.log(`${colors.bold(colors.green("XALWatcher"))} v0.1.3 PID${process.pid}`);
            console.log(`${colors.bold("Watching")}: ${config[OPTION_PATH]}`);
            console.log();
            console.log(`${colors.bold("Last changed files:")}`);
            filesHistory.forEach(file => {
                console.log(`  - ${file[0]} ${colors.bold(file[1])}`);
            });
            console.log();
        }

        function waitForThenSpawn(app, appConfig, waitList) {
            let launch = true;
            for (let i=0; i < waitList.length && launch; ++i) {
                if (execs[waitList[i]]) launch = false;
            }

            if (launch) {
                spawnApp(app, appConfig);
            } else {
                setTimeout(() => waitForThenSpawn(app, appConfig, waitList), 100);
            }
        }

        function spawnApp(app, appConfig) {
            execs[app] = spawn(appConfig.run, [], { 
                env: process.env, 
                shell: true,
                cwd: process.cwd(),
                detached: true
            });

            console.log(colors.green(`Launched app ${app}[${execs[app].pid}]: ${appConfig.run}`));

            execs[app].stdout.on('data', data => {
                let l = `[${app}][${execs[app] && execs[app].pid}] ${String(data)}`;
                if (appConfig.color) l = colors[appConfig.color](l);
                process.stdout.write(l);
            });

            execs[app].stderr.on('data', data => {
                process.stdout.write(colors.red(`[${app}][${execs[app] && execs[app].pid}] ${String(data)}`));
            });

            execs[app].on('close', data => {
                if (execs[app].isClosing) return;

                console.log(colors.green(`App ${app} has done...`));
                execs[app] = null;
                if (appsWithIgnoreChangesFlag.includes(app)) {
                    appsWithIgnoreChangesFlag.splice(appsWithIgnoreChangesFlag.indexOf(app), 1);
                }
            });
        }

        function execute(filename, root, eventType) {
            APPS_KEYS.forEach(app => {
                if (execs[app]) {
                    try {
                        execs[app].isClosing = true;

                        console.log(colors.green(`Killing app ${app}[${execs[app].pid}]\n`));
                        process.kill(-execs[app].pid);
                    } catch (error) {
                        try {
                            process.kill(execs[app].pid);
                        } catch (error2) {
                            console.error(colors.red(`Error while killing ${app}[${execs[app].pid}]`));
                            console.log(error);
                            console.log(error2);
                        }
                    }
                }
            });

            APPS_KEYS.forEach(async app => {
                let appConfig = config[OPTION_EXECUTE][app];

                if (filename !== undefined && appConfig.when) {
                    let shouldExecute = false;

                    if (appConfig.when.changed) {
                        for (let i=0; i < appConfig.when.changed.length && !shouldExecute; ++i) {
                            shouldExecute = root.startsWith(appConfig.when.changed[i]);
                        }
                    }
                    

                    if (!shouldExecute && appConfig.when.addedOrDeleted && eventType == 'rename') {
                        for (let i=0; i < appConfig.when.addedOrDeleted.length && !shouldExecute; ++i) {
                            shouldExecute = root.startsWith(appConfig.when.addedOrDeleted[i]);
                        }
                    }

                    if (appConfig.when.not) {
                        
                    }

                    if (!shouldExecute) return;
                }

                if (config[OPTION_EXECUTE][app].ignoreChangesWhileRunning) {
                    appsWithIgnoreChangesFlag.push(app);
                }

                while (true) {
                    try {
                        process.kill(execs[app].pid, 0);
                        await sleep(250);
                    } catch (error) {
                        execs[app] = null;
                        break;
                    }
                }

                if (appConfig.waitFor) {
                    console.log(colors.yellow(`Before launching ${app} we are waiting for ${appConfig.waitFor.join(",")} to finish...`));
                    waitForThenSpawn(app, appConfig, appConfig.waitFor);
                } else {
                    spawnApp(app, appConfig);
                }
            })
        }

        let lastChangedFilenameDate = 0;
        function onChanged(filename, root, eventType) {
            if (appsWithIgnoreChangesFlag.length != 0) return;

            if (Date.now() - lastChangedFilenameDate < 50) return;
            lastChangedFilenameDate = Date.now();
            
            if (config[OPTION_IGNORE] && (config[OPTION_IGNORE].includes(root) || config[OPTION_IGNORE].includes(path.join(root || "", filename)))) return;

            if (filesHistory.length == 3) filesHistory.pop();
            filesHistory.splice(0, 0, [ filename, new Date() ] );

            console.log("There was a change...");
            console.log(filename, root, eventType);
            execute(filename, root, eventType);
        }

        function watchForEach(pathname, root = null) {
            if (!fs.existsSync(pathname)) {
                console.error(`The path "${pathname}" doesn't exists`);
                process.exit(1);
            }

            if (!path.isAbsolute(pathname)) {
                pathname = path.join(path.dirname(argv.config), pathname);
            }

            fs.watch(pathname, { recursive: false, persistent: true, encoding: 'utf8' }, (eventType, filename) => { onChanged(filename, root, eventType) });

            if (fs.lstatSync(pathname).isDirectory()) {
                fs.readdirSync(pathname).forEach(subpath => {
                    const subpathname = path.join(pathname, subpath);
                    if (fs.lstatSync(subpathname).isDirectory()) watchForEach(subpathname, path.join(root || "", subpath));
                })
            }
        }

        function onExit(options) {
            if (options.cleanup) {
                APPS_KEYS.forEach(app => {
                    if (execs[app]) {
                        try {
                            process.kill(-execs[app].pid);
                        } catch (error) {
                            try {
                                process.kill(execs[app].pid);
                            } catch (error2) {
                                console.error(colors.red(`Error while killing ${app}[${execs[app].pid}]`));
                                console.log(error);
                                console.log(error2);
                            }
                        }
                    }
                })
            }

            if (options.exit) process.exit();
        }

        process.on('exit', () => onExit({ cleanup: true }));
        process.on('SIGINT', () => onExit({ exit: true, from: "SIGINT" }));

        // catches "kill pid" (for example: nodemon restart)
        process.on('SIGUSR1', () => onExit({ exit: true, from: "SIGUSR1" }));
        process.on('SIGUSR2', () => onExit({ exit: true, from: "SIGUSR2" }));

        //catches uncaught exceptions
        // process.on('uncaughtException', () => onExit({ exit: true, from: "uncaughtException" }));
        
        config[OPTION_PATH].forEach(path => watchForEach(path, path));

        draw();

        if (config[OPTION_ONCE]) {
            for (let i=0, length=config[OPTION_ONCE].length; i < length; ++i) {
                const key = Object.keys(config[OPTION_ONCE][i]);
                spawnApp(key, config[OPTION_ONCE][i][key]);
            }
        }

        execute();
    } catch (error) {
        console.error(error);
    }
})();