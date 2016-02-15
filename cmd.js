'use strict';

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {'default': obj};
}

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _commander = require('commander');

var _commander2 = _interopRequireDefault(_commander);

var _fsExtra = require('fs-extra');

var _fsExtra2 = _interopRequireDefault(_fsExtra);

var sep = _path2['default'].sep;

var cwd = process.cwd();
var projectRootPath = cwd;

_commander2['default'].usage('[command] <options ...>');

_commander2['default'].option('-v, --version', 'output the version number', function () {
    console.log('Version ....2');
});

_commander2['default'].command('new <projectPath>').description('create project').action(function (projectPath) {

    projectRootPath = _path2['default'].resolve(projectRootPath, projectPath);

    _fsExtra2['default'].copy(__dirname + '/www', projectRootPath, function (err) {
        if (err) return console.error(err);

        _fsExtra2['default'].move(projectRootPath + '/plugins/default', projectRootPath + '/plugins/' + projectPath, function (err) {
            if (err) return console.error(err);
            console.log('success!');
        });

        console.log('success!');
    });
});

_commander2['default'].parse(process.argv);