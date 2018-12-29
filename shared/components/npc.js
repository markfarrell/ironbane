angular
    .module('components.npc', ['ces'])
    .config([
        '$componentsProvider',
        function($componentsProvider) {
            'use strict';

            $componentsProvider.registerShared({
                'npc': {}
            });
        }
    ]);