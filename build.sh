#!/bin/bash
path=$(pwd)/node_modules/.bin
${path}/babel src -d bin &&
cp bin/index.js bin/xalwatcher