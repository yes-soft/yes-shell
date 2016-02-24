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

            settings.queryPool = {};

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
                                if (dep.indexOf("{$") < 0)
                                    list.push(dep);
                            });

                            setPageTemplate($stateParams);

                            return $ocLazyLoad.load(list).then(function (res) {

                            }, function (e) {
                                console.log("load error:", e);
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

            function registerSchemaFormComponent(provider, name, tplUrl) {
                provider.addMapping(
                    'bootstrapDecorator',
                    name,
                    tplUrl
                );
                provider.createDirective(
                    name,
                    tplUrl
                );
            }

            function registerSchemaForms(provider) {

                angular.forEach(settings.schemaFormComponents, function (items, key) {
                    angular.forEach(items, function (item) {
                        registerSchemaFormComponent(provider, key + '-' + item, 'plugins/' +
                            key + '/templates/schema-form/' + item + '.html');
                    });
                });

                var baseSchemaForms = [
                    'group',
                    'select-multiple',
                    'select2',
                    'select',
                    'editor',
                    'textarea',
                    'datePicker',
                    'dateTimePicker',
                    'dateRangePicker',
                    'checkboxes-inline',
                    'label',
                    'columns'
                ];

                angular.forEach(baseSchemaForms, function (item) {
                    registerSchemaFormComponent(provider, item,
                        'ui/templates/forms/' + item + '.html');
                });

            }

            function registerQueryForms() {
                angular.forEach(settings.queryFormComponents, function (items, key) {
                    angular.forEach(items, function (item) {
                        registerQueryFormComponent(key + '-' + item, 'plugins/' +
                            key + '/templates/query-form/' + item + '.html');
                    });
                });
            }

            function registerQueryFormComponent(name, tplUrl) {
                settings.queryPool[name] = tplUrl;
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

                    registerSchemaForms(schemaFormDecoratorsProvider);
                    registerQueryForms();
                    initRouters(settings, $stateProvider, $urlRouterProvider);
                    alias(settings.alias, $compileProvider);
                });

            require.config({
                baseUrl: settings.baseUrl || ""
            });

            var components = [];

            angular.forEach(settings.components, function (items, key) {
                angular.forEach(items, function (item) {
                    components.push('plugins/' + key + '/directives/' + item);
                });
            });

            require(components, function () {
                angular.bootstrap(document, ['app']);
            });

        }
    };

}(window, angular));