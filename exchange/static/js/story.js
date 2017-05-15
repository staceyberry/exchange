if (window.renderer === 'maploom') {


    function isMediaPropertyName(name) {
      var lower = name.toLowerCase();
      return lower.indexOf('fotos') === 0 || lower.indexOf('photos') === 0 ||
          lower.indexOf('audios') === 0 || lower.indexOf('videos') === 0;
    }

    function setPositionAndSize(config) {
        var navbarHeight = $('.navbar-fixed-top').height();
        var header = $('#map-header');
        var footer = $('#footer');
        var sidebar = $('#sidebar');
        var mapFrame = $('iframe.maploom');
        var adjustedHeight = navbarHeight;
        var adjustedWidth = 0;

        if (!config.mapHeader.visible) {
            header.css('display', 'none');
        } else {
            adjustedHeight += header.height();
            header.css('display', 'block');
        }
        mapFrame.css('top', adjustedHeight);

        if (!config.mapFooter.visible) {
            footer.css('display', 'none');
        } else {
            footer.css('display', 'block');
            adjustedHeight += footer.height();
        }
        if (!config.mapSidebar.visible) {
            sidebar.css('display', 'none');
        } else {
            sidebar.css('display', 'block');
            adjustedWidth += sidebar.width();
        }

        mapFrame.css('left', adjustedWidth);
        mapFrame.css('width', 'calc(100% - ' + adjustedWidth + 'px)');
        mapFrame.css('height', 'calc(100% - ' + adjustedHeight + 'px)');
        mapFrame.css('position', 'absolute');

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
    }

    function updateFeature(featureID){
        $.get('/geoserver/wfs?service=wfs&version=2.0.0&request=GetFeature&outputFormat=json&featureID=' + featureID,
            function(data) {
                try {
                    var featureProperties = data.features[0].properties;
                    var table = $('#feature-table');
                    var media = [];
                    table.empty();
                    $.each(featureProperties, function(key, value) {
                        if (isMediaPropertyName(key)) {
                            var jsonValue;
                            try {
                                jsonValue = JSON.parse(value);
                            } catch (e) {
                                if (typeof value === 'string' && value === ''){
                                    jsonValue = undefined;
                                } else {
                                    jsonValue = '\"' + value + '\"';
                                }
                            }
                            if ($.isArray(jsonValue)){
                                for(var i = 0; i < jsonValue.length; ++i){
                                    media.push(jsonValue[i]);
                                }
                            } else if (jsonValue !== undefined) {
                                media.push(jsonValue);
                            }
                        } else {
                            var row = $('<div class="row" style="padding: 0px;">' +
                                '<div class="col-md-6" style="padding: 0px;">' + key + '</div>' +
                                '<div class="col-md-6" style="padding: 0px;">' + value + '</div>' +
                                '</div>');
                            row.appendTo(table);
                        }
                    });
                    var carousel = $('#sidebar-carousel');
                    carousel.slick('removeSlide', null, null, true);
                    $.each(media, function(key, val){
                       var img = '<div><img src="' + val + '"/></div>';
                       carousel.slick('slickAdd',img);
                    });
                } catch (e) {
                    //Exception is thrown when feature doesn't exist in the wfs endpoint
                }
            });
    }

    var plainTemplateObject = {
                        mapHeader: {
                            visible: true
                        },
                        mapFooter: {
                            visible: true
                        },
                        mapSidebar: {
                            visible: true
                        }
                    };


    $('#logo-upload').on('change', function(e) {
        var file = $('#logo-upload')[0].files[0];
        var reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = function() {
            $('#logo').attr('src', reader.result);
        };
    });
    $('#logo').click(function() {
        $('#logo-upload').trigger('click');
    });

    $('body').bind('featureSelected',function(e, featureID) {
        updateFeature(featureID);
    });


    if (window.map_id) {
        $.get('/storyPersist?map_id=' + window.map_id, function(data){
            $('#logo').attr('src', data.icon);
            $('#footer').children()[0].innerText = data.footer;
            window.template = data.template;
            if (data.template === 'plain') {
                setPositionAndSize(plainTemplateObject);
            }

            if (data.selected_feature) {
                updateFeature(data.selected_feature);
            }
        });
    } else {
        $('#template-selector').modal();
        $('#plain-template').on('click', function(){
            window.template = 'plain';
            setPositionAndSize(plainTemplateObject);
        });
    }
}
