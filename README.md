# tus-jquery

A file upload library for jQuery implementing the [tus resumable upload
protocol](https://github.com/tus/tus-resumable-upload-protocol).

This first version will provide a low level API without a GUI. More advanced
features will follow.

## API Draft

```js
$('input[type=file]').change(function() {
  tus.upload(this, function() {
  
  });
});
```

## License

This project is licensed under the MIT license, see `LICENSE.txt`.
