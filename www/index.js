/* global requirejs */
/* global angular */
(function () {

    var settings = {
        host: 'self', //当前API调用的主机头
        mock: window.debugging || false,  //如果是mock状态则API调取得静态的目录data下的json
        debug: window.debugging || false, //如启用debug 则服务log 输出日志
        apiPrefix: "api", //api调用的地址前缀
        language: 'zh-CN', //当前语言的设定
        pageSize: 20, //分页默认大小,
        uiGrid: {
            enableGridMenu: true, //启用表格菜单
            exporterMenuCsv: true, //启用导出CSV的菜单
            exporterMenuPdf: false,//启用导出PDF的菜单
            enablePaginationControls: true,//启用表格自带的分页控件
            enableFiltering: false,//启用表格内的查询过滤输入框
            enableRowHeaderSelection: true, //启用左侧选择栏
            exporterOlderExcelCompatibility: true, //导出兼容旧版本excel的格式
            useExternalPagination: true, //使用服务端分页,
            paginationPageSizes: [20, 200, 1000], //表格分页页大小选项
            paginationPageSize: 20,//表格分页页大小
            minRowsToShow: (document.documentElement.clientHeight / 26) - 9,
            rowHeight: 26,
            virtualizationThreshold: 1000  //虚拟化阈值
        },
        logo: "themes/default/images/logo.png",
        logoTitle: "JFMS",
        otherwise: 'home',
        templates: {},
        plugins: {},
        components: {},
        pluginDefaultName: 'default'
    };

    settings.templates = {
        'masterPage': 'plugins/' + settings.pluginDefaultName + '/pages/master.html', //根布局母模版
        'login': 'plugins/' + settings.pluginDefaultName + '/pages/login.html', //登录页面模版
        'home': 'plugins/' + settings.pluginDefaultName + '/pages/home.html' //首页
    };

    /**
     * 插件的设置项
     */
    settings.plugins.base = {
        version: "x.x.x",
        getByAttIdUrl: "/base/attachment/getByAttId",
        uploadUrl: "/base/attachment/upload",
        getUuid: "/base/attachment/getUuid",
        delByUid: "/base/attachment/"
    };

    /**
     * 插件的业务组件声明,不要手动修改
     */
    settings.components.base = ['base.uploader', 'base.gallery'];

    application.bootstrap(settings);


}());