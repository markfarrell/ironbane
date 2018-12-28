angular
    .module('models.npcs', [])
    .provider('NPCsCollection', function() {
        'use strict';

        var _collection = new Mongo.Collection('npcs');

        this.$get = [function() {
            if (Meteor.isClient) {
                Meteor.subscribe('npcs');
            }

            return _collection;
        }];
    });