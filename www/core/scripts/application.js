(function (window, angular) {

    window.application = {
        bootstrap: function (settings) {
            settings.routers = {
                'app': {
                    url: '',
                    templateUrl: settings.templates.masterPage,
                    abstract: true,
                    controller: 'app.master', //master page 定义的controller
                    dependencies: [
                        settings.templates.masterPage.replace(".html", "")
                    ]
                },
                'login': {
                    url: '/login',
                    templateUrl: settings.templates.login,
                    controller: "app.login",
                    dependencies: [
                        settings.templates.login.replace(".html", "")
                    ]
                },
                'app.home': {

                    url: '/home',
                    views: {
                        "content": {
                            templateUrl: function () {
                                return settings.templates.home;
                            }
                        }
                    },
                    dependencies: [
                        settings.templates.home.replace(".html", "")
                    ]
                },
                'app.list': {
                    url: '/:module/:page',
                    views: {
                        "content": {
                            templateUrl: function () {
                                return settings.templates.custom;
                            }
                        }
                    },
                    dependencies: [
                        'plugins/{$module}/pages/{$page}'
                    ]
                },
                'app.list.action': {
                    url: '/:action',
                    views: {
                        "content": {
                            templateUrl: function () {
                                return settings.templates.custom;
                            }
                        }
                    },
                    dependencies: [
                        'plugins/{$module}/pages/{$page}'
                    ]
                }
            };


            angular.module('app.settings', [
                'infrastructure',
                'base.utils',
                'base.ui',
                'ui.select',
                'base.ui.ext',
                'base.grid',
                'ui.router',
                'oc.lazyLoad',
                'ngSanitize',
                'ngDialog',
                //'ngAnimate',
                'angularFileUpload',
                'toastr',
                'pascalprecht.translate',
                'schemaForm'
            ]);

            angular.module('base.ui.ext', [
                'ui.select'
            ]);

            angular.module('base.grid', [
                'ui.grid',
                'ui.grid.selection',
                'ui.grid.resizeColumns',
                'ui.grid.pagination',
                'ui.grid.autoResize',
                'ui.grid.exporter',
                'ui.grid.moveColumns',
                'ui.grid.grouping',
                'ui.grid.edit'
            ]);

            /**
             * 自动路由设置模版
             * params 地址段按长度匹配不同的路由
             * @returns {*}
             */
            function setPageTemplate(params) {

                var routerCases = {
                    1: ['plugins', settings.pluginDefaultName, 'pages', params.name].join('/'),  // 如 /dashboard
                    2: ['plugins', params.module, 'pages', params.page].join('/'), // 如 base/account
                    3: ['plugins', params.module, 'pages', params.page, params.action].join('/') //如 base/account/detail
                };

                var keys = Object.keys(params);
                if (keys.length) {
                    settings.templates.custom = routerCases[Object.keys(params).length] + ".html";
                }
            }

            /**
             * 初始化路由
             * @param settings
             * @param $stateProvider
             * @param $urlRouterProvider
             */
            function initRouters(settings, $stateProvider, $urlRouterProvider) {
                if (settings.routers) {
                    angular.forEach(settings.routers, function (route, name) {

                        if (route.dependencies) {
                            route.resolve = resolves(route.dependencies);
                        }
                        $stateProvider.state(name, route);
                    });
                }
                if (settings.html5Mode) {
                    $locationProvider.html5Mode({
                        enabled: true
                    });
                }
                $urlRouterProvider.otherwise(settings.otherwise);
            }

            /**
             * 处理异步加载依赖的脚本
             * @param dependencies
             * @returns {{resolver: *[]}|*}
             */
            function resolves(dependencies) {
                var definition;
                definition = {
                    resolver: ['$ocLazyLoad', '$stateParams', 'settings',
                        function ($ocLazyLoad, $stateParams) {
                            var list = [];

                            angular.forEach(dependencies, function (dep) {
                                for (var key in $stateParams) {
                                    if ($stateParams.hasOwnProperty(key) && $stateParams[key]) {
                                        dep = dep.replace('{$' + key + '}', $stateParams[key]);
                                    }
                                }
                                if (dep.indexOf("$") < 0)
                                    list.push(dep);
                            });

                            setPageTemplate($stateParams);
                            return $ocLazyLoad.load(list).then(function (res) {

                            }, function (e) {
                                console.log(e);
                            });
                        }]
                };

                return definition;
            }


            /**
             * 处理别名指令
             * @param configItems
             * @param $compileProvider
             */
            function alias(configItems, $compileProvider) {

                angular.forEach(configItems, function (config, alias) {
                    if (angular.isString(config)) {
                        config = {
                            replace: true,
                            template: config
                        };
                    }
                    $compileProvider.directive(alias, function () {
                        return config;
                    });
                });
            }


            function snakeCase(name, separator) {
                separator = separator || '_';
                return name.replace(/[A-Z]/g, function (letter, pos) {
                    return (pos ? separator : '') + letter.toLowerCase();
                });
            }

            function regFormCtrl(p, name) {

                p.addMapping(
                    'bootstrapDecorator',
                    name,
                    "plugins/" + settings.pluginDefaultName + "/templates/forms/" + snakeCase(name, '-') + ".html"
                );
                p.createDirective(
                    name,
                    "plugins/" + settings.pluginDefaultName + "/templates/forms/" + snakeCase(name, '-') + ".html"
                );
            }

            function registerSchemaForm(p) {
                var forms = [
                    'group',
                    'select-multiple',
                    'select2',
                    'uploader',
                    'gallery',
                    'editor',
                    'datePicker',
                    'dateTimePicker',
                    'dateRangePicker',
                    'checkboxes-inline',
                    'inputdialog',
                    'custemplates',
                    'label',
                    'columns',
                    'columns-remark',
                    'radios-inline-remark'
                ];

                angular.forEach(settings.components, function (c) {
                    if (angular.isArray(c)) {
                        angular.forEach(c, function (form) {
                            regFormCtrl(p, form);
                        })
                    }
                });

                angular.forEach(forms, function (form) {
                    regFormCtrl(p, form);
                });
            }

            angular.module('app').config(
                function (settingsProvider,
                          $ocLazyLoadProvider,
                          $stateProvider,
                          $compileProvider,
                          $translateProvider,
                          $translatePartialLoaderProvider,
                          schemaFormDecoratorsProvider,
                          $httpProvider,
                          ngDialogProvider,
                          $urlRouterProvider) {

                    $ocLazyLoadProvider.config({
                        jsLoader: requirejs,
                        debug: false
                    });

                    ngDialogProvider.setDefaults({
                        className: 'ngdialog-theme-plain',
                        plain: false,
                        showClose: false,
                        closeByDocument: false,
                        closeByEscape: true
                    });

                    $httpProvider.interceptors.push('authorityInterceptor');
                    $httpProvider.interceptors.push('operationInterceptor');

                    $translateProvider.useLoader('$translatePartialLoader', {
                        urlTemplate: 'plugins/{part}/i18n/{lang}.json'
                    });
                    $translatePartialLoaderProvider.addPart(settings.pluginDefaultName);
                    $translateProvider.preferredLanguage('zh-CN');
                    $translateProvider.useSanitizeValueStrategy(null);
                    settingsProvider.setSettings(settings);
                    registerSchemaForm(schemaFormDecoratorsProvider);
                    initRouters(settings, $stateProvider, $urlRouterProvider);
                    alias(settings.alias, $compileProvider);
                });

            require.config({
                baseUrl: settings.baseUrl || ""
            });
            require([], function () {
                angular.bootstrap(document, ['app']);
            });

        }
    };

}(window, angular));