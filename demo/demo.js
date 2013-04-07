$(function() {
  $('input[type=file]').change(function() {
    var $parent = $(this).parent();
    var file = this.files[0];
    console.log('selected file', file);

    var options = {endpoint: 'http://localhost:1080/files'};
    options.reset = $('#reset').val() === 'on';

    tus
      .upload(file, options)
      .fail(function(error) {
        console.log('upload failed', error);
      })
      .progress(function(e, bytesUploaded, bytesTotal) {
        var percentage = (bytesUploaded / bytesTotal * 100).toFixed(2);
        console.log(bytesUploaded, bytesTotal, percentage + '%');
      })
      .done(function(url) {
        var $download = $('<a>Download uploaded file</a>').appendTo($parent);
        $download.attr('href', url);
        $download.addClass('btn').addClass('btn-success');
      });
  });
});
