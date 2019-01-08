angular
    .module('prefabs.human', []).factory('HumanPrefab', [
        function() {
            'use strict';
            return function(data) {
                var userData = data.userData || {};
                return {
                    components: {
                        npc : {},
                        quad: {
                            transparent: true,
                            width: 1,
                            height: 1,
                            charBuildData: userData.charBuildData || {}
                        },
                        rigidBody: {
                            shape: {
                                type: 'sphere',
                                // height: 1,
                                radius: 0.5
                            },
                            mass: 1,
                            friction: 0,
                            restitution: 0,
                            allowSleep: false,
                            lock: {
                                position: {
                                    x: false,
                                    y: false,
                                    z: false
                                },
                                rotation: {
                                    x: true,
                                    y: true,
                                    z: true
                                }
                            },
                            group: 'npcs',
                            collidesWith: ['level', 'npcs', 'otherPlayers']
                        },
                        script: {
                            scripts: [
                                '/scripts/built-in/walk-animation.js',
                            ]
                        },
                        fighter: {
                            prefix: 'a',
                            faction: 'human'
                        },
                        shadow: {
                            simple: true
                        },
                        health: {
                            max: 3,
                            value: 3
                        },
                        armor: {
                            max: 0,
                            value: 0
                        },
                        armorRegen: {},
                        damageable: {},
                        globalState: {
                            state: "wanderer",
                            config: {
                                aggroRadius: 15,
                                defendRadius: 30,
                                monsterBehaviour: { 
                                    "Random Strafing" : true
                                }
                            }
                        },
                        steeringBehaviour: {
                            speed: 2,
                            maxSpeed: 5
                        }
                    }
                };               
            };
        }
    ]);

