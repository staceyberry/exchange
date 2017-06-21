
    var errorCallBack = function (problems) {
        var msg = 'Something went wrong:';
        if (problems[0].status == 404 || problems[0].status == 502 || problems[0].status == 500) {
            msg = "<div class='alert alert-danger' style='margin-bottom:0'>" +
                "<span class='glyphicon glyphicon-exclamation-sign' style='padding-right: 6px;' aria-hidden='true'></span>" +
                "<span>" +
                "The mapping server did not respond properly. It is likely temporarily down, " +
                "but should be up soon. If this problem persists please let the administrators know." +
                "</span></div>";
        }
    };

    var createGeometryCollection = function (features) {

        for (var i = 0; i < features.length; i++) {
            var feature = features[i];

            var coords = [];
            var d_to_d = feature.get('DEPARTURE_TO_DESTINATION_GEOM');

            var lineString = new ol.geom.LineString(coords);

            if (d_to_d) {
                lineString = new ol.geom.LineString(feature.get('DEPARTURE_TO_DESTINATION_GEOM').coordinates);
            }

            var rangeInNauticalMiles = feature.get('REMAININGFUELMILES');
            var rangeInMeters = rangeInNauticalMiles * ol.proj.METERS_PER_UNIT['m'] * 1852;

            var circle = new ol.geom.Circle(ol.proj.transform([feature.get('GPS_LON'), feature.get('GPS_LAT')], 'EPSG:4326', 'EPSG:3857'), rangeInMeters);

            var geomCollection = new ol.geom.GeometryCollection([
                new ol.geom.Point(ol.proj.transform([feature.get('GPS_LON'), feature.get('GPS_LAT')],
                    'EPSG:4326', 'EPSG:3857')),
                new ol.geom.Point(ol.proj.transform([feature.get('DEPARTURE_LON'), feature.get('DEPARTURE_LAT')],
                    'EPSG:4326', 'EPSG:3857')),
                new ol.geom.Point(ol.proj.transform([feature.get('DESTINATION_LON'), feature.get('DESTINATION_LAT')],
                    'EPSG:4326', 'EPSG:3857')),
                lineString, circle]);

            features[i].set('geometry', geomCollection);
        }

        return features;

    };

    var fuelStyleFunc = function (feature) {

        var color = 'rgba(255, 154, 0, 0.1)';

        switch (feature.get('STATUS')) {
            case 'AVAILABLE':
                color = 'rgba(0, 204, 102, 1)';
                break;
            case 'OFF-LINE':
                color = 'rgba(255, 0, 0, 1)';
                break;
            case 'RESTRICTED':
                color = 'rgba(255, 255, 51, 1)';
                break;
            case 'EMERGENCY ONLY':
                color = 'rgba(255, 255, 51, 1)';
                break;
            default:
                color = 'rgba(255, 154, 0, 1)';


        }


        var style = new ol.style.Style({
            image: new ol.style.RegularShape({
                fill: new ol.style.Fill({color: color}),
                stroke: new ol.style.Stroke({color: 'rgba(0, 0, 0, 0.7)', width: 1}),
                points: 3,
                radius: 5,
                rotation: Math.PI / 4,
                angle: 0
            })
        });


        return [style];
    }

    var styleFunc = function (feature) {

        if (feature.getGeometry().getType() == 'GeometryCollection') {
            var geometries = feature.getGeometry().getGeometries();
            var departureStyle = new ol.style.Style({
                geometry: geometries[1],
                image: new ol.style.RegularShape({
                    stroke: new ol.style.Stroke({
                        color: 'black',
                        width: 1
                    }),
                    fill: new ol.style.Fill({color: '#7E3F0C'}),
                    points: 3,
                    radius: 5,
                    rotation: Math.PI / 4,
                    angle: 0
                })
            });
            var lineStyle = new ol.style.Style({
                geometry: geometries[3],
                stroke: new ol.style.Stroke({
                    color: '#0000cd',
                    width: 2
                })
            });

            var circleStyle = new ol.style.Style({
                geometry: geometries[4],
                stroke: new ol.style.Stroke({
                    color: '#ffa000',
                    width: 2
                }),
                fill: new ol.style.Fill({color: [255, 160, 0, 0.3]})
            });


            var destinationStyle = new ol.style.Style({
                geometry: geometries[2],
                image: new ol.style.RegularShape({
                    stroke: new ol.style.Stroke({
                        color: 'black',
                        width: 1
                    }),
                    fill: new ol.style.Fill({color: '#0F7F12'}),
                    points: 4,
                    radius: 5,
                    rotation: Math.PI / 4,
                    angle: 0
                })
            });

            var colors = ['Green'];
            if (feature.get('APPROACH') === 1) {
                colors = ['Red'];
            }
            feature.set('color', colors[0]);

            var canvas = feature.get('color') ? document.getElementById('canvas' + feature.get('color')) : document.getElementById('canvas');

            var airCraftStyle = new ol.style.Style({
                geometry: geometries[0],
                image: new ol.style.Icon({
                    rotation: 0.01745329251 * parseInt(feature.get('HEADING'), 10),
                    img: canvas,
                    imgSize: [
                        30.5,
                        32
                    ]
                }),
                text: new ol.style.Text({
                    text: feature.get('TITLE'),
                    fill: new ol.style.Fill({color: 'black'}),
                    font: 'Normal' + ' ' + '10px' + ' ' + 'Arial',
                    stroke: new ol.style.Stroke({color: '#ffffff', width: 3}),
                    offsetX: -20,
                    offsetY: 20
                })
            });

            return [
                airCraftStyle,
                departureStyle,
                destinationStyle,
                lineStyle/*,
                 circleStyle*/
            ];

        } else {
            return styles['circle'];
        }
    };

    var styleCache = {};
    var clusterStyle = function (feature, resolution) {
        var size = feature.get('features').length;
        var style = styleCache[size];
        if (!style) {
            if (size === 1) {
                style = [new ol.style.Style({
                    image: new ol.style.RegularShape({
                        fill: new ol.style.Fill({color: 'rgba(255, 2, 2, 0.1)'}),
                        stroke: new ol.style.Stroke({color: 'rgba(255, 2, 2, 1)', width: 2}),
                        points: 4,
                        radius: 5,
                        radius2: 0,
                        angle: 0
                    })
                })];
            }
            else {
                style = [new ol.style.Style({
                    image: new ol.style.RegularShape({
                        radius: 10,
                        points: 4,
                        fill: new ol.style.Fill({color: 'rgba(255, 2, 2, 0.5)'}),
                        stroke: new ol.style.Stroke({color: 'rgba(255, 2, 2, 1)'})
                    }),
                    text: new ol.style.Text({
                        text: size.toString(),
                        fill: new ol.style.Fill({
                            color: '#fff'
                        })
                    })
                })];
            }

            styleCache[size] = style;
        }
        return style;
    };

    var styleCache2 = {};
    var clusterStyle2 = function (feature, resolution) {
        var size = feature.get('features').length;
        var style = styleCache2[size];
        if (!style) {
            if (size === 1) {
                style = [new ol.style.Style({
                    image: new ol.style.Circle({
                        fill: new ol.style.Fill({color: 'rgba(0, 0, 0, 0.1)'}),
                        stroke: new ol.style.Stroke({color: 'rgba(0, 0, 0, 1)', width: 1}),
                        points: 4,
                        radius: 5,
                        angle: Math.PI / 4
                    })
                })];
            }
            else {
                style = [new ol.style.Style({
                    image: new ol.style.Circle({
                        radius: 8,
                        points: 4,
                        fill: new ol.style.Fill({color: 'rgba(0, 0, 0, 0.5)'}),
                        stroke: new ol.style.Stroke({color: 'rgba(0, 0, 0, 1)'})
                    }),
                    text: new ol.style.Text({
                        text: size.toString(),
                        fill: new ol.style.Fill({
                            color: '#fff'
                        })
                    })
                })];
            }
            styleCache2[size] = style;
        }
        return style;
    };

    var checkStyleFunc = function (feature) {

        var style = new ol.style.Style({
            image: new ol.style.Icon({
                geometry: feature.getGeometry(),
                rotation: 0.01745329251 * parseInt(feature.get('HEADING'), 10),
                src: '/static/img/aircraft-check-small.png',
                size: [
                    30.5,
                    32
                ],
                scale: 0.25
            }),
            text: new ol.style.Text({
                text: feature.get('TITLE'),
                fill: new ol.style.Fill({color: 'black'}),
                //        stroke: new ol.style.Stroke({
                //          color: 'yellow',
                //        width: 4
                //  }),
                offsetX: -20,
                offsetY: 20
            })
        })

        return [style];
    }

    var styles = {
        'circle': new ol.style.Style({
            image: new ol.style.Circle({
                fill: new ol.style.Fill({color: 'rgba(0, 0, 0, 0.1)'}),
                stroke: new ol.style.Stroke({color: 'rgba(0, 0, 0, 1)', width: 1}),
                points: 4,
                radius: 5,
                angle: Math.PI / 4
            })
        }),
        'square': new ol.style.Style({
            image: new ol.style.RegularShape({
                fill: new ol.style.Fill({color: 'rgba(0, 153, 225, 0.1)'}),
                stroke: new ol.style.Stroke({color: 'rgba(0, 153, 255, 1)', width: 1}),
                points: 4,
                radius: 5,
                angle: Math.PI / 4
            })
        }),
        'triangle': new ol.style.Style({
            image: new ol.style.RegularShape({
                fill: new ol.style.Fill({color: 'rgba(255, 154, 0, 0.1)'}),
                stroke: new ol.style.Stroke({color: 'rgba(255, 154, 0, 1)', width: 1}),
                points: 3,
                radius: 5,
                rotation: Math.PI / 4,
                angle: 0
            })
        }),
        'star': new ol.style.Style({
            image: new ol.style.RegularShape({
                fill: new ol.style.Fill({color: 'rgba(255, 0, 0, 0.1)'}),
                stroke: new ol.style.Stroke({color: 'red', width: 1}),
                points: 5,
                radius: 5,
                radius2: 4,
                angle: 0
            })
        }),
        'cross': new ol.style.Style({
            image: new ol.style.RegularShape({
                fill: new ol.style.Fill({color: 'rgba(255, 2, 2, 0.1)'}),
                stroke: new ol.style.Stroke({color: 'rgba(255, 2, 2, 1)', width: 2}),
                points: 4,
                radius: 5,
                radius2: 0,
                angle: 0
            })
        }),
        'x': new ol.style.Style({
            image: new ol.style.RegularShape({
                fill: new ol.style.Fill({color: 'rgba(255, 0, 0, 0.1)'}),
                stroke: new ol.style.Stroke({color: 'red', width: 1}),
                points: 4,
                radius: 5,
                radius2: 0,
                angle: Math.PI / 4
            })
        })
    };