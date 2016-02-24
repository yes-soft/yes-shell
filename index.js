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

var currentDir = process.cwd();

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
    .command('add <plugin>')
    .description('add a plugin to project')
    .action(function (plugin) {
        var dist = path.resolve(currentDir, "plugins/" + plugin);
        var srcDir = __dirname + '/plugins/' + plugin;

        fs.copy(srcDir, dist, function (fsErr) {
            if (fsErr) return console.error(fsErr);
        });
    });

commander
    .command('new <project>')
    .description('create project')
    .action(function (project) {
        currentDir = path.resolve(currentDir, project);
        var srcDir = __dirname + '/www';

        fs.copy(srcDir, currentDir, function (fsErr) {
            if (fsErr) return console.error(fsErr);
            fs.move(currentDir + "/plugins/$default",
                currentDir + '/plugins/' + project, function (err) {
                    if (err) return console.error(err);
                    console.log("success!");
                });
            var filePath = srcDir + '/index.js';
            vfs.src(filePath)
                // .pipe(replace(/pluginDefaultName:\s\/'\w+/g, "pluginDefaultName: " + "'" + project + "'"))
                .pipe(replace(/\$default/g, project))
                .pipe(vfs.dest(currentDir));
        });

    });

commander.parse(process.argv);
