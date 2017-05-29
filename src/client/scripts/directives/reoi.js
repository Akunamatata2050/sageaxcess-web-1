angular
  .module('theme.core.reoi_directives', [])
  .directive('reoiTimeline', ['GraphicsService', '$window', function(GraphicsService, $window) {
    'use strict';
    return {
      restrict: 'A',
      scope: {
          data: '=',
          selected: '=',
          options: '=',
          startDate: '=',
          endDate: '=',
          rowHeight: '='
      },
      link: function(scope, ele) {
        var svg = d3.select(ele[0]).append('svg'), rowsEl;

        scope.$watch('selected', function(){
            updateSelected();
        });

        scope.$watch('data', function(){
          redraw();
        });

        angular.element($window).bind('resize', function(){
          redraw();
        });

        // function getReoiID(ip){
        //   var reoId;
        //   for (var i = 0; i < scope.data.length; i++) {
        //     if(scope.data[i].IP === ip){
        //       reoId = scope.data[i].ReoiID;
        //     }
        //   }

        //   return reoId;
        // }

        function prepareData() {
          var m, d, rows = [], events = {}, maxSize = 0, range = {firstEvent:{moment:moment([3000]), size: 0}, lastEvent:{moment:moment([0]), size: 0}}, groups = {};
          for (var i = 0; i < scope.data.length; i++) {
            if(scope.data[i].IP){
              scope.data[i].IP=scope.data[i].IP.replace(/\./g,'_');  
            }
            
            d = scope.data[i];
            m = moment(d.WindowID, ['YYYY-MM-DDTHH:mm:ss.SSSSZ', 'YYYY-MM-DDTH:mm:ss.SSSSZ']);
            events[d.AnomalyID] = events[d.AnomalyID] || {moment:m, id:d.AnomalyID, size:d.Size, reois:[]};
            events[d.AnomalyID].reois.push(d.IP);

            if (rows.indexOf(d.IP) === -1) {
              rows.push(d.IP);
            }

            maxSize = Math.max(maxSize, d.Size);

            if (m.valueOf() < range.firstEvent.moment.valueOf() || (m.valueOf() === range.firstEvent.moment.valueOf() && d.Size > range.firstEvent.size)) {
              range.firstEvent = events[d.AnomalyID];
            }

            if (m.valueOf() > range.lastEvent.moment.valueOf() || (m.valueOf() === range.lastEvent.moment.valueOf() && d.Size > range.lastEvent.size)) {
              range.lastEvent = events[d.AnomalyID];
            }

            groups[d.IP] = groups[d.IP] || {events:[]};
            groups[d.IP].events.push(events[d.AnomalyID]);
          }

          angular.forEach(groups, function(value) {
            value.events.sort(function(a, b){
              return a.moment.valueOf() - b.moment.valueOf();
            });

            value.firstEvent = value.events[0];
            value.lastEvent = value.events[value.events.length - 1];
          });
  
          return {events:events, groups:groups, range:range, rows:rows.sort(), maxSize:maxSize};
        }

        function redraw() {
          svg.selectAll('*').remove();
          var options = scope.options || {};

          if (!scope.data) {
            return;
          }

          if (options.selectable) {
            ele.addClass('selectable');
          }

          var bodyEl = svg.append('svg').attr('class', 'reoi-body'),
              sideEl = svg.append('svg'),
              width = ele.width() || 0,
              sideGap = 10,
              dateSpaceH = 75,
              dateGap = 6,
              rowH = scope.rowHeight || 65,
              maxCircleR = rowH / 4 - 1,
              opt = prepareData(),
              veryFirstEventGap = opt.range.firstEvent.size / opt.maxSize * maxCircleR + dateGap,
              veryLastEventGap = opt.range.lastEvent.size / opt.maxSize * maxCircleR + dateGap,
              sineH = 25,
              dateSpaceV = 10,
              rangeDiff = opt.range.lastEvent.moment.diff(opt.range.firstEvent.moment),
              rangeDays = opt.range.lastEvent.moment.diff(opt.range.firstEvent.moment, 'days', true),
              i, titles;

          $(svg.node()).css('height', opt.rows.length * rowH + 'px');
          titles = sideEl.selectAll('text').data(opt.rows).enter()
            .append('a')
              .attr('xlink:href', function(d) { return '/#/reoi/' + d+'/?startDate='+moment(scope.startDate).format('MM-DD-YYYY')+'&endDate='+moment(scope.endDate).format('MM-DD-YYYY');})
              .attr('target', '_top')
            .append('text')
              .text(function(d) {  
                if(d){

                  return d.endsWith('_1')?'':d.replace(/_/g,'.');
                } else{
                  return '';
                }              
                }
                )
              .attr('class', 'group-name')
              .attr('dominant-baseline', 'middle')
              .attr('y', function(d, i) { return i * rowH + rowH / 2;});

          var sideBBox = sideEl.node().getBBox(),
              sideOffset = sideBBox.width ? sideBBox.width + sideGap : 0,
              bodyWidth = width - sideOffset,
              sineWrapperWidth = bodyWidth - dateSpaceH * 2 - veryFirstEventGap - veryLastEventGap,
              numSines = rangeDays * 2,
              numSinesFull = Math.ceil(numSines + 30),
              pathWidth = numSinesFull / numSines * sineWrapperWidth,
              sineOffsetX = opt.range.firstEvent.moment.diff(moment(opt.range.firstEvent.moment).startOf('day'), 'days', true) * (sineWrapperWidth / numSines * 2);

          bodyEl.attr('x', sideOffset);

          rowsEl = bodyEl.selectAll('svg').data(opt.rows).enter()
            .append('svg')
              .attr('y', function(d, i) { return i * rowH;});
            
            if (options.linked) {
              rowsEl = rowsEl.append('a')
                .attr('xlink:href', function(d) { return '/#/reoi/' + d+'/?startDate='+moment(scope.startDate).format('MM-DD-YYYY')+'&endDate='+moment(scope.endDate).format('MM-DD-YYYY');})
                .attr('target', '_top')
                .attr('class', 'row-link');
            }

            rowsEl.each(function(d, rowIndex) {
              var thEl = d3.select(this),
                  sX, sXR,
                  eX, eXR,
                  sineWrapper,
                  reoi = d,
                  sDiff = opt.groups[d].firstEvent.moment.valueOf() - opt.range.firstEvent.moment.valueOf(),
                  eDiff = opt.groups[d].lastEvent.moment.valueOf() - opt.range.firstEvent.moment.valueOf(),
                  firstEventGap = opt.groups[d].firstEvent.size / opt.maxSize * maxCircleR + dateGap,
                  lastEventGap = opt.groups[d].lastEvent.size / opt.maxSize * maxCircleR + dateGap;

              sX = (sDiff / rangeDiff * sineWrapperWidth) || 0;
              eX = (eDiff / rangeDiff * sineWrapperWidth) || 0;
              sXR = dateSpaceH + veryFirstEventGap + sX;
              eXR = dateSpaceH + veryFirstEventGap + eX;

              thEl.append('rect')
                .attr('x', 0)
                .attr('y', 0)
                .attr('width', bodyWidth)
                .attr('height', rowH)
                .attr('fill', 'rgba(0, 0, 0, 0)');
              
              sineWrapper = thEl.append('svg')
                .attr('height', rowH)
                .attr('width', (eX - sX)>0?(eX - sX):0)
                .attr('x', sXR);

              thEl.append('line')
                .attr('class', 'd-n-line')
                .attr('x1', 0)
                .attr('y1', rowH / 2)
                .attr('x2', bodyWidth)
                .attr('y2', rowH / 2);

              appendText(thEl, opt.groups[d].firstEvent.moment.format('L'), sXR - firstEventGap, rowH / 2 - dateSpaceV, 'end');
              appendText(thEl, opt.groups[d].firstEvent.moment.format('hh:mm A'), sXR - firstEventGap, rowH / 2 + dateSpaceV, 'end', 'hanging');

              appendText(thEl, opt.groups[d].lastEvent.moment.format('L'), eXR + lastEventGap, rowH / 2 - dateSpaceV);
              appendText(thEl, opt.groups[d].lastEvent.moment.format('hh:mm A'), eXR + lastEventGap, rowH / 2 + dateSpaceV, 'start', 'hanging');              
              
              sineWrapper.append('path')
                .attr('d', GraphicsService.getSine(numSinesFull, pathWidth, sineH))
                .attr('class', 'sine-path')
                .attr('fill', 'none')
                .attr('stroke', 'black')
                .attr('transform', 'translate(' + [(- sineOffsetX - (pathWidth / numSinesFull / 2) - sX) , rowH / 2] + ')');

              thEl.selectAll('g.event-circle').data(opt.groups[d].events).enter()
                .append('g')
                  .attr('class', function(d){return 'event-circle cc' + d.id + 'x' + reoi;})
                  .classed('shared', function(d) { return d.reois.length > 1;})
                  .attr('transform', function(d) {
                    var dayDiff = d.moment.diff(moment(d.moment).startOf('day'), 'days', true);
                    this._rowIndex = rowIndex;
                    this._pos = [dateSpaceH + veryFirstEventGap + d.moment.diff(opt.range.firstEvent.moment) / rangeDiff * sineWrapperWidth, rowH / 2 - Math.sin(dayDiff * Math.PI * 2 - Math.PI / 2) * (sineH / 2)];
                    return 'translate(' + this._pos + ')';
                })
                .each(function(d) {
                  var thEl = d3.select(this);
                  thEl.append('circle')
                    .attr('class', 'area-circle')
                    .classed('shared', d.reois.length > 1)
                    .attr('r', d.size / opt.maxSize * maxCircleR);

                  thEl.append('circle')
                    .attr('class', 'center-circle')
                    .attr('r', 1.5);

                  if (options.selectable) {
                    thEl.on('click', function(d) {
                      toggleSelected(d);
                    });
                  }
                });
            });

          angular.forEach(opt.events, function(value) {
            var from, to;
            if (value.reois.length > 1) {
              for (var i = 0; i < value.reois.length - 1; i++) {
                from = bodyEl.select('.cc' + value.id + 'x' + value.reois[i]);
                to = bodyEl.select('.cc' + value.id + 'x' + value.reois[i + 1]);

                bodyEl.append('line')
                  .attr('class', 'shared-link')
                  .attr('x1', from.node()._pos[0])
                  .attr('y1', from.node()._pos[1] + from.node()._rowIndex * rowH)
                  .attr('x2', to.node()._pos[0])
                  .attr('y2', to.node()._pos[1] + to.node()._rowIndex * rowH);
              }
            }
          });

          for (i = 0; i < Math.ceil(rangeDays); i++) {
            var edgeX = (i + 1) * (sineWrapperWidth / rangeDays) - sineOffsetX + dateSpaceH + veryFirstEventGap;
            bodyEl.append('line')
              .attr('class', 'day-edge')
              .attr('x1', edgeX)
              .attr('y1', 0)
              .attr('x2', edgeX)
              .attr('y2', opt.rows.length * rowH);
          }

          function appendText(target, text, x, y, anchor, baseline) {            
            var t = target.append('text')
              .text(text)
              .attr('x', x)
              .attr('y', y);

            if (anchor) {
              t.attr('text-anchor', anchor);
            }

            if (baseline) {
              t.attr('dominant-baseline', baseline);
            }
          }

          updateSelected();
        }

        function toggleSelected(d){
          var sel = scope.selected || [];
          var i = sel.indexOf(d.id);

          if (i > -1) {
            sel.splice(i, 1);
          }
          else {
            sel.push(d.id);
          }

          scope.selected = sel;
          updateSelected();

          scope.$apply();
        }

        function updateSelected() {
          if (!rowsEl) {
            return;
          }
          var c = rowsEl.selectAll('g.event-circle');
          var sel = scope.selected || [];
          c.each(function(d) {
            d3.select(this).classed('selected', sel.indexOf(d.id) > -1);
          });
        }
      }
    };
  }])
.directive('reoiList', ['$location', function($location) {
    'use strict';
    return {
      templateUrl: 'views/reoi/details-list-template.html',
      replace: true,
      restrict: 'A',
      scope: {
          data: '=',
          fields: '=',
          title: '=',
          links: '=',
          headerFunc: '=',
          rowFunc: '=',
          beforeEachFunc: '=',
          link: '=',
          activities: '='
      },
      link: function(scope, ele) {
        update();

        scope.$watchGroup(['data', 'fields'], function(n, o){
          if (n !== o) {
            update();
          }
        }, true);

        scope.dblClick = function(item) {
          if (scope.link) {
            $location.path(scope.link + item.value);
          }
        };

        scope.isDisabled = function(item) {
          var linkId, linkItem, i, field, disabled;

          for (linkId in scope.links) {
            if (linkId !== scope.id) {

              if (typeof disabled === 'undefined') {
                disabled = true;
              }

              linkItem = scope.links[linkId];

              for (i in linkItem.data) {
                field = linkItem.data[i].field;

                if (isRelated(field, linkItem.value, item)) {
                  disabled = false;
                }
              }
            }
          }
 
          return disabled || false;
        };

        function isRelated(field, value, testItem) {
          var i, k;
          for (i in testItem.data) {
            for (k in testItem.data[i].items) {
              if (testItem.data[i].items[k][field] === value) {
                return true;
              }
            }
          }
          return false;
        }

        scope.isSelected = function(item) {
          return scope.links && scope.links[scope.id] && scope.links[scope.id].value === item.value;
        };

        scope.dataIntersect = dataIntersect;

        scope.select = function(item) {
          if (scope.links && scope.links[scope.id] && scope.links[scope.id].value === item.value) {
            delete scope.links[scope.id];
          }
          else {
            scope.links = scope.links || {};
            scope.links[scope.id] = item;
          }
        };

        function update() {
          if (scope.activities) {
            $(ele).find('.body').addClass('show-activity');
          }

          scope.id = String(scope.fields);
          var i, k,
              fields = Array.isArray(scope.fields) ? scope.fields : [scope.fields],
              items = getAllItems(),
              field, item, fieldValue,
              res = {};

          for (i = 0; i < fields.length; i++) {
            field = fields[i];
            res[field] = res[field] || {};

            for (k = 0; k < items.length; k++) {
              item = items[k];
              fieldValue = item[field];
              res[field][fieldValue] = res[field][fieldValue] || [];
              res[field][fieldValue].push(items[k]);
            }
          }

          scope.gridData = getGridData(res);

          if (scope.headerFunc) {
            scope.header = scope.headerFunc(scope.gridData);
          }
        }

        function dataIntersect(a, b, key) {
          if (Array.isArray(a) && Array.isArray(b)) {

            for (var i in a) {
              for (var k in b) {

                if (b[k][key] === a[i][key]) {
                  return true;
                }
              }
            }
          }
          
          return false;
        }

        function getGridData(obj) {
          var resV = {}, res = [], values, item;

          for (var field in obj) {
            values = obj[field];

            for (var value in values) {
              resV[value] = resV[value] || [];
              resV[value].push({field:field, items:obj[field][value]});
            }
          }

          for (var key in resV) {
            item = {value:key, data:resV[key]};

            if (scope.rowFunc) {
              item.details = scope.rowFunc(item);
            }

            if (item.value) {
              res.push(item);
            }
          }

          return res;
        }

        function getAllItems() {
          var res = [];

          if (scope.data) {
            for (var i = 0; i < scope.data.length; i++) {
              if(scope.data[i].Data){               
                for (var k = 0; k < scope.data[i].Data.length; k++) {
                  res.push(scope.data[i].Data[k]);
                } 
              }
            }
          }
      
          return res;
        }
      }
    };
}])
.directive('reoiInfo', [function() {
    'use strict';
    return {
      templateUrl: 'views/reoi/details-info-template.html',
      replace: true,
      restrict: 'A',
      scope: {
          data: '=',
      },
      link: function(scope, ele) {

        scope.range = {s:'', e:''};
        scope.duration = 0;

        update();

        scope.$watch('data', function(n, o){
          if (n !== o) {
            update();
          }
        }, true);

        function update() {
          if (!scope.data) { return; }

          var range = getRange(scope.data);

          scope.duration = getDuration(range.min, range.max);
          scope.range = {s:range.min.format('MMM DD, YYYY hh:mm A'), e:range.max.format('MMM DD, YYYY hh:mm A')};
        }

        function getRange() {
          var m, i, min = moment([3000]), max = moment([0]);

          for (i in scope.data) {
            m = moment(scope.data[i].WindowID, ['YYYY-MM-DDTHH:mm:ss.SSSSZ', 'YYYY-MM-DDTH:mm:ss.SSSSZ']);
            min = moment.min(min, m);
            max = moment.max(max, m);
          }

          return {min:min, max:max};
        }

        function getDuration(min, max) {
          max = moment(max);

          var periods = ['years', 'days', 'hours', 'minutes'], 
              periodsS = ['year', 'day', 'hour', 'minute'], 
              value = [],
              diff,
              i;

          for (i in periods) {
            diff = max.diff(min, periods[i]);
            max.subtract(diff, periods[i]);
            if (value.length || diff) {
              value.push(diff + ' ' + (diff === 1 ? periodsS[i] : periods[i]));
            }
          }
          return value.join(', ');
        }
      }
    };
}])
.directive('collapsible', [function() {
    'use strict';
    return {
      restrict: 'A',
      link: function(scope, ele) {
        var arrow = $('<div class="collapse-icon"><i class="fa fa-angle-down"></i></div>').appendTo(ele.find('.table-cell')[0]);
        arrow.on('click', function(){
          $(ele).toggleClass('collapsed');
        });
      }
    };
}]);