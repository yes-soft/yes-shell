#!/usr/bin/env node

'use strict';

var fs = require('fs-extra'),
    rfs = require('fs'),
    commander = require('commander'),
    exec = require('child_process').exec,
    path = require('path'),
    config = require('./package.json'),
    replace = require('gulp-replace'),
    os = require('os'),
    glob = require('glob'),
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
                autoConfigPlugin();
            }
        });
    }
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

function scanPlugins() {

    var pluginFolder = currentDir + '/plugins';
    var plugins = glob.sync(pluginFolder + '/*/*.json');
    var settings = {
        components: {},
        queryFormComponents: {},
        schemaFormComponents: {}
    };
    var pluginConfig = {};

    plugins.forEach(function (uri) {
        var pluginName = path.basename(path.parse(uri).dir);
        var directives = getFileNames(currentDir + '/plugins/' + pluginName + '/directives/**/*.js', '.js');
        var queryFormComponents = getFileNames(
            currentDir + '/plugins/' + pluginName + '/templates/query-form/*.html', '.html');
        var schemaFormComponents = getFileNames(
            currentDir + '/plugins/' + pluginName + '/templates/schema-form/*.html', '.html');

        settings.components[pluginName] = directives;
        settings.queryFormComponents[pluginName] = queryFormComponents;
        settings.schemaFormComponents[pluginName] = schemaFormComponents;

        var cfg = require(uri);
        if (cfg && cfg.settings) {
            pluginConfig[pluginName] = cfg.settings;
        }

        if (cfg && cfg.root) {
            settings['pluginDefaultName'] = pluginName;
        }
    });

    settings.plugins = pluginConfig;
    console.log("scan plugin completed!");
    return settings;
}

function getFileNames(src, ext) {
    var items = glob.sync(src);
    var fileNames = [];
    items.forEach(function (p) {
        var name = path.basename(p, ext);
        fileNames.push(name);
    });
    return fileNames;
}

function autoConfigPlugin() {
    var coreType = getCoreType();
    if (coreType) {
        var to = currentDir + "/plugins";
        var from = getLibPath() + '/' + coreType + '/plugins/config.js';

        var pluginInfo = scanPlugins();
        var jsContent = JSON.stringify(pluginInfo);
        var str = "application.plugin = " + jsContent;

        vfs.src(from)
            .pipe(replace("var $code_template = true;", str))
            .pipe(vfs.dest(to));
    }
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
                autoConfigPlugin();
            }
        };

        if (action.hasOwnProperty(method)) {
            action[method](core, project);
        } else {
            console.log("project " + method, "not exist!");
        }
    });

commander.parse(process.argv);