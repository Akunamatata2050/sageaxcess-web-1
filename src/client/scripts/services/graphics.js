(function() {
  'use strict';

  angular.module('app').factory('GraphicsService', function() {
    function getSine(num, width, height) {
        num = num || 2;
        width = width || 100;
        height = height || 50;

        var xScale = width / num / Math.PI,
            yScale = height / 2,
            xO = 0, sY, eY, 
            d = 'M0,0';

        var cp = {
                    s: {x: 0.512286623256592433 * xScale, y: 0.512286623256592433 * yScale}, 
                    e: {x: 1.002313685767898599 * xScale, y: yScale}
                };

        for (var i = 0; i < num; i++) {
            sY = i % 2 ? -cp.s.y : cp.s.y;
            eY = i % 2 ? -cp.e.y : cp.e.y;

            d += 'C' + [xO + cp.s.x, sY, 
                        xO + cp.e.x, eY,
                        xO + Math.PI / 2 * xScale, i % 2 ? -yScale: yScale] + 'S' +  
                       [xO + Math.PI * xScale - cp.s.x, sY, 
                        xO + Math.PI * xScale, 0];

            xO += Math.PI * xScale;
        }

        return d;
    }

    function getArc(x, y, radius, startAngle, endAngle, reverse){
        var coord = [polarToCartesian(x, y, radius, endAngle), polarToCartesian(x, y, radius, startAngle)];
        var largeArc = endAngle - startAngle <= Math.PI ? '0' : '1';
        var sweep = [0, 1];

        if (reverse) {
            coord.reverse();
            sweep.reverse();
        }
        
        var d = [
            'M', coord[0].x, coord[0].y, 
            'A', radius, radius, 0, largeArc, sweep[0], coord[1].x, coord[1].y
        ].join(' ');

        function polarToCartesian(centerX, centerY, radius, angle) {
          return {
            x: centerX + (radius * Math.cos(angle - Math.PI / 2)),
            y: centerY + (radius * Math.sin(angle - Math.PI / 2))
          };
        }

        return d;       
    }

    return {
    	getSine: getSine,
        getArc: getArc
    };
  });
})();
