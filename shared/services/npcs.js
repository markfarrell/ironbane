angular
	.module('services.npcs', [
		'underscore',
		'models.npcs'
	]).service('NPCService',
		['_', 'NPCsCollection', function(_, NPCsCollection) {
			'use strict'; 
			this.getFactions = function() {
				var prefabs = NPCsCollection.find({}).fetch();
                var factions = _.chain(prefabs)
                    .pairs()
                    .map(function(pair) { 
                        var name = pair[0];
                        var prefab = pair[1];
                        var faction = prefab.components.fighter.faction;
                        return [name, faction];
                    })
                    .groupBy(function(pair) { 
                        var faction = pair[1];
                        return faction;
                    })
                    .pairs()
                    .map(function(pair) {
                        var faction_name = pair[0];
                        var faction_npcs = _.map(pair[1], _.first);
                        return {
                            name : faction_name,
                            npcs: faction_npcs
                        };
                    })
                    .reject(function(faction) {
                        return !faction.name;
                    })
                    .value();
                return factions;
            };
	}]);