/*
 * tus-jquery-client
 * https://github.com/tus/tus-jquery-client
 *
 * Copyright (c) 2013 Transloadit Ltd and Contributors
 * http://tus.io/
 *
 * Licensed under the MIT license:
 * http://www.opensource.org/licenses/MIT
 */

(function ($) {
  'use strict';

  // The Public API
  var tus = window.tus = {
    upload: function(file, options) {
      var upload = new ResumableUpload(file, options);
      upload._start();
      return upload;
    },
  };

  function ResumableUpload(file, options) {
    // The file to upload
    this.file = file;
    // Options for resumable file uploads
    this.options = {
      // The tus upload endpoint url
      endpoint: options.endpoint,
    };

    // The url of the uploaded file, assigned by the tus upload endpoint
    this.url = null;
    // Bytes sent to the server so far
    this.bytesUploaded = null;
    // Total amount of bytes to sent
    this.bytesTotal = null;

    // Create a deferred and make our upload a promise object
    this._deferred = $.Deferred();
    this._deferred.promise(this);
  }

  // Creates a file resource at the configured tus endpoint and gets the url for it.
  ResumableUpload.prototype._start = function() {
    var self = this;
    var options = {
      type: 'POST',
      url: this.options.endpoint,
      headers: {
        'Content-Range': 'bytes */' + this.file.size,
        'Content-Disposition': 'attachment; filename="' + encodeURI(this.file.name) + '"'
      }
    };

    this.bytesUploaded = 0;
    this.bytesTotal = this.file.size;

    $.ajax(options)
      .fail(function(jqXHR, textStatus, errorThrown) {
        // @TODO: Implement retry support
        self._deferred.reject(new Error('Could not create file resource: ' + textStatus), jqXHR, errorThrown);
      })
      .done(function(data, textStatus, jqXHR) {
        self.url = jqXHR.getResponseHeader('Location');
        if (!self.url) {
          self._deferred.reject(new Error('Could not get url for file resource: ' + textStatus));
          return;
        }

        // We now have a url, time to fire the progress event!
        self._deferred.notifyWith(self);
        self._upload();
      });
  };

  // Uploads the file data to tus resource url created by _start()
  ResumableUpload.prototype._upload = function() {
    var self = this;
    var slice = this.file.slice || this.file.webkitSlice || this.file.mozSlice;
    var blob = slice.call(this.file, 0, this.file.size, this.file.type);
    var xhr = $.ajaxSettings.xhr();

    var options = {
      type: 'PUT',
      url: this.url,
      data: blob,
      processData: false,
      contentType: this.file.type,
      cache: false,
      xhr: function() { return xhr },
      headers: {
        'Content-Range': 'bytes 0-' + (this.file.size - 1)  + '/' + this.file.size,
      }
    };

    $(xhr.upload).bind('progress', function(e) {
      self.bytesUploaded = e.originalEvent.loaded;
      self._deferred.notifyWith(self, [e, self.bytesUploaded, self.bytesTotal]);
    });

    var jqXHR = $.ajax(options)
      .fail(function() {
        console.log('fail', arguments);
      })
      .done(function() {
        console.log('done', arguments, self, self.url);
        self._deferred.resolveWith(self, [self.url]);
      });
  };
})(jQuery);
