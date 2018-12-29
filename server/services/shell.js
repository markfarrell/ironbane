angular
    .module('server.services.shell', [
    	'services.npcs',
    	'services.items',
    	'server.services.zones'
    ]).run(['$log', 'NPCService', 'ItemService', 'ZonesService', function($log, NPCService, ItemService, ZonesService) {
    	'use strict';

    	// Services available to shell
    	var services = {
    		'services.npcs' : NPCService,
    		'services.items' : ItemService,
    		'server.services.zones' : ZonesService
    	};

    	Meteor.methods({
    		getService : function(name) {
	    		if(Meteor.isServer) {
	    			return services[name]; 
	    		}
    		}
    	});
	}]);
