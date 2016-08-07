angular.module('qmsk.e2', [
        'qmsk.e2.source',
        'qmsk.e2.web',
        'ngResource',
        'ngRoute',
        'ngWebSocket',
        'luegg.directives',
        'jsonFormatter',
        'ui.bootstrap',
])

.config(function($routeProvider) {
    $routeProvider
        .when('/main', {
            templateUrl: '/static/qmsk.e2/server/main.html',
            controller: 'MainCtrl',
            reloadOnSearch: false,
        })
        .when('/sources', {
            templateUrl: '/static/qmsk.e2/server/sources.html',
            controller: 'SourcesCtrl',
        })
        .when('/screens', {
            templateUrl: '/static/qmsk.e2/server/screens.html',
            controller: 'ScreensCtrl',
        })
        .when('/auxes', {
            templateUrl: '/static/qmsk.e2/server/auxes.html',
            controller: 'AuxesCtrl',
        })
        .when('/presets', {
            templateUrl: '/static/qmsk.e2/server/presets.html',
            controller: 'PresetsCtrl',
            reloadOnSearch: false,
        })
        .when('/system', {
            templateUrl: '/static/qmsk.e2/server/system.html',
            controller: 'SystemCtrl',
        })
        .otherwise({
            redirectTo: '/main',
        });
})

.factory('Status', function($http) {
    var Status = {};

    $http.get('/api/status').then(
        function success(r) {
            Status.server = r.data.server;
            Status.mode = r.data.mode;
        }
    );

    return Status;
})

.factory('State', function($rootScope, Events) {
    var State = {
        System: Events.state.System,
    };

    $rootScope.$on('qmsk.e2.event', function($e, event){
        State.System = Events.state.System;
    });

    return State;
})

.factory('Preset', function($resource) {
    return $resource('/api/presets/:id', { }, {
        get: {
            method: 'GET',
            url: '/api/presets',
        },
        all: {
            method: 'GET',
            isArray: true,
        },
        query: {
            method: 'GET',
            isArray: false,
        },
        activate: {
            method: 'POST',
            url: '/api/presets',
        },
    }, {stripTrailingSlashes: false});
})

.filter('dimensions', function() {
    return function(dimensions) {
        if (dimensions && dimensions.width && dimensions.height) {
            return dimensions.width + "x" + dimensions.height;
        } else {
            return null;
        }
    };
})

.controller('HeaderCtrl', function($scope, $location, Status, httpState) {
    $scope.status = Status;
    $scope.state = httpState;

    $scope.isActive = function(prefix) {
        return $location.path().startsWith(prefix);
    };

})

.controller('StatusCtrl', function($scope, Events) {
    $scope.events = Events;
})

.controller('SystemCtrl', function($scope, State) {
    $scope.state = State;
})

.controller('MainCtrl', function($scope, $location, State) {
    $scope.state = State;
    $scope.sources = [];

    $scope.$watch('state.System', function(system) {
        // compute a merged state mapping sources to their active destinations
        // TODO: aux destinations
        $scope.sources = $.map(system.SrcMgr.SourceCol, function(source, sourceID){
            var item = {
                id: sourceID,
                type: source.SrcType,
                name: source.Name,
                source: source,
                active: false,
                preview: [],
                program: [],
            };

            if (source.SrcType == "input") {
                item.input = system.SrcMgr.InputCfgCol[source.InputCfgIndex];
            }

            $.each(system.DestMgr.ScreenDestCol, function(screenID, screen) {
                var output = {
                    type: "screen",
                    id: screenID,
                    name: screen.Name,
                    active: screen.IsActive > 0,
                };

                $.each(screen.LayerCollection, function(layerID, layer) {
                    if (layer.PgmMode > 0 && layer.LastSrcIdx == sourceID) {
                        output.program = true;
                    }

                    if (layer.PvwMode > 0 && layer.LastSrcIdx == sourceID) {
                        output.preview = true;
                    }
                });

                if (output.program) {
                    item.program.push(output);
                }
                if (output.preview) {
                    item.preview.push(output);
                }
                if (output.active && output.preview) {
                    item.active = true;
                }
            });

            return item;
        });
    });

    $scope.selectOrder = function(order) {
        $scope.order = order;
        $scope.orderBy = function(){
            switch (order) {
            case 'source':
                return ['-type', 'name'];
            case 'preview':
                return ['preview_screens', 'program_screens'];
            case 'program':
                return ['program_screens', 'preview_screens'];
            default:
                return [];
            }
        }();

        $location.search('order', order || null);
    };
    $scope.selectOrder($location.search().order || 'source');
})

.controller('SourcesCtrl', function($scope, State) {
    $scope.state = State;
})

.controller('ScreensCtrl', function($scope, State) {
    $scope.state = State;
})

.controller('AuxesCtrl', function($scope, State) {
    $scope.state = State;
})

.controller('PresetsCtrl', function($scope, State, Preset, $location) {
    $scope.state = State;

    // size
    $scope.displaySize = $location.search().size || 'normal';

    $scope.$watch('displaySize', function(displaySize) {
        $location.search('size', displaySize);
    });

    // collapsing
    $scope.showGroup = $location.search().group || null;
    $scope.collapseGroups = {};

    $scope.selectGroup = function(groupID) {
        $scope.collapseGroups = {};

        if (groupID != $scope.showGroup) {
            $scope.showGroup = groupID;
        
            $location.search('group', groupID);
        }
    }
    $scope.clearGroup = function() {
        $scope.collapseGroups = {};
        $scope.showGroup = null;
        $location.search('group', null);
    };
    $scope.toggleGroup = function(groupID) {
        $scope.collapseGroups[groupID] = !$scope.collapseGroups[groupID];
    };

    // grouping
    $scope.groupBy = $location.search().groupBy || 'sno';
    
    $scope.$watch('groupBy', function(groupBy) {
        $location.search('groupBy', groupBy);          
    });

    function groupBySno(presets) {
        var groups = { };

        $.each(presets, function(id, preset) {
            var groupID = preset.group; // from sno=X.Y
            
            preset = $.extend({groupIndex: preset.index}, preset);

            // group it
            var group = groups[groupID];

            if (!group) {
                group = groups[groupID] = {
                    id: groupID,
                    name: groupID,
                    presets: []
                };
            }

            group.presets.push(preset);
        });

        return $.map(groups, function(group, id){
            return group;
        });
    };
    function groupByConsole(presets) {
        var groups = { };
        var presetsByID = { };

        $.each(presets, function(presetID, preset){
            presetsByID[preset.id] = preset;
        });

        $.each(State.System.ConsoleLayoutMgr.ConsoleLayout.PresetBusColl, function(buttonID, button) {
            var groupID = Math.floor(button.id / 12); // rows of 12 keys
            var group = groups[groupID];
            var preset = presetsByID[button.ConsoleButtonTypeIndex];

            if (button.ConsoleButtonType != 'preset' || !preset) {
                return;
            }
            
            // copy with groupIndex, since the same preset can be included multiple times
            preset = $.extend({ groupIndex: button.id }, preset);

            if (!group) {
                group = groups[groupID] = {
                    id: groupID+1,
                    name: "Preset PG" + (groupID+1),
                    presets: []
                };
            }

            group.presets.push(preset);

        });

        return $.map(groups, function(group) {
            return group;
        });
    }

    $scope.presets = [];
    $scope.groups = [];
        
    Preset.all(function(presets){
        $scope.presets = presets;
    });
    
    $scope.$watchGroup(['groupBy', 'presets'], function() {
        var groups;

        if ($scope.groupBy == 'sno') {
            groups = groupBySno($scope.presets);
        } else if ($scope.groupBy == 'console') {
            groups = groupByConsole($scope.presets);
        } else {

            groups = [{
                id: 0,
                name: "",
                presets: $.map($scope.presets, function(preset){
                    return $.extend({groupIndex: preset.id}, preset);
                }),
            }];
        }

        $scope.groups = groups;
    });

    // active preset on server; reset while changing...
    $scope.activePresetID = null;
    $scope.$watch('state.System', function(system) {
        $scope.activePresetID = system.PresetMgr.LastRecall
    });

    // select preset for preview
    $scope.previewPreset = null
    $scope.select = function(preset) {
        $scope.activePresetID = null;
        Preset.activate({id: preset.id},
            function success(r) {
                $scope.previewPreset = preset;
            },
            function error(e) {

            }
        );
    };
    
    // take preset for program
    $scope.autoTake = $location.search().autotake || false;

    $scope.$watch('autoTake', function(autoTake) {
        $location.search('autotake', autoTake ? true : null);
    });

    $scope.programPreset = null;
    $scope.take = function(preset) {
        if (preset) {

        } else if ($scope.previewPreset) {
            preset = $scope.previewPreset;
        } else {
            return;
        }

        $scope.activePresetID = null;
        Preset.activate({id: preset.id, live: true},
            function success(r) {
                $scope.programPreset = preset;
            },
            function error(e) {

            }
        );
    };
})

;
