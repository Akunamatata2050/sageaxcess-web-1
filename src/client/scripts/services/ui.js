/*jshint bitwise: false*/

(function() {
  'use strict';

  angular.module('app').factory('UI', function() {

      var transform = function(el, value) {
        $(el).css({
          'transform':value,
          '-ms-transform':value,
          '-webkit-transform':value, 
          '-moz-transform':value,
        });
      };

      var translate = function(el, x, y) {
        transform(el, 'translate(' + x + 'px,' + y + 'px)');
      };

      var shake = function(el) {
        $({t:0}).animate({t:2}, {
            duration: 500,
            step: function(val) {
                var sineValue = Math.sin((val * 2 - 1) * Math.PI);
                translate(el, sineValue * 4, 0);
            }
        });
      };

      function rgbToHex(r, g, b) {
          return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
      }

      function hsvToRgb(h, s, v) {
          var r, g, b;
          var i;
          var f, p, q, t;
           
          // Make sure our arguments stay in-range
          h = Math.max(0, Math.min(360, h));
          s = Math.max(0, Math.min(100, s));
          v = Math.max(0, Math.min(100, v));
           
          // We accept saturation and value arguments from 0 to 100 because that's
          // how Photoshop represents those values. Internally, however, the
          // saturation and value are calculated from a range of 0 to 1. We make
          // That conversion here.
          s /= 100;
          v /= 100;
           
          if(s === 0) {
              // Achromatic (grey)
              r = g = b = v;
              return [
                  Math.round(r * 255), 
                  Math.round(g * 255), 
                  Math.round(b * 255)
              ];
          }
           
          h /= 60; // sector 0 to 5
          i = Math.floor(h);
          f = h - i; // factorial part of h
          p = v * (1 - s);
          q = v * (1 - s * f);
          t = v * (1 - s * (1 - f));
           
          switch(i) {
              case 0:
                  r = v;
                  g = t;
                  b = p;
                  break;
           
              case 1:
                  r = q;
                  g = v;
                  b = p;
                  break;
           
              case 2:
                  r = p;
                  g = v;
                  b = t;
                  break;
           
              case 3:
                  r = p;
                  g = q;
                  b = v;
                  break;
           
              case 4:
                  r = t;
                  g = p;
                  b = v;
                  break;
           
              default: // case 5:
                  r = v;
                  g = p;
                  b = q;
          }
           
          return [
              Math.round(r * 255), 
              Math.round(g * 255), 
              Math.round(b * 255)
          ];
      }

      var getColorByString = function(str, hRange, sRange, vRange) {
        var lowerCase = str.replace(/\W/g, '').toLowerCase(),
            countedSymbols = Math.min(lowerCase.length, 10),
            max = countedSymbols * 25,
            scale,
            strSum = 0;

        hRange = hRange || [0, 360];
        sRange = sRange || [0, 100];
        vRange = vRange || [0, 100];

        for (var i = 0; i < countedSymbols; i++) {
          strSum += lowerCase.charCodeAt(i) - 97;
        }

        scale = strSum / (max / 3) % 1;

        var hsv = [
          hRange[0] + scale * (hRange[1] - hRange[0]), 
          sRange[0] + scale * (sRange[1] - sRange[0]), 
          vRange[0] + scale * (vRange[1] - vRange[0])
        ];
       
        var rgb = hsvToRgb(hsv[0], hsv[1], hsv[2]);

        return rgbToHex(rgb[0], rgb[1], rgb[2]);
      };

      function wrapSvgText(textNode, maxLen) {
        var textLength = textNode.getComputedTextLength(),
            text = textNode.textContent,
            ellipsisLength = (textLength / text.length) * 2, // attempt to guess
            newText, numSymbols;

        while (text.length) {
          numSymbols = Math.floor(maxLen / (textLength + ellipsisLength) * text.length);
          newText = text.slice(0, numSymbols);

          if (newText === text) {
            return;
          }

          text = newText;
          textNode.textContent = text + '...';
          textLength = textNode.getComputedTextLength();
          ellipsisLength = 0;
        }
      }

        function ToolTip(className) {
            this.container = d3.select('body').append('div').attr('class', 'diagram-tooltip-container ' + (className || ''));
            this.tooltip = this.container.append('div').attr('class', 'diagram-tooltip diagram-tooltip-bottom diagram-tooltip-hidden');
            this.content = this.tooltip.append('div').attr('class', 'diagram-tooltip-content');
        }

        ToolTip.prototype.hide = function() {
            this.tooltip.classed('diagram-tooltip-hidden', true);
        };

        ToolTip.prototype.show = function(ele) {
            this.tooltip.classed('diagram-tooltip-hidden', false);
            var offset = $(ele).offset(),
                box = ele.getBBox();
            this.place(offset.left, offset.top, box.width, box.height);         
        };

        ToolTip.prototype.place = function(x, y, width, height) {
            var classes = ['diagram-tooltip-bottom', 'diagram-tooltip-top'];
            if (y < $(this.tooltip.node()).height()) {
                classes.reverse();
            }
            this.container.style({'left':x + 'px', 'top':y  + 'px', 'width':width + 'px', 'height':height + 'px'}).select('.diagram-tooltip').classed(classes[0], false).classed(classes[1], true);
        };

        ToolTip.prototype.remove = function() {
            this.container.remove();
        };

      return {
        transform: transform,
        translate:translate,
        shake:shake,
        rgbToHex:rgbToHex,
        hsvToRgb:hsvToRgb,
        getColorByString:getColorByString,
        wrapSvgText:wrapSvgText,
        ToolTip: ToolTip
      };
    }
  );
})();
