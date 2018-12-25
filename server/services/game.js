angular
    .module('server.services.game', [
        'models',
        'server.services.activeWorlds',
        'engine.entity-builder',
        'global.constants',
        'server.services.chat',
        'three'
    ])
    .service('GameService', [
        '$log',
        'EntitiesCollection',
        '$activeWorlds',
        'IB_CONSTANTS',
        'EntityBuilder',
        'ChatService',
        'THREE',
        function($log, EntitiesCollection, $activeWorlds, IB_CONSTANTS, EntityBuilder, ChatService, THREE) {
            'use strict';

            this.enterGame = function(charId) {
                var me = this;

                var doc = EntitiesCollection.findOne({
                    owner: this.userId,
                    _id: charId
                });

                if (!doc) {
                    throw new Meteor.Error('char-not-found', 'Character not found!');
                }

                var user = Meteor.users.findOne(this.userId);
                if (user.profile.server.id !== Meteor.settings.server.id) {
                    throw new Meteor.Error('server-mismatch', 'You are already in-game on another server!');
                }

                _.each($activeWorlds, function (world) {
                    var playerEntities = world.getEntities('player');
                    playerEntities.forEach(function (player) {
                        if (player.owner === me.userId) {
                            throw new Meteor.Error('already-in-game', 'You are already in-game!');
                        }
                    });
                });

                if ($activeWorlds[doc.level]) {
                    doc.components.player = {};
                    doc.components.netSend = {};
                    doc.components.netRecv = {};

                    // Make sure regen stays the same across updates
                    doc.components.armorRegen = {
                        rate: 2.0,
                        amount: 0.25
                    };

                    var name = doc.name;

                    if (Roles.userIsInRole(doc.owner, ['game-master'])) {
                        name = '<GM> ' + name;

                        // Later can add additional things like clans, ranks etc
                    }

                    doc.components['name-mesh'] = {
                        text: name,
                        color: Roles.userIsInRole(doc.owner, ['game-master']) ? '#4f87ee' : 'aqua',
                        stroke: '#06452d',
                        fontsize: 52,
                        fontface: 'volter_goldfishregular'
                    };

                    var ent = EntityBuilder.build(doc);
                    if (ent) {
                        // it's unlikely that the server will not want to send an entity
                        ent.addComponent('persisted', {_id: doc._id});
                        ent.addComponent('steeringBehaviour', {
                            speed: 2.5,
                            maxSpeed: 10
                        });
                        ent.addComponent('fighter', {
                            faction: 'ravenwood'
                        });


                        if (Roles.userIsInRole(doc.owner, ['game-master'])) {
                            ent.addComponent('cheats');
                        }

                        ent.owner = doc.owner;

                        // TODO: decorate entity with other components, such as "player", etc. like the client does
                        $activeWorlds[doc.level]._ownerCache[doc.owner] = ent.uuid;
                        $activeWorlds[doc.level].addEntity(ent);

                        ChatService.announce(ent.name + ' has entered the world.', {
                            join: true
                        });
                    } else {
                        console.log('error building entity for: ', doc);
                    }
                    //console.log('adding entity: ', doc.name, ' to ', doc.level, ' count: ', $activeWorlds[doc.level].getEntities().length);
                }


            };

            var userExit = function (userId) {
                _.each($activeWorlds, function (world) {
                    var playerEntities = world.getEntities('player');
                    playerEntities.forEach(function (player) {
                        if (player.owner === userId) {
                            world.removeEntity(player);

                            ChatService.announce(player.name + ' has left the world.', {
                                leave: true
                            });
                        }
                    });
                });
            };

            Meteor.users.find({
                'status.online': true,
                'profile.server.id': Meteor.settings.server.id
            }).observe({
                removed: function(user) {
                    userExit(user._id);
                }
            });

            this.leaveGame = function() {
                userExit(this.userId);
            };

            this.resetPlayer = function(targetZone) {

                var me = this;

                var players = _.chain($activeWorlds)
                    .map(function(world) {
                        return world.getEntities('player');
                    })
                    .flatten()
                    .value();

                var player = _.findWhere(players, {owner : me.userId});

                var sourceWorld = $activeWorlds[player.level];

                var targetWorld = (function() {
                    var defaultZone = IB_CONSTANTS.world.startLevel;
                    var zone = targetZone || defaultZone;
                    return $activeWorlds[zone] || $activeWorlds[defaultZone];
                })();

                if(!player) {
                    $log.error('[GameService.resetPlayer] player not found!');
                    return;
                }

                if(!targetWorld) { 
                    $log.error('[GameService.resetPlayer] world not found!');
                    return;
                }

                var zone = targetWorld.name;

                var spawns = _.chain(targetWorld.getEntities('spawnPoint'))
                    .filter(function(spawnPoint) {
                        return spawnPoint.getComponent('spawnPoint').tag === 'playerStart';
                    })
                    .map(function(spawnPoint) {
                        return _.pick(spawnPoint, 'position', 'rotation');
                    })
                    .value();

                var spawn = (function() {
                    var defaultSpawn = {
                        position : new THREE.Vector3(),
                        rotation : new THREE.Euler()
                    };
                    var targetSpawn = _.sample(spawns);
                    if(!targetSpawn) {
                        $log.warn('[GameService.resetPlayer] spawn point not found ('+zone+')!');
                    }
                    return targetSpawn || defaultSpawn;
                })();

                var runReset = function(player, zone, spawn) {
                    sourceWorld.removeEntity(player);
                    player.position.copy(spawn.position);
                    player.rotation.copy(spawn.rotation);
                    player.level = zone;
                    targetWorld.addEntity(player);
                };

                var scheduleReset = function(player, zone, spawn) {
                    var delay = IB_CONSTANTS.world.resetDelay;
                    if(!player.__isResetting) {
                        player.__isResetting = true;
                        setTimeout(function() {
                            runReset(player, zone, spawn);
                            delete player.__isResetting;
                        }, delay);
                    }
                };

                scheduleReset(player, zone, spawn);

            };
        }
    ])
    .run(['GameService', function(GameService) {
        'use strict';

        Meteor.methods({
            enterGame: GameService.enterGame,
            leaveGame: GameService.leaveGame,
            resetPlayer: GameService.resetPlayer
        });
    }]);
