angular
  .module('theme', [
    'ngCookies',
    'ngResource',
    'ngSanitize',
    'ngRoute',
    'ngAnimate',
    /*'easypiechart',*/
    /*'NgSwitchery',
    'sun.scrollable',*/
    'ui.bootstrap',
    'ui.select',
    'theme.core.templates',
    'theme.core.template_overrides',
    'theme.core.directives',
    'theme.core.custom_directives',
    'theme.core.diagram_directives',
    'theme.core.charts_directives',
    'theme.core.reoi_directives',
    'theme.core.graphics_directives',
    'theme.core.monitoring_diagram_directives',
    'theme.core.geo_directives',
    'theme.core.tables_directives',
    'theme.core.main_controller',
    'theme.core.navigation_controller',
    'theme.core.messages_controller',
    'theme.core.notifications_controller',    
    'theme.core.downloads_controller',
    'theme.core.dashboard_controller',
    'theme.core.user_details_controller',
    'theme.core.user_relationships_controller',
    'theme.core.activity_controller',
    'theme.core.intelligence_controller',
    'theme.core.anomaly_controller',
    'theme.core.reoi_controller',
    'theme.core.reoi_details_controller',
    'theme.core.user_relationship_controller',
    'theme.core.monitoring_controller',
    'theme.core.system_details_controller',
    'jlareau.pnotify',
    'nvd3ChartDirectives',
    'legendDirectives',
    'angularUtils.directives.dirPagination'
  ])
  .config(function(paginationTemplateProvider) {
        paginationTemplateProvider.setPath('views/templates/dir-pagination.html');
  })
  .constant('nanoScrollerDefaults', {
    nanoClass: 'scroll-pane',
    paneClass: 'scroll-track',
    sliderClass: 'scroll-thumb',
    contentClass: 'scroll-content'
  })
  .run(['$window', function ($window) {
      'use strict';
    /*$window.ngGrid.config = {
        footerRowHeight: 40,
        headerRowHeight: 40,
        rowHeight: 40
    };*/
  }]);

