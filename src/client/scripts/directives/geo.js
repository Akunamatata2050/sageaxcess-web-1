angular
  .module('theme.core.geo_directives', [])
  .directive('worldmap', [function() {
    'use strict';
    return {
      restrict: 'A',
      scope: {
          options: '=',
          active: '='
      },
      link: function(scope, ele) {
        var svg = d3.select(ele[0]).append('svg'),
            g = svg.append('g'),
            countries,
            width = 348,
            height = width * 0.395;

        var tip = d3.tip().attr('class', 'd3-tip').html(function(target, d) {
          var valueText = '<span style="color:grey;">No Data</span>',
              regionName = scope.options.names ? scope.options.names[d.properties.a3] : '',
              regionLine = regionName && regionName.toLowerCase() !==  d.properties.name.toLowerCase() ? regionName + '<br>' : '';

          if (scope.options && scope.options.values && scope.options.values[d.properties.a3]) {
            valueText =  '<strong>' + Math.round(scope.options.values[d.properties.a3]) + '%</strong>'; 
          }

          return regionLine + d.properties.name + '<br>' + valueText;
        }).offset([-8, 0]);

        svg.call(tip);

        scope.$watchGroup(['active', 'options'], function(){
            applyOptions();
        });

        var countryOverFunc = function(d) {
          $(this).addClass('hover');
          tip.show(this, d);
        };

        var countryOutFunc = function() {
          tip.hide();
          $(this).removeClass('hover');
        };
       
        function redrawMap(topoData) {
          
          if (!topoData) {
            g.selectAll('*').remove();
            return;
          }

          var projection = d3.geo.equirectangular()
                .scale(width / 2 / Math.PI),
              path = d3.geo.path().projection(projection);

          svg.attr('width', width).attr('height', height);
          countries = g.selectAll('.country').data(topoData);

          countries.enter().insert('path')
              .attr('class', 'country')
              .on('mouseover', countryOverFunc).on('mouseout', countryOutFunc);

          countries.each(function(){
            var th = d3.select(this);

            th.attr('d', path)
              .attr('id', function(d) { return d.id; })
              .attr('title', function(d) { return d.properties.name; });
          });

          countries.exit().remove();

          var box = g.node().getBBox();
          g.attr('transform', 'translate(' + [-box.x, -box.y] + ')');
        }

        function applyOptions() {
          if (!countries) {
            return;
          }

          countries.each(function(d) {
            d3.select(this).style('fill', function(d) { return (scope.options && scope.options.colors) ? scope.options.colors[d.properties.a3] || 'grey' : 'grey';})
              .classed('active', d.properties.a3 === scope.active)
              .classed('hardly-visible', function(d) {return scope.options && scope.options.values && (scope.options.values[d.properties.a3] / scope.options.maxPercentValue) < 0.05;});
          });
        }

        d3.json('assets/maps/world-naturalearth-50.json', function(error, world) {
          var topoData = topojson.feature(world, world.objects.countries).features;
          redrawMap(topoData);
          applyOptions();
        });
      }
    };
  }]);