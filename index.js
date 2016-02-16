#!/usr/bin/env node

'use strict';

var fs = require('fs-extra'),
    commander = require('commander'),
    exec = require('child_process').exec,
    path = require('path'),
    config = require('./package.json'),
    os = require('os'),
    portfinder = require('portfinder'),
    httpServer = require('http-server');

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
    .command('start [args]')
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

//commander
//    .command('exec [args]')
//    .description('start current project')
//    .action(function (args) {
//        //exec('httpserver', function (err, stdout) {
//        //    if (err) throw err;
//        //    console.log(stdout);
//        //    process.stdout.write(stdout);
//        //});
//    });

commander
    .command('new <project>')
    .description('create project')
    .action(function (project) {
        currentDir = path.resolve(currentDir, project);
        fs.copy(__dirname + '/www', currentDir, function (fsErr) {
            if (fsErr) return console.error(fsErr);
            fs.move(currentDir + "/plugins/default",
                currentDir + '/plugins/' + project, function (err) {
                    if (err) return console.error(err);
                    console.log("success!");
                });
        });
    });

commander.parse(process.argv);


if (process.platform === 'win32') {
    require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
    }).on('SIGINT', function () {
        process.emit('SIGINT');
    });
}

process.on('SIGINT', function () {
    console.log('yes-ui stopped.'.red);
    process.exit();
});

process.on('SIGTERM', function () {
    console.log('yes-ui stopped.'.red);
    process.exit();
});