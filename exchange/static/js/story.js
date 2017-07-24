(function () {

    if (window.renderer === 'maploom') {
        var currentFeature,
        currentLayer,
        csrfToken;


        var csrfRegex = new RegExp('csrftoken=([^;]+)');
        csrfToken = csrfRegex.exec(document.cookie)[1];

        function isMediaPropertyName(name) {
            var lower = name.toLowerCase();
            return lower.indexOf('fotos') === 0 || lower.indexOf('photos') === 0 ||
                lower.indexOf('videos') === 0;
        }

        function setPositionAndSize(config, editModeEnabled) {
            var navbarHeight = $('.navbar-fixed-top').height();
            var header = $('#map-header');
            var footer = $('#footer');
            var sidebar = $('#sidebar');
            var mapFrame = $('iframe.maploom');
            var adjustedHeight = navbarHeight;
            var adjustedWidth = 0;
            var editingEnabled = editModeEnabled;

            if (!config.mapHeader.visible) {
                header.css('display', 'none');
            } else {
                header.css({
                    'display': 'block',
                    'height': config.mapHeader.height
                });
                adjustedHeight += header.height();
            }

            var topOffset = adjustedHeight + 0;

            if (!config.mapFooter.visible) {
                footer.css('display', 'none');
            } else {
                footer.css({
                    'display': 'block',
                    'height': config.mapFooter.height
                });
                adjustedHeight += footer.height();
            }
            if (!config.mapSidebar.visible) {
                sidebar.css('display', 'none');
            } else {
                sidebar.css({
                    'display': 'block',
                    'width': config.mapSidebar.width,
                    'height': 'calc(100% - ' + adjustedHeight + 'px)',
                    'top': topOffset
                });
                adjustedWidth += sidebar.width();
            }

            mapFrame.css({
                'top': topOffset,
                'left': adjustedWidth,
                'width': 'calc(100% - ' + adjustedWidth + 'px)',
                'height': 'calc(100% - ' + adjustedHeight + 'px)',
                'position': 'absolute'
            });

            sidebar.resizable({
                minWidth: 200,
                handles: 'e'
            });
            header.resizable({
                minHeight: 50,
                handles: 's'
            });
            footer.resizable({
                handles: 'n',
                minHeight: 26
            });

            function createResizeOverlay() {
                //Had to do this, otherwise the iframe would keep stealing
                //focus and the user wouldn't be able to increase the size of the
                //sidebar
                var blockingDiv = $('<div id="blocker"></div>');
                blockingDiv.css({
                    'position': 'fixed',
                    'height': mapFrame.height(),
                    'width': mapFrame.width(),
                    'opacity': 0,
                    'top': mapFrame.css('top'),
                    'left': mapFrame.css('left')
                });
                blockingDiv.appendTo(document.body);
            }

            function destroyResizeOverlay() {
                $('#blocker').remove()
            }

            sidebar.on('resizestart', createResizeOverlay);
            header.on('resizestart', createResizeOverlay);
            footer.on('resizestart', createResizeOverlay);
            sidebar.on('resizestop', function () {
                mapFrame.css({
                    'left': sidebar.width(),
                    'width': 'calc(100% - ' + sidebar.width() + 'px)'
                });
                destroyResizeOverlay();
            });

            header.on('resizestop', function () {
                var newHeight = navbarHeight + header.height() + footer.height();
                sidebar.css({
                    'height': 'calc(100% - ' + newHeight + 'px)',
                    'min-height': 'calc(100% - ' + newHeight + 'px)',
                    'top': navbarHeight + header.height()
                });

                mapFrame.css({
                    'height': 'calc(100% - ' + newHeight + 'px)',
                    'min-height': 'calc(100% - ' + newHeight + 'px)',
                    'top': navbarHeight + header.height()
                });

                destroyResizeOverlay();
            });

            footer.on('resizestop', function () {
                var newHeight = navbarHeight + header.height() + footer.height();
                sidebar.css({
                    'height': 'calc(100% - ' + newHeight + 'px)',
                    'min-height': 'calc(100% - ' + newHeight + 'px)'
                });

                mapFrame.css({
                    'height': 'calc(100% - ' + newHeight + 'px)',
                    'min-height': 'calc(100% - ' + newHeight + 'px)'
                });

                destroyResizeOverlay();
            });

            if (!editingEnabled) {
                disableEdit();
            } else {
                enableEdit();
            }

            $('#sidebar-carousel').slick(
                {
                    dots: true,
                    infinite: true,
                    autoplay: true,
                    speed: 500,
                    fade: true,
                    cssEase: 'linear'
                }
            );

            $('#edit-template-btn').on('click', function () {
                if (editingEnabled) {
                    disableEdit();
                } else {
                    enableEdit();
                }
                editingEnabled = !editingEnabled;
            });
            $('#logo').click(function () {
                if (editingEnabled) {
                    $('#logo-upload').trigger('click');
                }
            });
            $('#logo-placeholder').click(function () {
                if (editingEnabled) {
                    $('#logo-upload').trigger('click');
                }
            });
        }

        function getPositions() {
            var header = $('#map-header');
            var footer = $('#footer');
            var sidebar = $('#sidebar');

            return {
                mapHeader: {
                    visible: true,
                    height: header.height()
                },
                mapFooter: {
                    visible: true,
                    height: footer.height()
                },
                mapSidebar: {
                    visible: true,
                    width: sidebar.width()
                }
            };

        }

        function disableEdit() {
            var header = $('#map-header');
            var footer = $('#footer');
            var sidebar = $('#sidebar');

            header.addClass('non-editable');
            $('body').removeClass('editable');
            $('#edit-template-btn span').switchClass('fa-eye', 'fa-pencil');

            sidebar.resizable('disable');
            header.resizable('disable');
            footer.resizable('disable');
            $('.footer-text').removeAttr('contenteditable');
            $('iframe.maploom')[0].contentWindow.EDITABLE = false;
            if ($('iframe.maploom')[0].contentWindow.$) {
                $('iframe.maploom')[0].contentWindow.$('body').triggerHandler('editable', [false]);
            }
        }

        function enableEdit() {
            var header = $('#map-header');
            var footer = $('#footer');
            var sidebar = $('#sidebar');

            $('body').addClass('editable');
            header.removeClass('non-editable');
            $('#edit-template-btn span').switchClass('fa-pencil', 'fa-eye');

            sidebar.resizable('enable');
            header.resizable('enable');
            footer.resizable('enable');
            $('.footer-text').attr('contenteditable', true);
            var mapWindow = $('iframe.maploom')[0].contentWindow;
            mapWindow.EDITABLE = true;
            if (mapWindow.$) {
                mapWindow.$('body').triggerHandler('editable', [true]);
            }
        }

        function persistChanges(id) {
            var reader;
            var mapWindow = $('iframe.maploom')[0].contentWindow;
            function post() {
                var params = {
                    'map_id': id,
                    'footer': $('.footer-text').text().trim(),
                    'selected_feature': JSON.stringify({featureID : currentFeature, layerID: currentLayer}),
                    'template': window.template,
                    'positions': JSON.stringify(getPositions()),
                    'chart_layer': mapWindow.CHART_LAYER,
                    'chart_attribute': mapWindow.CHART_ATTRIBUTE
                };

                if (reader) {
                    params.icon = reader.result.slice(reader.result.indexOf(',') + 1);
                }
                $.ajax({
                    url: '/storyPersist',
                    method: 'POST',
                    data: $.param(params),
                    headers: {
                        'X-CSRFToken': csrfToken,
                        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
                    }
                });
            }

            var file = $('#logo-upload')[0];
            if (file && file.files.length) {
                reader = new FileReader();
                reader.readAsDataURL(file.files[0]);
                reader.onload = post;
            } else {
                post();
            }
        }

        function updateFeature(featureID, layerID) {
            currentFeature = featureID;
            currentLayer = layerID;

            var ajaxCalls = [];

            ajaxCalls.push($.get('/geoserver/wfs?service=wfs&version=2.0.0&request=GetFeature&outputFormat=json&featureID=' + featureID,
                function (data) {
                    try {
                        return data.features[0].properties;
                    } catch (e) {
                        //Exception is thrown when feature doesn't exist in the wfs endpoint
                    }
                }));

            if (layerID) {
                ajaxCalls.push($.ajax({
                    url: '/layers/' + layerID + '/get',
                    method: 'GET',
                    //jquery wouldn't run the success function unless this was set
                    dataType: 'json',
                    success: function (data) {
                        return data;
                    }
                }));
            }
            $.when.apply(this, ajaxCalls).then(function (featureProp, layerMetadata) {
                var featureProperties;
                if ($.isArray(featureProp)) {
                    featureProperties = featureProp[0].features[0].properties;
                } else if (featureProp.features){
                    featureProperties = featureProp.features[0].properties;
                }
                if (layerMetadata && $.isArray(layerMetadata)) {
                    generateTable(featureProperties, layerMetadata[0]);
                } else if (featureProperties) {
                    generateTable(featureProperties);
                }
            });
        }

        function generateTable(featureProperties, layerMetadata) {
            var sortedOrder = [];
            if (layerMetadata) {
                sortedOrder = layerMetadata.attributes.sort(function (a, b) {
                    return a.display_order - b.display_order
                })
            } else {
                //If there is no metadata, order doesn't matter
                sortedOrder = Object.keys(featureProperties);
            }
            var table = $('#feature-table');
            var image_media = [];
            var video_media = [];
            table.empty();
            //TODO: Replace this with user selectable properties
            if (featureProperties.common_nam) {
                $('#feature-title').text(featureProperties.common_nam + ' - ' + featureProperties.observatio);
            }

            for (var i = 0; i < sortedOrder.length; ++i) {
                var attrKey;
                var display = true;
                var displayKey;
                if (sortedOrder[i].attribute) {
                    attrKey = sortedOrder[i].attribute;
                    display = sortedOrder[i].visible;
                    displayKey = sortedOrder[i].attribute_label || sortedOrder[i].attribute;
                } else {
                    attrKey = sortedOrder[i];
                    displayKey = attrKey;
                }
                var value = featureProperties[attrKey];
                if (isMediaPropertyName(attrKey)) {
                    var jsonValue;
                    var mediaArray;
                    if (attrKey.toLowerCase().indexOf('videos') === 0){
                        mediaArray = video_media;
                    } else {
                        mediaArray = image_media;
                    }
                    try {
                        jsonValue = JSON.parse(value);
                    } catch (e) {
                        if (typeof value === 'string' && value === '') {
                            jsonValue = undefined;
                        } else {
                            jsonValue = '\"' + value + '\"';
                        }
                    }
                    if ($.isArray(jsonValue)) {
                        for (var k = 0; k < jsonValue.length; ++k) {
                            var url = jsonValue[k];
                            if (url) {
                                if (url.indexOf('http') !== 0) {
                                    //TODO: This should really be the view endpoint rather than dl for videos
                                    url = '/api/fileservice/download/' + url;
                                }
                                mediaArray.push(url);
                            }
                        }
                    } else if (jsonValue !== undefined) {
                        url = jsonValue;
                        if (url.indexOf('http') !== 0) {
                            //TODO: This should really be the view endpoint rather than dl for videos
                            url = '/api/fileservice/download/' + url;
                        }
                        mediaArray.push(url);
                    }
                }
                else if (display) {
                    var row = $('<div class="row" style="padding: 0px;">' +
                        '<div class="col-md-6" style="padding: 0px;">' + displayKey + '</div>' +
                        '<div class="col-md-6" style="padding: 0px;">' + value + '</div>' +
                        '</div>');
                    row.appendTo(table);
                }
            }

            function createMediaObject(url) {
                if (url.indexOf('.mp4') !== -1) {
                    return '<div><video style="width: 100%; height: 100%;" controls src="' + url + '"/></div>';
                } else {
                    return '<div><img src="' + url + '"/></div>';
                }
            }

            var carousel = $('#sidebar-carousel');
            carousel.slick('removeSlide', null, null, true);
            $.each(image_media, function (key, val) {
                var img = createMediaObject(val);
                carousel.slick('slickAdd', img);
            });
            $.each(video_media, function (key, val) {
                var vid = createMediaObject(val);
                carousel.slick('slickAdd', vid);
            });
        }

        var plainTemplateObject = {
            mapHeader: {
                visible: true,
                height: 52
            },
            mapFooter: {
                visible: true,
                height: 60
            },
            mapSidebar: {
                visible: true,
                width: 200
            }
        };


        $('#logo-upload').on('change', function (e) {
            var file = $('#logo-upload')[0].files[0];
            var reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = function () {
                var logo = $('#logo');
                logo.attr('src', reader.result);
                logo.css('display', 'initial');
                $('#logo-placeholder').remove();
            };
        });

        $(document.body).bind('featureSelected', function (e, featureID, layerID) {
            updateFeature(featureID, layerID);
        });
        $(document.body).bind('saveMap', function (e, mapID) {
            persistChanges(mapID);
        });


        if (window.map_id) {
            $.get('/storyPersist?map_id=' + window.map_id, function (data) {
                if (data.icon) {
                    var logo = $('#logo');
                    logo.attr('src', data.icon);
                    logo.css('display', 'initial');
                    $('#logo-placeholder').remove();
                }
                $('#footer').children()[0].innerText = data.footer;
                window.template = data.template;
                if (data.template === 'plain' || data.template === 'time-slider' || data.template === 'chart') {
                    if (data.positions && data.positions !== '') {
                        setPositionAndSize(JSON.parse(data.positions), false);
                    } else {
                        setPositionAndSize(plainTemplateObject, false);
                    }
                }
                var mapWindow = $('iframe.maploom')[0].contentWindow;
                mapWindow.CHART_LAYER = data.chart_layer;
                mapWindow.CHART_ATTRIBUTE = data.chart_attribute;
                mapWindow.TEMPLATE = data.template;

                /*
                if (data.selected_feature) {
                    //TODO: Should this just be two separate fields?
                    try {
                        var parsedObj = JSON.parse(data.selected_feature);
                        updateFeature(parsedObj.featureID, parsedObj.layerID);
                    } catch (e) {
                        //If caught, selected_feature is just a string, not an object
                        updateFeature(data.selected_feature);
                    }
                }
                */
            });
        } else {
            $('#template-selector').modal();
            $('#plain-template').on('click', function () {
                window.template = 'plain';
                setPositionAndSize(plainTemplateObject, true);
                $('iframe.maploom')[0].contentWindow.$('body').triggerHandler('set-time-slider', [false]);
            });
            $('#time-slider-template').on('click', function () {
                window.template = 'time-slider';
                setPositionAndSize(plainTemplateObject, true);
                $('iframe.maploom')[0].contentWindow.$('body').triggerHandler('set-time-slider', [true]);
            });
            $('#chart-template').on('click', function () {
                window.template = 'chart';
                setPositionAndSize(plainTemplateObject, true);
                var mapWindow = $('iframe.maploom')[0].contentWindow;
                mapWindow.TEMPLATE = 'chart';
                $('iframe.maploom')[0].contentWindow.$('body').triggerHandler('enable-chart', [true]);
            });
        }
    }
}());
