# XALWatcher

XALWatcher is an app that can monitor changes in an directory and run apps by applying simple conditions.

# Installation

`npm i -g xalwatcher`

# Usage 

XALWatcher requires an configuration file in order to work. Here is a simple configuration file:

    path: src
    env:
        NODE_PORT: 3000
    execute:
        NODE: babel-node src/server.js
        GENERATE_SOME_FILES:
            run: generator.sh
            when:
                changed: 
                    - src/file1.js
                    - src/ex
        WEBPACK: 
            run: webpack --config webpack.config.js --display-error-details
            color: green
            waitFor: GENERATE_SOME_FILES
        
The config above watch the directory `src` and set the environmental variable `NODE_PORT` to `3001` and will share it to 
all the apps.

The watcher launch at first all 3 apps we specified: `NODE`, `GENERATE_SOME_FILES`, `WEBPACK`. `STATISTICS_APP`.

The app `NODE` launch the command `babel-node src/server.js` without any conditions and will be restarted when every 
single change in the `src` directory will be made.

The app `GENERATE_SOME_FILES` will run the command `generator.sh` only when are some changes with the file 
`src/file1.js` or some file in the directory `src/ex`.

The app `WEBPACK` will show its output with the color `green` and will wait for `GENERATE_SOME_FILES` to finish, but will
run straight away if `GENERATE_SOME_FILES` is not run because its conditions are not met.


# Documentation

## Config
- `path` - `String|Array` (required) the folders to watch for changes(relative path are taken from the working directory) 
- `env` - `Object` additional entries to the enviromental variables 
- `once` - TODO
- `execute` - `Object` (required) the apps to execute

For each object in `execute` you have the options:
- `run` - `String` (required) the path to launch 
- `when` - `Object` Relaunch the app only if some files/paths are modified
  - `not` - TODO
  - `changed` - `String|Array` The paths/files to check if changed
  - `addedOrDeleted` - `String|Array` The paths/files to check if added or deleted
- `color` - `String` the name of the colors. Using the package `colors`
- `waitFor` - `String|Array` wait for some apps before executing this app
- `ignoreChangesWhileRunning` - `Boolean` ignore the changes to the files while this app is running (useful if the app is modifying the watched files)

Also the value of the object in `execute` can be the string to execute.