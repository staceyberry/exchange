if (window.renderer === 'maploom') {

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
    }



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

    if (window.map_id) {
        $.get('/storyPersist?map_id=' + window.map_id, function(data){
            $('#logo').attr('src', data.icon);
            $('#footer').children()[0].innerText = data.footer;
            window.template = data.template;
            if (data.template === 'plain') {
                setPositionAndSize(
                    {
                        mapHeader: {
                            visible: true
                        },
                        mapFooter: {
                            visible: true
                        },
                        mapSidebar: {
                            visible: true
                        }
                    });
            }
        });
    } else {
        $('#template-selector').modal();
        $('#plain-template').on('click', function(){
            window.template = 'plain';
            setPositionAndSize(
                {
                    mapHeader: {
                        visible: true
                    },
                    mapFooter: {
                        visible: true
                    },
                    mapSidebar: {
                        visible: true
                    }
            });
        });
    }
}
