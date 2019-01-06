/*global Assets*/
angular
    .module('server.services.items', [
        'models.items',
        'global.constants'
    ])
    .run([
        'ItemsCollection',
        function(ItemsCollection) {
            'use strict';

            ItemsCollection.remove({});

            Meteor.publish('items', function() {
                return ItemsCollection.find({});
            });
        }
    ]);
