'use strict';
angular
.module('theme.core.custom_directives', [])
.directive('highlightRow', [function() {
  return {
    restrict: 'A',
    link: function(scope, ele) {
      var row;
      row = ele.closest('.row').css({
        'cursor': 'text'
      }).addClass('input');
      return ele.on('focus', function() {
        return row.addClass('selected');
      }).on('blur', function() {
        return row.removeClass('selected');
      });
    }
  };
}])
.directive('d3Sparkline', function () {
  return {
    restrict: 'EA',
    template: '<div></div>',
    replace: true,
    scope: {
      data: '=',
      width: '=',
      height: '=',
      max: '='
    },
    link: function (scope, ele) {

      var i, seriesMax = -Infinity;

      for (i = 0; i < scope.data.values.length; i++) {
        seriesMax = Math.max(seriesMax, scope.data.values[i][1]);
      }

      var x = d3.time.scale()
      .range([0, scope.width]);

      var y = d3.scale.linear()
      .range([scope.height, 0]);

      var area = d3.svg.area()
      .x(function(d) { return x(d[0]); })
      .y0(scope.height)
      .y1(function(d) { return y(d[1] * (seriesMax / scope.max)); });

      var svg = d3.select(ele[0]).append('svg')
      .attr('width', scope.width)
      .attr('height', scope.height)
      .append('g');

      x.domain(d3.extent(scope.data.values, function(d) { return d[0]; }));
      y.domain([0, d3.max(scope.data.values, function(d) { return d[1]; })]);

      svg.append('path')
      .datum(scope.data.values)
      .attr('class', 'area')
      .attr('d', area);
    }
  };
})
.directive('dateNavigator', ['$window', '$rootScope', function ($window, $rootScope) {
  return {
    restrict: 'EA',
    template: '<div class="dn-container">' +
    '<div class="inner">' +
    '<div class="main">' +
    '<div class="graph"></div>' +
    '<div class="scroll-bar">' +
    '<div class="back-button"></div>' +
    '<div class="forward-button"></div>' +
    '</div>' +
    '<div class="pointer">' +
    '<div class="drag-start"></div>' +
    '<div class="drag-end"></div>' +
    '<div class="window">'+
    '<span class="window-start">start</span>'+
    '<span style="" class="window-end">end</span>'+
    '</div>' +
    '</div>' +
    '</div>' +
    '<div class="text-range" style="margin-top: 10px;">' +
    '</div>' +
    '</div>' +
    '</div>',
    replace: true,
    scope: {
      options: '=',
      range: '=',
      callback: '='
    },
    link: function (scope, ele) {

      var data, dateStart, dateEnd, selectedDateStart, selectedDateEnd, width, height;
      var start = 0;
      var end = 0.5;
      var dateCurrent = moment.utc();
      var jqEle = $(ele);
      var pointer = jqEle.find('.pointer');
      var dragButtons = jqEle.find('.drag-start, .drag-end');
      var scrollButtons = jqEle.find('.back-button, .forward-button');
      var main = jqEle.find('.main');
      var graph = jqEle.find('.graph');
      var downData = {x:0, y:0, start:start, end:end, ele:null};
      var mainOffset, mouseOffset;
      var redrawTimeout;

      if (scope.options) {
        updateData(scope.options.data, true);
        delayedRedraw();
      }

      angular.element($window).bind('resize', function(){
        delayedRedraw();
      });

      $rootScope.$on('leftbarCollapsed', function(){
        delayedRedraw();
      });

      function delayedRedraw() {
        clearTimeout(redrawTimeout);
        redrawTimeout = setTimeout(function(){
          redraw();
        }, 100);
      }

      function redraw() {
        if (!scope.options) {return;}

        $(graph).empty();

        width = $(graph).width();
        height = $(graph).height();

        var x = d3.time.scale()
        .range([0, width]);

        var y = d3.scale.linear()
        .range([height, 0]);

        var area = d3.svg.area()
        .x(function(d) { return x(d[0]); })
        .y0(height)
        .y1(function(d) { return y(d[1]); });

        var svg = d3.select(graph[0]).append('svg')
        .attr('width', width)
        .attr('height', height)
        .style('width', width + 'px')
        .style('height',height + 'px')
        .append('g');

        x.domain(d3.extent(data, function(d) { return d[0]; }));
        y.domain([0, d3.max(data, function(d) { return d[1]; })]);

        svg.append('path')
        .datum(data)
        .attr('class', function(){return 'area';})
        .attr('d', area);

        setTimeout(function(){
          calculateMonthLabels();
        }, 250);
      }

      updatePointer();

      setZoomWindowStartEnd();

      function calculateMonthLabels(){
        var startDt = angular.copy(scope.options.summaryStartDate);
        var endDt = angular.copy(scope.options.summaryEndDate);

        var months = endDt.diff(startDt,'months');
        var startDtValue = parseInt(startDt.format('D'));
        var labels = [{'Month': startDt.format('MMM'), 'Days': parseInt(startDt.endOf('month').format('D'))-startDtValue+1}];
        for(var i=1;i<=months;i++){
          var dt = startDt.add(1, 'months');
          labels.push({'Month': dt.format('MMM'), 'Days': parseInt(dt.endOf('month').format('D'))});
        }

        labels.push({'Month': endDt.format('MMM'), 'Days': parseInt(endDt.format('D'))-1});

        var days=0;
        labels.forEach(function(item){
          item.Position=days+item.Days/2;
          days += item.Days;
        });

        setMonthLabels(labels);
      }

      function setMonthLabels(labels){
        $('.label-month').remove();

        var prevElement = jqEle.find('.text-range');
        labels.forEach(function(item){
          var position = 48+(item.Position/180)*graph.width();
          if(graph.width()!=0){
            prevElement.after('<div class="label-month '+item.Month+'"style="color: #a2a1a1;font-size: 12px;position:absolute;left:'+position+'px">'+item.Month+'</div>');
            prevElement = jqEle.find('.'+item.Month);
          }
        });
      }

      function setZoomWindowStartEnd(){
        var summaryStartDate = scope.options.summaryStartDate;
        var summaryEndDate = scope.options.summaryEndDate;

        var dataStartDate = scope.options.dataStartDate;
        var dataEndDate = scope.options.dataEndDate;

        var navLength = summaryEndDate.diff(summaryStartDate, 'days');

        var windowStart = (dataStartDate.diff(summaryStartDate, 'days'))/navLength;
        var windowEnd = (dataEndDate.diff(summaryStartDate, 'days'))/navLength;

        updateScaleRange(windowStart, windowEnd, true);

        var dateFormat = 'MMM DD, YYYY';
        var days = dataEndDate.diff(dataStartDate, 'days');
        if(days<30){
          dateFormat = 'M/D';
        }

        if(days<12){
          dateFormat = 'D';
        }

        jqEle.find('.window-start').text(dataStartDate.format(dateFormat));
        jqEle.find('.window-end').text(dataEndDate.format(dateFormat));
      }

      function fillDragObjects(e) {
        mainOffset = $(main).offset();
        downData.x = e.pageX - mainOffset.left;
        downData.y = e.pageY - mainOffset.top;
        downData.start = start;
        downData.end = end;
        downData.ele = e.target;
      }

      scrollButtons.click(function(e) {
        fillDragObjects(e);
        var diff = end - start;
        movePointer(e.target.className === 'back-button' ? -diff : diff, downData.start, downData.end);
        loadData();
      });

      pointer.mousedown(function(e) {
        fillDragObjects(e);
        pointer.addClass('active');

        $('.dn-container').on('mousemove', pointerMoveFunc).on('mouseup', function() {
          $(this).off('mousemove', pointerMoveFunc);
          pointer.removeClass('active');
          scope.$apply();
        });
      });

      dragButtons.mousedown(function(e){
        e.stopPropagation();
        fillDragObjects(e);
        pointer.addClass('active');

        $('.dn-container').on('mousemove', dragBtnMoveFunc).on('mouseup', function() {
          $(this).off('mousemove', dragBtnMoveFunc);
          pointer.removeClass('active');
          scope.$apply();
        });
      });

      $('.pointer').on('mouseup',function(){
        loadData();
      });

      function dragBtnMoveFunc(e) {
        mouseOffset = e.pageX - mainOffset.left - downData.x;
        scope.range = 'custom';
        moveBound(mouseOffset, downData.ele.className);
      }

      function pointerMoveFunc(e) {
        mouseOffset = e.pageX - mainOffset.left - downData.x;
        var offsetScale = mouseOffset / main.width();
        movePointer(offsetScale, downData.start, downData.end);
      }


      function moveBound(offset, name) {
        var offsetScale = offset / main.width();
        setBounds(name === 'drag-start' ? downData.start + offsetScale : start, name === 'drag-end' ? downData.end + offsetScale : end);
      }

      function setBounds(s, e) {
        updateScaleRange(Math.max(0, Math.min(e, s, 1)), Math.min(1, Math.max(e, s, 0)));
      }

      function movePointer(offset, fromStart, fromEnd) {
        var scaleRange = fromEnd - fromStart;
        var newStart = Math.max(0, Math.min(1 - scaleRange, fromStart + offset));
        updateScaleRange(newStart, newStart + scaleRange, false);
      }

      function updateScaleRange(newStart, newEnd, initial) {
        /*console.log(newStart, newEnd);*/
        if (newStart === start && newEnd === end) {
          return;
        }

        start = newStart;
        end = newEnd;

        updateSelectedDateRange(initial);
        updatePointer();
        setWindowDates();
      }

      function setDateRange(newDateStart, newDateEnd, initial) {
        var mS = moment.utc(newDateStart);
        var mE = moment.utc(newDateEnd);

        if (mS.valueOf() === moment.utc(dateStart).valueOf() && mE === moment.utc(dateEnd).valueOf()) {
          return;
        }

        dateStart = mS;
        dateEnd = mE;

        var dateFormat = 'DD MMM';

        if (dateStart.year() === dateEnd.year() === dateCurrent.year()) {
          dateFormat = 'DD MMM';
        }

        /*jqEle.find('.label-start').text(dateStart.format(dateFormat));
        jqEle.find('.label-end').text(dateEnd.format(dateFormat));*/

        setWindowDates();

        if (!updateSelectedDateRange(initial)) {
          scope.$apply();
        }
      }

      function updateSelectedDateRange() {

        selectedDateStart = scope.options.dataStartDate;
        selectedDateEnd = scope.options.dataEndDate;

        return true;
      }

      function loadData(){
        var range = dateEnd.valueOf() - dateStart.valueOf();
        var newSelStart = moment.utc(dateStart).add(parseInt(range * start));
        var newSelEnd = moment.utc(dateStart).add(parseInt(range * end));

        setWindowDates();

        scope.$apply(scope.callback(newSelStart, newSelEnd));
      }

      function setWindowDates(){

        var range = dateEnd.valueOf() - dateStart.valueOf();
        var newSelStart = moment.utc(dateStart).add(parseInt(range * start));
        var newSelEnd = moment.utc(dateStart).add(parseInt(range * end));

        var dateFormat = 'MMM DD, YYYY';

        var days = newSelEnd.diff(newSelStart, 'days');

        if(days<30){
          dateFormat = 'M/D';
        }

        if(days<12){
          dateFormat = 'D';
        }

        jqEle.find('.window-start').text(newSelStart.format(dateFormat));
        jqEle.find('.window-end').text(newSelEnd.format(dateFormat));
      }

      function setSelectedRangeByString(value, initial) {
        if (value === 'custom') {
          return;
        }

        var range = dateEnd.valueOf() - dateStart.valueOf();
        var ms;

        if (value === 'h') {
          ms = 1000 * 60 * 60;
        }
        else if (value === 'd') {
          ms = 1000 * 60 * 60 * 24;
        }
        else if (value === 'w') {
          ms = 1000 * 60 * 60 * 24 * 7;
        }
        else if (value === 'm') {
          ms = 1000 * 60 * 60 * 24 * 30;
        }
        else if (value === 'q') {
          ms = 1000 * 60 * 60 * 24 * 30 * 4;
        }
        else if (value === 'y') {
          ms = 1000 * 60 * 60 * 24 * 365;
        }

        end = Math.min(1, start + ms / range);

        updateSelectedDateRange(initial);
        updatePointer();
      }

      function updatePointer() {
        pointer.css({'left':start * 100 + '%', 'right':(1 - end) * 100 + '%'});
      }


      function updateData(value, initial) {
        if (!value) {return;}

        data = value;
        setDateRange(data[0][0], data[data.length - 1][0], initial);
        setSelectedRangeByString(scope.range, initial);
        return data;
      }

      scope.$watch('range', function(n, o) {
        if (n !== o) {
          setSelectedRangeByString(scope.range, true);
        }
      });
    }
  };
}])
.directive('focusOnClick', function () {
  return {
    restrict: 'A',
    link: function (scope, ele, attr) {
      $(ele).click(function(){
        setTimeout(function(){
          $(scope.$eval(attr.focusOnClick)).focus();
        }, 100);
      });
    }
  };
})
.factory('DropdownService', function() {
  var wrapper = $('<div class="dropdonw-menu-wrapper">').css({'display':'none', 'position':'absolute'});
  wrapper.on('click', function(event){
    event.stopPropagation();
  });
  return {wrapper:wrapper, isOpen:false};
})
.directive('sageDropdown', ['$rootScope', function ($rootScope) {
  return {
    restrict: 'A',
    scope: {
      dropdownFocus: '='
    },
    link: function (scope, ele) {
      ele = $(ele);
      var menu = ele.find('.dropdown-menu').css({
        'display':'none',
        'left':0, 'top':0,
        'right':'auto'
      }).on('click', function(){
        event.stopPropagation();
      });

      var body = $('body'),
      toggler = $(ele.find('.dropdown-toggle')[0] || ele),
      isOpen = false;

      toggler.on('click', function(){
        var offset = ele.offset();
        menu.appendTo(body);


        menu.css({
          'width': ele.width() + 'px',
          'position':'absolute',
          'display': 'block'
        });

        setPageHeight();

        function setPageHeight(){
          var pageSize = $('body').height();
          var menuHeight = menu.height();
          var topSpace = Math.min($('body').height() - menu.height() - 10, (offset.top + ele.height() + 10));

          if( pageSize - topSpace - 10 <= menuHeight){
            $('body').css({height: menuHeight + (offset.top + ele.height() + 10)});
          }
        }

        menu.css({
          'left': Math.max(0, Math.min(offset.left + (ele.width() - menu.width()) / 2, body.width() - menu.width())) + 'px',
          'top': Math.max(0, Math.min($('body').height() - menu.height() - 10, (offset.top + ele.height() + 10))) + 'px'
        });

        if (!isOpen) {
          setTimeout(function(){
            isOpen = true;
            setPageHeight();
            body.on('click', bodyClick);
            body.on('keydown', bodyKeyDown);
          }, 10);
        }

        if (scope.dropdownFocus) {
          var focusItem = menu.find(scope.dropdownFocus);
          focusItem.focus();
          setTimeout(function(){
            focusItem.focus();
          }, 100);
        }
      });

      $rootScope.$on('$routeChangeStart', function() {
        hideWrapper();
      });

      function hideWrapper(){
        $('body').css({height: '100%'});
        menu.css({'display':'none'});
        isOpen = false;
        body.off('keydown', bodyKeyDown);
        body.off('click', bodyClick);
      }

      function bodyKeyDown(e){
        if (e.keyCode === 27) {
          hideWrapper();
        }
      }

      function bodyClick(){
        hideWrapper();
      }
    }
  };
}])
.directive('searchInput', [function() {
  return {
    restrict: 'A',
    link: function (scope, ele) {
      ele.attr('type', 'text');
      var svgNs = 'http://www.w3.org/2000/svg';
      var wrapper = $('<div class="search-input-wrapper">');
      var next = ele.next();

      if (next.length) {
        ele.next().before(wrapper.append(ele));
      } else {
        ele.parent().append(wrapper.append(ele));
      }

      var iconWrapper = $('<div class="search-icon-wrapper">').appendTo(wrapper);
      var size = {w:iconWrapper.width() || 16, h:iconWrapper.height() || 16};
      iconWrapper.css({width: size.w + 'px', height: size.h + 'px', top:'50%', 'margin-top': (-size.h / 2) + 'px'});
      size.r = Math.min(size.w, size.h) / 2;

      var iconNormal = document.createElementNS(svgNs, 'circle');
      var iconActive = document.createElementNS(svgNs, 'circle');
      var iconSvg = document.createElementNS(svgNs, 'svg');
      iconSvg.setAttribute('width', size.w);
      iconSvg.setAttribute('height', size.h);

      iconNormal.setAttribute('class', 'search-icon-normal');
      iconNormal.setAttribute('cx', size.w / 2);
      iconNormal.setAttribute('cy', size.h / 2);
      iconNormal.setAttribute('r', size.r);

      iconActive.setAttribute('class', 'search-icon-active');
      iconActive.setAttribute('cx', size.w / 2);
      iconActive.setAttribute('cy', size.h / 2);
      iconActive.setAttribute('r', size.r);
      $(iconActive).css({'stroke-dasharray':2 * Math.PI * size.r, 'stroke-dashoffset':2 * Math.PI * size.r});

      iconSvg.appendChild(iconNormal);
      iconSvg.appendChild(iconActive);

      iconWrapper.append(iconSvg);
    }
  };
}])
.directive('throbber', [function() {
  return {
    // restrict: 'A',
    // link: function (scope, ele, attr) {
    //   var throb = new Throbber(angular.extend({color: 'black'}, scope.$eval(attr.throbber))).appendTo(ele[0]).start();
    //   scope.$on('$destroy', function () {
    //     throb.stop();
    //   });
    // }
  };
}])
.directive('processLines', [function() {
  return {
    restrict: 'A',
    link: function (scope, ele, attr) {
      var lineWidth = attr.lineWidth || 8,
      lineSpacing = attr.size || 3,
      bgColor = attr.backgroundColor || '#d8e3fa',
      lineColor = attr.lineColor || '#94aee2';

      var canvas = document.createElement('canvas');
      canvas.width = canvas.height = lineWidth + lineSpacing;
      var ctx = canvas.getContext('2d');

      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = lineColor;

      for (var x = 0; x < lineWidth; x++) {
        for (var y = 0; y < canvas.height; y++) {
          ctx.fillRect(canvas.width - ((x + y) % canvas.width) - 1, y, 1, 1);
        }
      }

      $(ele).css({
        'background-image':'url(' + canvas.toDataURL('image/png') + ')',
        'background-repeat':'repeat',
        'min-height':canvas.height + 'px'})
      .addClass('process-lines');

      var count = 0,
      interval = setInterval(function(){
        $(ele).css({'background-position':(++count % canvas.width) + 'px 0px'});
      }, 30);

      scope.$on('$destroy', function () {
        clearInterval(interval);
      });
    }
  };
}])
.directive('saTimeline', ['$compile', function($compile) {
  return {
    restrict: 'A',
    scope: {
      data: '='
    },
    link: function (scope, ele) {
      var svgNs = 'http://www.w3.org/2000/svg';
      var i, k, blockNode, headerNode, leftNode, rightNode, messageNode, textNode, pointSvg, pointCircle, text, prevValue, date, prevDate,
      values = scope.data.values.slice(0);

      scope.files = {};

      values = values.sort(function(a, b){
        return moment(b.date).unix() - moment(a.date).unix();
      });

      ele.addClass('sa-timeline');

      for (i = 0 ; i < values.length; i++) {
        date = moment(values[i].date);
        prevDate = prevValue ? moment(prevValue.date) : date;

        if (!prevValue || prevDate.week() !== date.week() || prevDate.month() !== date.month() || prevDate.day() !== date.day()) {
         headerNode = $('<div class="timeline-block date">').appendTo(ele);
         headerNode.text(date.fromNow()).append($('<span class="full-date">').text(' ' + date.format('MMM D, YYYY')));

         if (rightNode) {
          rightNode.css({'padding-bottom': 0});
        }
      }

      blockNode = $('<div class="timeline-block">').addClass(values[i].type).appendTo(ele);

      pointCircle = document.createElementNS(svgNs, 'circle');
      pointCircle.setAttribute('r', 3);
      pointCircle.setAttribute('cx', 0);
      pointCircle.setAttribute('cy', 0);
      pointCircle.setAttribute('class', 'point-circle');
      pointSvg = document.createElementNS(svgNs, 'svg');
      pointSvg.setAttribute('class', 'point');
      pointSvg.appendChild(pointCircle);

      leftNode = $('<div class="left">')
      .text(date.format('HH:mm'))
      .append(pointSvg);

      text = values[i].text.split('<cut>');

      rightNode = $('<div class="right">');
      messageNode = $('<div class="message">').appendTo(rightNode);
      textNode = $('<div class="text">').data('text', text).text(text[0]).appendTo(messageNode);

      if (text.length > 1) {
        textNode.addClass('left-icon text-expand').on('click', toggleOpenClass);
      }

      if (values[i].files) {
        scope.files[i] = {};

        var filesHtml,
        maxVisible = values[i].files.length > 6 ? 3 : Infinity;

        scope.files[i].visible = [];
        scope.files[i].dropDownList = [];

        for (k = 0; k < values[i].files.length; k++) {
          if (k < maxVisible) {
            scope.files[i].visible.push('<a href="">' + values[i].files[k] + '</a>');
          }
          else {
            scope.files[i].dropDownList.push(values[i].files[k]);
          }
        }

        if (values[i].files.length > 6) {
          var filesDropDownMenu;

          filesDropDownMenu = '<div class="dropdown-menu animated arrow search-list" dropdown-menu>' +
          '<input search-input ng-model="files[' + i + '].filter">' +
          '<div class="body">' +
          '<a ng-repeat="file in files[' + i + '].dropDownList | filter:files[' + i + '].filter" ng-href="">' +
          '{{file}}' +
          '</a>'+
          '</div>' +
          '</div>';
          filesHtml = '<div class="sage-dropdown faded" sage-dropdown dropdown-focus="\'[search-input]\'">' +
          scope.files[i].visible.join(', ') +
          '<a class="dropdown-toggle dropdown-icon" dropdown-toggle>' +
          ' and {{files[' + i + '].dropDownList.length}} other files' +
          '</a>' +
          filesDropDownMenu +
          '</div>';
        }
        else {
          filesHtml = '<div class="faded">' +
          scope.files[i].visible.join(', ') +
          '</div>';
        }

        var filesEl = angular.element(filesHtml);
        $compile(filesEl)(scope);
        messageNode.append(filesEl);
      }

      if (values[i].details) {
        textNode = $('<div class="details faded">').text(values[i].details).appendTo(messageNode);
      }

      if (values[i].location) {
        textNode = $('<div class="location left-icon">').text(values[i].location).appendTo(messageNode);
      }

      blockNode.append(leftNode, rightNode);
      prevValue = values[i];
    }

    function toggleOpenClass(event) {
      var th = $(event.currentTarget), text = th.data('text');
      th.toggleClass('open').text(th.hasClass('open') ? text.join(' ') : text[0]);
    }
  }
};
}])
.directive('animatedContent', ['$rootScope', '$timeout', function($rootScope, $timeout) {
  return {
    restrict: 'C',
    link: function postLink() {
      $rootScope.$on('$routeChangeSuccess', function() {
        $timeout( function () {
          angular.element('.animated-content .info-tile, .animated-content .panel')
          .css('visibility', 'visible');
          /*This line is commented because of page content flashes
          .velocity('transition.slideUpIn', {stagger: 50});*/
        }, 10);
      });
    }
  };
}])
.directive('scrollToActivate',[function(){
  return {
    restrict: 'C',
    scope: {
      callback:'&',
    },
    link: function(scope, element){

       element.bind('scroll', function(){
        var target = element[0];
        console.log('target.scrollHeight: ', target.scrollHeight);
        element.bind('scroll', function () {
          var difference = target.scrollHeight - (target.offsetHeight + target.scrollTop);
          if (difference <= 0.5) {
            console.log('scroll end');
            scope.$apply(function(){
              scope.callback();
            });
          }
        });
      });
     }
   };
 }])
;

