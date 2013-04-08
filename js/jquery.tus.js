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
    currentUpload: null,

    upload: function(file, options) {
      this.currentUpload = new ResumableUpload(file, options);
      if (file) {
        this.currentUpload._start();
      }
      return this.currentUpload;
    },
    stop: function(upload) {
      if (this.currentUpload) {
        this.currentUpload._stop();
      }
    }
  };

  function ResumableUpload(file, options) {
    // The file to upload
    this.file = file;
    // Options for resumable file uploads
    this.options = {
      // The tus upload endpoint url
      endpoint: options.endpoint,
      reset_before: options.reset_before,
      reset_after: options.reset_after
    };

    // The url of the uploaded file, assigned by the tus upload endpoint
    this.url = null;
    // Bytes sent to the server so far
    this.bytesUploaded = null;

    // the jqXHR object
    this.jqXHR = null;

    // Create a deferred and make our upload a promise object
    this._deferred = $.Deferred();
    this._deferred.promise(this);
  }

  ResumableUpload.prototype._post = function(url, file, cb) {
    var self    = this;
    var options = {
      type: 'POST',
      url: url,
      headers: {
        'Content-Range': 'bytes */' + file.size,
        'Content-Disposition': 'attachment; filename="' + encodeURI(file.name) + '"'
      }
    };

    $.ajax(options)
      .fail(function(jqXHR, textStatus, errorThrown) {
        // @todo: Implement retry support
        self._emitFail('Could not post to file resource: ' + textStatus);
      })
      .done(function(data, textStatus, jqXHR) {
        if (!(url = jqXHR.getResponseHeader('Location'))) {
          return self._emitFail('Could not get url for file resource: ' + textStatus);
        }

        cb(url, 0);
      });
  };

  ResumableUpload.prototype._head = function(url, cb) {
    var self    = this;
    var options = {
      type: 'HEAD',
      url: url
    };

    console.log('Resuming known url ' + url);

    $.ajax(options   )
      .fail(function(jqXHR, textStatus, errorThrown) {
        // @todo: Implement retry support
        self_emitFail('Could not head at file resource: ' + textStatus);
      })
      .done(function(data, textStatus, jqXHR) {
        var range = jqXHR.getResponseHeader('Range');
        var m     = range && range.match(/bytes=\d+-(\d+)/);
        var bytesUploaded = 0;
        if (m) {
          // If the server has not received anything so far,
          // there will be no Range header present.
          bytesUploaded = parseInt(m[1], 10) + 1;
        }

        cb(url, bytesUploaded);
      });
  };

  // Creates a file resource at the configured tus endpoint and gets the url for it.
  ResumableUpload.prototype._start = function() {
    var self = this;

    // Optionally reset_before
    if (self.options.reset_before === true) {
      self._cachedUrl(false);
    }


    var transmit = function (url, bytesUploaded) {
      if (bytesUploaded === self.file.size) {
        // Cool, we already completely uploaded this
        return self._emitDone();
      }

      // Save url
      self.bytesUploaded = bytesUploaded;
      self._cachedUrl(url);
      self._emitProgress();
      self._upload(url, self.bytesUploaded, self.file.size - 1);
    };

    if (!(self.url = self._cachedUrl())) {
      self._post(self.options.endpoint, self.file, transmit);
    } else {
      self._head(self.url, transmit);
    }
  };

  // Uploads the file data to tus resource url created by _start()
  ResumableUpload.prototype._upload = function(url, range_from, range_to) {
    var self  = this;

    var slice = self.file.slice || self.file.webkitSlice || self.file.mozSlice;
    var blob  = slice.call(self.file, range_from, range_to + 1, self.file.type);
    var xhr   = $.ajaxSettings.xhr();

    var options = {
      type: 'PUT',
      url: url,
      data: blob,
      processData: false,
      contentType: self.file.type,
      cache: false,
      xhr: function() {
        return xhr;
      },
      headers: {
        'Content-Range': 'bytes ' + range_from + '-' + range_to  + '/' + self.file.size
      }
    };

    $(xhr.upload).bind('progress', function(e) {
      self.bytesUploaded = e.originalEvent.loaded;
      self._emitProgress(e);
    });

    this.jqXHR = $.ajax(options)
      .fail(function(jqXHR, textStatus, errorThrown) {
        // Compile somewhat meaningful error
        // Needs to be cleaned up
        var msg = jqXHR.responseText || textStatus || errorThrown;
        self._emitFail(msg);
      })
      .done(function() {
        console.log('done', arguments, self, url);

        if (self.options.reset_after === true) {
          self._cachedUrl(false);
        }

        self._emitDone();
      });
  };

  ResumableUpload.prototype._stop = function() {
    if (this.jqXHR) {
      this.jqXHR.abort();
    }
  };

  ResumableUpload.prototype._emitProgress = function(e) {
    this._deferred.notifyWith(this, [e, this.bytesUploaded, this.file.size]);
  };

  ResumableUpload.prototype._emitDone = function() {
    this._deferred.resolveWith(this, [this.url, this.file]);
  };

  ResumableUpload.prototype._emitFail = function(err) {
    this._deferred.rejectWith(this, [err]);
  };

  ResumableUpload.prototype._cachedUrl = function(url) {
    var fingerPrint = 'file-' + this.file.name + '-' + this.file.size;

    if (url === false) {
      console.log('Resetting any known cached url for ' + this.file.name);
      return localStorage.removeItem(fingerPrint);
    }

    if (url) {
      return localStorage.setItem(fingerPrint, url);
    }

    return localStorage.getItem(fingerPrint);
  };
})(jQuery);
