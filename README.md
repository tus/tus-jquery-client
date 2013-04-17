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

## Try the demo

Without installing anything, you can testdrive over at the
[tus.io](http://www.tus.io/demo.html) website.

But for local development, here's how to run the repo-included demo:

- Install a tusd server to accept the upload on http://127.0.0.1:1080
as instructed [here](https://github.com/tus/tusd/blob/master/README.md).
- Install node.js to serve the demo from http://127.0.0.1:8080
(osx: `brew install nodejs`)
- Install & run the demo

```bash
cd demo
npm install
node server.js
```

- Point your browser to http://localhost:8080

## License

This project is licensed under the MIT license, see `LICENSE.txt`.
