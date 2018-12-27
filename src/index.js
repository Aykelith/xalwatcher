#!/usr/bin/env node
import fs from "fs";
import yaml from "js-yaml";
import path from "path";
import colors from "colors";
import clear from "console-clear";
import { execSync, spawn, exec } from "child_process"; 

const argv = require("yargs")
    .option("config", { alias: "c", demandOption: true, type: "string" })
    .option("env", { type: "string", array: true })
    .help("h")
    .alias("h", "help")
    .argv;

(async () => {
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

    const OPTION_PATH = "path";
    const OPTION_IGNORE = "ignore";
    const OPTION_BEFORE = "before";
    const OPTION_EXECUTE = "execute";
    const OPTION_ENV = "env";
    const OPTION_COLORS = "colors";

    const requiredOptions = [OPTION_PATH, OPTION_EXECUTE];
    const allOptions      = [...requiredOptions, OPTION_IGNORE, OPTION_BEFORE, OPTION_ENV, OPTION_COLORS];

    requiredOptions.forEach(option => {
        if (!config[option]) {
            console.error(`The option "${option}" from config is missing`);
            process.exit(1);
        }
    });

    Object.keys(config).forEach(option => {
        if (!allOptions.includes(option)) {
            console.error(`The option "${option}" from config is unknown`);
            process.exit(1);
        }
    });

    if (config[OPTION_BEFORE] && !Array.isArray(config[OPTION_BEFORE])) config[OPTION_BEFORE] = [ config[OPTION_BEFORE] ];

    if (typeof config[OPTION_EXECUTE] === "string") config[OPTION_EXECUTE] = { APP: config[OPTION_EXECUTE] };
    const APPS_KEYS = Object.keys(config[OPTION_EXECUTE]);
    
    if (config[OPTION_ENV]) {
        if (config[OPTION_ENV].PATH) {
            if (!path.isAbsolute(config[OPTION_ENV].PATH)) config[OPTION_ENV].PATH = path.join(path.dirname(argv.config), config[OPTION_ENV].PATH);
            config[OPTION_ENV].PATH = `${config[OPTION_ENV].PATH}:${process.env.PATH}`;
        }

        process.env = Object.assign(process.env, config[OPTION_ENV]);
    }

    if (argv.env) {
        argv.env.forEach(env => {
            let split = env.split("=");
            process.env[split[0]] = split[1];
        })
    }

    let filesHistory = [];
    let execs = {};
    let appColors = {};

    if (config[OPTION_COLORS]) {
        Object.keys(config[OPTION_COLORS]).forEach(app => appColors[app] = config[OPTION_COLORS][app]);
    }

    function draw() {
        clear();

        console.log(`${colors.bold(colors.green("XALWatcher"))} v0.0.1 PID${process.pid}`);
        console.log(`${colors.bold("Watching")}: ${config[OPTION_PATH]}`);
        console.log();
        console.log(`${colors.bold("Last changed files:")}`);
        filesHistory.forEach(file => {
            console.log(`  - ${file[0]} ${colors.bold(file[1])}`);
        });
        console.log();
    }

    function spawnApp(app, command) {
        console.log(colors.green(`Launchig app ${app} - ${command}\n`));

        execs[app] = spawn(command, [], { 
            env: process.env, 
            shell: true ,
            cwd: process.cwd(),
            detached: true
        });

        execs[app].stdout.on('data', data => {
            let l =  `[${app}][${execs[app].pid}] ${String(data)}`;
            if (appColors[app]) l = colors[appColors[app]](l);
            process.stdout.write(l);
        });

        execs[app].stderr.on('data', data => {
            process.stdout.write(colors.bgRed(`[${app}][${execs[app].pid}] ${String(data)}`));
        });
    }

    function execute() {
        if (config[OPTION_BEFORE]) {
            config[OPTION_BEFORE].forEach(command => {
                try {
                    execSync(command, { env: process.env });
                } catch (error) {
                    console.error(error);
                    process.exit(1);
                }
            });
        }

        APPS_KEYS.forEach(app => {
            console.log(app);
            const command = config[OPTION_EXECUTE][app];

            if (execs[app]) {
                exec(`kill -9 ${-execs[app].pid}`);
                spawnApp(app, command);
                console.log(colors.green(`There was a change... Killing app ${app}[${execs[app].pid}]\n`));
            } else {
                spawnApp(app, command);
            }
        })
    }

    let lastChangedFilenameDate = 0;
    function onChanged(filename, root) {
        if (Date.now() - lastChangedFilenameDate < 50) return;
        lastChangedFilenameDate = Date.now();
        
        if (config[OPTION_IGNORE] && (config[OPTION_IGNORE].includes(root) || config[OPTION_IGNORE].includes(path.join(root || "", filename)))) return;

        if (filesHistory.length == 3) filesHistory.pop();
        filesHistory.splice(0, 0, [ filename, new Date() ] );

        execute();
    }

    function watchForEach(pathname, root = null) {
        if (!fs.existsSync(pathname)) {
            console.error(`The path "${pathname}" doesn't exists`);
            process.exit(1);
        }

        if (!path.isAbsolute(pathname)) {
            pathname = path.join(path.dirname(argv.config), pathname);
        }

        fs.watch(pathname, { recursive: false, persistent: true, encoding: 'utf8' }, (eventType, filename) => onChanged(filename, root));

        if (fs.lstatSync(pathname).isDirectory()) {
            fs.readdirSync(pathname).forEach(subpath => {
                const subpathname = path.join(pathname, subpath);
                if (fs.lstatSync(subpathname).isDirectory()) watchForEach(subpathname, path.join(root || "", subpath));
            })
        }
    }
    
    watchForEach(config[OPTION_PATH]);

    draw();
    execute();
})();