angular.module('app').controller('app.master',
    function ($scope, $location, $http, tree, utils, $timeout, settings, $ocLazyLoad) {

        $scope.minSize = false;
        var children, menuStack, found;
        $scope.displayName = "";
        menuStack = [];

        var baseUrl = "#/" + settings.pluginDefaultName;
        var menuData = [
            {
                "uid": "biz",
                "name": "业务模块",
                "tip": "业务模块",
                "color": "blue",
                "tag": "base",
                "icon": "fa-desktop",
                "order": 920,
                "url": "#",
                "state": true,
                "parent": "",
                "type": "menu",
                "home": true,
                "blank": false,
                "expanded": true
            },
            {
                "uid": "base",
                "name": "系统管理",
                "tip": "系统管理",
                "color": "blue",
                "tag": "base",
                "icon": "fa-desktop",
                "order": 900,
                "url": "#",
                "state": true,
                "parent": "",
                "type": "menu",
                "home": true,
                "blank": false,
                "expanded": true
            },
            {
                "uid": "biz-example",
                "name": "业务示例",
                "tip": "业务示例",
                "color": "btn-primary",
                "tag": "",
                "icon": "fa-user",
                "order": 100,
                "url": baseUrl + "/example",
                "state": true,
                "parent": "biz",
                "type": "menu",
                "blank": false,
                "expanded": false
            },
            {
                "uid": "base-settings",
                "name": "参数配置",
                "tip": "参数配置",
                "color": "btn-primary",
                "tag": "",
                "icon": "fa-user",
                "order": 100,
                "url": baseUrl + "#/settings",
                "state": true,
                "parent": "base",
                "type": "menu",
                "blank": false,
                "expanded": false
            }
        ];

        $scope.openMethod = "tab";
        $scope.tabs = {
            0: {
                "name": "首页",
                "id": 0,
                "content": "plugins/" + settings.pluginDefaultName + "/pages/default.html",
                "active": true,
                "closable": true
            }
        };

        function getPageFilePath(params) {
            switch (params.length) {
                case 1:
                    return ['plugins', 'infrastructure', 'pages', params[0]].join('/');
                    break;
                case 2:
                    return ['plugins', params[0], 'pages', params[1]].join('/');
                    break;
                case 3:
                    return ['plugins', params[0], 'pages', params[1], params[2]].join('/');
                    break;
                default:
                    return "";
            }
        }

        var index = index || 0;

        function renderTabs(loader, node) {

            var parsed = (node.url || "").split('?')[0].replace('#\/', "").replace('#', "");
            var params = parsed.split('\/');

            var filePath = getPageFilePath(params);

            loader.load(filePath).then(function () {

                index++;
                $scope.tabs[index] = {
                    "name": node.name,
                    "id": index,
                    "url": node.url,
                    "content": filePath + ".html",
                    "active": true
                };
                if (document.body.clientWidth < 768) {
                    $scope.minSize = false;
                }

            });
        }

        $scope.closeTab = function (event, tab) {

            if ($scope.tabs.hasOwnProperty(tab.id)) {
                delete $scope.tabs[tab.id];
            }
        };

        $scope.$on('nav:open-tab', function (event, node) {
            renderTabs($ocLazyLoad, node);
        });

        function setSubMenu(menu) {

            var tree = [];
            if (angular.isObject(menu)) {
                tree.push({
                    name: menu.name,
                    children: menu.children
                });
                $scope.treeSource = tree;

                //$scope.treeSource = menu.children;
                //console.log($scope.treeSource);

            }
        }

        function walkTree(menus, parent) {
            angular.forEach(menus, function (item) {
                if (parent)
                    item.parent = parent;

                walkTree(item.children, item);
            })
        }

        function walkParent(menu) {
            if (menu.parent) {
                menu.parent.expanded = true;
                walkParent(menu.parent);
            }
        }

        function expandedParents() {
            var uri = location.hash.substring(2);

            found = menuStack.filter(function (item) {
                return item.url && item.url.lastIndexOf(uri) > 0;
            });
            if (found.length === 1) {
                walkParent(found[0]);
            } else {
                found = null;
            }
        }

        $scope.operations = {
            calculator: {
                name: '计算器',
                color: "#002A7A",
                icon: 'fa-calculator'
            },
            edit: {
                name: "编辑",
                color: "#0095FF",
                icon: 'fa-edit'
            },
            attach: {
                name: "附件",
                color: "#079E5F",
                icon: 'fa-file'
            },
            lockEdit: {
                name: "锁定编辑",
                color: "#01670B",
                icon: 'fa-lock'
            },
            save: {
                name: "保存",
                color: "#BF3E00",
                icon: 'fa-save'
            },
            commit: {
                name: "提交",
                color: "#CF0000",
                icon: 'fa-check'
            },
            cancel: {
                name: "取消提交",
                color: "#810333",
                icon: 'fa-undo'
            },
            create: {
                name: "新建",
                color: "#1F0055",
                icon: 'fa-plus'
            },
            delete: {
                name: "删除",
                color: "#3000B8",
                icon: 'fa-remove'
            }
        };


        function initMenus() {
            children = children || {};
            $scope.menus = tree.initMenus("", menuData);

            setSubMenu($scope.menus[0]);

            if ($scope.menus.length) {
                children = $scope.menus;
                menuStack = tree.buildMenuTree(menuData);
                walkTree($scope.menus);
            }

            expandedParents();

            $timeout(function () {
                angular.element("a[href='#" + location.hash.replace("#/", "") + "'")
                    .parent().addClass('tree-selected');
            }, 500);
        }

        $scope.load = function () {
            initMenus();
            $scope.displayName = localStorage.getItem("displayName");
        };

        $scope.action = {
            nav: function (item, items) {

                angular.forEach(items, function (item) {
                    item.active = false;
                });

                $scope.currentMenu = item;
                item.active = true;
                setSubMenu(item);
            },
            logout: function () {
                utils.ajax({
                    method: "POST",
                    url: "user/logout"
                }).then(function (res) {
                    localStorage.removeItem("displayName");
                    location.reload();
                }, function (error) {
                    location.reload();
                });
            }
        };

        $scope.loadSubMenus = function (page) {
            $scope.currentPage = page;
        };

        $scope.unLoadSubMenus = function () {
            $scope.treeSource = null;
        };

        $scope.getMenus = function (value) {

            if (!menuStack)
                return [];

            return menuStack.filter(function (raw) {
                return raw.name.includes(value);
            });
        };

        /**
         * 菜单搜索选择处理。
         * @param $item
         */
        $scope.onSelect = function ($item) {
            renderTabs($ocLazyLoad, {
                name: $item.label,
                url: $item.url
            });
            $scope.search = "";
        };

        $scope.load();
    });
