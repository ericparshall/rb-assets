require('whatwg-fetch');
require('./utils/object-assign');

var AssetDirectoryApp = require('./classes/AssetDirectoryApp');
var AssetPreview = require('./classes/AssetPreview');

function runDirectoryView(baseEl, options)
{
    var app = new AssetDirectoryApp(baseEl, options);
    app.run();
}

function showAssetPreview(container, asset)
{
    (new AssetPreview(container, asset)).show();
}

window.RB = window.RB || {};
window.RB.runDirectoryView = runDirectoryView;
window.RB.showAssetPreview = showAssetPreview;
