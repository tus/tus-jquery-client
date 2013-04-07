$(function() {
  $('.js-stop').click(function(e) {
    e.preventDefault();

    tus.stop();
  });

  $('input[type=file]').change(function() {
    var $input = $(this);
    var $parent = $input.parent();
    var file = this.files[0];
    console.log('selected file', file);

    $('.js-stop').removeClass('disabled');

    var options = {
      endpoint: 'http://localhost:1080/files',
      reset: $('#reset').prop('checked')
    };

    tus
      .upload(file, options)
      .fail(function(error) {
        alert('Failed because: ' + error);
      })
      .always(function(error) {
        $input.val('');
        $('.js-stop').addClass('disabled');
      })
      .progress(function(e, bytesUploaded, bytesTotal) {
        var percentage = (bytesUploaded / bytesTotal * 100).toFixed(2);
        console.log(bytesUploaded, bytesTotal, percentage + '%');
      })
      .done(function(url, file) {
        var $download = $('<a>Download ' + file.name + ' (' + file.size + 'b)</a><br />').appendTo($parent);
        $download.attr('href', url);
        $download.addClass('btn').addClass('btn-success');
      });
  });
});
