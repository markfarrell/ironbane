angular
    .module('server.services.shell', [
        'underscore',
        'three',
        'engine.entity-builder',
    	'services.npcs',
    	'services.items',
    	'server.services.zones',
        'server.services.activeWorlds'
    ]).run(['_', 'THREE', 'EntityBuilder', '$log', 'NPCService', 'ItemService', 'ZonesService', '$activeWorlds', function(_, THREE, EntityBuilder, $log, NPCService, ItemService, ZonesService, $activeWorlds) {
    	'use strict';

    	// Services available to shell
    	var services = {
            'engine.entity-builder' : EntityBuilder,
    		'services.npcs' : NPCService,
    		'services.items' : ItemService,
    		'server.services.zones' : ZonesService,
            'server.services.activeWorlds' : $activeWorlds
    	};

    	Meteor.methods({
    		getService : function(name) {
	    		if(Meteor.isServer) {
	    			return services[name];
	    		}
    		}
    	});
	}]);
