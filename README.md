# WARNING: Deprecated Project

tus-jquery-client is not maintained anymore and no support is available.
Please use [tus-js-client](https://github.com/tus/tus-js-client) for a modern
tus client for browsers. More implementations for different environments can
be found on [tus.io](https://tus.io/implementations.html).

## tus-jquery-client
[![Build Status](https://travis-ci.org/tus/tus-jquery-client.svg?branch=master)](https://travis-ci.org/tus/tus-jquery-client)

A jQuery client implementing the [tus resumable upload
protocol](https://github.com/tus/tus-resumable-upload-protocol).
If you looking for a browser client without the need of jQuery, you
may enjoy [tus-js-client](https://github.com/tus/tus-js-client).

## Example

The code below outlines how the API could work.

```js
$('input[type=file]').change(function() {
  var options = { endpoint: 'http://localhost:1080/files' };
  var input   = $(this);

  tus
    .upload(this.files[0], options)
    .fail(function(error) {
      console.log('upload failed', error);
    })
    .always(function() {
       input.val('');
    })
    .progress(function(e, bytesUploaded, bytesTotal) {
       console.log(bytesUploaded, bytesTotal);
    })
    .done(function(url, file) {
      console.log(url);
      console.log(file.name);
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
