(function() {
  'use strict';

  angular.module('app').factory('DiagramsService', function() {
    
    function rotate(x, y, angle, oX, oY) {
        var cos, sin, tx, ty;
        oX = oX || 0;
        oY = typeof oY === 'undefined' ? oX : oY; 
        cos = Math.cos(angle);
        sin = Math.sin(angle);
        tx = x * cos - y * sin;
        ty = x * sin + y * cos;
        return {
          x: tx + oX,
          y: ty + oY
        };
    }

    function sqr(x) { return x * x; }
    function dist2(p1, p2) { return sqr(p1.x - p2.x) + sqr(p1.y - p2.y); }

    
    function closestLinePoint(p, l1, l2) {
        var len = dist2(l1, l2);

        if (len === 0) {
            return l1;
        }

        var t = ((p.x - l1.x) * (l2.x - l1.x) + (p.y - l1.y) * (l2.y - l1.y)) / len;
        t = Math.max(0, Math.min(1, t));

        return { x: l1.x + t * (l2.x - l1.x), y: l1.y + t * (l2.y - l1.y) };
    }

    function pathFromPoints(pointsArray) {
        var d = '';
        for (var i = 0; i < pointsArray.length; i++) {
            d += (i ? 'L' : 'M') + pointsArray[i].x + ',' + pointsArray[i].y;
        }

        return d + 'z';
    }

    function MatrixClass(values, colsNames, rowsNames) { 
        this.values = values ? values.slice() : [];
        this.colsNames = colsNames ? colsNames.slice() : [];
        this.rowsNames = rowsNames ? rowsNames.slice() : [];
    }

    MatrixClass.prototype.getValue = function(x, y) {
        if (typeof x === 'number' && typeof y === 'number') {
          return this.values[y][x];
        }

        if (typeof x === 'number') {
          var res = [];
          for (var i = 0; i < this.values.length; i++) {
            res.push(this.values[i][x]);
          }
          return res;
        }

        if (typeof y === 'number') {
          return this.values[y];
        }

        return [];
    };

    MatrixClass.prototype.minMax = function() {
        var min = Infinity,
            max = -Infinity;

        for (var i = 0; i < this.values.length; i++) {
            for (var k = 0; k < this.values[i].length; k++) {
                min = Math.min(min, this.values[i][k]);
                max = Math.max(max, this.values[i][k]);
            }
        }

        return [min, max];
    };

    MatrixClass.prototype.min = function() {
        return this.minMax()[0];
    };

    MatrixClass.prototype.max = function() {
        return this.minMax()[1];
    };

    MatrixClass.prototype.divide = function(divider) {
        for (var i = 0; i < this.values.length; i++) {
            for (var k = 0; k < this.values[i].length; k++) {
                this.values[i][k] /= divider;
            }
        }
        return this;
    };

    MatrixClass.prototype.getRows = function() {
        var res = [];
        for (var i = 0; i < this.values.length; i++) {
            res.push(this.values[i]);
        }
        return res;
    };

    MatrixClass.prototype.getCols = function() {
        var res = [];
        if (!this.values.length) {
            return res;
        }
        for (var i = 0; i < this.values[0].length; i++) {
            res.push(this.getValue(i));
        }
        return res;
    };

    MatrixClass.mean = function (arr) {
        var sum = 0;
        for (var i = 0; i < arr.length; i++) {
            sum += arr[i];
        }
        return sum / arr.length;
    };

    MatrixClass.sum = function(arr) {
        var sum = 0;
        for (var i = 0; i < arr.length; i++) {
            sum += arr[i];
        }
        return sum;
    };

    MatrixClass.prototype.rowsAvg = function() {
        var rows = this.getRows(),
            res = [];

        for (var i = 0; i < rows.length; i++) {
            res.push(MatrixClass.mean(rows[i]));
        }

        return res;
    };


    MatrixClass.prototype.rowsSum = function() {
        var res = [];
            
        for (var i = 0; i < this.values.length; i++) {
            res.push(MatrixClass.sum(this.values[i]));
        }
        
        return res;
    };

    MatrixClass.prototype.colsSum = function() {
        var cols = this.getCols(),
            res = [];
            
        for (var i = 0; i < cols.length; i++) {
            res.push(MatrixClass.sum(cols[i]));
        }
        
        return res;
    };

    MatrixClass.prototype.colsAvg = function() {
        var cols = this.getCols(),
            res = [];
            
        for (var i = 0; i < cols.length; i++) {
            res.push(MatrixClass.mean(cols[i]));
        }
        
        return res;
    };


    MatrixClass.prototype.removeCol = function(index) {
        this.colsNames.splice(index, 1);
        var res = [];

        for (var i = 0; i < this.values.length; i++) {
            res.push(this.values[i].splice(index, 1));
        }

        return res;
    };

    MatrixClass.prototype.addCol = function(value, name) {
        this.colsNames.push(name);
        for (var i = 0; i < value.length; i++) {
            if (this.values.length <= i) {
                this.values.push([]);
            }
            this.values[i].push(value[i]);
        }
    };

    MatrixClass.prototype.removeRow = function(index) {
        this.rowsNames.splice(index, 1);
        return this.values.splice(index, 1);
    };

    MatrixClass.prototype.addRow = function(value, name) {
        this.values.push(value);
        this.rowsNames.push(name);
    };

    MatrixClass.prototype.pruneRows = function(handlerFunc) {
        var pruned = new MatrixClass(null, this.colsNames),
            th = this;

        for (var i = 0; i < th.values.length; i++) {
            if (handlerFunc.call(th, th.values[i], i)) {
                pruned.addRow(th.values.splice(i, 1)[0], th.rowsNames.splice(i, 1)[0]);
                i--;
            }
        }

        return pruned;
    };

    MatrixClass.prototype.pruneCols = function(handlerFunc) {
        var pruned = new MatrixClass(null, [], this.rowsNames),
            cols = this.getCols(),
            th = this;

        if (!cols.length) {
            this.colsNames = [];
            return pruned;
        }

        for (var i = 0; i < cols.length; i++) {
            if (handlerFunc.call(th, cols[i], i)) {

                var res = [];

                for (var k = 0; k < th.values.length; k++) {
                    res.push(th.values[k].splice(i, 1));

                    if (!th.values[k].length) {
                        th.values.splice(k, 1);
                        th.rowsNames.splice(k, 1);
                        k--;
                    }
                }

                cols.splice(i, 1);
                pruned.addCol(res, th.colsNames.splice(i, 1)[0]);
                i--;
            }
        }

        return pruned;
    };

    MatrixClass.prototype.search = function(rows, cols) {
        var res = new MatrixClass(this.values, this.colsNames, this.rowsNames);

        if (rows) {
            res.pruneRows(function(value, index){
                return !test(new RegExp(rows, 'i'), this.rowsNames[index]);
            });
        }

        if (cols) {
            res.pruneCols(function(value, index){
                return !test(new RegExp(cols, 'i'), this.colsNames[index]);
            });
        }

        function test(regexp, source) {
            if (typeof source === 'string') {
                return regexp.test(source);
            }
            else {
                for (var key in source) {
                    if (test(regexp, source[key])) {
                        return true;
                    }
                }
            }

            return false;
        }

        return res;
    };

    MatrixClass.prototype.isEmpty = function() {
        for (var i = 0; i < this.values.length; i++) {
            if (this.values[i].length) {
                return false;
            }
        }

        return true;
    };

    function meanMatrix(matrix) {
        var res = [];
        for (var i = 0; i < matrix.length; i++) {
            res.push(d3.mean(matrix[i]));
        }

        return res;
    }

    function matrixProduct(values) {
        var res = [];

        for (var i = 0; i < values.length; i++) {

            for (var k = 0; k < values[i].length; k++) {
                if (res.length <= k) {
                    res.push([]);
                }

                for (var v = 0; v < values[i][k].length; v++) {
                    if (res[k].length <= v) {
                        res[k].push(0);
                    }

                    res[k][v] += values[i][k][v];
                }
            }
        }

        return res;
    }

    function dataProduct(values) {
        var pre = {}, res = {};

        angular.forEach(values, function(dataSet) {

          angular.forEach(dataSet, function(matrix, typeKey) {
            if (typeof pre[typeKey] === 'undefined') {
                pre[typeKey] = [];
              }

              pre[typeKey].push(matrix);

          });
        });

        angular.forEach(pre, function(dataSet, key) {
          res[key] = matrixProduct(dataSet);
        });

        return res;
    }

    function wrapArrayValues(arr, key) {
        var res = [], obj;
        if (arr){
            for (var i = 0; i < arr.length; i++) {
                obj = {index:i};
                obj[key] = arr[i];
                res.push(obj);
            }    
        }
        
        return res;
    }

    return {
        rotate: rotate,
        meanMatrix: meanMatrix,
        matrixProduct: matrixProduct,
        Matrix: MatrixClass,
        dataProduct: dataProduct,
        wrapArrayValues: wrapArrayValues,
        pathFromPoints: pathFromPoints,
        closestLinePoint: closestLinePoint,
        sqr: sqr,
        dist2: dist2
    };
  });
})();
