#!/usr/bin/env node

'use strict';

var fs = require('fs-extra'),
    commander = require('commander'),
    exec = require('child_process').exec,
    path = require('path'),
    config = require('./package.json'),
    replace = require('gulp-replace'),
    os = require('os'),
    portfinder = require('portfinder'),
    httpServer = require('http-server'),
    vfs = require('vinyl-fs');

var currentDir = process.cwd();

var getLibPath = function () {
    var cfg = require('./lib.json');
    if (cfg && cfg.uri) {
        return cfg.uri;
    } else {
        return __dirname + "/resources";
    }
};

function listen(port, host) {
    var options = {
        root: './',
        showDir: true,
        autoIndex: true,
        robots: false
    };

    var ssl = false;
    var server = httpServer.createServer(options);

    server.listen(port, host, function () {
        console.log("yes-ui serving", "127.0.0.1:" + port);
    });
}

function copyPluginToName(name, newName) {

    var core = getCoreType();
    if (core) {

        var pluginName = newName || name;
        var dist = path.resolve(currentDir, "plugins/" + pluginName);
        var srcDir = getLibPath() + '/' + core + '/plugins/' + name;

        fs.copy(srcDir, dist, function (fsErr) {
            if (fsErr) return console.error(fsErr);
            var config = require(srcDir + "/config.json");
            if (config && config.root) {
                changeDefaultPluginName(pluginName, core);
            }
        });
    }
}

function changeDefaultPluginName(newName, core, dest) {
    var dist = dest || currentDir;
    dist = dist + "/core/scripts";
    var filePath = getLibPath() + '/' + core + '/core/core/scripts/application.js';
    vfs.src(filePath)
        .pipe(replace(/\$default/g, newName))
        .pipe(vfs.dest(dist));
}

function copyCore(core, project) {

    if (checkCore(core)) {
        currentDir = path.resolve(currentDir, project);
        var srcDir = getLibPath() + "/" + core + '/core';

        fs.copy(srcDir, currentDir, function (fsErr) {
            if (fsErr) return console.error(fsErr);
        });
    }
}

function checkCore(name) {
    var core = {
        desktop: 'desktop',
        mobile: 'mobile'
    };

    if (core[name])
        return name;
    else
        console.log('core name not exist');
    return false;
}

function getCoreType() {
    var coreCfg = currentDir + '/core/config.json';
    var cfg = require(coreCfg);
    if (cfg && cfg.type) {
        return cfg.type;
    } else {
        console.log("core missing config.json");
    }
    return false;
}

commander.usage('[command] <options ...>');

commander.option('-v, --version', 'output the version number', function () {
    console.log("version:", config.version);
});

commander
    .command('start')
    .description('start current project')
    .action(function (args) {
        portfinder.basePort = 8080;
        portfinder.getPort(function (err, port) {
            if (err) {
                throw err;
            }
            listen(port);
        });
        console.log('Hit CTRL-C to stop the server');
    });

commander
    .command('lib <protocol> <uri>')
    .description('add a plugin to project')
    .action(function (protocol, uri) {

        if (protocol && uri) {

            var json = {
                protocol: protocol,
                uri: uri
            };
            var ws = fs.createOutputStream(__dirname + '/lib.json');
            ws.write(JSON.stringify(json));
        } else {
            console.log("require protocol and uri");
        }
    });

commander
    .command('plugin <method> <name>')
    .description('add a plugin to project')
    .action(function (method, name) {
        var action = {
            "add": function (name) {
                copyPluginToName(name);
            },
            "new": function (name) {
                copyPluginToName("$default", name);
            }
        };

        if (action.hasOwnProperty(method)) {
            action[method](name);
            console.log("plugin added!");
        } else {
            console.log("plugin " + method, "not exist!");
        }
    });

commander
    .command('project <method> [core] [project]')
    .description('create project')
    .action(function (method, core, project) {

        var action = {
            "new": function (core, project) {
                if (core && project) {
                    copyCore(core, project);
                    console.log("project created!");
                } else {
                    console.log("required argument core and project");
                }
            },
            "build": function () {
                console.log("project built!");
            }
        };

        if (action.hasOwnProperty(method)) {
            action[method](core, project);
        } else {
            console.log("project " + method, "not exist!");
        }
    });


commander.parse(process.argv);
