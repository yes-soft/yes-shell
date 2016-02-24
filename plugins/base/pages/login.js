angular.module('app').controller("app.login",
    function ($scope, $stateParams, $location, $log, utils, settings, toastr, dialog) {

        $scope.vm = {};
        $scope.vm.loginName = localStorage.getItem("loginName");
        if (localStorage.getItem("rememberPwd") == "true") {
            $scope.vm.password = localStorage.getItem("password");
            $scope.rememberPwd = true;
        }
        var self = $scope;

        $scope.login = function () {
            var data = angular.copy($scope.vm);

            console.log(data);

            utils.ajax({
                'method': "POST",
                'url': 'user/login',
                'data': data
            }).then(function (res) {
                var data = res.data;

                localStorage.setItem("displayName", data.loginName || data.name);

                if ($scope.rememberPwd) {
                    localStorage.setItem("loginName", $scope.vm.loginName);
                    localStorage.setItem("password", $scope.vm.password);
                    localStorage.setItem("rememberPwd", $scope.rememberPwd);
                } else {
                    localStorage.setItem("loginName", $scope.vm.loginName);
                    localStorage.removeItem("password");
                    localStorage.removeItem("rememberPwd");
                }

                location.href = "/";

            }, function (err) {
                console.log(err.data.errors.message);
                toastr.error(err.data.errors.message);
            });
        };
    });