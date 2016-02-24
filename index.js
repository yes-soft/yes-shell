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
        console.log("yes-ui serving", "127.0.0.1:", port);
    });
}

function copyPluginToName(name, newName) {
    var dest = newName || name;
    var dist = path.resolve(currentDir, "plugins/" + dest);
    var srcDir = __dirname + '/plugins/' + name;

    fs.copy(srcDir, dist, function (fsErr) {
        if (fsErr) return console.error(fsErr);
    });
}

function changeDefaultPluginName(newName, dest) {

    var dist = dest || currentDir;
    var filePath = __dirname + '/www/index.js';
    vfs.src(filePath)
        // .pipe(replace(/pluginDefaultName:\s\/'\w+/g, "pluginDefaultName: " + "'" + project + "'"))
        .pipe(replace(/\$default/g, newName))
        .pipe(vfs.dest(dist));
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
    .command('add <plugin> [name]')
    .description('add a plugin to project')
    .action(function (plugin) {
        copyPluginToName(plugin, name);
        console.log("plugin added!");
    });

commander
    .command('new <project> [name]')
    .description('create project')
    .action(function (project, name) {
        currentDir = path.resolve(currentDir, project);
        var srcDir = __dirname + '/www';
        var pluginName = name || "$default";
        fs.copy(srcDir, currentDir, function (fsErr) {
            if (fsErr) return console.error(fsErr);
            copyPluginToName(pluginName, project);
            changeDefaultPluginName(project);
            console.log("project created!");
        });
    });

commander.parse(process.argv);
