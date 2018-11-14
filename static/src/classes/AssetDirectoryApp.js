var moment = require('moment');
var snabbdom = require('snabbdom');
var patch = snabbdom.init([
    require('snabbdom/modules/class').default, // makes it easy to toggle classes
    require('snabbdom/modules/props').default, // for setting properties on DOM elements
    require('snabbdom/modules/style').default, // handles styling on elements with support for animations
    require('snabbdom/modules/eventlisteners').default, // attaches event listeners
]);
var h = require('snabbdom/h').default; // helper function for creating vnodes
var hh = require('hyperscript-helpers')(h);

var div = hh.div,
    p = hh.p,
    i = hh.i,
    ul = hh.ul,
    li = hh.li,
    a = hh.a,
    h1 = hh.h1,
    h2 = hh.h2,
    h3 = hh.h3,
    span = hh.span
    ;

var UploadManager = require('./UploadManager');

function AssetDirectoryApp(baseEl, options)
{
    options = options || {};
    this.library = null;
    this.libraries = [];
    this.baseEl = baseEl;
    this.vnode = baseEl;
    this.libraryIcon = 'fa fa-folder';
    this.uploads = [];
    this.selected = null;
    this.onChoose = options.onChoose;
    this.onSelect = options.onSelect;
    this.allowDirectorySelect = options.allowDirectorySelect === true;
    this.allowedTypes = (Array.isArray(options.allowedTypes) && options.allowedTypes.length)  ? options.allowedTypes : [
        "Image",
        "Video",
        "Audio",
        "Document",
    ];

    this.allowedTypes = this.allowedTypes.concat(['Directory']);

    this.uploadingAssets = {};
    this.assets = {};
    this.topLevelIds = [];
    this.loading = true;
    this.root = null;
    this.library = null;
    this.assetLibraryId = options.assetLibraryId;
}

AssetDirectoryApp.prototype.run = function() {
    this.baseEl.innerHTML = ''; // remove contents
    this.update();
    var self = this;

    // loads the base items
    this.loadLibraries(function(libraries){
        if (self.assetLibraryId) {
            for (var i = 0; i < libraries.length; i ++) {
                if (libraries[i]._id === self.assetLibraryId) {
                    self.setLibrary(libraries[i]);
                    break;
                }
            }
        }
    });
    // this.loadDirectory('', function(){
    //     this.loading = false;
    // }.bind(this));
};

AssetDirectoryApp.prototype.update = function() {
    var newVnode = this.render();
    patch(this.vnode, newVnode);
    this.vnode = newVnode;
};

AssetDirectoryApp.prototype.setLibrary = function(lib) {
    this.library = lib;

    this.root = this.buildAsset({name: lib.name, assetType: 'Directory', _id: lib._id, mime: ''}, true);
    this.assets[''] = this.root;

    // this.loading = true;
    this.loadDirectory('');
    this.update();
}

AssetDirectoryApp.prototype.unsetLibrary = function() {
    this.library = null;

    this.root = null;
    this.assets[''] = null;

    this.update();
}



///////////////////////////////////////////////////////////
//                       RENDER                          //
///////////////////////////////////////////////////////////

AssetDirectoryApp.prototype.render = function() {
    var children = this.loading ? [this.renderSpinner()] :
        this.library ? [this.renderRoot()] : [this.renderLibrarySelect()];
    var topLevelChildren = [div('#directory-view', {}, children)];

    if (this.uploads) {
        topLevelChildren = this.uploads.map(function(upload){return upload.renderStatus()}).concat(topLevelChildren);
    }

    return div('#directory-container', topLevelChildren);
};

AssetDirectoryApp.prototype.renderSpinner = function() {
    return i('.fa.fa-circle-o-notch.spin');
};

AssetDirectoryApp.prototype.renderLibrarySelect = function() {
    var self = this;
    return div([
        h3({
            style: {
                fontFamily: 'Poppins, sans-serif',
                background: '#efefef',
                color: '#134471',
                marginBottom: '10px',
                marginTop: '0px',
                borderRadius: '10px',
                padding: '5px 10px',
            }
        }, ['Select an Asset Library']),
        ul('.library-select', {
            style: {
                padding: 0
            }
        }, this.libraries.map(function(lib) {
            console.log(li([lib.name]))
            return li({
                style: {
                    display: 'inline-block',
                    width: '25%',
                }
            },[a('.link', {
                on: {
                    click: function(e) {
                        self.setLibrary(lib);
                    }
                },
                style: {
                    cursor: 'pointer'
                }
            }, [i('.icon.fa.fa-folder', {style: {margin: '4px'}}), lib.name])]);
        }))
    ])
}

AssetDirectoryApp.prototype.renderRoot = function() {
    var self = this;
    var asset = this.root;

    var children = this.root.childIds.map(function(id){
        return this.renderAsset(this.assets[id]);
    }.bind(this));

    if (!asset.fullyLoaded) {
        if(asset.loading) {
            children.push(li(".loading-message", ["Loading...", this.renderSpinner()]));
        } else {
            children.push(li(".load-more", [
                a({
                    on: {click: asset.loadMore},
                    "class": {link: true}
                }, [
                    "Load More..."
                ])
            ]));
        }
    }

    if (asset.uploadingChildIds.length) {
        // console.log('CHILD UPLOADING IDS: ', JSON.stringify(asset.uploadingChildIds));
        // console.log('UPLOADING ASSETS IDS: ', Object.keys(this.uploadingAssets));
        children = asset.uploadingChildIds.map(function(id){
            return this.renderUploadingAsset(this.uploadingAssets[id]);
        }.bind(this)).concat(children);
    }

    // if (asset.uploadingChildIds.length) {
    //     children = asset.uploadingChildIds.map(function(id){
    //         return this.renderUploadingAsset(this.uploadingAssets[id]);
    //     }.bind(this)).concat(children);
    // }

    return div('.root-directory', {"class": {closed: !asset.open, open: asset.open}},[
        h3({
            style: {
                fontFamily: 'Poppins, sans-serif',
                background: '#efefef',
                color: '#134471',
                marginBottom: '10px',
                marginTop: '0px',
                borderRadius: '10px',
                padding: '5px 10px',
            }
        }, ['Select an Asset']),
        a('.link', {
            style: {
                display: 'block',
                cursor: 'pointer'
            },
            on: {
                click: function() {
                    self.unsetLibrary();
                }
            }
        }, this.assetLibraryId ? [] : [i('.icon.fa.fa-chevron-left', {
            style: {
                marginRight: '4px',
                // borderRadius: '10px',
                // width: '20px',
                // height: '20px',
                // fontSize: '20px',
                // background: '#134471',
                // color: 'white',
            }
        }), 'Go Back']),
        a({
            "class": {"highlight-directory": asset.highlight, link: true},
            props: {href: '/asset-libraries/view/'+asset.record._id},
            on: {
                click: asset.onClick,
                dragover: asset.onDragover,
                dragenter: asset.onDragenter,
                dragleave: asset.onDragleave,
                drop: asset.onDrop
            },
        }, [
            i(".icon."+(asset.open ? asset.openIcon : asset.icon)),
            span([asset.record.name])
        ]),
        ul(children)
    ]);
}

AssetDirectoryApp.prototype.renderAsset = function(asset) {
    var dateFormat = 'MMMM Do YYY, h:mm:ss a';
    var self = this;
    var highlight = asset.highlight || (self.selected === asset);
    var rowChildren = [
        a({
            "class": {"highlight-directory": highlight, link: true},
            props: {href: '/assets/view/'+asset.record._id},
            on: {
                click: asset.onClick,
                dragover: asset.onDragover,
                dragenter: asset.onDragenter,
                dragleave: asset.onDragleave,
                drop: asset.onDrop
            }
        }, [
            i(".icon."+(asset.open ? asset.openIcon : asset.icon)),
            span([asset.record.name])
        ]),
    ];

    var children = [
        div('.asset-row', rowChildren),
    ];

    if (asset.isDirectory) {
        var childDirs = asset.childIds.map(function(id){
            return this.renderAsset(this.assets[id]);
        }.bind(this));

        if (!asset.fullyLoaded) {
            if(asset.loading) {
                childDirs.push(li(".loading-message", ["Loading...", this.renderSpinner()]));
            } else {
                childDirs.push(li(".load-more", [
                    a({
                        on: {click: asset.loadMore},
                        "class": {link: true}
                    }, [
                        "Load More..."
                    ])
                ]));
            }
        }

        if (asset.uploadingChildIds.length) {
            // console.log('CHILD UPLOADING IDS: ', JSON.stringify(asset.uploadingChildIds));
            // console.log('UPLOADING ASSETS IDS: ', Object.keys(this.uploadingAssets));
            childDirs = asset.uploadingChildIds.map(function(id){
                return this.renderUploadingAsset(this.uploadingAssets[id]);
            }.bind(this)).concat(childDirs);
        }

        children.push(ul(childDirs));
    }

    return li({
        "class": {open: asset.open, closed: !asset.open},
        style: {
            display: asset.hidden ? 'none' : 'list-item',
        }
    }, children);
};

AssetDirectoryApp.prototype.renderUploadingAsset = function(asset) {
    var rowChildren = [
        span({
            "class": {"upload": true, "active": asset.uploading},
        }, [
            i(".icon.fa.fa-circle-o-notch", {"class": {spin: asset.uploading}}, []),
            span([asset.entry.name])
        ]),
    ];
    if (asset.childrenIds.length) {
        rowChildren.push(ul(asset.childrenIds.map(function(id){
            return this.renderUploadingAsset(this.uploadingAssets[id]);
        }.bind(this))));
    }
    return li({"class": {open: true}}, rowChildren);
};



///////////////////////////////////////////////////////////
//                      ACTIONS                          //
///////////////////////////////////////////////////////////

AssetDirectoryApp.prototype.loadLibraries = function(done) {
    var self = this;

    var url = '/asset-libraries/list/0';

    fetch(url, {
        headers: {
            'Accept': 'application/json'
        },
        credentials: 'same-origin',
    }).then(function(response) {
        return response.json();
    }).then(function(json){
        var data = json.data;
        var list = data.list;
        var total = data.total;

        self.libraries = list;

        if (typeof done === 'function')  {
            done(self.libraries);
        }

        console.log('JSON: ', json);
        // update view
        self.loading = false;
        self.update();

    }).catch(function(ex) {
        console.log('LOAD FAILED: ', ex);
    });


}

AssetDirectoryApp.prototype.loadDirectory = function(parentId, done) {

    var self = this;
    var parentAsset = self.assets[parentId];
    var pageNo = parentAsset.childPagesLoaded;

    if (parentAsset.loading) {
        return;
    }

    Object.assign(parentAsset, {
        loading: true,
    });

    // update the view to show the loading state
    self.update();

    var query = [
        "libraryId[eq]=", this.library._id,
        "&parentId[eq]=", parentId
    ].join('');

    var url = '/assets/list/'+(pageNo)+'?'+query
    console.log('url', url);

    fetch(url, {
        headers: {
            'Accept': 'application/json'
        },
        credentials: 'same-origin',
    })
    .then(function(response) {
        return response.json();
    }).then(function(json){
        console.log('JSON:',json);
        var data = json.data;
        var list = data.list;
        var total = data.total;

        var newDefs = {};
        var newIds = list.map(function(record) {
            // so we don't have to iterate twice
            newDefs[record._id] = self.buildAsset(record, false);
            return record._id
        });

        var updatedParent = {};
        var childrenLoaded = parentAsset.childrenLoaded + list.length;

        Object.assign(parentAsset, {
            childrenLoaded: childrenLoaded,
            loading: false,
            childIds: arrayUnique(parentAsset.childIds.concat(newIds)),
            totalChildren: total,
            childPagesLoaded: pageNo+1,
            fullyLoaded: total <= childrenLoaded,
            loaded: true
        });

        Object.assign(self.assets, newDefs);

        console.log('PARENT ASSET:', parentAsset);

        if (typeof done === 'function') {
            done();
        }


        // update view
        self.update();

    }).catch(function(ex) {
        console.log('LOAD FAILED: ', ex);
    });
};

AssetDirectoryApp.prototype.buildAsset = function(record, isRoot)
{
    var self = this;

    var isDirectory = record.assetType === "Directory";
    var icon = (function(assetType){
        switch(assetType) {
            case 'Directory':
                return 'fa fa-folder';
            case 'Image':
                return 'fa fa-file-image-o';
            case 'Video':
                return 'fa fa-file-video-o';
            case 'Audio':
                return 'fa fa-file-audio-o';
            default:
                var mimePrefix = record.mime.split('/')[0];
                switch(mimePrefix)
                {
                    case 'text':
                        return 'fa fa-file-text-o';
                    default:
                        return 'fa fa-file-o';
                }
        }
    })(record.assetType);

    var openIcon = isDirectory ? 'fa fa-folder-open' : icon;

    if (isRoot) {console.log('ROOT:', record)};

    var asset = {
        isRoot: !!isRoot,
        record: record,
        fullyLoaded: !isDirectory,
        loaded: false,
        loading: false,
        open: !!isRoot,
        childIds: [],
        uploadingChildIds: [],
        icon: icon,
        openIcon: openIcon,
        totalChildren: 0,
        childrenLoaded: 0,
        childPagesLoaded: 0,
        lastClick: 0,
        clickTimeout: null,
        isDirectory: isDirectory,
        link: isRoot ? ('/asset-libraries/view/' + record._id) : ('/assets/view/' + record._id),
        highlight: false,
        hidden: self.allowedTypes.indexOf(record.assetType) === -1
    }

    // if (isDirectory)
    // {
        asset.onClick = function(e) {
            e.preventDefault();
            if (asset.clickTimeout) {
                clearTimeout(asset.clickTimeout);
            }

            var now = Date.now();
            if (now - asset.lastClick < 200) {
                if (self.onChoose && (asset.type !== 'Directory' || self.allowDirectorySelect))
                {
                    self.onChoose(asset.record);
                }
                else
                {
                    window.location = asset.link;
                }
                return;
            } else {
                asset.lastClick = now;
                asset.clickTimout = setTimeout(function(){
                    if (isDirectory)
                    {
                        asset.open = !asset.open;
                        if(!asset.loaded)
                        {
                            self.loadDirectory(asset.record._id);
                        }
                        if (self.allowDirectorySelect)
                        {
                            self.selected = asset;
                            if (self.onSelect)
                            {
                                self.onSelect(asset.record);
                            }
                        }
                    }
                    else
                    {
                        self.selected = asset;
                        if (self.onSelect)
                        {
                            self.onSelect(asset.record);
                        }
                    }

                    self.update();
                }, 300);
            }
        }

        asset.loadMore = function(e) {
            asset.isRoot  ? self.loadDirectory('') : self.loadDirectory(asset.record._id);

        }

        if(isDirectory)
        {
            asset.onDrop = function(e) {
                e.preventDefault();
                asset.highlight = false;

                var files = e.dataTransfer.files;
                var items = e.dataTransfer.items;

                var entries = [];

                for (var i = 0, item; item = items[i]; i++) {
                    if (item.kind != 'file') {
                        continue;
                    }

                    entries.push(item.webkitGetAsEntry());
                }

                console.log('A total of: ' + entries.length + ' files are uploading.');
                console.log('Raw items: ', items);

                if (entries.length) {
                    asset.open = true;
                    self.update();
                    self.runUpload(entries, asset);
                }

            }

            asset.onDragover = function(e) {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'copy';
            }

            asset.onDragenter = function(e) {
                asset.highlight = true;
                self.update();
            }

            asset.onDragleave = function(e) {
                asset.highlight = false;
                self.update();
            }
        }


    // }

    return asset;
}

AssetDirectoryApp.prototype.runUpload = function(entries, asset) {
    var self = this;

    var upload = new UploadManager(entries, this.library._id, asset.isRoot ? null : asset.record._id, this.update.bind(this));

    this.uploads.unshift(upload);

    upload.on('assetprepped', function(data) {
        // console.log('PREPPED: ', data);
        if (data.item.parentId === asset.record._id)
        {
            asset.uploadingChildIds.push(data.item.id);
        }
        self.uploadingAssets[data.item.id] = data.item;
    });

    upload.on('assetqueued', function(data) {
        // console.log('QUEUED: ', data);
    });

    upload.on('assetrunning', function(data) {
        // console.log('RUNNING: ', data);
    });

    upload.on('assetdone', function(data) {
        // console.log('DONE: ', data);
        if (!data.item.errored) {
            var newAsset = self.buildAsset(data.item.realData);
            var parentAsset = (self.assets[data.item.realData.parentId] || self.root);
            parentAsset.uploadingChildIds = parentAsset.uploadingChildIds.filter(function(id){return id !== data.item.id;});
            parentAsset.childIds.unshift(data.item.realData._id);
            self.assets[data.item.realData._id] = newAsset;
            newAsset.uploadingChildIds = data.item.childrenIds.slice();
            var icon = newAsset.icon;
            var openIcon = newAsset.openIcon;
            newAsset.icon = 'fa fa-check green';
            newAsset.openIcon = 'fa fa-check green';
            newAsset.open = true;
            newAsset.fullyLoaded = true;

            setTimeout(function(){
                newAsset.icon = icon;
                newAsset.openIcon = openIcon;
                self.update();
            }, 2000);
            // delete self.uploadingAssets[data.item.id];
        }
    });

    upload.on('done', function(data){
        // console.log('UPLOAD DONE: ', data);
        setTimeout(function(){
            self.uploads = self.uploads.filter(function(u){return u !== upload});
            self.update();
        }, 5000);
    });

    upload.run();
}

function arrayUnique(arr) {
    var res = {};
    arr.forEach(function(v){res[v] = true});
    return Object.keys(res);
}

module.exports = AssetDirectoryApp;
