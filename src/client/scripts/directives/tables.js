'use strict';
angular
  .module('theme.core.tables_directives', [])
  .directive('statCell', [function() {
    return {
      template: '<div class="cell">' +
                  '<span ng-if="!tooltipText" class="value" ng-bind="value.Now | shortNumber"></span>' +
                  '<span ng-if="tooltipText" class="value active" ng-bind="value.Now | number : 0" tooltip-html-unsafe="{{tooltipText}}" tooltip-trigger="mouseenter" tooltip-placement="bottom" tooltip-append-to-body="true"></span>' +
                  '<span class="change" ng-class="diffClass">{{diffString}}</span>' +
                  '<br><span ng-if="!link">{{title}}</span>' +
                  '<a ng-if="link" ng-href="{{link}}">{{title}}</span>' +
                '</div>',
      replace: true,
      scope: {
        value: '=',
        title: '=',
        diff: '=',
        link: '=',
        tooltipText: '=',
      },
      link: function(scope) {
        scope.diffString = '';
        scope.diffClass = '';

        if (scope.diff && scope.value) {
          var diffVal = scope.diff === 'percent' ? (scope.value.Now - scope.value.Was) / scope.value.Was * 100 : scope.value.Now - scope.value.Was;

          console.log('scope.value.Now, scope.value.Was : ', scope.value.Now, scope.value.Was);
          console.log('diffVal: ', diffVal);

          diffVal = Math.round(diffVal);

          scope.diffString = diffVal ? (scope.diff === 'percent' ? diffVal + '%' : diffVal) : '';
          scope.diffClass = {'up green':scope.value.Now > scope.value.Was, 'down red':scope.value.Now < scope.value.Was, 'same':scope.value.Now === scope.value.Was};
        }
      }
    };
  }])
  .directive('sortTable', [function() {
    return {
      restrict: 'A',
      scope: {
        sortBy: '='
      },
      link: function(scope, ele) {
        var attrKey,
            targets =  $('thead', ele).find('[key]');

        updateClasses(targets);

        scope.$watch('sortBy', function(newVal, oldVal) {
          if (newVal !== oldVal) {
            updateClasses(targets);
          }
        }, true);

        targets.on('click', function() {
          if (typeof scope.sortBy === 'undefined') {
            scope.sortBy = {};
          }
          attrKey = $(this).attr('key');
          scope.sortBy.reverse = scope.sortBy.key === attrKey ? !scope.sortBy.reverse : false;
          scope.sortBy.key = attrKey;

          scope.$apply();
        });


        function updateClasses(targets) {
          if (!scope.sortBy) {
            return;
          }

          var attr;
          targets.each(function(){
            attr = $(this).attr('key');
            $(this).removeClass('active up down');
            if (attr === scope.sortBy.key) {
              $(this).addClass('active ' + (scope.sortBy.reverse ? 'up' : 'down'));
            }
          });
        }
      }
    };
  }]);