angular
    .module('services.contentLoader', [])
    .service('ContentLoader', ["$q", function($q) {
        'use strict';

        this.load = function() {
            var deferred = $q.defer();
            deferred.resolve();
            return deferred.promise;
        };

    }]);
