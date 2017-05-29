angular
  .module('theme.core.graphics_directives', [])
  .directive('sineCurve', ['GraphicsService', function(GraphicsService) {
    'use strict';
    return {
      restrict: 'A',
      scope: {
          width: '=',
          height: '=',
          num: '='
      },
      link: function(scope, ele) {
        var svg = d3.select(ele[0]).append('svg');

        update();

        scope.$watch('width', function(n, o){
          if (n !== o) {
            update();
          }
        }, true);

        function update(){
          var w = scope.width || 100,
              h = scope.height || 50,
              num = scope.num || 2;

          svg.selectAll('*').remove();
          svg.attr('width', w)
          .attr('height', h)
          .style('width', w )
          .style('height', h );
          svg.append('g')
            .attr('transform', 'translate(0, ' + h / 2 + ')')
              .append('path')
                .attr('d', GraphicsService.getSine(num, w, h));
                
        }
      }
    };
  }]);