angular.module('game.ui.admin.adminDiv', [
        'underscore',
        'game.clientSettings',
        'game.world-root',
        'global.constants',
        'angular-meteor',
        'engine.util',
        'models.zones',
        'models.factions',
        'models.items'
    ])
    .directive('adminDiv', ['$rootWorld', function($rootWorld) {
            'use strict';

            return {
                restrict: 'EA',
                templateUrl: 'client/game/ui/admin/admin-div.ng.html',
                controllerAs: 'adminDiv',
                scope: {
                    cheats: '='
                },
                controller: ["_", "$scope", "$http", "$clientSettings", "$rootScope", "ZonesCollection", "FactionsCollection", "ItemsCollection", "CharBuilder", "IB_CONSTANTS", "IbUtils",'$meteor', function(_, $scope, $http, $clientSettings, $rootScope, ZonesCollection, FactionsCollection, ItemsCollection, CharBuilder, IB_CONSTANTS, IbUtils, $meteor) {

                    var ctrl = this;

                    $scope.getImageID = function (e) {
                        $scope.imageId = (Math.floor(e.offsetX / 32)) + ((0+Math.floor(e.offsetY / 32))*16)
                    };

                    $scope.capitalize = function(name) {
                        return name.charAt(0).toUpperCase() + name.substring(1).toLowerCase();
                    }; // Retrieved from UnderscoreJS website (12/18/2018).

                    $scope.count = function(lst) {
                        return _.size(lst);
                    }

                    var groupItems = function(items, groupFunction) {
                        return _.chain(items)
                            .groupBy(groupFunction)
                            .pairs()
                            .map(function(pair) {
                                var group_name = pair[0];
                                var group_items = pair[1];
                                return {name : group_name, items : group_items};
                            })
                            .value();
                    };

                    var itemGroups = function() { 
                        var items = ItemsCollection.find({}).fetch();
                        return {
                            rarities : groupItems(items, function(item) { return item.rarity }),
                            types : groupItems(items, function(item) { return item.type })
                        };
                    };

                    // These have to kept sync with the actual armor images in the images/characters/ folders until I figure
                    // out how these can be autoread and sent to the client
                    $scope.charImages = IB_CONSTANTS.charImages;

                    $meteor.subscribe("zones");
                    $meteor.subscribe("factions");

                    $scope.zones = $meteor.collection(ZonesCollection);
                    $scope.factions = $meteor.collection(FactionsCollection);

                    var groups = itemGroups();
                    $scope.rarities = groups.rarities;
                    $scope.itemTypes = groups.types;
                    $scope.dropItems = { input : "{}" };

                    $scope.JSON = {parse : JSON.parse};

                    $scope.dropRandom = function(opts) {
                        console.log("Opts:", opts);
                        var items = ItemsCollection.find(opts).fetch();
                        var item = _.sample(items);
                        var entity = $rootScope.mainPlayer;
                        if(entity) {
                            console.log("Item:", item);
                            $rootWorld.publish("inventory:dropItem", entity, item);
                        }
                    };

                    var updateCharacterPreview = function () {
                        var data = {};
                        _.each($scope.charPreview, function(val, key) {
                            if (['skin', 'hair', 'eyes'].indexOf(key) !== -1) {
                                data[key] = $scope.charImages[key][val];
                            }
                        });
                        $scope.charPrevData = JSON.stringify(data);
                        CharBuilder.makeChar(data).then(function (url) {
                            $scope.charSpritesheetImg = url;
                            return CharBuilder.getSpriteSheetTile(url, 1, 4, 3, 8);
                        }).then(function (url) {
                            $scope.charPrevImg = url;
                        });
                    };

                    $scope.randomize = function () {
                        $scope.charPreview = {
                            body: 0,
                            feet: 0,
                            head: 0,
                            hair: _.random(0, $scope.charImages['hair'].length - 1),
                            eyes: _.random(0, $scope.charImages['eyes'].length - 1),
                            skin: _.random(0, $scope.charImages['skin'].length - 1)
                        };
                        updateCharacterPreview();
                    };

                    $scope.charPreview = {
                        body: 0,
                        feet: 0,
                        head: 0,
                        hair: 2,
                        eyes: 1,
                        skin: 3
                    };
                    updateCharacterPreview();

                    _.each($scope.charPreview, function(val, key) {
                        $scope['next' + key] = function() {
                            $scope.charPreview[key]++;
                            if ($scope.charPreview[key] >= $scope.charImages[key].length) {
                                $scope.charPreview[key] = 0;
                            }
                            updateCharacterPreview();
                        };
                        $scope['prev' + key] = function() {
                            $scope.charPreview[key]--;
                            if ($scope.charPreview[key] < 0) {
                                $scope.charPreview[key] = $scope.charImages[key].length - 1;
                            }
                            updateCharacterPreview();
                        };
                    });

                   // $scope.$watch('cheats', function(component, old) {

                   //      if (!component) {
                   //          return;
                   //      }

                   //      console.log(JSON.stringify(component));

                   //      $meteor.call('updateCheats', function () {

                   //      });

                   //  });

                }]
            };
        }]);
