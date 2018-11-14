registerFieldType('asset', function(key, attr, value, container)
{
    var imgDiv = $(document.createElement('div'));
    imgDiv.css('width', '100%');
    //imgDiv.append(attr.label+'<br/>');
    //displayImageInputPreview
    imgDiv.append(displayAssetInputPreview(key, attr, value));
    imgDiv.append(displayAssetInput(key, attr, value));
    container.append(imgDiv);
    appendAssetScriptFile();
});

var assetScriptFileAppended = false;
function appendAssetScriptFile()
{
    if (!assetScriptFileAppended)
    {
        assetScripFileAppended = true;

        var scriptEl = document.createElement('script');
        scriptEl.type = 'text/javascript';
        scriptEl.src = '/static/assets/scripts/asset-directory-view.js';
        document.body.appendChild(scriptEl);

        var styleEl = document.createElement('link');
        styleEl.rel = 'stylesheet';
        styleEl.href = '/static/assets/css/asset-directory-view.css';

        document.head.appendChild(styleEl);
    }
}

function showDirectorySelect(attr, callback)
{
    var ownerModelKey = attr.ownerModelKey;
    var ownerId = attr.ownerId;
    var currentSelection = null;

    var modalWrapper = $(document.createElement('div'));
    modalWrapper.css({
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
        background: "rgba(0,0,0,0.4)",
        padding: '20px',
    });

    var well = $(document.createElement('div'));
    well.addClass('well');
    modalWrapper.append(well);

    var rowDiv = $(document.createElement('div'));
    rowDiv.addClass('clearfix');
    well.append(rowDiv);

    var directoryElWrapper = $(document.createElement('div'));
    directoryElWrapper.css({
        'width': 'calc(100% - 284px)',
        'min-height': '160px',
        display: 'inline-block',
        float: 'left'
    })
    var directoryEl = $(document.createElement('div'));
    directoryEl.attr('id', 'directory-container');

    directoryElWrapper.append(directoryEl);
    rowDiv.append(directoryElWrapper);

    var previewWrapper = $(document.createElement('div'));
    var preview = $(document.createElement('div'));

    previewWrapper.css({
        display: 'inline-block',
        float: 'left',
        padding: '10px',
        'margin-left': '20px',
    });

    preview.css({
        'height': '160px',
        'width': '240px',
        border: '2px solid #333',
        'background': '#efefef',
        'border-radius': '10px',
        'position': 'relative',
        'overflow': 'hidden',
        'text-align': 'center',
        'font-size': '100px',
        'vertical-align': 'middle',
        'line-height': '160px'
    });

    previewWrapper.append(preview);
    rowDiv.append(previewWrapper);

    var controlsDiv = $(document.createElement('div'));

    well.append(controlsDiv);

    var cancelButton = $(document.createElement('a'));
    cancelButton.addClass('btn');
    cancelButton.text('Cancel');
    cancelButton.click(function(e)
    {
        e.preventDefault();
        modalWrapper.remove();
    })
    controlsDiv.append(cancelButton);

    var selectButton = $(document.createElement('a'));
    selectButton.addClass('btn');
    selectButton.text('Select');
    selectButton.click(function(e)
    {
        onChoose(currentSelection);
    })
    controlsDiv.append(selectButton);

    function onSelect(record) {
        console.log('SELECTED: ', record);
        RB.showAssetPreview(preview[0], record);
        currentSelection = record;
    }

    function onChoose(record) {
        console.log('CHOSEN: ', record);
        callback(record);
        modalWrapper.remove();
    }

    $(document.body).append(modalWrapper);

    RB.runDirectoryView(directoryEl[0], ownerId, ownerModelKey, "fa fa-folder", "Project", {
        onSelect: onSelect,
        onChoose: onChoose,
    });
}

function displayAssetFileInput(key, attr, value)
{
    var iconClass = 'fa-file';

    var assetInput = $(document.createElement('input'));
    assetInput.attr('type', 'hidden');
    assetInput.attr('value', value);
    assetInput.attr('name', key);
    assetInput.attr('id', 'f_'+key);
    assetInput.css('display', 'none');

    var assetInputWrapper = $(document.createElement('div'));
    assetInputWrapper.addClass('editable');
    assetInputWrapper.css('cursor', 'pointer').css('padding-bottom', '0');

    var icon = $(document.createElement('i'));
    icon.addClass('fa').addClass(iconClass);
    icon.css('margin-right', '10px');
    icon.css('color', '{{#data:key/"primaryColor"}}');
    assetInputWrapper.append(icon);

    var fileName = $(document.createElement('span'));
    fileName.text(value ? "Select Asset" : "Loading Asset...");
    fileName.attr('id', 'f_'+key+'__display');
    assetInputWrapper.append(fileName);

    assetInputWrapper.append(assetInput);

    assetInputWrapper.click(function(e) {
        showDirectorySelect(attr, function(asset)
        {
            console.log('ASSET: ', asset);
            showAsset(asset);
            assetInput.val(asset._id);
        });
    });

    if (value)
    {
        var url = '/assets/view/' + value;
        $.ajax({
            dataType: 'json',
            url: url,
            method: 'get',
            headers: {
                'Accept': 'application/json'
            },
            success: function(data) {
                console.log('DATA: ', data);
                var asset = data.data;
                whenDisplayAssetAvailable(showAsset.bind(null, asset));
            },
            error: function(failure) {
                console.error('FAIL: ', failure);
            }
        });
    }

    var showAsset = function(asset) {
        fileName.text(asset.name);
        RB.showAssetPreview($('#fPrev_'+key)[0], asset);
    }

    return assetInputWrapper;
}

function displayAssetInput(key, attr, value)
{
    var fileInput = displayAssetFileInput(key, attr, value);
    var imageInputWrapper = $(document.createElement('div'));
    imageInputWrapper.append(attr.label+'<br/>');
    imageInputWrapper.addClass('formImgFile');
    imageInputWrapper.append(fileInput);
    return imageInputWrapper;
}

function displayAssetInputPreview(key, attr, value)
{
    var imageInputWrapper = $(document.createElement('div'));
    imageInputWrapper.css({float: 'left'});

    var preview = $(document.createElement('div'));
    preview.height('50px');
    preview.attr('id', 'fPrev_'+key);
    preview.css('max-width', '160px');
    preview.css({
        'position': 'relative',
        'background': '#efefef',
        'border-radius': '10px',
        'position': 'relative',
        'overflow': 'hidden',
        'text-align': 'center',
        'font-size': '24px',
        'vertical-align': 'middle',
        'line-height': '50px'
    });


    imageInputWrapper.append(preview);

    var imageUrl = '';

    imageInputWrapper.addClass('formImgThumb');
    return imageInputWrapper;
}

var DISPLAY_ASSET_QUEUE = [];
var whenDisplayAssetAvailableTimeout = null;

function whenDisplayAssetAvailableTimeoutFn ()
{
    if (window.RB && window.RB.showAssetPreview)
    {
        DISPLAY_ASSET_QUEUE.forEach(function(fn)
        {
            fn();
        });
    }
    else
    {
        whenDisplayAssetAvailableTimeout = setTimeout(whenDisplayAssetAvailableTimeoutFn, 200);
    }
}

function whenDisplayAssetAvailable(callback) {

    if (window.RB && window.RB.displayAssetPreview)
    {
        return callback();
    }

    DISPLAY_ASSET_QUEUE.push(callback);

    if (!whenDisplayAssetAvailableTimeout)
    {
        whenDisplayAssetAvailableTimeout = setTimeout(whenDisplayAssetAvailableTimeoutFn, 200);
    }
}