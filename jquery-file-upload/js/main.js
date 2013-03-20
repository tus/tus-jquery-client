$(function () {
    'use strict';

    var doIt = false;
    var host = 'http://localhost:1080';

    var files = {};

    $('#fileupload').fileupload({
        url: host + '/files',
        maxRetries: 100,
        maxChunkSize: 10 * 1024 * 1024,
        retryTimeout: 2 * 1000,
        multipart: false,
        submit: function(e, data) {
            if (doIt) {
                return true;
            }

            var self = this;
            var totalSize = 0;
            for (var i in data.files) {
                var file = data.files[i];
                if (typeof file === 'object') {
                    totalSize += file.size;
                }
            }

            $.ajax({
                type: "POST",
                url: host + '/files',
                data: {},
                headers: {'Content-Range': 'bytes */' + totalSize},
                success: function(theData, status, jqXHR) {
                    doIt = true;
                    var url = host + jqXHR.getResponseHeader('Location');
                    files[data.files[0].name] = url;
                    data.url = url;
                    data.submit();
                },
                dataType: 'text'
            });

            return false;
        },
        done: function() {
            console.log('done');
        },
        fail: function (e, data) {
            var fu = $(this).data('blueimp-fileupload') || $(this).data('fileupload');
            var retries = data.context.data('retries') || 0;
            var retry = function () {
                $.ajax({
                  type: "HEAD",
                  url: files[data.files[0].name],
                  success: function(theData, status, jqXHR) {
                    data.uploadedBytes = fu._getUploadedBytes(jqXHR);
                    data.data = null;
                    data.submit();
                  },
                  error: function(xhr, status) {
                    fu._trigger('fail', e, data);
                  }
                });
            };

            var bytes    = data.uploadedBytes;
            var fileSize = data.files[0].size;

            if (data.errorThrown !== 'abort' && bytes < fileSize && retries < fu.options.maxRetries) {
                retries += 1;
                data.context.data('retries', retries);
                window.setTimeout(retry, retries * fu.options.retryTimeout);
                return;
            }

            data.context.removeData('retries');
            $.blueimp.fileupload.prototype.options.fail.call(this, e, data);
        }
    });
});
