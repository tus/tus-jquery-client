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
    // Total amount of bytes to send
    this.bytesTotal = null;

    // the jqXHR object
    this.jqXHR = null;

    // Create a deferred and make our upload a promise object
    this._deferred = $.Deferred();
    this._deferred.promise(this);
  }

  // Creates a file resource at the configured tus endpoint and gets the url for it.
  ResumableUpload.prototype._start = function() {
    var self = this;
    var reqOptions;

    // Optionally reset_before
    if (self.options.reset_before === true) {
      self._cachedUrl(false);
    }

    self.url        = self._cachedUrl();
    self.bytesTotal = self.file.size;

    if (self.url) {
      console.log('Resuming known url ' + self.url);
      // Resume against existing url
      reqOptions = {
        type: 'HEAD',
        url: self.url
      };
    } else {
      // New upload, get url
      reqOptions = {
        type: 'POST',
        url: self.options.endpoint,
        headers: {
          'Content-Range': 'bytes */' + self.bytesTotal,
          'Content-Disposition': 'attachment; filename="' + encodeURI(self.file.name) + '"'
        }
      };
    }

    $.ajax(reqOptions)
      .fail(function(jqXHR, textStatus, errorThrown) {
        // @TODO: Implement retry support
        self._deferred.reject(new Error('Could not create file resource: ' + textStatus), jqXHR, errorThrown);
      })
      .done(function(data, textStatus, jqXHR) {
        if (!self.url) {
          if (!(self.url = jqXHR.getResponseHeader('Location'))) {
            self._deferred.reject(new Error('Could not get url for file resource: ' + textStatus));
            return;
          }

          self._cachedUrl(self.url);
          self.bytesUploaded = 0;
        } else {
          self.bytesUploaded = self._bytesUploaded(jqXHR.getResponseHeader('Range'));

          if (self.bytesUploaded === self.file.size) {
            self._emitDone();
            return;
          }
        }

        // We now have a url, time to fire the progress event!
        self._emitProgress();

        self._upload(self.bytesUploaded, self.bytesTotal - 1);
      });
  };

  // Uploads the file data to tus resource url created by _start()
  ResumableUpload.prototype._upload = function(range_from, range_to) {
    var self  = this;

    var slice = self.file.slice || self.file.webkitSlice || self.file.mozSlice;
    var blob  = slice.call(self.file, range_from, (range_to - range_from) + 1, self.file.type);
    var xhr   = $.ajaxSettings.xhr();

    var options = {
      type: 'PUT',
      url: self.url,
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
        self._emitFail(textStatus + ' - ' + errorThrown);
        console.log('fail', arguments);
      })
      .done(function() {
        console.log('done', arguments, self, self.url);

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

  // Parses the Range header from the server response
  // and returns the uploaded bytes:
  ResumableUpload.prototype._bytesUploaded = function (range) {
    if (!range) {
      return;
    }

    var parts = range.split('-');
    if (parts.length < 2) {
      return;
    }

    return parseInt(parts[1], 10) + 1;
  },

  ResumableUpload.prototype._emitProgress = function(e) {
    this._deferred.notifyWith(this, [e, this.bytesUploaded, this.bytesTotal]);
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
      localStorage.removeItem(fingerPrint);
      return true;
    }

    if (url) {
      localStorage.setItem(fingerPrint, url);
      return true;
    }

    return localStorage.getItem(fingerPrint);
  };
})(jQuery);
