angular
    .module('models.factions', [])
    .provider('FactionsCollection', function() {
        'use strict';

        var _collection = new Mongo.Collection('factions');

        this.$get = [function() {
            return _collection;
        }];
    });