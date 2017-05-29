'use strict';
angular
  .module('theme.core.diagram_directives', [])
   .directive('zoomControl', function () {
    return {
      restrict: 'A',
      replace: true,
      templateUrl: 'views/templates/zoom.html',
      scope: {
        value: '=?',
        min: '=?',
        max: '=?',
        step: '=?'
      },
      link: function (scope, ele) {
        scope.value = scope.value || 0;
        scope.min = scope.min || 0;
        scope.max = typeof scope.max === 'undefined' ? 1 : scope.max;
        scope.step = scope.step || 0.1;

        var pointer = ele.find('.zoom-pointer'), scale;

        scope.$watchGroup(['value'], function(){
          initScale();
          updatePointer();
        });

        updatePointer();

        ele.find('.zoom-out').on('mousedown', function(e){
          e.preventDefault();
          setValue(scope.value - scope.step);
        });

        ele.find('.zoom-in').on('mousedown', function(e){
          e.preventDefault();
          setValue(scope.value + scope.step);
        });

        ele.find('.zoom-no-scale-mark').css({
          'left': scale * 100 + '%'
        });

        function setValue(value) {
          scope.value = Math.max(scope.min, Math.min(scope.max, value));
          updatePointer();
          scope.$apply();
        }

        function initScale(){
          scale = Math.max(0, Math.min(1, (scope.value - scope.min) / (scope.max - scope.min)));
        }

        function updatePointer() {
          initScale();
          pointer.css({'left':scale * 100 + '%'});
        }
      }
    };
  })
  .directive('relationship', ['DiagramsService', '$window', 'UI', 'GraphicsService', function (DiagramsService, $window, UI, GraphicsService) {
    return {
      restrict: 'A',
      replace: false,
      scope: {
        data: '=',
        updateFunc: '&',
        colors: '=',
        sortKey: '=',
        zoom: '=?',
        zoomStep: '=?',
        hideLinks: '=?',
        centerIcons: '=?'
      },
      link: function (scope, ele) {
        var svg, 
            background,
            backingG,
            panG,
            offsetG,
            newLevelsG,
            newLevelsOffsetG,
            mainG, 
            opacityG,
            centerG,
            selectionG,
            itemsG,
            overlayG,
            levelsOverlays,
            defs,
            centerImage,
            centerImageScale,
            centerCircle,
            centerCircleNameOffset,
            centerCircleStatusOffset,
            levels, 
            newLevels,
            levelsTextPaths,
            levelsNames,
            levelNameMargin,
            data, 
            basicColors, 
            outerGap, 
            centerRadius, 
            centerGap,
            outerRadius,
            maxAbsPointRadius,
            minMax,
            pointSpacing,
            updateTimeout,
            levelSpacing,
            centerTypePath,
            centerTypeText,
            centerNamePath,
            zoomOrigin,
            centerNameText,
            mDownCoord,
            mDownOffset,
            positionOffset,
            linksG,
            linkLevels,
            arrowheadSize,
            arrowheads,
            arrowheadsConstantColors,
            markers,
            gradients,
            linesTransitionObj,
            linksLinesScale,
            selection,
            selectionContainer,
            selectionStrokeWidth,
            selectedItemId,
            maxPointRadius,
            oldZoom,
            balloonContent,
            balloon,
            balloonContainer,
            linkMousePoint,
            linksAreDisabled,
            hoverLink,
            linksMouse,
            drag;

        create();

        scope.$watchGroup(['data', 'sortKey', 'zoom'], function(){
          update();
        });

        scope.$watch('hideLinks', function(){
          transitionLines();
        });

        angular.element($window).bind('resize', function(){
          clearTimeout(updateTimeout);
          updateTimeout = setTimeout(function(){
            update();
          }, 100);
        });

        function transitionLines() {
          $(linesTransitionObj).animate({t:scope.hideLinks ? 0 : 1}, {
              duration: 700,
              easing: 'swing',
              queue: false,
              step: function(now) {
                linksLinesScale = now;
                linksG.style('opacity', now);
                updateLinksLines();
              }
          });
        }

        function addZoomOffset() {
            var cMX = positionOffset[0] - zoomOrigin[0],
                cMY = positionOffset[1] - zoomOrigin[1];

            var scale = scope.zoom / oldZoom;

            positionOffset[0] += cMX * scale - cMX;
            positionOffset[1] += cMY * scale - cMY;
            panG.attr('transform', 'translate(' + positionOffset + ')');

            oldZoom = scope.zoom;
        }

        function hideTooltip() {
          balloon.classed('diagram-tooltip-hidden', true);
        }

        function showTooltip(ele, d) {
          balloon.classed('diagram-tooltip-hidden', false);
          var offset = $(ele).offset(),
              box = ele.getBBox();

          updateTooltipContent(d);
          placeTooltip(offset.left, offset.top, box.width, box.height);         
        }

        function placeTooltip(x, y, width, height) {
          var classes = ['diagram-tooltip-bottom', 'diagram-tooltip-top'];
          if (y < $(balloon.node()).height()) {
            classes.reverse();
          }
          balloonContainer.style({'left':x + 'px', 'top':y  + 'px', 'width':width + 'px', 'height':height + 'px'}).select('.diagram-tooltip').classed(classes[0], false).classed(classes[1], true);
        }

        function updateTooltipContent(data) {
          var rows, nameRow,
              fields = ['Ports', 'Protocols', 'Activities', 'Actions'];

          nameRow = balloonContent.selectAll('.tooltip-title').data(data.Name ? [data.Name] : []);
          nameRow.enter().insert('div', ':first-child').attr('class', 'tooltip-title');
          nameRow.exit().remove();
          nameRow.each(function(d){
            d3.select(this).text(d);
          });

          rows = balloonContent.selectAll('.tooltip-row').data(fields.filter(function(key){ return data[key]; }));
          rows.enter().append('div').attr('class', 'tooltip-row').each(function(){
            d3.select(this).append('span').attr('class', 'tooltip-row-name');
          });
          rows.exit().remove();

          rows.each(function(d) {
            var items, 
                th = d3.select(this);

            th.select('.tooltip-row-name').text(d + ': ');
            items = th.selectAll('.tooltip-row-item').data(typeof data[d] === 'number' ? [data[d]] : data[d]);

            items.enter().append('span').attr('class', 'tooltip-row-item');
            items.each(function(d){
              var th = d3.select(this), text = '';

              if (typeof d === 'string' || typeof d === 'number') {
                text = d;
              }
              else if (typeof d === 'object') {
                text = d.value;

                if (d.color) {
                  th.style('color', d.color);
                }
              }

              th.text(text + ' ');
            });
            items.exit().remove();
          });
        }

        function create() {
          positionOffset = [0, 0];
          zoomOrigin = [0, 0];
          scope.zoom = scope.zoom || 1;
          scope.zoomStep = scope.zoomStep || 0.1;
          scope.centerIcons = scope.centerIcons || {};
          oldZoom = scope.zoom;
          scope.hideLinks = scope.hideLinks || false;
          linksLinesScale = scope.hideLinks ? 0 : 1;
          svg = d3.select(ele[0]).append('svg');
          background = svg.append('rect').attr('class', 'background');
          panG = svg.append('g').attr('class', 'pan-g');
          offsetG = panG.append('g').attr('class', 'offset-g');
          mainG = offsetG.append('g').attr('class', 'main-g');
          newLevelsOffsetG = mainG.append('g').attr('class', 'new-levels-offset-g');
          newLevelsG = newLevelsOffsetG.append('g').attr('class', 'new-levels-g');
          opacityG = mainG.append('g').attr('class', 'opacity-g');
          backingG = opacityG.append('g');
          backingG.append('circle').attr('class', 'center-circle');
          selectionG = opacityG.append('g').attr('class', 'selections');
          itemsG = opacityG.append('g').attr('class', 'items');
          linksG = opacityG.append('g').attr('class', 'links');
          centerG = opacityG.append('g').attr('class', 'center-g');
          overlayG = opacityG.append('g').attr('class', 'overlay');
          centerCircle = centerG.append('circle').attr('class', 'center-circle');
          selection = selectionG.append('g').attr('class', 'selection');
          selectionContainer = selection.append('g').attr('class', 'selection-container');
          selectionContainer.append('path').attr('class', 'dashed-circle');
          selectionContainer.append('path').attr('class', 'outer-circle');
          selectionStrokeWidth = 5;
          basicColors = d3.scale.category20();
          outerGap = 150;
          centerGap = 25;
          centerRadius = 52;
          maxAbsPointRadius = 17;
          pointSpacing = 5;
          centerImageScale = 0.6;
          centerCircleNameOffset = 10;
          centerCircleStatusOffset = 18;
          levelNameMargin = 5;
          arrowheadSize = [10, 5];
          linesTransitionObj = {t:1};
          arrowheadsConstantColors = [{'color':'red', 'id':'red'}, {'color':'black', 'id':'black'}];
          defs = svg.append('defs');
          linkMousePoint = overlayG.append('circle').attr({'r':4, 'stroke-width':0, 'class':'link-mouse-point'}).attr('visibility', 'hidden');
          newLevelsG.append('circle').attr({'class':'new-center', 'r':centerRadius});
          newLevelsG.append('text').text('Loading...').attr({'text-anchor':'middle', 'dominant-baseline':'middle'});

          balloonContainer = d3.select('body').append('div').attr('class', 'diagram-tooltip-container');
          balloon = balloonContainer.append('div').attr('class', 'diagram-tooltip relationship-tooltip diagram-tooltip-bottom diagram-tooltip-hidden');
          balloonContent = balloon.append('div').attr('class', 'diagram-tooltip-content');

          background.on('click', function(){
            if (d3.event.defaultPrevented) {
              return;
            }

            setSelection();
          });

          centerG.on('click', function(){
            setSelection();
          });

          svg.on('dblclick', function(){
            zoomOrigin = d3.mouse(this);
            zoomOrigin[0] -= $(svg.node()).width() / 2;
            zoomOrigin[1] -= $(svg.node()).height() / 2;
            scope.zoom += scope.zoomStep;
            scope.$apply();
          });

          centerImage = defs.append('g').attr({'id':'centerImage'});
          centerImage.append('image')
                .attr({'preserveAspectRatio':'xMidYMid meet', 'width':centerRadius * centerImageScale * 2, 'height':centerRadius * centerImageScale * 2, 'viewBox':'0 0 ' + (centerRadius * centerImageScale * 2) + ' ' + (centerRadius * centerImageScale * 2)})
                .attr({'x':-centerRadius * centerImageScale, 'y':-centerRadius * centerImageScale});

          centerTypePath = defs.append('path').attr({'id':'centerTypePath'});
          centerNamePath = defs.append('path').attr({'id':'centerNamePath'});
          centerTypeText = centerG.append('text').attr('text-anchor', 'middle')
            .attr('class', 'center-type')
              .append('textPath')
              .attr({'startOffset': '50%', 'xlink:href': '#centerTypePath'});

          markers = defs.append('g').attr('class', 'markers');
          gradients = defs.append('g').attr('class', 'gradients');

          centerNameText = centerG.append('text').attr('text-anchor', 'middle')
             .attr('class', 'center-name')
              .append('textPath')
              .attr({'startOffset': '50%', 'xlink:href': '#centerNamePath'});

          centerG.append('use').attr({'xlink:href':'#centerImage'});

          drag = d3.behavior.drag();
          d3.select(ele[0]).call(drag);

          drag.on('dragstart', function(){
            d3.event.sourceEvent.stopPropagation();
            d3.event.sourceEvent.preventDefault();
            mDownCoord = [d3.event.sourceEvent.clientX, d3.event.sourceEvent.clientY];
            mDownOffset = positionOffset.slice(0);

          }).on('drag', function(){
            d3.event.sourceEvent.stopPropagation();
            d3.event.sourceEvent.preventDefault();
            var mCoord = [d3.event.sourceEvent.clientX, d3.event.sourceEvent.clientY];
            positionOffset[0] = mDownOffset[0] + mCoord[0] - mDownCoord[0];
            positionOffset[1] = mDownOffset[1] + mCoord[1] - mDownCoord[1];
            panG.attr('transform', 'translate(' + positionOffset + ')');
          });
        }

        function update() {
          if (!scope.data || !Object.keys(scope.data).length){
            return;
          }

          addZoomOffset();

          data = angular.copy(scope.data);
          addServiceCounts(data);
          sortValues(data);
          outerRadius = Math.max(centerRadius + data.Levels.length * 20, ele.width() / 2 - outerGap);
          offsetG.classed('animated', false).style({'transform':'translate(0, 0)'});
          opacityG.style({'opacity':1});
          mainG.classed('center-active', data.Center.IsActive);
          mainG.selectAll('.center-circle').attr('r', centerRadius);
          mainG.style({'opacity':1});
          newLevelsG.style({'opacity':0, 'transform':'scale(0)'});
          levels = itemsG.selectAll('.level').data(data.Levels);
          newLevels = newLevelsG.selectAll('.new-level').data(data.Levels);
          levelsTextPaths = defs.selectAll('.level-path').data(data.Levels);
          levelsNames = itemsG.selectAll('.level-name').data(data.Levels);
          minMax = getMinMax(data);
          levelSpacing = (outerRadius - centerRadius - centerGap) / data.Levels.length;
          centerTypePath.attr('d', GraphicsService.getArc(0, 0, (centerRadius + centerCircleNameOffset), Math.PI * 1.5, Math.PI * 0.5, true));
          centerNamePath.attr('d', GraphicsService.getArc(0, 0, (centerRadius + centerCircleStatusOffset), Math.PI * 0.5, Math.PI * 1.5, false));
          centerTypeText.text(data.Center.Type.replace(/(.*)s$/, '$1'));
          centerNameText.text(data.Center.Name);
          centerImage.select('image').attr({'xlink:href':scope.centerIcons[data.Center.Type] || ''});
          updateArrowheads(data);
          levelsTextPaths.enter().append('path').attr('class', 'level-path');

          levelsTextPaths.each(function(d, index){
            d3.select(this).attr('d', GraphicsService.getArc(0, 0, (centerRadius + centerGap + levelSpacing * (index + 1)) * scope.zoom, Math.PI * 1.5, Math.PI * 0.5, true))
              .attr('id', 'level-textpath-' + index);
          });

          levelsNames.enter().append('text')
            .attr('class', 'level-name')
            .attr('fill', function(d, index) { return colorFunc()(index);})
            .attr('text-anchor', 'middle').each(function(){
            d3.select(this).append('textPath').attr({'startOffset': '50%'});
          });

          levelsNames.each(function(d, index){
            d3.select(this).select('textPath').attr({'xlink:href': '#level-textpath-' + index}).text(d.Type);
          });

          levels.enter().append('g')
            .attr('class', 'level').each(function(){
                d3.select(this).append('path').attr('class', 'track');
                overlayG.append('g').attr('class', 'level-overlay');
            });

          newLevels.enter().append('circle').attr('class', 'new-level');

          levelsOverlays = overlayG.selectAll('.level-overlay');

          levels.each(function(d, index) {
            this._radius = (centerRadius + centerGap + levelSpacing * (index + 1)) * scope.zoom;
            this._color = colorFunc()(index);
            this._index = index;
            this._isOuter = index === (data.Levels.length - 1);
            this._tunnelAngle = (levelsNames[0][index].getBBox().width + levelNameMargin * 2) / (2 * Math.PI *  this._radius) * Math.PI * 2;

            d3.select(this).select('.track')
              .attr('d', GraphicsService.getArc(0, 0, this._radius, this._tunnelAngle / 2, Math.PI * 2 - this._tunnelAngle / 2, true))
              .attr('fill', 'none')
              .attr('stroke', this._color);

            updateItems(index, minMax, levelSpacing * scope.zoom);
          });

          newLevels.each(function(d, index){
            d3.select(this).attr('r', (centerRadius + centerGap + levelSpacing * (index + 1)) * scope.zoom);
          });

          updateLinks(data);

          levels.exit().each(function(d, i){
            d3.select(this).remove();
            d3.select(levelsOverlays[0][i]).remove();
          });

          newLevels.exit().remove();

          levelsTextPaths.exit().remove();
          levelsNames.exit().remove();
          resize();
          setSelection(selectedItemId, false);
        }

        function updateItems(levelIndex, minMax, width) {
          var items, levelNode, levelOverlay, overlays, values, level, textAnchor, textAngle, textOffset;

          levelNode = itemsG.selectAll('.level')[0][levelIndex];
          level = d3.select(levelNode);
          levelOverlay = d3.select(overlayG.selectAll('.level-overlay')[0][levelIndex]);
          values = level.datum().Values;
          items = level.selectAll('.item').data(values);

          items.enter().append('g').attr('class', 'item').each(function() {
            var overlay, th = d3.select(this);

            overlay = levelOverlay.append('g').attr('class', 'item-overlay');
            
            overlay.on('mouseover', function(){
              if (!selectedItemId) {
                markRelatedUp(d3.select(this), 'active');
                markRelatedDown(d3.select(this), 'active');
                mainG.classed('hover', true);
              }

              showTooltip(d3.select(this).select('circle').node(), d3.select(this).datum());
            }).on('click', function(){
              if (selectedItemId === this._id) {
                setSelection();
              }
              else {
                setSelection(this._id, true);
              }
              
            }).on('mouseout', function(){
              if (!selectedItemId) {
                mainG.classed('hover', false);
                overlayG.selectAll('.item-overlay').classed('active', false);
                linksG.selectAll('.link').classed('active', false);
              }
              hideTooltip();
            }).on('dblclick', function(){
              d3.event.stopPropagation();
              d3.event.preventDefault();
              setSelection();
              scope.updateFunc({'type':data.Levels[this._levelIndex].Type, 'index':this._index, 'loading':false});
              scope.$apply();
              hideTooltip();
              newLevelsOffsetG.style({'transform':'translate(' + [this._coord.x + 'px', this._coord.y + 'px'] + ')'});
              
              offsetG.classed('animated', true).style({'transform':'translate('+ [-this._coord.x + 'px', -this._coord.y + 'px'] + ')'});
              newLevelsG.style({'opacity':1, 'transform':'scale(1)'});
              opacityG.style({'opacity': 0});
            });

            overlay.append('circle').attr('class', 'point-circle');
            overlay.append('g')
              .attr('class', 'text-g')
              .append('text');

            th.append('circle').attr('class', 'bg-circle');
          });

          overlays = levelOverlay.selectAll('.item-overlay');

          items.each(function(d, index){
            var th, angleStep, perimeter, overlayNode, overlay, id;
            id = d._level + '-' + d._index;
            th = d3.select(this);
            overlayNode = overlays[0][index];
            overlay = d3.select(overlayNode).attr('id', 'item-overlay' + id);
            overlay.datum(d);
            th.attr('id', 'item' + id);
            perimeter = 2 * Math.PI * levelNode._radius;
            angleStep = (Math.PI * 2 - levelNode._tunnelAngle) / values.length;
            maxPointRadius = Math.min(maxAbsPointRadius, width / 2 - 2, angleStep / (Math.PI * 2) * perimeter / 2 - 2);
            this._angle = levelNode._tunnelAngle / 2 + angleStep * 0.5 + index * angleStep;
            this._coord = DiagramsService.rotate(0, -levelNode._radius, this._angle + (levelNode._index % 2 ? maxPointRadius / perimeter * Math.PI * 2 : 0));
            this._radius = Math.max(2, maxPointRadius * (getSizeValue(d) / minMax.max));
            this._color = levelNode._color;
            this._id = id;

            overlayNode._id = this._id;
            overlayNode._coord = this._coord;
            overlayNode._color = this._color;
            overlayNode._levelIndex = d._level;
            overlayNode._index = d._index;

            if (this._angle > Math.PI) {
              textAnchor = 'end';
              textAngle = 90;
              textOffset = -(this._radius + pointSpacing);
            }
            else {
              textAnchor = 'start';
              textAngle = -90;
              textOffset = this._radius + pointSpacing;
            }

            th.attr('transform', 'translate(' + [this._coord.x, this._coord.y] + ')');
            overlay.attr('transform', 'translate(' + [this._coord.x, this._coord.y] + ')');

            overlay.select('.point-circle')
              .attr({
                'r': this._radius,
                'stroke': levelNode._color,
                'fill': 'none'
              });

            th.select('.bg-circle')
              .attr('r', this._radius + 5)
              .attr('fill', '#fff');

            overlay.select('.text-g')
              .attr('transform', 'rotate(' + (this._angle * 180 / Math.PI + textAngle) + ')')
              .select('text')
                .attr('x', textOffset)
                .attr('dominant-baseline', 'middle')
                .attr('text-anchor', textAnchor)
                .attr('fill', levelNode._color)
                .text(d.Name)
                .each(function(){UI.wrapSvgText(this, (levelNode._isOuter ? Math.max(outerGap, outerGap * scope.zoom) : width - maxPointRadius) - th.node()._radius - pointSpacing);});
          });

          items.exit().each(function(d, index){
            d3.select(this).remove();
            d3.select(overlays[0][index]).remove();
          });
        }

        function updateArrowheads(data) {
          var levelColors = [];

          angular.forEach(data.Levels, function(value, index) {
            levelColors.push({'color':colorFunc()(index), 'id':'level'+index});
          });
          setArrowheadsData(levelColors.concat(arrowheadsConstantColors));
        }

        function setArrowheadsData(array) {
          arrowheads = markers.selectAll('marker').data(array);
          arrowheads.enter()
            .append('marker')
              .each(function(){
                d3.select(this).append('path');
              });

          arrowheads.each(function(d) {
            var th;
            th = d3.select(this);

            th.attr('id', function(d){ return 'arrowhead-' + d.id;})
              .attr('viewBox', '0,0 ' + arrowheadSize)
              .attr('orient', 'auto-start-reverse')
              .attr('refY', arrowheadSize[1] / 2)
              .attr('markerUnits', 'strokeWidth')
              .attr('markerWidth', arrowheadSize[0])
              .attr('markerHeight', arrowheadSize[1]);

            th.select('path')
              .attr('fill', d.color)
              .attr('d', 'M 0 0 L ' + arrowheadSize[0] + ' ' + arrowheadSize[1] / 2 + ' L 0 ' + arrowheadSize[1] + ' z');
          });

          arrowheads.exit().remove();
        }

        function placeLinkTooltip(node, mouse) {
          var coord = DiagramsService.closestLinePoint({'x':mouse[0], 'y':mouse[1]}, node._from._coord, node._to._coord);
          var t = DiagramsService.dist2(node._from._coord, coord) / DiagramsService.dist2(node._from._coord, node._to._coord);

          linkMousePoint.attr({'cx':coord.x, 'cy':coord.y, 'fill':d3.interpolateRgb(node._colors[0], node._colors[1])(t)});
          var offset = $(linkMousePoint.node()).offset();
          placeTooltip(offset.left, offset.top, 8, 8);
        }

        function setHover(value) {
          mainG.classed('hover', value || (selectedItemId ? true : false));
        }

        function activateLink(node, mouse) {
          if (!node) {
            return;
          }

          var th = d3.select(node);
          th.classed('active-link', true);
          overlayG.select('#item-overlay' + node._from._id).classed('active-link', true);
          overlayG.select('#item-overlay' + node._to._id).classed('active-link', true);
          linkMousePoint.attr('visibility', 'visible');
          setHover(true);
          placeLinkTooltip(node, mouse);
          showTooltip(linkMousePoint.node(), th.datum());
          th.on('mousemove', function(){
            placeLinkTooltip(node, d3.mouse(this));
          });
        }

        function updateLinks(data){
          linkLevels = linksG.selectAll('.links-level').data(data.Levels);
          linkLevels.enter().append('g').attr('class', 'links-level');
          linkLevels.exit().remove();

          linkLevels.each(function(d, levelIndex){
            var linksValueGroup = d3.select(this).selectAll('.links-value-group').data(d.Values);
            linksValueGroup.enter().append('g').attr('class', 'links-value-group');
            linksValueGroup.attr({'fill':'none'});
            linksValueGroup.exit().remove();

            linksValueGroup.each(function(valueD){
              var links = d3.select(this).selectAll('.link').data(valueD.Links);
              links.enter().append('g').attr('class', 'link').each(function(){
                var th = d3.select(this);
                th.append('line').attr('class', 'visual-line');
                th.append('line').attr('class', 'hover-line').attr({'stroke-width': 20, 'stroke':'rgba(0, 0, 0, 0)'});
                th.on('mouseover', function(){
                  linksMouse = d3.mouse(this);
                  hoverLink = this;

                  if (!linksAreDisabled) {
                    activateLink(this, linksMouse);
                  }
                }).on('mouseout', function(){
                  th.on('mousemove', null);
                  th.classed('active-link', false);
                  overlayG.select('#item-overlay' + this._from._id).classed('active-link', false);
                  overlayG.select('#item-overlay' + this._to._id).classed('active-link', false);
                  setHover(false);
                  hideTooltip();
                  linkMousePoint.attr('visibility', 'hidden');
                  linksAreDisabled = true;
                  hoverLink = null;
                  setTimeout(function(){
                    linksAreDisabled = false;
                    activateLink(hoverLink, linksMouse);
                  }, 100);
                });
              });
              links.exit().remove();

              links.each(function(d){
                var th = d3.select(this);
                th.attr('class', 'link link-to' + d.To[0] + '-' + d.To[1] + ' link-from' + levelIndex + '-' + valueD._index);
                this._from = d3.select('#item' + levelIndex + '-' + valueD._index).node();
                this._to = d3.select('#item' + d.To[0] + '-' + d.To[1]).node();

                if (this._from && this._to) {
                  setLineColor(d, [levelIndex, d.To[0]], this._from._coord.x > this._to._coord.x, th);
                }
                else {
                  th.remove();
                }

              });
            });
          });

          updateLinksLines();
        }

        function updateLinksLines() {
          var cropped;

          linksG.selectAll('.link').each(function() {
            cropped = cropLine(this._from._coord, this._to._coord, this._from._radius + arrowheadSize[0] + pointSpacing, this._to._radius + arrowheadSize[0] + pointSpacing);

            cropped[1].x = cropped[0].x + (cropped[1].x - cropped[0].x) * linksLinesScale;
            cropped[1].y = cropped[0].y + (cropped[1].y - cropped[0].y) * linksLinesScale;

            d3.select(this).selectAll('.hover-line, .visual-line').attr({'x1':cropped[0].x, 'y1':cropped[0].y})
              .attr({'x2':cropped[1].x, 'y2':cropped[1].y});
          });
        }

        function setSelection(itemId, animate) {
          overlayG.selectAll('.item-overlay').classed('active', false);
          linksG.selectAll('.link').classed('active', false);
          selection.classed('active-selection', !!itemId);
          selectedItemId = itemId;

          

          if (!itemId) {
            mainG.classed('hover', false);
            return;
          }
          
          var item = mainG.select('#item-overlay' + itemId).node(),
              radius = maxPointRadius + 8,
              circleLength = 2 * Math.PI * radius,
              d = d3.select(item).datum(),
              duration = 300;
          
          selection.attr('transform', 'translate('+item._coord.x + ',' + item._coord.y + ')');
          selection.selectAll('path').attr({'stroke':colorFunc()(d._level), 'fill':'none'});

          selection.select('.outer-circle').attr({
            'd': '',
            'stroke-width': 1
          }).node()._radius = radius + selectionStrokeWidth / 2;

          selection.select('.dashed-circle').attr({
            'd': '',
            'stroke-width': selectionStrokeWidth,
            'stroke-dasharray': '1, ' + (circleLength - 20) / 20
          }).node()._radius = radius;

          selection.select('.outer-circle')
            .transition()
            .duration(animate ? duration : 0)
            .each('start', function(){d3.select(this).attr('d', GraphicsService.getArc(0, 0, this._radius, 0, Math.PI * 2 * 0.9999));})
            .attrTween('d', function(){
              var th = this;

              return function(t) {
                d3.select(th).attr({'opacity':t});
                return GraphicsService.getArc(0, 0, th._radius - (5 * (1 - t)), 0, Math.PI * 2 * 0.9999);
              };
            });

          selection.select('.dashed-circle')
            .transition()
            .duration(animate ? duration : 0)
            .attrTween('d', function(){
              var th = this,
                  radius;

              return function(t) {
                radius = th._radius - (5 * (1 - t));
                var circleLength = 2 * Math.PI * radius;
                d3.select(th).attr({'stroke-dasharray': '1, ' + (circleLength - 20) / 20, 'opacity':t});
                return GraphicsService.getArc(0, 0, radius, 0, Math.PI * 2 * 0.9999);
              };
            });

          markRelatedDown(d3.select(item), 'active');
          markRelatedUp(d3.select(item), 'active');
          mainG.classed('hover', true);
        }

        function setLineColor(linkData, levels, reverse, target) {
          var markers, stroke, special = false, colors;

          if (linkData.FirstTimeActivity) {
            markers = ['red', 'red'];
            colors = ['red', 'red'];
            stroke = 'red';
            special = true;
          }
          else if (linkData.Ports.length === 1 || linkData.Protocols.length === 1) {
            markers = ['black', 'black'];
            colors = ['black', 'black'];
            stroke = 'black';
            special = true;
          }
          else {
            markers = ['level' + levels[0], 'level' + levels[1]];
            stroke = 'url(#' + getGradientId(levels[reverse ? 1 : 0], levels[reverse ? 0 : 1]) + ')';
            colors = [colorFunc()(levels[0]), colorFunc()(levels[1])];
          }

          target.node()._colors = colors;
          target.select('.visual-line').attr({'marker-start':'url(#arrowhead-' + markers[0] + ')', 'marker-end':'url(#arrowhead-' + markers[1] + ')', 'stroke':stroke}).classed('special', special);
        }

        function getGradientId(index1, index2) {
          var id = 'gradient-' + index1 + '-' + index2;

          if (gradients.select('#' + id).empty()) {
            var gradient = gradients.append('linearGradient').attr({'id':id});
            gradient.append('stop').attr({'offset':'0%', 'stop-color':colorFunc()(index1)});
            gradient.append('stop').attr({'offset':'100%', 'stop-color':colorFunc()(index2)});
          }

          return id;
        }

        function sortValues(data) {
          angular.forEach(data.Levels, function(level) {
            level.Values = level.Values.sort(sortFunc);
          });
          return data;
        }

        function cropLine(p1, p2, l1, l2) {
          var dl, np1, np2,
              dc1 = p2.x - p1.x, 
              dc2 = p2.y - p1.y;

          dl = Math.sqrt(dc1 * dc1 + dc2 * dc2);

          np1 = {
                  'x':p1.x + (p2.x - p1.x) * l1 / dl, 
                  'y':p1.y + (p2.y - p1.y) * l1 / dl
                };

          np2 = {
                  'x':p1.x + (p2.x - p1.x) * (1 - l2 / dl), 
                  'y':p1.y + (p2.y - p1.y) * (1 - l2 / dl)
                };

          return [np1, np2]; 
        }

        function markRelatedDown(item, className) {
          if (item.empty()) {
            return;
          }

          var linkedItem, level = item.datum()._level;
          item.classed(className, true);
          linksG.selectAll('.link-to' + level + '-' + item.datum()._index).classed(className, true);

          overlayG.selectAll('.item-overlay').each(function(d) {
            linkedItem = d3.select(this);

            for (var i = 0; i < d.Links.length; i++) {
              if (d.Links[i].To[0] === level && d.Links[i].To[1] === item.datum()._index) {
                markRelatedDown(linkedItem, className);
                break;
              }
            }
          });
        }

        function markRelatedUp(item, className) {
          var linkedItem, level = item.datum()._level;

          item.classed(className, true);
          linksG.selectAll('.link-from' + level + '-' + item.datum()._index).classed(className, true);

          angular.forEach(item.datum().Links, function(value){
            linkedItem = overlayG.select('#item-overlay' + value.To[0] + '-' + value.To[1]);
            
            if (!linkedItem.empty()) {
              linkedItem.classed(className, true);
              markRelatedUp(linkedItem, className);
            }
          });
        }

        function getMinMax(data) {
          var res = {'min':Infinity, 'max':-Infinity};

          angular.forEach(data.Levels, function(level) {
              angular.forEach(level.Values, function(obj) {
                res.min = Math.min(res.min, getSizeValue(obj));
                res.max = Math.max(res.max, getSizeValue(obj));
              });
          });

          return res;
        }

        function getSizeValue(value){
          return scope.sortKey ? value[scope.sortKey] : value._numLinks;
        }

        function addServiceCounts(data) {
          angular.forEach(data.Levels, function(level, levelIndex) {
              angular.forEach(level.Values, function(obj, itemIndex) {
                obj._numLinks = getNumLinks(levelIndex, itemIndex, data);
                obj._index = itemIndex;
                obj._level = levelIndex;
              });
          });

          return data;
        }

        function getNumLinks(levelIndex, itemIndex, data) {
          var num = data.Levels[levelIndex].Values[itemIndex].Links.length;

          angular.forEach(data.Levels, function(level) {
            angular.forEach(level.Values, function(value) {
              angular.forEach(value.Links, function(link) {
                if (link.To[0] === levelIndex && link.To[1] === itemIndex) {
                  num ++;
                }
              });
            });
          });

          return num;
        }

        function sortFunc(a, b) {
          return scope.sortKey ? b[scope.sortKey] - a[scope.sortKey] : b._numLinks - a._numLinks;
        }

        function colorFunc() {
          if (scope.colors && scope.colors.length) {
            return function(i) {
              return scope.colors[i % scope.colors.length];
            };
          }
          
          return basicColors;
        }

        function resize() {
          var height = (outerRadius + outerGap) * 2;

          svg.attr({'width':ele.width(), 'height':height})
            .style({'width':ele.width() + 'px', 'height':height + 'px'});

          background.attr({'width':ele.width(), 'height':height});
          mainG.attr('transform', 'translate(' + (ele.width() / 2) + ', ' + (height / 2) + ')');
        }
      }
    };
  }])
  .directive('systemsGrid', ['DiagramsService', 'UI', '$window', function (DiagramsService, UI, $window) {
    return {
      restrict: 'EA',
      replace: false,
      template: '<div class="systems-grid-options"><label class="system-grid-names-trigger"><input type="checkbox" ng-model="showNames"/> Show names</label></div><div class="systems-grid-body"><svg></svg></div>',
      scope: {
        data: '=',
        searchRows: '=',
        searchCols: '=',
        statFunc: '&',
        includeBroadcast:'=',
        reloadData: '&',
        officeId: '=',
        showNames: '=?'
      },

      link: function (scope, ele) {
        var body,
            svg,
            mainG,
            bodyG,
            dataProduct,
            dataAvg,
            maxChartLen,
            gridSpacing,
            nameLimit,
            rows,
            rowsLabels,
            colsLabels,
            resizeTimeout,
            smallModeGridSize,
            tooltip,
            namesTrigger,
            labelPadding,
            xAxisLabel,
            yAxisLabel,
            minBarWidth;

        init();

        scope.$watchGroup(['data', 'searchRows', 'searchCols', 'showNames'], function(){
          update();
        });

        angular.element($window).bind('resize', function(){
          clearTimeout(resizeTimeout);
          resizeTimeout = setTimeout(function(){
            update();
          }, 20);
        });

        function init() {
          body = d3.select(ele[0]).select('.systems-grid-body').style({'overflow':'auto'});
          svg = d3.select(ele[0]).select('svg');
          mainG = svg.append('g').attr({'class':'main-g'});
          bodyG = mainG.append('g').attr('class', 'body-g');
          maxChartLen = 70;
          nameLimit = 200;
          smallModeGridSize = 18;
          labelPadding = 3;
          minBarWidth = 16;
          tooltip = new UI.ToolTip('activity-tooltip');
          namesTrigger = d3.select(ele[0]).select('.system-grid-names-trigger');
          xAxisLabel = mainG.append('g').attr({'class':'x-axis-label axis-label'});
          xAxisLabel.append('text').text('Systems').attr({'transform': 'rotate(-90, 0, 0)'});
          yAxisLabel = mainG.append('text').text('Users').attr({'class':'y-axis-label axis-label', 'text-anchor':'end'});

          scope.$on('$destroy', function(){
            tooltip.container.remove();
          });
        }

        function update(){
          dataProduct = DiagramsService.dataProduct(scope.data.Data);
          dataAvg = (new DiagramsService.Matrix(dataProduct.Usage, DiagramsService.wrapArrayValues(scope.data.Systems, 'name'), DiagramsService.wrapArrayValues(scope.data.Users, 'name')))
                          .divide(Object.keys(scope.data.Data).length);

          dataAvg = dataAvg.search(scope.searchRows, scope.searchCols);

          var inactiveRows = dataAvg.pruneRows(function(d){
            return d3.sum(d) <= 0;
          });

          var inactiveCols = dataAvg.pruneCols(function(d){
            return d3.sum(d) <= 0;
          });

          scope.statFunc({value: {
            Users: {Total:dataAvg.rowsNames.concat(inactiveRows.rowsNames), Active:dataAvg.rowsNames, Inactive:inactiveRows.rowsNames}, 
            Systems: {Total:dataAvg.colsNames.concat(inactiveCols.colsNames), Active:dataAvg.colsNames, Inactive:inactiveCols.colsNames}
          }});
         
          updateLabels(dataAvg);
          updateBody(dataAvg);
          resize();
        }

        function updateLabels() {
          var cols, 
              th, 
              colsMax, 
              rowsMax, 
              maxRowLabelWidth = 0,
              maxColLabelWidth = 0,
              maxRowBarWidth = 0,
              hideNames = false,
              barWidth;

          colsMax = d3.max(dataAvg.colsAvg());
          rowsMax = d3.max(dataAvg.rowsAvg());
          cols = dataAvg.getCols();
          
          rowsLabels = mainG.selectAll('.row-label').data(dataAvg.rowsNames);
          rowsLabels.enter().append('a').attr('class', 'label row-label').each(function(){
            addLabel(d3.select(this), 'end');
          });
          rowsLabels.each(function(d){
            th = d3.select(this);
            updateLabel(th, d.name, 1, 1);
            maxRowLabelWidth = Math.max(maxRowLabelWidth, th.select('.name').node().getBBox().width);
          });
          
          gridSpacing = (ele.width() - (maxRowLabelWidth + labelPadding * 2)) / (dataAvg.colsNames.length + 0.5);

          if (gridSpacing < smallModeGridSize) {
            namesTrigger.style('display', 'inline-block');
            gridSpacing = (ele.width() - maxChartLen) / (dataAvg.colsNames.length + 0.5);
            if (!scope.showNames) {
              hideNames = true;
            }
          }
          else {
            namesTrigger.style('display', 'none');
          }

          gridSpacing = Math.max(scope.showNames ? 17 : 3, Math.min(40, gridSpacing));
          barWidth = Math.min(minBarWidth, gridSpacing);

          rowsLabels.each(function(d, i){
            this._barLength = d3.mean(dataAvg.values[i]) / rowsMax * (hideNames ? maxChartLen : (maxRowLabelWidth + labelPadding * 2));
            updateLabel(d3.select(this), d.name, this._barLength, barWidth, 0, gridSpacing + i * gridSpacing, 
            '/#/users/details/' + window.encodeURIComponent(d.name),
            hideNames);
          });

          colsLabels = mainG.selectAll('.col-label').data(dataAvg.colsNames);
          colsLabels.enter().append('a').attr('class', 'label col-label').each(function(){
            addLabel(d3.select(this), 'start', -90);
          });
          colsLabels.each(function(d){
            th = d3.select(this);
            updateLabel(d3.select(this), d.name, 1, 1);
            maxColLabelWidth = Math.max(maxColLabelWidth, th.select('.name').node().getBBox().width);
          });

          colsLabels.each(function(d, i){
            updateLabel(d3.select(this), d.name, d3.mean(cols[i]) / colsMax * (hideNames ? maxChartLen : (maxColLabelWidth + labelPadding * 2)), barWidth, gridSpacing + i * gridSpacing, 0, 
            '/#/systems/system/' + d.name, hideNames);
          });

          updateAxisLabels(maxRowBarWidth, maxColLabelWidth, barWidth, gridSpacing);
          rowsLabels.exit().remove();
          colsLabels.exit().remove();
        }

        function updateBody(matrix){
          var th, points, row, pointCircle, pointZone, pointG, pointScale, color, pointRadius, maxValue = matrix.max();
          rows = bodyG.selectAll('.row').data(matrix.values);
          rows.enter().append('g').attr('class', 'row');
          rows.each(function(d, rowIndex){
            row = d3.select(this);
            row.attr({'transform':'translate(0, ' + (gridSpacing + rowIndex * gridSpacing) + ')'});
            points = row.selectAll('.point').data(d);
            points.enter().append('g').attr({'class':'point'}).each(function(){
              th = d3.select(this);
              th.append('rect').attr('class', 'point-zone');
              th.append('circle').attr('class', 'point-circle');
              th.on('mouseover', function(d){
                var pointGNode = this;
                d3.select(this).classed('active-point', true);
                rowsLabels.each(function(d, i){
                  d3.select(this).classed('active-point', i === pointGNode._rowIndex);
                });
                colsLabels.each(function(d, i){
                  d3.select(this).classed('active-point', i === pointGNode._colIndex);
                });
                tooltip.content.html('System: ' + matrix.colsNames[pointGNode._colIndex].name + '<br />User: ' + matrix.rowsNames[pointGNode._rowIndex].name + '<br />Value: ' + Math.round(d * 100) / 100);
                tooltip.show(this);
              }).on('mouseout', function(){
                d3.select(this).classed('active-point', false);
                mainG.selectAll('.label').classed('active-point', false);
                tooltip.hide();
              });
            });
            points.each(function(d, pointIndex){
              this._colIndex = pointIndex;
              this._rowIndex = rowIndex;
              pointG = d3.select(this);
              pointCircle = pointG.select('.point-circle');
              pointZone = pointG.select('.point-zone');
              pointScale = matrix.getValue(pointIndex, rowIndex) / maxValue;
              color = pointScale ? UI.hsvToRgb(200, pointScale * 80, 50) : [220, 220, 220];
              pointRadius = pointScale ? Math.max(1.7, Math.min(10, gridSpacing / 2) * pointScale) : 1;
              pointG.attr({'transform':'translate(' + (gridSpacing + pointIndex * gridSpacing) + ', 0)'});
              pointCircle.attr({'r':pointRadius, 'fill':'rgb(' + color + ')'});
              pointZone.attr({'x':-gridSpacing / 2, 'y':-gridSpacing / 2, 'width':gridSpacing, 'height':gridSpacing, 'fill':'rgba(0, 0, 0, 0)'});
            });
            points.exit().remove();
          });
          rows.exit().remove();
        }

        function updateAxisLabels() {
          xAxisLabel.attr('transform', 'translate(' + [0, -16] + ')');
          yAxisLabel.attr('transform', 'translate(' + [-16, 0] + ')');
        }


        function updateLabel(el, text, barLength, barWidth, x, y, url, hideName) {
            el.attr({'xlink:href':url});

            var textEl = el.select('.name').style('display', hideName ? 'none' : 'inline');

            if (el.node()._text !== text && !hideName) {
              textEl.text(text).attr({'font-size':Math.min(14, barWidth - 2) + 'px'});
              UI.wrapSvgText(textEl.node(), nameLimit);
              el.node()._text = text;
            } 

            el.attr('transform', 'translate(' + [x, y] + ')');
            el.select('.bar').attr({'x':el.node()._align === 'start' ? 0 : -barLength, 'y':-barWidth / 2, 'width':barLength, 'height':barWidth});
        }

        function addLabel(target, align, rotation) {
          var text, contentG = target.append('g');
          contentG.append('rect').attr('class', 'bar');
          text = contentG.append('text').attr('class', 'name');

          if (rotation) {
            contentG.attr({'transform': 'rotate(' + rotation + ' 0 0)'});
          }

          target.node()._align = align;
          text.attr({'dominant-baseline':'middle', 'text-anchor':align, 'x':align === 'start' ? labelPadding: -labelPadding});

          return target.attr({'target': '_top'});
        }

        function resize() {
          var box = mainG.node().getBBox();

          svg.attr({'width':box.width, 'height':box.height})
            .style({'width':box.width + 'px', 'height':box.height + 'px'});

          mainG.attr('transform', 'translate(' + [-box.x, -box.y] + ')');
        }
      }
    };
  }])
  .directive('systemsGridOne', ['DiagramsService', function (DiagramsService) {
    return {
      restrict: 'EA',
      replace: false,
      scope: {
        data: '=',
        searchRows: '=',
        searchCols: '=',
        statFunc: '&',
        includeBroadcast:'=',
        reloadData: '&',
        officeId: '='
      },
      link: function (scope, ele) {
        scope.$watchGroup(['searchRows', 'searchCols'], function(){
          drawDiagram();
        });

        scope.statFunc({value:null});

        var info = $('<div class="dg-no-results">').appendTo(ele),
            mainWrapper = $('<div class="scrollbar-display">').css({overflow: 'auto'}),
            sideWrapper = $('<div>').css({overflow: 'visible', position: 'absolute', top: 0, left: '100%'}),
            mainSvg = d3.select(mainWrapper[0]).append('svg'),
            sideSvg = d3.select(sideWrapper[0]).append('svg'),
            generalWrapper = $('<div>').css({overflow: 'visible', position: 'relative'})
              .appendTo(ele).append([mainWrapper, sideWrapper]);

        drawDiagram();

        scope.$watch('includeBroadcast', function(nv,ov){
            if(nv !== ov){              
              scope.reloadData({value: scope.includeBroadcast});
              scope.statFunc({value: {}});
            }
          });

          scope.$watch('data', function(nv, ov){
            if(nv !== ov){    
              drawDiagram();
            }            
          });

        function drawDiagram() {
         
          mainSvg.selectAll('*').remove();
          sideSvg.selectAll('*').remove();

          if (!scope.data.Data){
            info.text('No matching results');
            return;
          }
          
          var gridSpacing = {x:100, y:50},
              chartLen = 70,
              tip = d3.tip().attr('class', 'd3-tip').html(function(d) { return d.Users + '<br />' + d.Systems + '<br />Usage: <strong>' + (Math.round(parseFloat(d.usage) * 100) / 100) + '</strong>'; }).offset([-8, 0]),
              dataProduct = DiagramsService.dataProduct(scope.data.Data),
              dataAvg = (new DiagramsService.Matrix(dataProduct.Usage, DiagramsService.wrapArrayValues(scope.data.Systems, 'name'), DiagramsService.wrapArrayValues(scope.data.Users, 'name')))
                          .divide(Object.keys(scope.data.Data).length);

          dataAvg = dataAvg.search(scope.searchRows, scope.searchCols);

          var inactiveRows = dataAvg.pruneRows(function(d){
            return d3.sum(d) <= 0;
          });

          var inactiveCols = dataAvg.pruneCols(function(d){
            return d3.sum(d) <= 0;
          });

          scope.statFunc({value: {
            Users: {Total:dataAvg.rowsNames.concat(inactiveRows.rowsNames), Active:dataAvg.rowsNames, Inactive:inactiveRows.rowsNames}, 
            Systems: {Total:dataAvg.colsNames.concat(inactiveCols.colsNames), Active:dataAvg.colsNames, Inactive:inactiveCols.colsNames}
          }});

          var colsAvg = dataAvg.colsAvg();

          info.text(dataAvg.isEmpty() ? 'No matching results' : '');

          var items = {
            lines:[],
            charts:[],
            circles:[],
            labels:{'Users':[], 'Systems':[]}
          };

          var main = mainSvg.append('svg'),
              body = main.append('svg'),
              header = main.append('svg'),
              side = sideSvg.append('svg'),
              lines = body.append('svg'),
              circles = body.append('svg'),
              labels = body.append('svg');
              
          mainSvg.call(tip);

          main.attr('x', gridSpacing.x / 2);
          labels.attr('class', 'grid-labels');
          body.attr('class', 'grid-body');

          // $(document.createElementNS(d3.ns.prefix.svg, 'rect')).attr({
          //   x: 0,
          //   y: -headerH,
          //   width: dataAvg.colsNames.length * gridSpacing.x,
          //   height: headerH,
          //   fill: '#fff'
          // }).appendTo(systems);


          var i, v, line, circle, circleArea, circleG, chart, barLength;

          // Create Systems header
          for (i = 0; i < dataAvg.colsNames.length; i++) {
            barLength = colsAvg[i] / d3.max(colsAvg) * chartLen;
            chart = getchartBar(i * gridSpacing.x, 0, header, barLength, dataAvg.colsNames[i].name, '/#/systems/system/'+dataAvg.colsNames[i].name, -45, 15);
            chart.node()._grid = {type:'Systems', value:i};
            items.charts.push(chart);
          }

          // Create Users column
          for (i = 0; i < dataAvg.rowsNames.length; i++) {
            barLength = d3.mean(dataAvg.values[i]) / d3.max(dataAvg.rowsAvg()) * chartLen;
            chart = getchartBar(0, i * gridSpacing.y, side, barLength, dataAvg.rowsNames[i].name, '/#/users/details/' + window.encodeURIComponent(dataAvg.rowsNames[i].name), 0, 30);
            chart.node()._grid = {type:'Users', value:i};
            items.charts.push(chart);
          }

          var chartOverFunc = function() {
            var i, label, oType;
            var opposite = {'Users':'Systems', 'Systems':'Users'};
            var chartData = this._grid;

            fadeLabels();

            for (i = 0; i < items.circles.length; i++) {
              if (items.circles[i][chartData.type] === chartData.value) {
                items.circles[i].node.classed('faded', false);

                oType = opposite[chartData.type];
                label = items.labels[oType][items.circles[i][oType]];

                if (oType === 'Users') {
                  label.attr('x', parseFloat(items.circles[i].actual.attr('cx')) + items.circles[i].actual.node().getBBox().width / 2 + 5);
                  label.attr('y', parseFloat(items.circles[i].actual.attr('cy')));
                }
                else {
                  label.attr('x', parseFloat(items.circles[i].actual.attr('cx')));
                  label.attr('y', parseFloat(items.circles[i].actual.attr('cy')) - items.circles[i].actual.node().getBBox().height / 2 - 10);
                }

                label.classed('faded', false);
                label.select('.item-value-label').text(Math.round(items.circles[i].usage * 100) / 100);
                label.select('.item-name-label').classed('faded', !((chartData.type === 'Users' && chartData.value > 0) || (chartData.type === 'Systems' && chartData.value < dataAvg.colsNames.length - 1)));
              }
              else {
                items.circles[i].node.classed('faded', true);
              }
            }

            for (i = 0; i < items.lines.length; i++) {
              if ((items.lines[i].type === chartData.type && items.lines[i].value === chartData.value) || items.lines[i].type !== chartData.type) {
                items.lines[i].node.classed('faded', false);
              }
              else {
                items.lines[i].node.classed('faded', true);
              }
            }
          };

          function fadeLabels() {
            for (var key in items.labels) {
              for (var i = 0; i < items.labels[key].length; i++) {
                items.labels[key][i].classed('faded', true);
              }
            }
          }

          var chartOutFunc = function() {
            var i;

            for (i = 0; i < items.circles.length; i++) {
              items.circles[i].node.classed('faded', false);
            }

            for (i = 0; i < items.lines.length; i++) {
              items.lines[i].node.classed('faded', false);
            }

            fadeLabels();
          };

          for (i = 0; i < items.charts.length; i++) {
            items.charts[i]
              .on('mouseover', chartOverFunc)
              .on('mouseout', chartOutFunc);
          }

          function getchartBar(x, y, appendTo, length, text, url, rotation, maxLength) {
            var chart = appendTo.append('svg').attr({
              x: x,
              y: y
            });

            var chartLink = chart.append('a')
              .attr('xlink:href', url)
              .attr('target', '_top')
              .attr('class', 'transition');

            chartLink.append('rect').attr({
              width: chartLen,
              height: gridSpacing.y,
              fill: 'rgba(0, 0, 0, 0)',
              x: 0,
              y: -gridSpacing.y / 2
            });

            chartLink.append('line').attr({
              x1: 0.5,
              x2: length + 0.5,
              y1: 0.5,
              y2: 0.5,
              class: 'chart-bar'
            });


            getText(text, 0, -10, chartLink, maxLength);
            

            if (rotation) {
              chartLink.attr('transform', 'rotate(' + rotation + ' 0 0)');
            }

            return chart;
          }

          function getText(text, x, y, appendTo, maxLength) {
            var str = text;

            if (typeof maxLength !== 'undefined' &&  str && str.length > maxLength) {
              str = str.substring(0, maxLength).trim() + '...';
            }

            return appendTo.append('text')
              .text(str)
              .attr({
                x: x,
                y: y,
                class: 'item-label'
              });
          }

          function getLabel(text, x, y, appendTo, rotation) {
            var container = appendTo.append('svg');
            var label = getText(text, 0, 0, container);

            label.attr({
              x: x,
              y: y
            });

            if (rotation) {
              label.attr('transform', 'rotate(' + rotation + ' 0 0)');
            }

            return container;
          }

          var maxRadius = Math.min(gridSpacing.x, gridSpacing.y) / 2 - 1;
          var radiusCoeff = maxRadius / Math.sqrt(maxRadius / Math.PI);

          function getRadius(scale) {
              return Math.sqrt(scale * maxRadius / Math.PI) * radiusCoeff;
            }

          var labelContainer, circleLabel, valueLabel;

          // Vertical grid lines

          for (i = 0; i < dataAvg.colsNames.length; i++) {
            line = lines.append('line').attr({
              x1: gridSpacing.x * i + 0.5,
              x2: gridSpacing.x * i + 0.5,
              y1: 0.5,
              y2: gridSpacing.y * dataAvg.rowsNames.length + 0.5,
              class: 'grid-line v'
            });
       
            items.lines.push({node:line, type:'Systems', value:i});
            labelContainer = labels.append('svg').classed('faded', true);
            circleLabel = getLabel(dataAvg.colsNames[i].name, 0, 0, labelContainer, -45);
            circleLabel.select('text').classed('item-name-label', true);
            valueLabel = getLabel(dataAvg.colsNames[i].name, 15, 15, labelContainer, -45);
            valueLabel.select('text').classed('item-value-label', true);
            items.labels.Systems.push(labelContainer);
          }

          // Horizontal grid lines and circels

          var circleOverFunc = function() {
            var circleData = this._grid;
            $(this).addClass('hover');
            tip.show({Users:dataAvg.rowsNames[circleData.Users].name, Systems:dataAvg.colsNames[circleData.Systems].name, usage:circleData.usage}, circleData.actual);
          };

          var circleOutFunc = function() {
            tip.hide();
            $(this).removeClass('hover');
          };

          var circleData,
              dataMaxValue = dataAvg.max();

          for (i = 0; i < dataAvg.rowsNames.length; i++) {
            line = lines.append('line').attr({
              x1: 0.5,
              x2: dataAvg.colsNames.length * gridSpacing.x + 0.5,
              y1: gridSpacing.y + gridSpacing.y * i + 0.5,
              y2: gridSpacing.y + gridSpacing.y * i + 0.5,
              class: 'grid-line h'
            });

            items.lines.push({node:line, type:'Users', value:i});
            labelContainer = labels.append('svg').classed('faded', true);
            circleLabel = getLabel(dataAvg.rowsNames[i].name, 0, -4, labelContainer);
            circleLabel.select('text').classed('item-name-label', true);
            valueLabel = getLabel(dataAvg.rowsNames[i].name, 0, 13, labelContainer);
            valueLabel.select('text').classed('item-value-label', true);
            items.labels.Users.push(labelContainer);

            for (v = 0; v < dataAvg.colsNames.length; v++) {
              circleG = circles.append('g').attr('class', 'transition');

              circle = circleG.append('circle').attr({
                cx: gridSpacing.x * v + 0.5,
                cy: gridSpacing.y + gridSpacing.y * i + 0.5,
                r: Math.max(0.001, getRadius(dataAvg.getValue(v, i) / dataMaxValue)), //Returning .001 radius as FF, IE and Edge are not recognising circles with 0 radius
                class: 'transition grid-circle'
              });
              
              circleArea = circleG.append('circle').attr({
                cx: gridSpacing.x * v + 0.5,
                cy: gridSpacing.y + gridSpacing.y * i + 0.5,
                r: Math.max(maxRadius, getRadius(dataAvg.getValue(v, i) / dataMaxValue)),
                fill: 'rgba(0, 0, 0, 0)'
              });
              
              circleData = {node:circleG, 'Users':i, 'Systems':v, actual:circle, usage:dataAvg.getValue(v, i)};
              items.circles.push(circleData);
              circleG.on('mouseover', circleOverFunc).on('mouseout', circleOutFunc);
              circleG.node()._grid = circleData;
            }
          }

          var headerBBox = header.node().getBBox();
          header.attr('y', headerBBox.height);
          body.attr('y', headerBBox.height);

          var mainBBox = main.node().getBBox();
          var sideBBox = side.node().getBBox();
          // var bodyBBox = body.node().getBBox();

          side.attr('y', headerBBox.height + gridSpacing.y);

          var mainWidth = -mainBBox.x + mainBBox.width;
          var sideWidth = sideBBox.x + sideBBox.width + 10;

          mainSvg.style({width: mainWidth + 'px', height:mainBBox.y + mainBBox.height + 'px', display: 'initial'});
          sideSvg.style({width: sideWidth + 'px', height:mainBBox.y + mainBBox.height + 'px', display: 'initial'});
          generalWrapper.css({'max-width': mainWidth + 'px'});
          ele.css({'padding-right': sideWidth + 'px'});
        }
      }
    };
  }])
.directive('systemsRadial', ['DiagramsService', 'UI', function (DiagramsService, UI) {
  return {
    restrict: 'EA',
    replace: false,
    scope: {
      data: '=',
      searchRows: '=',
      searchCols: '=',
      statFunc: '&',
      includeBroadcast:'=',
      reloadData: '&',
      officeId: '='
    },
    link: function (scope, ele) {
  
      var radius = 330,
          maxAbsOuterCircleRadius = 20,
          innerItemHeight = 22,
          innerItemSpacing = 4,
          tunnelWidth = 230,
          tunnelGap = 10,
          strokeWeight = 1,
          svg, tip, defs, userImage, mainG, arc, arcs, tunnelAngle, dataAvg, outerG, innerG, linksG, noDataText, innerItems, innerItemWidth, outerItems, linkItems;

      create();

      scope.$watch('data', function(){
        update();
      });

      scope.$watchGroup(['searchRows', 'searchCols'], function(){
        update();
      });

      function create() {
        svg = d3.select(ele[0]).append('svg');
        mainG = svg.append('g').attr('class', 'main');
        linksG = mainG.append('g').attr('class', 'links');
        outerG = mainG.append('g').attr('class', 'outer');
        innerG = mainG.append('g').attr('class', 'inner');
        noDataText = mainG.append('text')
          .text('No Data')
          .attr('class', 'no-data')
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'middle');
      
        arc = d3.svg.arc()
            .outerRadius(radius)
            .innerRadius(radius - strokeWeight)
            .cornerRadius(strokeWeight / 2);

        defs = svg.append('defs');

        tip = d3.tip().attr('class', 'd3-tip').html(function(d) { return 'Total ' + d.type + ' Activity:<br><strong>' + Math.round(d.value * 100) / 100 + '</strong>'; }).offset([-8, 0]);                          
        svg.call(tip);

        userImage = defs.append('g').attr({'id':'userImage'});

        userImage.append('image')
            .attr({'xlink:href':'/assets/img/custom-assets/diagram-user.svg', 'width':maxAbsOuterCircleRadius * 2, 'height':maxAbsOuterCircleRadius * 2})
            .attr({'x':-maxAbsOuterCircleRadius, 'y':-maxAbsOuterCircleRadius});
      }

      function update() {
        var box, colsSum, colsMax, cols, rowsSum, rowsMax, maxCircleRadius, outerHalfLength, innerHeight;

        mainG.attr('transform', 'none');

        tunnelAngle = 2 * Math.asin(tunnelWidth / (2 * radius)) / 2; // Get central angle based on chord length and devided by 2
        dataAvg = prepareData();
        outerHalfLength = Math.floor((dataAvg.rowsNames.length - 1) / 2);

        cols = dataAvg.getCols();

        colsSum = dataAvg.colsSum();
        colsMax = d3.max(colsSum);

        rowsSum = dataAvg.rowsSum();
        rowsMax = d3.max(rowsSum);

        noDataText.attr('visibility', function(){ return dataAvg.isEmpty() ? 'visible' : 'hidden';});

        innerHeight = dataAvg.colsNames.length * (innerItemHeight + innerItemSpacing) - innerItemSpacing;
        maxCircleRadius = Math.min(maxAbsOuterCircleRadius, (1 - tunnelAngle * 4 / (Math.PI * 2)) * (2 * Math.PI * radius) / dataAvg.rowsNames.length / 2 - 2);
        innerItemWidth = tunnelWidth - maxCircleRadius * 2 - tunnelGap * 2;
        arcs = outerG.selectAll('.arc').data([{s:tunnelAngle, e:Math.PI - tunnelAngle}, {s:Math.PI + tunnelAngle, e:Math.PI * 2 - tunnelAngle}]);
        innerItems = innerG.selectAll('.item').data(dataAvg.colsNames);
        outerItems = outerG.selectAll('.item').data(dataAvg.rowsNames);
        linkItems = linksG.selectAll('.link').data(getLinksData(dataAvg));

        arcs.exit().remove();
        innerItems.exit().remove(); 
        outerItems.exit().remove();
        linkItems.exit().remove();

        
        arcs.enter()
          .append('path')
          .attr('class', 'arc');

        outerItems.enter()
          .append('a')
          .attr('target', '_top')
          .attr('class', 'item').each(function() {
            var th = d3.select(this);

            th.append('circle');
            th.append('use').attr({'xlink:href':'#userImage'});

            var text = th.append('g')
              .attr('class', 'text-g')
              .append('text');

            // text.append('tspan').attr('class', 'icon').attr('dominant-baseline', 'middle').text(function (d) {return '\uf007';});
            text.append('tspan').attr('class', 'name').attr('dominant-baseline', 'middle');
          });

        outerItems.attr('xlink:href', function(d, index) {
          return '/#/users/details/' + window.encodeURIComponent(dataAvg.rowsNames[index].name);
        });

        linkItems.enter()
          .append('g')
            .attr('class', 'link')
            .each(function() {
              d3.select(this).append('path');
            });
         
        innerItems.enter()
          .append('a')
          .attr('target', '_top')
          .attr('class', 'item')
          .each(function() {
            var th = d3.select(this);
            th.append('rect').attr('class', 'bg');
            th.append('rect').attr('class', 'bar');
              // .attr({'fill':'url(#innerBarFill)'});
            th.append('rect').attr('class', 'active-bar');
            th.append('rect').attr('class', 'user-bar');
            th.append('text')
              .attr('class', 'name')
              .attr('text-anchor', 'middle')
              .attr('dominant-baseline', 'middle');
          });

        innerItems.attr('xlink:href', function(d, index) {
          return '/#/systems/system/' + (dataAvg.colsNames[index] ? dataAvg.colsNames[index].name : -1);
        });

        innerItems.each(function(d, index){
          var th, name;

          th = d3.select(this);

          this._coord = {x:0, y:(-innerHeight / 2 + index * (innerItemHeight + innerItemSpacing))};

          th.attr('transform', function() { return 'translate(' + 0 + ', ' + this._coord.y + ')';});
          name = th.select('.name');
          name.attr('y', innerItemHeight / 2).text(d.name).each(function(){UI.wrapSvgText(this, innerItemWidth - 10);});
          name.node()._wrappedText = name.text();

          th.select('.bg')
            .attr('x', -innerItemWidth / 2)
            .attr('width', innerItemWidth)
            .attr('height', innerItemHeight);

          th.selectAll('.bar, .active-bar, .user-bar')
              .attr('x', -innerItemWidth / 2)
              .attr('width', innerItemWidth * colsSum[index] / colsMax)
              .attr('height', innerItemHeight);
        });

        outerItems.each(function(d, index) {
          var th, useEl, text, textG, itemAngle, itemCoord, circleR, imageScale, textAnchor, textAngle, textOffset;
          th = d3.select(this);
          useEl = th.select('use');
          text = th.select('text');
          textG = th.select('.text-g');
          circleR = Math.max(2, maxCircleRadius * rowsSum[index] / rowsMax);
          imageScale = circleR / maxAbsOuterCircleRadius;

          if (dataAvg.rowsNames.length === 1) {
            itemAngle = Math.PI / 2;
            textAnchor = 'start';
            textAngle = -90;
            textOffset = circleR + 5;
          }
          else if (index <= outerHalfLength) {
            itemAngle = tunnelAngle + (Math.PI - tunnelAngle * 2) * (index / outerHalfLength);
            textAnchor = 'start';
            textAngle = -90;
            textOffset = circleR + 5;
          }
          else {

            if (dataAvg.values.length - outerHalfLength === 2) {
              itemAngle = Math.PI * 1.5;
            }
            else {
              itemAngle = Math.PI + tunnelAngle + (Math.PI - tunnelAngle * 2) * ((index - outerHalfLength - 1) / (dataAvg.rowsNames.length - outerHalfLength - 2));
            }
            
            textAnchor = 'end';
            textAngle = 90;
            textOffset = - circleR - 5;
          }
          
          itemCoord = DiagramsService.rotate(0, -radius + 0.5, itemAngle);
          th.attr('transform', 'translate(' + itemCoord.x + ',' + itemCoord.y + ')');
          this._coord = itemCoord;
          th.select('circle').attr('r', circleR);
          useEl.attr({'transform':'scale(' + [imageScale, imageScale] + ')'});

          text.attr('text-anchor', textAnchor)
            .attr('x', textOffset)
            .select('.name').text(function(){ return ' ' + d.name;});

          textG.attr('transform', 'rotate(' + (itemAngle * 180 / Math.PI + textAngle) + ')');
        });

        outerItems.on('mouseover', function(d, index){
          setActiveOuterItem(index, true);
          tip.show({type:'User', value:rowsSum[index]});

        }).on('mouseout', function(d, index){
          setActiveOuterItem(index, false);
          tip.hide();
        });

        innerItems.on('mouseover', function(d, index){
          setActiveInnerItem(index, true);
        }).on('mouseout', function(d, index){
          setActiveInnerItem(index, false);
        });

        function setActiveOuterItem(index, isActive) {
          d3.select(outerItems[0][index]).classed('outer-active', isActive);

          angular.forEach(dataAvg.values[index], function(value, innerIndex) {
            var th = d3.select(innerItems[0][innerIndex]).classed('outer-active', isActive && value > 0);
            th.select('.user-bar').attr('width', value / colsMax * innerItemWidth);
          });

          var links = linksG.selectAll('.o' + index);
          links.classed('outer-active', isActive);

          if (isActive) {
            links.each(function() {
               this.parentNode.appendChild(this);
            });
          }
        }

        function setActiveInnerItem(index, isActive) {
          angular.forEach(cols[index], function(value, outerIndex) {
            d3.select(outerItems[0][outerIndex]).classed({'inner-active':isActive && value > 0, 'faded': isActive && value === 0});
          });

          var th = d3.select(innerItems[0][index]).classed('inner-active', isActive);

          var links = linksG.selectAll('.i' + index);
          links.classed('inner-active', isActive);

          if (isActive) {

            tip.show({type:'System', value:colsSum[index]});
            th.select('.name').text(function(d){ return d.name;});

            links.each(function(){
              this.parentNode.appendChild(this);
            });
          }
          else {
             tip.hide();
             th.select('.name').text(function(){ return this._wrappedText;});
          }
        }

        linkItems.each(function(d){
          var th = d3.select(this);

          th.attr('class', 'link i' + d.x + ' o' + d.y)
            .attr('display', function(d){ return d.value === 0 ? 'none' : 'inline'; });

          if (d.value === 0) {
            return;
          }

          var innerCoord, circleCoord;
          circleCoord = outerItems[0][d.y]._coord;
          
          innerCoord = {x:innerItems[0][d.x]._coord.x, y:innerItems[0][d.x]._coord.y + innerItemHeight / 2};
          innerCoord.x = innerCoord.x + (circleCoord.x < 0 ? -innerItemWidth / 2 : innerItemWidth / 2);



          if (d.value > 0) {
            th.select('path').attr('d', getPath(circleCoord, innerCoord));
          }

          function getPath(from, to) {
            var str, xDiff, yDiff, circleDist, tunnelY;

            xDiff = from.x - to.x;
            yDiff = from.y - to.y;
            tunnelY = Math.abs(DiagramsService.rotate(0, -radius, tunnelAngle).y);
            
            str = 'M' + [from.x, from.y];

            if (Math.abs(to.y) < tunnelY) {
              circleDist = Math.sqrt(radius * radius - to.y * to.y);
              if (from.x < 0) {
                circleDist = -circleDist;
              }
              str += 'C' + [from.x - xDiff / 2, from.y, circleDist / 2, to.y, to.x, to.y];
            }
            else {
              var xTunnel, yTunnel, yTunnelDiff, overY;

              xTunnel = tunnelWidth / 2 - maxCircleRadius - tunnelGap / 2;
              if (from.x < 0) {
                xTunnel = -xTunnel;
              }
              yTunnel = to.y < 0 ? -tunnelY : tunnelY;
              yTunnelDiff = from.y - yTunnel;
              overY = to.y - yTunnel;

              str += 'C' + [from.x - xDiff / 2, from.y, xTunnel, yTunnel + yTunnelDiff / 2, xTunnel, yTunnel];
              str += 'C' + [xTunnel, yTunnel + overY / 2, to.x + (from.x < 0 ? - Math.abs(overY) / 8 : Math.abs(overY) / 8), to.y, to.x, to.y];
            }

            return str;
          }
        });

        arcs.each(function(d) {
          d3.select(this).attr('d', arc({'startAngle':d.s, 'endAngle':d.e}));
        });

        // box = innerG.node().getBBox();
        // innerG.attr('transform', 'translate(0, ' + (-box.height / 2) + ')');

        box = mainG.node().getBBox();
        svg.attr('width', box.width)
          .attr('height', box.height)
          .style('width', box.width + 'px')
          .style('height', box.height + 'px');

        mainG.attr('transform', 'translate(' + (-box.x) + ', ' + (-box.y) + ')');
      }

      function getLinksData(data) {
        var res = [];
        angular.forEach(data.values, function(row, y) {
          angular.forEach(row, function(vX, x) {
            res.push({'x':x, 'y':y, 'value':vX, 'key':data.rowsNames[y].index + '-' + data.colsNames[x].index});
          });
        });
        return res;
      }

      function prepareData() {
        if(!scope.data.Data){
          return;
        }

        var dataProduct =  DiagramsService.dataProduct(scope.data.Data),
            dataAvg =  (new DiagramsService.Matrix(dataProduct.Usage, DiagramsService.wrapArrayValues(scope.data.Systems, 'name'), DiagramsService.wrapArrayValues(scope.data.Users, 'name')))
                        .divide(Object.keys(scope.data.Data).length);

        dataAvg = dataAvg.search(scope.searchRows, scope.searchCols);
       
        var inactiveRows = dataAvg.pruneRows(function(d){
          return d3.sum(d) <= 0;
        });

        var inactiveCols = dataAvg.pruneCols(function(d){
          return d3.sum(d) <= 0;
        });

        scope.statFunc({value: {
          Users: {Total:dataAvg.rowsNames.concat(inactiveRows.rowsNames), Active:dataAvg.rowsNames, Inactive:inactiveRows.rowsNames}, 
          Systems: {Total:dataAvg.colsNames.concat(inactiveCols.colsNames), Active:dataAvg.colsNames, Inactive:inactiveCols.colsNames}
        }});

        return dataAvg;
      }
    }
  };
}])
 .directive('systemsRadialOne', ['DiagramsService', function (DiagramsService) {
    return {
        restrict: 'A',
        scope: {
          data: '=',
          color: '=',
          searchRows: '=',
          searchCols: '=',
          statFunc: '&',
          includeBroadcast:'=',
          reloadData: '&',
          officeId: '='
      },
        link: function(scope, ele) {

          var diameter = 600,
              radius = diameter / 2,
              strokeWeight = 12,
              usernameRotation = Math.PI / 3,
              innerPadding = strokeWeight * 2,
              valueBgVisual = {paddingH: 12, paddingV: 3, radius: 11},
              innerRadius = radius - innerPadding;
          
          scope.statFunc({value:null});

          var header = $('<div class="dg-breadcrumb">').appendTo(ele);
          var info = $('<div class="dg-no-results">').appendTo(ele);
          var mainWrapper = $('<div class="scrollbar-display">').appendTo(ele);


          var svg = d3.select(mainWrapper[0]).append('svg');

          var centerContainer = svg.append('svg').attr({x:'50%', y:'50%'}).style('overflow', 'visible');

          centerContainer.append('circle')
                .attr('r', radius)
                .attr('cx', 0)
                .attr('fill', 'rgba(0, 0, 0, 0)')
                .attr('cy', 0);


          var outerContainer = centerContainer.append('g')
            .attr('class', 'outer');

          var innerContainer = centerContainer.append('g')
            .attr('transform', 'translate(' + (-innerRadius) + ',' + (-innerRadius) + ')')
            .attr('class', 'inner');

          var linksContainer = centerContainer.append('g')
            .attr('class', 'links');

          var arc = d3.svg.arc()
              .outerRadius(radius)
              .innerRadius(radius - strokeWeight)
              .cornerRadius(strokeWeight / 2)
              .padAngle(0.01);

          var pie = d3.layout.pie()
            .sort(null)
            .value(function(d) { return d; });

          scope.$watchGroup(['searchRows', 'searchCols'], function(){
              drawDiagram(prepareData());
          });

          scope.$watch('includeBroadcast', function(nv,ov){
            if(nv !== ov){              
              scope.reloadData({includeBroadcast: scope.includeBroadcast, officeId: scope.officeId});
              scope.statFunc({value: {}});
            }
          });

          scope.$watch('officeId', function(nv,ov){
            if(nv !== ov){              
              scope.reloadData({includeBroadcast: scope.includeBroadcast, officeId: scope.officeId});
              scope.statFunc({value: {}});
            }
          });

          scope.$watch('data', function(nv, ov){
            if(nv !== ov){    
              drawDiagram(prepareData());
            }            
          });

          function prepareData() {
            if(!scope.data.Data){
              return;
            }

            var dataProduct =  DiagramsService.dataProduct(scope.data.Data),
                dataAvg =  (new DiagramsService.Matrix(dataProduct.Usage, DiagramsService.wrapArrayValues(scope.data.Systems, 'name'), DiagramsService.wrapArrayValues(scope.data.Users, 'name')))
                            .divide(Object.keys(scope.data.Data).length);

            dataAvg = dataAvg.search(scope.searchRows, scope.searchCols);
           
            var inactiveRows = dataAvg.pruneRows(function(d){
              return d3.sum(d) <= 0;
            });

            var inactiveCols = dataAvg.pruneCols(function(d){
              return d3.sum(d) <= 0;
            });

            scope.statFunc({value: {
              Users: {Total:dataAvg.rowsNames.concat(inactiveRows.rowsNames), Active:dataAvg.rowsNames, Inactive:inactiveRows.rowsNames}, 
              Systems: {Total:dataAvg.colsNames.concat(inactiveCols.colsNames), Active:dataAvg.colsNames, Inactive:inactiveCols.colsNames}
            }});

            return createTree(dataAvg, radius, 3);
          }

          drawDiagram(prepareData());

          function drawDiagram(data, level) {
            level = level || 0;

            var currentData = data, 
                levelI = level,
                headerEl = [];

            if (level) {
              headerEl.push($('<span class="selection">Root</span>').click([data, 0], levelClickFunc));
            }

            if(!currentData || currentData.isEmpty()){
              info.text('No matching results');
              return;  
            }            

            while (levelI && currentData.rowsNames[currentData.rowsNames.length - 1].children) {
              levelI--;
              currentData = currentData.rowsNames[currentData.rowsNames.length - 1].children;
              headerEl.push($('<span class="sep"> > </span>'));
              headerEl.push($('<span class="selection">' + currentData.min() + ' - ' + currentData.max() + '</span>').click([data, level - levelI], levelClickFunc));
              
            }

            function levelClickFunc(e) {
              drawDiagram(e.data[0], e.data[1]);
            }

            if (headerEl.length) {
              header.show().empty().append(headerEl);
            }
            else {
              header.hide();
            }

            

            var rowsSum = currentData.rowsSum(),
                colsSum = currentData.colsSum();

            var users = outerContainer.datum(rowsSum).selectAll('.arc').data(pie);

            users.enter()
              .append('a')
              .attr('target', '_top')
              .attr('class', 'arc')
              .each(function(d, index){
                d.index = index;
                d3.select(this).append('path')
                  .each(function(d) { this._current = this._current ? d : {startAngle:2 * Math.PI, endAngle:2 * Math.PI, value: 0}; });

                d3.select(this).append('g')
                  .attr('class', 'name')
                  .append('text')
                  .attr('dy', '.35em');
              });

            users.attr('xlink:href', function(d, index) {
              return '/#/users/details/' + window.encodeURIComponent(currentData.rowsNames[index].name);
            });

            users.each(function(d, index){
              d3.select(this).select('.name').attr('transform', function(d) {
                var a = d.startAngle + (d.endAngle - d.startAngle) / 2,
                  angleAppend = isTextFlip(a) ? 180 : 0,
                  coord = DiagramsService.rotate(0, - radius - 10, a);

                return 'translate(' + coord.x + ',' + coord.y + ') ' + 'rotate(' + (getTextRotation(a) * 180 / Math.PI + angleAppend) + ' 0 0)'; 
              });
              d3.select(this).select('text')
                .text(function() { return currentData.rowsNames[index].name || currentData.rowsNames[index]; })
                
                .attr('text-anchor', function(d) {
                  return isTextFlip(d.startAngle + (d.endAngle - d.startAngle) / 2) ? 'end' : 'start';
                })
                .attr('fill-opacity', function(d) {
                  return currentData.rowsNames[index].children ? 1 : Math.min(1, (d.endAngle - d.startAngle) / (Math.PI * 2) * (2 * Math.PI * radius) / 20);
                })
                .style('font-size', function(d) {
                  return currentData.rowsNames[index].children ? '14px' : Math.max(8, Math.min(1, (d.endAngle - d.startAngle) / (Math.PI * 2) * (2 * Math.PI * radius) / 20) * 14) + 'px';
                })
                .style('font-weight', function() {
                  return currentData.rowsNames[index].children ? 700 : 'normal';
                });
            });

            users.each(function(d, index){
              d3.select(this).select('path')
                .style('fill', function() { return currentData.rowsNames[index].color; })
                .transition().duration(700)
                  .attrTween('d', function (a) {
                    var i = d3.interpolate(this._current, a);
                    this._current = i(0);
                    return function(t) {
                      return arc(i(t));
                    };
                  });
            });

            users.exit().remove();

            function getTextRotation(a) {
              return (a - Math.PI / 2) + Math.abs(Math.cos(a)) * usernameRotation;
            }

            function isTextFlip(a) {
              var rot = getTextRotation(a);
              return rot > Math.PI / 2 && rot < Math.PI * 1.5;
            }

            //--------------------------
            //  Systems
            //--------------------------

            var pack = d3.layout.pack()
              .size([innerRadius * 2, innerRadius * 2])
              .padding(10)
              .value(function(d) { return d.size; });

            var children = DiagramsService.wrapArrayValues(colsSum, 'size');
            var systemsTree = children.length ? {children:children} : null;
            var systems = innerContainer.datum(systemsTree).selectAll('.node').data(systemsTree ? pack.nodes : []);

            systems.enter()
              .append('a')
              .attr('target', '_top');

            systems
            .attr('transform', function(d) {return 'translate(' + d.x + ',' + d.y + ')'; })
            .attr('class', function(d) {return d.depth > 0 ? 'node' : 'node hidden'; })
            .attr('xlink:href', function(d, index) {
              return '/#/systems/system/' + (currentData.colsNames[index] ? currentData.colsNames[index].name : -1);
            });

            systems.each(function(){
              d3.select(this).selectAll('*').remove();
            });

            systems.exit().remove();
           
            systems.append('circle')
              .attr('r', function(d) { return d.r; })
              .attr('class', 'circle');

            systems.each(function(d){
              if (!d.depth) {
                return;
              }

              var arc = d3.svg.arc()
                .outerRadius(d.r)
                .innerRadius(0);

              var pie = d3.layout.pie()
                .sort(null)
                .value(function(d) { return d; });

              var container = d3.select(this).append('g')
                .attr('class', 'pie');

              var g = container.selectAll('.arc')
                .data(pie(currentData.getValue(d.index)))
                  .enter().append('g')
                  .attr('class', 'arc');

              g.append('path')
                .attr('d', arc)
                .style('fill', function(d, index) { return currentData.rowsNames[index].color; });

              d.pie = g;
            });

            systems.append('text')
                .text(function(d) { return currentData.colsNames[d.index] ? currentData.colsNames[d.index].name || currentData.colsNames[d.index] : ''; })
                .attr('class', 'name')
                .attr('dominant-baseline', 'middle')
                .attr('text-anchor', 'middle');

            systems.append('rect')
              .attr('class', 'value-bg')
              .attr('x', 0)
              .attr('y', 0)
              .attr('rx', valueBgVisual.radius)
              .attr('ry', valueBgVisual.radius);

            systems.append('text')
                .text('value')
                .attr('class', 'value')
                .attr('dominant-baseline', 'middle')
                .attr('text-anchor', 'middle')
                .attr('y', 26);

            linksContainer.selectAll('*').remove();

            users.each(function(userD, userIndex){
              var i,
                usedSystems = 0,
                usedSystemIndex = 0,
                userColor = currentData.rowsNames[userIndex].color;

              for (i = 0; i < currentData.colsNames.length; i++) {
                if (currentData.getValue(i, userIndex) > 0) {
                  usedSystems++;
                } 
              }

              systems.each(function(systemD) {
                
                if (!systemD.depth || currentData.getValue(systemD.index, userIndex) <= 0) {
                  return;
                }

                usedSystemIndex++;

                var outerPointRotation = userD.startAngle + (userD.endAngle - userD.startAngle) / (usedSystems + 1) * (usedSystemIndex);
                var outerCoord = DiagramsService.rotate(0, -radius + strokeWeight, outerPointRotation);
                var linkWidth = Math.max(0.5, (currentData.getValue(systemD.index, userIndex) / currentData.max()) * 8);

                systemD.pie.each(function(slice, index) {
                  var sliceCoord, sliceAngle, angleOffset, distance, xx, yy, curveControlStart;

                  if (userIndex === index) {
                    sliceCoord = getClosestCirclePoint(outerCoord.x, outerCoord.y, systemD.x - innerRadius, systemD.y - innerRadius, systemD.r);
                    sliceAngle = Math.atan2(sliceCoord.y - (systemD.y - innerRadius), sliceCoord.x - (systemD.x - innerRadius)) + Math.PI / 2;
                    
                    if (sliceAngle < 0) {
                      sliceAngle = Math.PI * 2 + sliceAngle;
                    }

                    angleOffset = Math.min((slice.endAngle - slice.startAngle) / 2, 10 / (2 * Math.PI * systemD.r) * (2 * Math.PI)); // 10 pixels slice padding
                    sliceAngle = Math.max(slice.startAngle + angleOffset, Math.       min(slice.endAngle - angleOffset, sliceAngle));
                    sliceCoord = DiagramsService.rotate(0, -systemD.r, sliceAngle, systemD.x - innerRadius, systemD.y - innerRadius);
                    xx = sliceCoord.x - outerCoord.x;
                    yy = sliceCoord.y - outerCoord.y;
                    distance = Math.sqrt(xx * xx + yy * yy);
                    curveControlStart = DiagramsService.rotate(0, -distance / 2, outerPointRotation + Math.PI, outerCoord.x, outerCoord.y);
                    slice.link = linksContainer.append('g').attr('class', 'link');
                    
                    if(!isNaN(sliceCoord.x) && !isNaN(sliceCoord.y)){

                      slice.link.append('path')
                      .attr('d', 'M' + outerCoord.x + ',' + outerCoord.y + 'C' + curveControlStart.x + ',' + curveControlStart.y + ',' + sliceCoord.x + ',' + sliceCoord.y + ',' + sliceCoord.x + ',' + sliceCoord.y)
                      .attr('stroke-width', linkWidth)
                      .attr('stroke', userColor)
                      .attr('class', 'path');

                      slice.link.append('circle')
                      .attr('r', 4)
                      .attr('cx', outerCoord.x)
                      .attr('cy', outerCoord.y)
                      .attr('fill', userColor)
                      .attr('class', 'connection-point');

                    
                      slice.link.append('circle')
                      .attr('r', 4)
                      .attr('cx', sliceCoord.x)
                      .attr('cy', sliceCoord.y)
                      .attr('fill', userColor)
                      .attr('class', 'connection-point');
                    }
                  }
                });
              });

              function getClosestCirclePoint(pX, pY, cX, cY, r) {
                var vX = pX - cX;
                var vY = pY - cY;
                var magV = Math.sqrt(vX * vX + vY * vY);
                return {x: cX + vX / magV * r, y: cY + vY / magV * r};
              }

              users.on('mouseover', function(d, index){
                svg.classed('hover', true);
                setActiveUser(this, index);

              }).on('mouseout', function(){
                svg.classed('hover', false);
                setActiveUser(this, -1);
              }).on('click', function(d, index){

                if (currentData.rowsNames[index].children) {
                  d3.event.preventDefault();
                  drawDiagram(data, level + 1);
                }
                
              });

              function setActiveUser(context, index) {
                d3.select(context).classed('active', index >= 0);
                systems.each(function(d) {
                  if (d.depth) {
                    var systemTh = d3.select(this);
                    systemTh.classed('active', index >= 0);

                    if (index >= 0) {
                      d3.select(this).select('.value').each(function() {
                        var th = d3.select(this);
                        th.text(Math.round(currentData.getValue(d.index, index) * 10) / 10);
                        var textBBox = th.node().getBBox();

                        systemTh.select('.value-bg').each(function() {
                          d3.select(this)
                            .attr('x', textBBox.x - valueBgVisual.paddingH)
                            .attr('y', textBBox.y - valueBgVisual.paddingV)
                            .attr('height', textBBox.height + valueBgVisual.paddingV * 2)
                            .attr('width', textBBox.width + valueBgVisual.paddingH * 2);
                        });
                      });
                    }

                    d.pie.classed('hidden', function(d, sliceIndex){
                      return index !== sliceIndex && index >= 0;
                    });
                  }
                });
              }

              systems.on('mouseover', function(d){
                svg.classed('hover', true);
                setActiveSystem(this, d.index);

              }).on('mouseout', function(){
                svg.classed('hover', false);
                setActiveSystem(this, -1);
              });

              function setActiveSystem(context, index) {
                var byUsers = [];
                d3.select(context)
                  .classed('active', index >= 0)
                  .each(function(d){
                    d.pie.each(function(slice, userIndex){
                      if (slice.value) {
                        slice.link.classed('active', index >= 0);
                        byUsers.push(userIndex);
                      }
                    });
                  });

                if (index >= 0) {

                  d3.select(context).select('.value').each(function() {
                    var th = d3.select(this);
                    th.text(Math.round(d3.sum(currentData.getValue(index)) * 10) / 10);
                    var textBBox = th.node().getBBox();

                    d3.select(context).select('.value-bg').each(function() {
                      d3.select(this)
                        .attr('x', textBBox.x - valueBgVisual.paddingH)
                        .attr('y', textBBox.y - valueBgVisual.paddingV)
                        .attr('height', textBBox.height + valueBgVisual.paddingV * 2)
                        .attr('width', textBBox.width + valueBgVisual.paddingH * 2);
                    });
                  });
                }



                users.classed('active', function(d, userIndex) {
                  return byUsers.indexOf(userIndex) >= 0 && index >= 0;
                });
              }


              svg.classed('hover', false);
              systems.classed('active', false);
            });

            resize();
          }

          function resize() {
            var box = centerContainer.node().getBBox();
            svg.attr('height', box.height || 1);

            // This is added to display the chart without clipping on zoom  
            svg.style('width',box.width + 'px');              
            svg.style('display','block');              
            svg.style('margin','auto');
            svg.style('margin-top','5%');
            svg.style('overflow','auto');
            
            // This is added as IE11/Edge browsers clipping the svg 
            mainWrapper.css('height', (box.height || 1) + 'px');
            centerContainer.attr('y', -box.y);
          }

          function createTree(root, radius, maxLevel, current, level) {
            maxLevel = typeof maxLevel === 'undefined' ? 5 : maxLevel;
            level = level || 0;
            current = current || root;

            var colors = d3.scale.category20();

            for (var i = 0; i < current.rowsNames.length; i++) {
              current.rowsNames[i].color = colors[Math.min(colors.length - 1, i)];
              current.rowsNames[i].color = colors(i);
            }

            if (level >= maxLevel) {
              return root;
            }

            var rowsSum = d3.sum(current.rowsSum()),
                pruned = current.pruneRows(function(d) {
                  return (DiagramsService.Matrix.sum(d) / rowsSum) * (2 * Math.PI * radius) < 25;
                });

            if (!pruned.values.length) {
              return root;
            }
            
            current.addRow(pruned.colsSum(), {name:'Other (' + pruned.values.length + ')', children:pruned, color:'#4d4d4d'});

            return createTree(root, radius, maxLevel, pruned, level + 1);
          }
        }
      };
    }])
  .directive('divChartBar', function() {
      return {
          restrict: 'A',
          scope: {
        value: '=',
            color: '='
      },
        link: function(scope, ele) {
          $(ele).css({width:scope.value * 180 + 'px', height:'5px', 'border-radius':'2.5px', 'background-color':scope.color, display:'inline-block', 'vertical-align':'middle'});
        }
      };
  })
  .directive('anomalyGrid',['deviceDetector', function (deviceDetector) {
    return {
      restrict: 'EA',
      template: '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1"></svg>',
      replace: false,
      scope: {
        data: '='
      },
      link: function (scope, ele) {
        var xmlns = 'http://www.w3.org/2000/svg',            
            template,
            data,
            avData,
            gridSpacing = {x:50, y:50},
            chartLen = 70,
            dataLen,
            gridStepX;       

        var items;
        
        var main, body, users, lines, circles, labels, systems;
        
        var i, v, line, circle, circleArea, circleG, chart, barLength, j, columnDt;                
        var maxRadius = Math.min(gridSpacing.x, gridSpacing.y) / 2 - 1;
        var radiusCoeff = maxRadius / Math.sqrt(maxRadius / Math.PI);
        var circleLabel;
        var daysValues = [];
        var tip = d3.tip().attr('class', 'd3-tip').html(function(d) { return d.Users + '<br />' + d.Systems + '<br />Count: <strong>' + d.usage + '</strong>'; }).offset([-8, 0]);        

        template = ele.find('svg')[0];                    
        d3.select(template).call(tip);

        var circleOverFunc = function() {          
          var circleData = $(this).data('grid');
          $(this).addClass('hover');
          tip.show({Users:data.Users[circleData.Users], Systems:data.Systems[circleData.Systems], usage:circleData.usage}, circleData.actual);
        };

        var circleOutFunc = function() {
          tip.hide();
          $(this).removeClass('hover');
        };

        var chartOverFunc = function() {
          var i, label, bBox, oType;
          var opposite = {'Users':'Systems', 'Systems':'Users'};
          var chartData = $(this).data('grid');

          fadeLabels();
          
          for (i = 0; i < items.circles.length; i++) {
            if (items.circles[i][chartData.type] === chartData.value ||
              items.circles[i][chartData.type+'1'] === chartData.value) {
              $(items.circles[i].node).removeClass('faded');

              oType = opposite[chartData.type];
              label = items.labels[oType][items.circles[i][oType]];
              bBox = items.circles[i].actual.getBBox();

              if ((chartData.type === 'Users' && chartData.value > 0) || (chartData.type === 'Systems' && chartData.value < data.Systems.length - 1)) {
                if (oType === 'Users') {
                  label.setAttribute('x', bBox.x + bBox.width + 5);
                  label.setAttribute('y', bBox.y + bBox.height / 2 - 10);
                }
                else {
                  label.setAttribute('x', bBox.x + bBox.width / 2);
                  label.setAttribute('y', bBox.y - 10);
                }
                
                $(label).removeClass('faded');
              } 
            }
            else {
              $(items.circles[i].node).addClass('faded');
            }
          }

          for (i = 0; i < items.lines.length; i++) {
            if ((items.lines[i].type === chartData.type && items.lines[i].value === chartData.value) || items.lines[i].type !== chartData.type) {
              $(items.lines[i].node).removeClass('faded');
            }
            else {
              $(items.lines[i].node).addClass('faded');
            }
          }
        };

        var chartOutFunc = function() {
          var i;

          for (i = 0; i < items.circles.length; i++) {
            $(items.circles[i].node).removeClass('faded');
          }

          for (i = 0; i < items.lines.length; i++) {
            $(items.lines[i].node).removeClass('faded');
          }

          fadeLabels();
        };

        drawDiagram();

        function drawDiagram(){
          data = scope.data;
          avData = scope.data.average;
          dataLen = Object.keys(scope.data.Data).length;
          gridStepX = gridSpacing.x * data.Systems.length;

          items = {
            lines:[],
            charts:[],
            circles:[],
            labels:{'Systems':[], 'Users':[]}
          };

          main = document.createElementNS(xmlns, 'svg');
          body = document.createElementNS(xmlns, 'svg');
          users = document.createElementNS(xmlns, 'svg');
          lines = document.createElementNS(xmlns, 'svg');
          circles = document.createElementNS(xmlns, 'svg');
          labels = document.createElementNS(xmlns, 'svg');
          systems = document.createElementNS(xmlns, 'svg');

          main.setAttribute('x', gridSpacing.x / 2);
          body.setAttribute('x', 150);
          labels.setAttribute('class', 'grid-labels');
          body.setAttribute('class', 'grid-body');
          systems.setAttribute('x', 150);

          createSystemsHeader();
          createUsersColumn();
          attachEvents();     
          createVerticalLines();        
          prepareDaysValues();
          createCirclesAndLines();      
          assemble();
        }

        scope.$watch('data', function(newVal, oldVal){
          if(newVal !== oldVal){            
            $(template).empty();
            drawDiagram();
          }          
        }, true);

        function createSystemsHeader(){
          // Systems header            
          for (j = 0; j < dataLen; j++){
            /*console.log('scope.data.StartDate: ', scope.data.StartDate);*/
            var startDt = angular.copy(scope.data.StartDate);
            columnDt = startDt.add(j,'days');
            for (i = 0; i < data.Systems.length; i++) {     
              barLength = avData.Usage.chart.Systems.valuesByDay[j]? (avData.Usage.chart.Systems.valuesByDay[j][i] / avData.Usage.chart.Systems.max * chartLen):0;
              barLength = barLength?barLength:0;              

              chart = getchartBar(((j * gridStepX)+(i * gridSpacing.x)), 0, barLength, columnDt.format('D MMM')+' '+data.Systems[i], '/#/systems/system/'+data.Systems[i], -45, 30);
              $(chart).data('grid', {type:'Systems', value:j+'-'+i});
              items.charts.push(chart);
              systems.appendChild(chart);
            }
          }
        }

        function createUsersColumn(){
            // Users column
          for (i = 0; i < data.Users.length; i++) {
            barLength = avData.Usage.chart.Users.values[i] / avData.Usage.chart.Users.max * chartLen;
            chart = getchartBar(0, gridSpacing.y + i * gridSpacing.y, barLength, data.Users[i], '/#/users/details/' + (data.UserIds?data.UserIds[i].replace(' ',''):0), 0, 40, 'right');
            $(chart).data('grid', {type:'Users', value:i});
            items.charts.push(chart);
            users.appendChild(chart);
          }  
        }        

        function fadeLabels() {
          for (var key in items.labels) {
            for (var i = 0; i < items.labels[key].length; i++) {
              $(items.labels[key][i]).addClass('faded');
            }
          }
        }

        function attachEvents(){
            for (i = 0; i < items.charts.length; i++) {
              $(items.charts[i]).mouseover(chartOverFunc).mouseout(chartOutFunc);
            }  
        }

        function getchartBar(x, y, length, text, url, rotation, maxLength, align) {
          var chartLink = $(document.createElementNS(xmlns, 'g')),
              rightAlign = align === 'right'? true : false;

          var chartRect = $(document.createElementNS(xmlns, 'rect')).attr({
            width: chartLen,
            height: gridSpacing.y,
            fill: 'rgba(0, 0, 0, 0)',
            x: rightAlign ? -chartLen : 0,
            y: -gridSpacing.y / 2
          });

          var chartBar = $(document.createElementNS(xmlns, 'line')).attr({
            x1: rightAlign ? -length : 0,
            x2: rightAlign ? 0 : length,
            y1: 0,
            y2: 0,
            class: 'chart-bar'
          });


          var chartText = getText(text, 0, -10, maxLength);

          if (rightAlign) {
            $(chartText).attr('text-anchor', 'end');
          }
          
          var chart = $(document.createElementNS(xmlns, 'svg')).attr({
            x: x,
            y: y
          });

          chartLink.append(chartText, chartBar, chartRect);

          if (rotation) {
            chartLink[0].setAttribute('transform', 'rotate(' + rotation + ' 0 0)');
          }

          chart.append(chartLink);

          return chart[0];
        }

        function getText(text, x, y, maxLength) {
          var label = $(document.createElementNS(xmlns, 'text')).attr({
            x: x,
            y: y,
            class: 'item-label'
          });

          var str = text;

          if (typeof maxLength !== 'undefined' && str.length > maxLength) {
            str = str.substring(0, maxLength).trim() + '...';
          }

          label.append(document.createTextNode(str));

          return label[0];
        }

        function getLabel(text, x, y, rotation) {
          var container = $(document.createElementNS(xmlns, 'svg')).attr({
            x: x,
            y: y,
            class: 'faded transition'
          });

          var label = getText(text, x, y);

          if (rotation) {
            label.setAttribute('transform', 'rotate(' + rotation + ' 0 0)');
          }
          
          container.append(label);
          return container[0];
        }        

        function getRadius(scale) {
            return scale ? Math.sqrt(scale * maxRadius / Math.PI) * radiusCoeff : 0;
        }

        function createVerticalLines(){
            for (j = 0; j < dataLen; j++){
              // Vertical lines

            for (i = 0; i < data.Systems.length; i++) {
              line = $(document.createElementNS(xmlns, 'line')).attr({
                x1: (j * gridStepX) + gridSpacing.x * i,
                x2: (j * gridStepX) + gridSpacing.x * i,
                y1: 0,
                y2: gridSpacing.y * data.Users.length,
                class: 'grid-line v'
              });
         
                items.lines.push({node:line[0], type:'Systems', value:j+'-'+i});
                circleLabel = getLabel(data.Systems[i], 0, 0, -45);
                labels.appendChild(circleLabel);
                items.labels.Systems.push(circleLabel);
                lines.appendChild(line[0]);
            }
          }
        }                

        function prepareDaysValues(){
          var keys = _.keys(data.Data).sort(function(a, b) { return moment(a, 'MM-DD-YYYY').valueOf() - moment(b, 'MM-DD-YYYY').valueOf();});  

          keys.forEach(function(item){        
            daysValues.push(data.Data[item]);
          });
        }

        function createCirclesAndLines(){
          var circleData;
          var zRange = [data.MinStrength, data.MaxStrength];

          var zScores=[];
          _.values(data.Data).forEach(function(item){
            zScores.push(item.Strength);
          });
          /*console.log(zScores);*/
          var colors = d3.scale.linear()
              .domain([0, 0.6, 0.8, 1])
              .interpolate(d3.interpolateRgb)
              .range(['#718a97','#7eadb0', '#eae81c', '#f61d1d']);

          for (j = 0; j < dataLen; j++){
            var usage = daysValues[j].Usage;

            for (i = 0; i < data.Users.length; i++) {
              line = $(document.createElementNS(xmlns, 'line')).attr({
                x1: (j*gridStepX)-gridSpacing.x,
                x2: (j*gridStepX)+data.Systems.length * gridSpacing.x-gridSpacing.x,
                y1: gridSpacing.y + gridSpacing.y * i,
                y2: gridSpacing.y + gridSpacing.y * i,
                class: 'grid-line h'
              });

              items.lines.push({node:line[0], type:'Users', value:i});
              circleLabel = getLabel(data.Users[i], 0, 0);
              labels.appendChild(circleLabel);
              items.labels.Users.push(circleLabel);
              lines.appendChild(line[0]);

              for (v = 0; v < data.Systems.length; v++) {
                circleG = $(document.createElementNS(xmlns, 'g')).attr({class:'transition'});
                circle = $(document.createElementNS(xmlns, 'circle')).attr({
                  cx: (j*gridStepX)+gridSpacing.x * v,
                  cy: gridSpacing.y + gridSpacing.y * i,
                  r: Math.max(0.001, getRadius(usage[i][v] / data.MaxValue)), //Returning .001 radius as FF, IE and Edge are not recognising circles with 0 radius
                  class: 'transition grid-circle',
                  fill: colors(zScores[j][i][v] - zRange[0]/ (zRange[1] - zRange[0]))
                });                

                circleArea = $(document.createElementNS(xmlns, 'circle')).attr({
                  cx: (j*gridStepX)+gridSpacing.x * v,
                  cy: gridSpacing.y + gridSpacing.y * i,
                  r: Math.max(maxRadius, getRadius(usage[i][v] / data.MaxValue)),
                  fill: 'rgba(0, 0, 0, 0)'
                });
                
                circleData = {node:circleG, 'Users':i, 'Systems':v, 'Systems1':j+'-'+v, actual:circle[0], usage:usage[i][v]};
                items.circles.push(circleData);
                circleG.mouseover(circleOverFunc).mouseout(circleOutFunc).data('grid', circleData);

                circleG.append(circle, circleArea);
                circles.appendChild(circleG[0]);
              }
            }
          }  
        }       

        function assemble() {
          main.appendChild(body);
          main.appendChild(users);
          main.appendChild(systems);
          body.appendChild(lines);
          body.appendChild(circles);
          template.appendChild(main);

          var bodyBBox = body.getBBox();
          var usersBBox = users.getBBox();
          var systemsBBox = systems.getBBox();
          // In dashboard Anomalies vertical scroll bar is appearing in various browsers even though there is no data overflow, to fix this issue we are using offsetToAvoidUnnecssaryVerticalScrollbar 
          //TODO: Need generic solution that works for all browsers.
          var offsetToAvoidUnnecssaryVerticalScrollbar;
          if(deviceDetector.browser==='safari'){
            offsetToAvoidUnnecssaryVerticalScrollbar=40;
          }else{
            offsetToAvoidUnnecssaryVerticalScrollbar=10;
          }

          $(users).attr({x:-usersBBox.x, y: systemsBBox.height});
          $(systems).attr({x:-usersBBox.x - bodyBBox.x, y: systemsBBox.height});
          $(body).attr({x:-usersBBox.x - bodyBBox.x, y: systemsBBox.height});

          var mainBBox = main.getBBox();
          $(main).attr({height:mainBBox.height});
          mainBBox = main.getBBox();
          $(template).css({width:mainBBox.x + mainBBox.width + 30 + 'px', height:mainBBox.y + mainBBox.height+offsetToAvoidUnnecssaryVerticalScrollbar + 'px'});
        }
      }
    };
  }]);