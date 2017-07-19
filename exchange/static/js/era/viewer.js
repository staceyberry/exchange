'use strict';

(function () {

    var module = angular.module('viewer', [
        'storytools.core.time',
        'storytools.core.mapstory',
        'storytools.core.pins',
        'storytools.core.boxes',
        'storytools.core.ogc',
        'storytools.core.legend',
        'storytools.core.measure',
        'storytools.core.distance_bearing',
        'storytools.core.breadcrumbs',
        'ui.bootstrap'
    ]);

    module.constant('access_token', ACCESS_TOKEN);

    function sortByKey(array, key) {
        return array.sort(function (a, b) {
            var x = a.get(key);
            var y = b.get(key);
            return ((x < y) ? -1 : ((x > y) ? 1 : 0));
        });
    }

    module.filter('sortByAttribute', function () {
        return function (input, key) {

            if (input) {
                return sortByKey(input, key);
            } else {
                return input;
            }
        }
    });

    function MapManager(stEditableLayerBuilder, $rootScope, $location,
                        StoryMap, stStoryMapBaseBuilder, StoryPinLayerManager) {
        this.storyMap = new StoryMap({target: 'map', returnToExtent: false});

        var self = this;
        StoryPinLayerManager.map = self.storyMap;

        var featureOverlay = new ol.layer.Vector({
            renderBuffer: 1,
            source: new ol.source.Vector(),
            map: this.storyMap.getMap(),
            style: function (feature, resolution) {

                if (feature.getGeometry().getType() == 'GeometryCollection' && feature.getGeometry().getGeometries()) {
                    return new ol.style.Style({
                        geometry: feature.getGeometry().getGeometries()[4],
                        stroke: new ol.style.Stroke({
                            color: '#ffa000',
                            width: 2
                        }),
                        fill: new ol.style.Fill({color: [255, 160, 0, 0.3]})
                    });
                } else {
                    return null;
                }
            }
        });
        var highlight;
        var attributes = {};

        this.displayFeatureInfo = function (pixel, overlay) {

            var filterVisible = function (items) {
                var filtered = {};
                for (var i in items){
                    if (items[i].visible){
                        filtered[items[i].attribute] = items[i].attribute_label;
                    }
                }
                return filtered;
            };

            var getHtml = function (feature, attributes) {

                var header;
                var row = "";

                for (var prop in feature.getProperties()) {
                    if (prop.indexOf('_IDX') == -1 && prop.indexOf('_GEOM') == -1) {
                        if (prop != "geometry") {
                            if (prop == "TITLE" || prop == "LOCATION_NAME") {
                                header = "<tr class='" + prop + "'><th colspan=2>" + feature.get(prop) + "</th></tr>";
                            } else {

                                if (attributes && attributes.hasOwnProperty(prop)) {
                                    var value = (feature.get(prop) == 'null' || feature.get(prop) == null) ? "N/A" : feature.get(prop);
                                    row += "<tr class='" + feature.get(prop) + "'><td style='text-transform: capitalize;padding: 2px;'>" + prop + "</td><td>" + value + "</td></tr>";
                                }
                            }

                        }
                    }
                }

                return header + row;
            };

            var selected_ = self.storyMap.getMap().forEachFeatureAtPixel(pixel,
                function (feature, layer) {
                    return {'feature': feature, 'layer': layer};
                });

            var currentZoom = self.storyMap.getMap().getView().getZoom();

            if (selected_ === undefined || (overlay && currentZoom <= 7 && selected_.feature !== highlight)) {
                if (highlight) {
                    featureOverlay.getSource().removeFeature(highlight);
                    highlight = undefined;
                }
                if (selected_ && selected_.feature) {
                    featureOverlay.getSource().addFeature(selected_.feature);

                    highlight = selected_.feature;
                }
            }

            if (selected_ && selected_.feature && Object.keys(selected_.feature.getProperties()).length > 1) {
                var current_attributes = null;

                if (selected_.layer) {
                    if (!attributes.hasOwnProperty(selected_.layer.get('id'))) {

                        self.storyMap.getStoryLayers().forEach(function (lyr) {
                            if (lyr.getLayer() == selected_.layer) {
                                attributes[selected_.layer.get('id')] = filterVisible(lyr.get('geonodeAttributes'));
                                current_attributes = filterVisible(lyr.get('geonodeAttributes'));
                            }
                        });
                    } else {
                        current_attributes = attributes[selected_.layer.get('id')];
                    }
                }

                var body;
                if (typeof selected_.feature.get('features') === 'undefined') {
                    body = getHtml(selected_.feature, current_attributes);
                } else {
                    var features = selected_.feature.get('features');
                    if (features.length > 1) {
                        body = "<tr><th>" + features.length + " Features</th></tr>";
                        for (var i = 0; i < features.length; i++) {
                            var val = features[i].get('TITLE') || features[i].get('LOCATION_NAME');
                            body += '<tr><td><a ng-click=\"zoomToExtent(); $event.stopPropagation();\">' + val + '</a></td></tr>';
                        }
                    }
                    if (features.length == 1) {
                        body = getHtml(features[0], current_attributes);
                    }

                }

                var overlays = self.storyMap.getMap().getOverlays().getArray();
                var popup = null;
                var geometry = selected_.feature.getGeometry();

                if (geometry.getType() == 'GeometryCollection') {
                    geometry = geometry.getGeometries()[0];
                }

                var coord = geometry.getCoordinates();
                for (var iOverlay = 0; iOverlay < overlays.length; iOverlay += 1) {
                    var overlay = overlays[iOverlay];
                    try {
                        if (overlay.getId() == 'popup-' + selected_.feature.id) {
                            popup = overlay;
                            break;
                        }
                    } catch (err) {

                    }
                }

                if (popup == null) {
                    var popupOptions = {
                        insertFirst: false,
                        id: 'popup-' + selected_.feature.get('id'),
                        positioning: 'bottom-center',
                        stopEvent: true,
                        panMapIfOutOfView: false
                    };
                    popup = new ol.Overlay.Popup(popupOptions);
                    self.storyMap.getMap().addOverlay(popup);
                }

                popup.setPosition(coord);
                popup.show(coord, "<table class='responsive-table bordered striped'>" + body + "</table>");

            }
        };

        this.addLayer = function (name, _options) {
            if (angular.isString(_options.server)) {
                server = {path: _options.server}
            }
            var workspace = 'geonode';

            var url = _options.server.path + '/wms';
            var id = workspace + ":" + name;
            var options = {
                id: id,
                name: id,
                title: _options.title || name,
                url: url,
                path: _options.server.path,
                type: (_options.asVector === true) ? 'VECTOR' : 'WMS',
                style: _options.style,
                cql: _options.cql,
                filter: _options.featureCallback,
                host: _options.server.host,
            };

            options['fitExtent'] = (_options.fitExtent === undefined) ? false : _options['fitExtent'];
            options['cluster'] = (_options.cluster === undefined) ? false : _options['cluster'];
            options['animate'] = (_options.animate === undefined) ? false : _options['animate'];
            options['visible'] = (_options.visible === undefined) ? false : _options['visible'];


            return stEditableLayerBuilder.buildEditableLayer(options, self.storyMap.getMap()).then(function (layer) {
                layer.set('visibility', options.visible);
                layer.getLayer().setVisible(options.visible);
                self.storyMap.addStoryLayer(layer);
                var map = self.storyMap.getMap();
                if (options.fitExtent === true && layer.get('latlonBBOX')) {
                    var extent = ol.proj.transformExtent(
                        layer.get('latlonBBOX'),
                        'EPSG:4326',
                        self.storyMap.getMap().getView().getProjection()
                    );
                    // prevent getting off the earth
                    extent[1] = Math.max(-20037508.34, Math.min(extent[1], 20037508.34));
                    extent[3] = Math.max(-20037508.34, Math.min(extent[3], 20037508.34));

                    var isInvalid = extent.some(function (a) {
                        return isNaN(a);

                    });
                } else {
                    var center = [-10449764.649391213, 3406143.1723930337]
                    self.storyMap.animateCenterAndZoom(center, 7);
                }
                return layer;
            });
        };

        this.loadMap = function (options) {
            options = options || {};

            stStoryMapBaseBuilder.defaultMap(this.storyMap);

            // display popup on hover
            self.storyMap.getMap().on('pointermove', function (evt) {
                if (evt.dragging) {
                    return;
                }
                self.displayFeatureInfo(evt.pixel, true);
            });

        };

    }

    module.service('MapManager', function ($injector) {
        return $injector.instantiate(MapManager);
    });

    module.controller('tileProgressController', function ($scope) {
        $scope.tilesToLoad = 0;
        $scope.tilesLoadedProgress = 0;
        $scope.$on('tilesLoaded', function (evt, remaining) {
            $scope.$apply(function () {
                if (remaining <= 0) {
                    $scope.tilesToLoad = 0;
                    $scope.tilesLoaded = 0;
                    $scope.tilesLoadedProgress = 0;
                } else {
                    if (remaining < $scope.tilesToLoad) {
                        $scope.tilesLoaded = $scope.tilesToLoad - remaining;
                        $scope.tilesLoadedProgress = Math.floor(100 * ($scope.tilesLoaded / ($scope.tilesToLoad - 1)));
                    } else {
                        $scope.tilesToLoad = remaining;
                    }
                }
            });
        });
    });

    module.controller('viewerController', function ($rootScope, $scope, $q, $injector, $log, $interval, $timeout, stStoryMapBaseBuilder, stAnnotateLayer, MapManager, TimeControlsManager) {
        $scope.timeControlsManager = $injector.instantiate(TimeControlsManager);
        $scope.mapManager = MapManager;

        $scope.mapManager.loadMap({title: 'OpenStreetMap', type: 'OSM'});

        var server = {
            canStyleWMS: true,
            host: SITE_URL,
            name: "era",
            path: "/geoserver"
        }
        $scope.loading = {};

        var cqlFilter;
        var filters = [];
        var ORG;//set by django
        if (ORG && ORG != "0" && ORG != "245") {
            var orgs = ORG.split(',');

            for (var i in orgs) {
                filters.push("CUSTOMER_IDX=" + orgs[i]);
            }

            cqlFilter = filters.join(' OR ');
        }

        var options = {title: "Aircraft Base", visible: true, server: server, asVector: true, cluster: true, style: clusterStyle2, cql: cqlFilter, fitExtent: false};
        var base = MapManager.addLayer('ERAMAP_AIRCRAFT_BASE_MV', options);

        options = {
            title: "Aircraft Air",
            server: server,
            asVector: true,
            style: styleFunc,
            featureCallback: createGeometryCollection,
            cql: cqlFilter,
            animate: true,
            fitExtent: false,
            visible: true
        };
        var air = $scope.mapManager.addLayer('ERAMAP_AIRCRAFT_AIR_MV', options);

        options = {
            title: "Aircraft NONFF",
            server: server,
            asVector: true,
            cluster: true,
            style: checkStyleFunc,
            cql: cqlFilter,
            fitExtent: false,
            visible: false
        };

        var air_nonff = $scope.mapManager.addLayer('ERAMAP_AC_POS_NONFF_MV', options);


        options = {title: "BSEE", server: server, asVector: true, style: styles['square'], fitExtent: false};
        //var bsee = MapManager.addLayer('ERAMAP_BSEE_MV', options);

        options = {title: "Aircraft Check", visible: true, server: server, asVector: true, style: checkStyleFunc, cql: cqlFilter, fitExtent: false};
        var check = MapManager.addLayer('ERAMAP_AIRCRAFT_CHECK_MV', options);

        options = {title: "Airports", server: server, asVector: false, fitExtent: false};
        //var bases = MapManager.addLayer('ERAMAP_AIRPORTS_MV', options);

        $timeout( function(){

            options = {title: "Fuel Locations", server: server, asVector: true, style: fuelStyleFunc, fitExtent: true};
            var fuel_locations = MapManager.addLayer('ERAMAP_OFFSHORE_FUEL_MV', options);

            options = {title: "Bases", server: server, asVector: true, style: styles['square'], fitExtent: false};
            var bases = MapManager.addLayer('ERAMAP_BASES_MV', options);

            var options = {title: "Hospitals", server: server, asVector: true, style: clusterStyle, fitExtent: false, cluster: true};
            var hospitals = MapManager.addLayer('ERAMAP_HOSPITALS_MV', options);

            options = {title: "BSEE Blocks", server: server, asVector: false, fitExtent: false, visible: false};
            MapManager.addLayer('BLOCKS_AREAS', options);

            //    options = {title: "BSEE Districts", server: server, asVector: false, fitExtent: false, visible: false};
            //    MapManager.addLayer('MB_MMS_AREAS', options);


            options = {title: "15-Minute Lightning Strike Density", server: server, asVector: false, fitExtent:false, visible: false};

            MapManager.addLayer('ltng_15min', options).then(function (layer) {

                $interval(function(){
                    var params = layer.getLayer().getSource().getParams();
                    params.t = new Date().getTime();
                    layer.getLayer().getSource().updateParams(params);

                }, 60000);

            });

            options = {title: "Weather", server: server, asVector: false, fitExtent: false, visible: true};
            MapManager.addLayer('NEXRAD_NOAA', options).then(function (layer) {

                var center = [-10449764.649391213,3406143.1723930337]
                MapManager.storyMap.animateCenterAndZoom(center, 7);

                $interval(function(){
                    var params = layer.getLayer().getSource().getParams();
                    params.t = new Date().getTime();
                    layer.getLayer().getSource().updateParams(params);

                }, 100000);

                options = {title: "Sea Surface Temperature", server: server, asVector: false, fitExtent: false, visible: false};
                //  MapManager.addLayer('1', options).then(function (layer) {});
            });

        }, 5000);

        $q.all([air, check, base]).then(function (layers) {
            window.setInterval(function () {
                for (var index in layers) {
                    var lyr = layers[index];
                    stAnnotateLayer.getFeatures(lyr, $scope.mapManager.storyMap.getMap()).then(function () {

                    });
                }
            }, 60000);
        }, errorCallBack).finally(function () {
            $scope.loading = {};
        });

        $scope.$watch('model.graticule', function () {
            MapManager.storyMap.setGraticule($scope.model.graticule);
        });

        $scope.toggleVisibleLayer = function (lyr) {
            MapManager.storyMap.toggleStoryLayer(lyr);
        };

        $rootScope.$on('layer-status', function (event, args) {
            $log.debug("Layer Status: ", args.name, args.phase, args.status);
            if (args.phase === 'features') {
                if (args.status === 'loading') {
                    $scope.loading[args.name] = true;
                } else {
                    $timeout(function () {
                        $scope.loading[args.name] = false;
                    }, 2000);
                }
            }
        });


        $scope.onChange = function (baseLayer) {
            stStoryMapBaseBuilder.setBaseLayer(MapManager.storyMap, baseLayer);
        };

        var default_baseLayers = [{
            title: 'OpenStreetMap', type: 'OSM', name: 'osm'
        }];

        $scope.baseLayers = BASEMAP_CONFIG || default_baseLayers;

        $scope.zoomToExtent = function (feature) {
            var lon = feature.get('GPS_LON') || feature.get('LON');
            var lat = feature.get('GPS_LAT') || feature.get('LAT');

            if (lat && lon) {
                var location = new ol.geom.Point(ol.proj.transform([lon, lat],
                    'EPSG:4326', 'EPSG:3857'));

                var extent = location.getExtent();

                var center = ol.extent.getCenter(extent);

                MapManager.storyMap.animateCenterAndZoom(center, 10);

                $timeout(function () {
                    var pixel = MapManager.storyMap.getMap().getPixelFromCoordinate(location.getCoordinates());
                    MapManager.displayFeatureInfo(pixel, false);
                }, 1000);
            }
        };

        $scope.playbackOptions = {
            mode: 'instant',
            fixed: false
        };
    });
})();
