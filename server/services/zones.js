angular
    .module('server.services.zones', [
        'underscore',
        'models',
        'services.contentLoader',
        'global.constants.game',
        'server.services',
        'game.threeWorld',
        'systems.lifespan'
    ])
    .run([
        '_',
        '$q',
        'ZonesCollection',
        'ContentLoader',
        'ThreeWorld',
        '$injector',
        '$activeWorlds',
        function(_, $q, ZonesCollection, ContentLoader, ThreeWorld, $injector, $activeWorlds) {
            'use strict';

            var systemsForWorlds = [ // order matters
                'Network',
                'Persistence',
                'Damage',
                'Mesh',
                'Spawn',
                'Buff',
                'Trigger',
                'Movers',
                'Actor',
                'Inventory',
                'LifeSpan',
                // 'Armor',
                // 'Health',
                'Teleporter'
            ];

            var path = Meteor.npmRequire('path');
            var walk = Meteor.npmRequire('walkdir');

            var meteorBuildPath = path.resolve('.') + '/';
            var meteorBuildPublicPath = meteorBuildPath + '../web.browser/app/';
            var scenePath = meteorBuildPublicPath + 'scene';

            var worldToZone = function(world) { 
                var spawn_zone = 'spawnZone';
                var zone_name = world.name;
                var zone_npcs = _.chain(world.getEntities(spawn_zone))
                    .map(function(entity) { 
                        return entity.getComponent(spawn_zone);
                    })
                    .map(function(component) {
                        return component.entitiesToSpawnSeparatedByCommas.split(',');
                    })
                    .flatten()
                    .uniq()
                    .value();
                return { name: zone_name, npcs: zone_npcs};
            };

            ContentLoader.load().then(Meteor.bindEnvironment(function () {

                var sceneIds = _.chain(walk.sync(scenePath, { 'no_recurse' : true }))
                    .map(path.basename)
                    .reject(function(sceneId) {
                        return Meteor.settings.public.useDevZone && sceneId.indexOf('dev-') === -1;
                    })
                    .value();

                var worldPromises = _.map(sceneIds, function(sceneId) {
                    var deferred = $q.defer();

                    var world = $activeWorlds[sceneId] = new ThreeWorld();

                    // TODO: prolly track this elsewhere

                    world._ownerCache = {};

                    angular.forEach(systemsForWorlds, function(system) {
                        var registeredSystemName = system + 'System';
                        if ($injector.has(registeredSystemName)) {
                            var Sys = $injector.get(registeredSystemName);
                            world.addSystem(new Sys(), angular.lowercase(system));
                        } else {
                            console.error(registeredSystemName + ' was not found!');
                        }
                    });

                    Meteor.setTimeout(function() {
                        world.load(sceneId).then(function () {
                            console.log('Loaded world:', world.name);
                            deferred.resolve(world);
                        });
                    }, 10);

                    return deferred.promise;
                });

                var zonesPromise = $q.all(worldPromises).then(function(worlds) {
                    return _.map(worlds, worldToZone);
                });

                zonesPromise.then(Meteor.bindEnvironment(function(zones) {
                    ZonesCollection.remove({});
                    _.each(zones, function(zone) {
                        zone.id = ZonesCollection.insert(zone);
                    });
                    Meteor.publish('zones', function() {
                        return ZonesCollection.find({});
                    });
                    console.log('Loaded ' + _.size(zones) + ' NPC zones into Meteor collection');
                }));

            }), function (err) {
                if (err) {
                    console.log('error zones.js:79 ', err);
                } else {
                    console.log('undefined error zones.js:79');
                }
            })
            .then(function () {}, function (err) {
                console.log(err.stack);
            });

        }
    ]);
