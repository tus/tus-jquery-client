# tus-jquery-client

A jQuery client implementing the [tus resumable upload
protocol](https://github.com/tus/tus-resumable-upload-protocol).

This first version will provide a low level API without a GUI. More advanced
features will follow.

## Example

The code below outlines how the API could work.

```js
$('input[type=file]').change(function() {
  var options = {url: 'http://localhost:1080/files'};
  tus
    .upload(this.files[0], options)
    .fail(function(upload, error) {
      console.log('upload failed', error);
    })
    .progress(function(upload) {
      console.log(upload.bytesSent, upload.bytesTotal);
    })
    .done(function(upload) {
      console.log(upload.url);
    });
});
```

## License

This project is licensed under the MIT license, see `LICENSE.txt`.
