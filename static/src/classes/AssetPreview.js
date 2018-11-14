function AssetPreview(container, asset)
{
    this.container = container;
    this.asset = asset;

    console.log('ASSET PREVIEW: ', this);
}

AssetPreview.prototype.renderPreview = function()
{
    console.log('RENDERING ASSET PREVIEW: ');
    var asset = this.asset;
    this.container.innerHTML = '';

    switch(asset.assetType) {
        case 'Directory':
            this.renderDirectoryPreview();
            break;
        case 'Image':
            this.renderImagePreview();
            break;
        case 'Video':
            this.renderVideoPreview();
            break;
        case 'Audio':
            this.renderAudioPreview();
            break;
        case 'Document':
            this.renderDocumentPreview();
            break;
    }
}

AssetPreview.prototype.show = AssetPreview.prototype.renderPreview;

AssetPreview.prototype.renderDirectoryPreview = function()
{
    this.renderPreviewAsIcon('fa fa-folder');
}

AssetPreview.prototype.renderImagePreview = function()
{
    var imgEl = document.createElement('div');
    var src = this.asset.locationHost + this.asset.locationPath;
    // imgEl.style.backgroundColor = '#efefef';
    imgEl.style.backgroundImage = 'url("'+src+'")';
    imgEl.style.position = 'absolute';
    imgEl.style.left = 0;
    imgEl.style.right = 0;
    imgEl.style.top = 0;
    imgEl.style.bottom = 0;
    imgEl.style.backgroundSize = 'contain';
    imgEl.style.backgroundPosition = 'center center';
    imgEl.style.backgroundRepeat = 'no-repeat';

    console.log('IMAGE PREVIEW: ', imgEl);

    this.container.appendChild(imgEl);
}

AssetPreview.prototype.renderVideoPreview = function()
{
    // temporary
    this.renderPreviewAsIcon('fa fa-file-video-o');
}

AssetPreview.prototype.renderAudioPreview = function()
{
    // temporary
    this.renderPreviewAsIcon('fa fa-file-audio-o');
}

AssetPreview.prototype.renderDocumentPreview = function()
{
    // temporaryish
    this.renderPreviewAsIcon('fa fa-file-o');
}

AssetPreview.prototype.renderPreviewAsIcon = function(iconClass)
{
    var icon = document.createElement('div');
    icon.classList = iconClass;

    this.container.appendChild(icon);
}

module.exports = AssetPreview;
