'use strict';
angular.module('app').filter('shortNumber', [ function() {
    return function(number, fractionSize) {

        if(number === null) {
            return null;
        }

        if(number === 0) {
            return '0';
        }

        if(!fractionSize || fractionSize < 0) {
            fractionSize = 1;
        }

        var abs = Math.abs(number);
        var rounder = Math.pow(10,fractionSize);
        var isNegative = number < 0;
        var key = '';
        var powers = [
            {key: 'q', value: Math.pow(10,15)},
            {key: 't', value: Math.pow(10,12)},
            {key: 'b', value: Math.pow(10,9)},
            {key: 'm', value: Math.pow(10,6)},
            {key: 'k', value: 1000}
        ];

        for (var i = 0; i < powers.length; i++) {

            var reduced = abs / powers[i].value;
            reduced = Math.round(reduced * rounder) / rounder;

            if (reduced >= 1) {
                abs = reduced;
                key = powers[i].key;
                break;
            }
        }

        return number?(isNegative ? '-' : '') + abs + key: 'n/a';
    };
}]);