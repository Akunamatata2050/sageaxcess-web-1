'use strict';
angular
.module('theme.core.charts_directives', [])
.directive('radialChart', function () {
  return {
    restrict: 'A',
    scope: {
      value: '=',
      radius: '='
    },
    link: function (scope, ele) {
      scope.$watch('value', function(){
          update();
      });

      var radius = scope.radius || 50,
          outerWidth = 0.054, // the width of stroke related to radius
          innerWidth = 0.054,
          spacingWidth = 0.018,
          outerRadius = (1 - outerWidth / 2) * radius,
          outerLength = 2 * Math.PI * outerRadius;

      var arc = d3.svg.arc()
        .innerRadius(radius * (1 - outerWidth - spacingWidth))
        .outerRadius(radius * (1 - outerWidth - spacingWidth - innerWidth))
        .startAngle(Math.PI)
        .cornerRadius(radius * innerWidth / 2);

      var svg = d3.select(ele[0]).append('svg')
        .attr('width', radius*2)
        .attr('height', radius*2)
        .style('width', radius*2 )
        .style('height', radius*2 )
        .append('g')
          .attr('transform', 'translate(' + ele.width()/2 + ',' + ele.height()/2 + ')');

      svg.append('circle')
          .attr('class', 'marking')
          .attr('cx', 0)
          .attr('cy', 0)
          .attr('r', outerRadius)
          .attr('stroke-width', radius * outerWidth)
          .attr('stroke-dasharray', '1,' + (outerLength - 60) / 60)
          .attr('fill', 'none');

      var arcPath = svg.append('path')
          .attr('class', 'arc')
          .attr('stroke-width', 0);

      update();

      function update() {
        if (!scope.value) {
          return;
        }

        arc.endAngle(Math.PI + scope.value * Math.PI * 2);
        arcPath.attr('d', arc());
      }
    }
  };
});