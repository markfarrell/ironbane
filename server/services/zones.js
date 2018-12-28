angular
    .module('server.services.zones', [
        'underscore',
        'three',
        'models',
        'services.contentLoader',
        'global.constants.game',
        'server.services',
        'game.threeWorld',
        'systems.lifespan',
        'engine.util'
    ])
    .service('ZonesService', ['_', 'THREE', 'IbUtils', function(_, THREE, IbUtils) {
        'use strict';

        var getEntitySpawnList = function(spawnZoneEntity) {
            var component = spawnZoneEntity.getComponent('spawnZone');
            return component.entitiesToSpawnSeparatedByCommas.split(',');
        };

        var getMeshes = function(spawnZoneEntity) {
            var meshes = _.chain(spawnZoneEntity.children)
                .map(function(entity) {
                    return entity.getComponent('mesh');
                })
                .reject(_.isUndefined)
                .filter(function(component) { 
                    return component._meshLoaded;
                })
                .map(function(component) { 
                    return component._mesh;
                })
                .reject(_.isUndefined)
                .value();
            return meshes;
        };

        var getBoundingBox = function(mesh) {
            if (!mesh.geometry.boundingBox) {
                mesh.geometry.computeBoundingBox();
            }
            var box = mesh.geometry.boundingBox;
            var min3 = new THREE.Vector3(box.min.x,box.min.y,box.min.z);
            var max3 = new THREE.Vector3(box.max.x,box.max.y,box.max.z);
            min3.applyMatrix4(mesh.matrixWorld);
            max3.applyMatrix4(mesh.matrixWorld);
            return { min : min3, max : max3 };
        };

        var getBoundingBoxes = function(spawnZoneEntity) {
            var meshes = getMeshes(spawnZoneEntity);
            return _.map(meshes, getBoundingBox);
        };

        var ZonesService = this;

        ZonesService.getSpawnPoints = function(world) {
            return _.chain(world.getEntities('spawnPoint'))
                .filter(function(spawnPoint) {
                    return spawnPoint.getComponent('spawnPoint').tag === 'playerStart';
                })
                .map(function(spawnPoint) {
                    return _.pick(spawnPoint, 'position', 'rotation');
                })
                .value();
        };

        ZonesService.getSpawnZones = function(world) {
            return _.chain(world.getEntities('spawnZone'))
                .map(function(spawnZoneEntity) {
                    return {
                        bounds : getBoundingBoxes(spawnZoneEntity),
                        npcs : getEntitySpawnList(spawnZoneEntity)
                    };
                })
                .value();
        };

        ZonesService.getSpawnList = function(world) {
            return _.chain(world.getEntities('spawnZone'))
                .map(getEntitySpawnList)
                .flatten()
                .uniq()
                .value();
        };

        ZonesService.getZone = function(world) {
            return {
                name : world.name,
                npcs : ZonesService.getSpawnList(world),
                spawnZones : ZonesService.getSpawnZones(world),
                spawnPoints : ZonesService.getSpawnPoints(world)
            };
        };

    }])
    .run([
        '_',
        '$q',
        'ZonesService',
        'ZonesCollection',
        'ContentLoader',
        'ThreeWorld',
        '$injector',
        '$activeWorlds',
        function(_, $q, ZonesService, ZonesCollection, ContentLoader, ThreeWorld, $injector, $activeWorlds) {
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

                var buildZonesCollection = Meteor.bindEnvironment(function(zones) {
                    ZonesCollection.remove({});
                    _.each(zones, function(zone) {
                        zone.id = ZonesCollection.insert(zone);
                    });
                    Meteor.publish('zones', function() {
                        return ZonesCollection.find({});
                    });
                    console.log('Loaded ' + _.size(zones) + ' NPC zones into Meteor collection');
                });

                var zonesPromise = $q.all(worldPromises).then(function(worlds) {
                    return _.map(worlds, ZonesService.getZone);
                }).then(buildZonesCollection);

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
