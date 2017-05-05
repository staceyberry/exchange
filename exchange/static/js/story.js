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

if (map_id) {
    $.get('/storyPersist?map_id=' + map_id).then(function(data){
        $('#logo').attr('src', data.icon);
        $('#footer').children()[0].innerText = data.footer;
    });
}
