class AssetFormField extends FormField {
    constructor(parentNode, key, attr, initialValue, colW) {
        super(parentNode, key, attr, initialValue, colW);

        this.displayValue = initialValue ? this.renderLoadingMessage() : 'No Asset Selected';

        this.onInputClick = this.onInputClick.bind(this);
        this.assetInputElm = null;
        this.asset = null;

        if (initialValue) {
            this.load(initialValue);
        }

        appendAssetScriptFile();
    }

    resetData(value) {
        console.log('ASSET FORM FIELD VALUE: ', value);
        this.initialValue = value;
        if (value) {
            this.load(value);
        }
    }

    renderInputSection(value) {
        return [
            this.renderPreview(value),
            h('div.formImgFile', {
                style: {
                    verticalAlign: 'top'
                }
            }, [
                this.renderLabel(value),
                this.renderInput(value),
            ]),
        ];
    }

    renderPreview(value) {
        return h('div.formImgThumb', {
            style: {
                position: 'relative',
                background: '#efefef',
                borderRadius: '10px',
                position: 'relative',
                overflow: 'hidden',
                textAlign: 'center',
                fontSize: '24px',
                verticalAlign: 'top',
                lineHeight: '50px'
            }
        }, this.renderPreviewType(value))
    }

    renderPreviewType(value) {
        if (!this.asset) {
            return [];
        }

        const asset = this.asset;

        switch(asset.assetType) {
            case 'Image':
                return [this.renderImagePreview(asset)];
            case 'Video':
                return [this.renderVideoPreview(asset)];
            case 'Audio':
                return [this.renderAudioPreview(asset)];
            case 'Document':
                return [this.renderDocumentPreview(asset)];
            default:
                return [];
        }
    }

    renderImagePreview(asset) {
        return h('div', {
            style: {
                backgroundImage: `url(${asset.downloadLink})`,
                position: 'absolute',
                left: '0px',
                right: '0px',
                top: '0px',
                bottom: '0px',
                backgroundSize: 'cover',
                backgroundPosition: 'center center',
                backgroundRepeat: 'no-repeat'
            },
        })
    }

    renderVideoPreview(asset) {
        // TODO: show real video
        return h('div.fa.fa-file-video-o');
    }

    renderAudioPreview(asset) {
        // TODO: show real audio
        return h('div.fa.fa-file-audio-o');
    }

    renderDocumentPreview(asset) {
        // TODO: adjust based on type of document
        return h('div.fa.fa-file-o');
    }

    renderInput(value) {
        return h('div.editable', {
            style: {
                cursor: 'pointer',
                paddingBottom: '0px'
            },
            on: {
                click: this.onInputClick
            }
        }, [
            h('i.fa.fa-photo', {
                style: {
                    marginRight: '10px',
                    color: '{{#data:key/"primaryColor"}}',
                }
            }),
            h('span', [this.displayValue]),
            h('input', {
                style: {
                    // display: 'none',
                },
                props: {
                    type: 'hidden',
                    // value: value,
                    name: this.formName(),
                    id: 'f_' + this.key,
                    disabled: !this.isMutable(),
                },
                hook: {
                    insert: (vnode) => {this.assetInputElm = vnode.elm; vnode.elm.value = this.initialValue}
                }
            })
        ])
    }

    showAsset(asset) {
        this.displayValue = asset.name;
        this.asset = asset;
        this.getRootForm().updateValue(`_temp.${this.key}.asset`, asset);
        this.update();
    }

    load(id) {
        var url = '/assets/view/' + id;
        $.ajax({
            dataType: 'json',
            url: url,
            method: 'get',
            headers: {
                'Accept': 'application/json'
            },
            success: (data) => {
                // console.log('DATA: ', data);
                var asset = data.data;
                whenDisplayAssetAvailable(this.showAsset.bind(this, asset));
            },
            error: (failure) => {
                console.error('FAIL: ', failure);
            }
        });
    }

    onInputClick(e) {
        showDirectorySelect(this.attr, (asset) => {
            // console.log('ASSET: ', asset);
            this.showAsset(asset);
            this.assetInputElm.value = asset._id;
        });
    }
}

RBForm.registerFieldType('asset', AssetFormField);

var assetScriptFileAppended = false;
function appendAssetScriptFile()
{
    if (!assetScriptFileAppended)
    {
        assetScriptFileAppended = true;

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
    well.addClass('modal');
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
        padding: '0 10px 10px',
        'margin-left': '20px',
    });

    var previewTitle = $(document.createElement('h3'));
    previewTitle.css({
        'font-family': 'Poppins, sans-serif',
        'background': 'rgba(239,239,239,1)',
        'color': 'rgb(19, 68, 113)',
        'margin-bottom': '10px',
        'margin-top': '0px',
        'padding': '5px 10px',
        'border-radius': '10px',
    })

    previewTitle.text('Preview')

    preview.css({
        'height': '160px',
        'width': '240px',
        // border: '2px solid #333',
        'background': '#efefef',
        'border-radius': '10px',
        'position': 'relative',
        'overflow': 'hidden',
        'text-align': 'center',
        'font-size': '100px',
        'vertical-align': 'middle',
        'line-height': '160px'
    });

    previewWrapper.append(previewTitle);
    previewWrapper.append(preview);
    rowDiv.append(previewWrapper);

    var controlsDiv = $(document.createElement('div'));
    controlsDiv.addClass('modal-controls');

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

    RB.runDirectoryView(directoryEl[0], {
        onSelect: onSelect,
        onChoose: onChoose,
        allowDirectorySelect: attr.allowDirectorySelect,
        allowedTypes: attr.allowedTypes || [],
    });
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

AssetFormField.showDirectorySelect = showDirectorySelect;
