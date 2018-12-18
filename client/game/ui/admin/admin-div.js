angular.module('game.ui.admin.adminDiv', [
        'game.clientSettings',
        'global.constants',
        'angular-meteor',
        'models.factions'
    ])
    .directive('adminDiv', function() {
            'use strict';

            return {
                restrict: 'EA',
                templateUrl: 'client/game/ui/admin/admin-div.ng.html',
                controllerAs: 'adminDiv',
                scope: {
                    cheats: '='
                },
                controller: ["$scope", "$http", "$clientSettings", "FactionsCollection", "CharBuilder", "IB_CONSTANTS", '$meteor', function($scope, $http, $clientSettings, FactionsCollection, CharBuilder, IB_CONSTANTS, $meteor) {

                    var ctrl = this;

                    $scope.getImageID = function (e) {
                        $scope.imageId = (Math.floor(e.offsetX / 32)) + ((0+Math.floor(e.offsetY / 32))*16)
                    };

                    // These have to kept sync with the actual armor images in the images/characters/ folders until I figure
                    // out how these can be autoread and sent to the client
                    $scope.charImages = IB_CONSTANTS.charImages;

                    $scope.audit = { date : "" };

                    $http.get("/audit/audit.json").success(function(response) {
                        if(response.date) {
                            $scope.audit.date = response.date;
                        } else {
                            console.log("Warning: could not find audit date in response.");
                        }
                    }).error(function(response){
                        console.log("Request error: could not retrieve audit data.");
                    });

                    $meteor.subscribe("factions");

                    $scope.factions = $meteor.collection(FactionsCollection);

                    $scope.item_types = []
                    $scope.rarities = [];

                    $http.get("/audit/items.json").success(function(response) {
                        if(response.item_types) {
                            $scope.item_types = response.item_types;
                        } else {
                            console.log("Warning: could not find item-type data in response.");
                        }

                        if(response.rarities) {
                            $scope.rarities = response.rarities;
                        } else {
                            console.log("Warning: could not find item rarity data in response.");
                        }
                    }).error(function(response){
                        console.log("Request error: could not retrieve item data.");
                    });

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
        });
