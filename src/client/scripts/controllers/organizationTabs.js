(function() {
  'use strict';

  function OrganizationTabsCtrl($scope, $location) {
    var vm = this;
    
    var tabName=$location.url().split('/')[2];
    vm.tabs=[{'Name':'Organization','TemplateUrl':'views/organization/form.html','Status':true},
    {'Name':'Offices','TemplateUrl':'views/office/list.html','Status':false},
    {'Name':'Departments','TemplateUrl':'views/department/list.html','Status':false},
    {'Name':'Settings','TemplateUrl':'views/organization/settings.html','Status':false},
    {'Name':'Networks','TemplateUrl':'views/networks/list.html','Status':false},
    {'Name':'Export','TemplateUrl':'views/organization/export_session.html','Status':false},
    {'Name':'KeyPairs','TemplateUrl':'views/organization/key_pair_list.html','Status':false}
    ]; 

  


    vm.gotoTab=gotoTab;    

    setActiveTab(tabName);

    function setActiveTab(name){            
      vm.tabs.forEach(function(item){
        if (item.Name.toLowerCase()===name.split('?')[0]){
          item.Status=true;
        } else{
          item.Status=false;
        }  
      });
    }

    function gotoTab(name){            
      $location.path('/admin/'+name.toLowerCase());
    }
  }

  OrganizationTabsCtrl.$inject = [
  '$scope', '$location'
  ];

  angular.module('theme.core.main_controller').controller('OrganizationTabsCtrl', OrganizationTabsCtrl);
}).call(this);