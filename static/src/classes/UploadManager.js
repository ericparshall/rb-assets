var randomId = require('../utils/random-id');
var h = require('snabbdom/h').default; // helper function for creating vnodes
var hh = require('hyperscript-helpers')(h);

var div = hh.div,
    p = hh.p,
    i = hh.i,
    ul = hh.ul,
    li = hh.li,
    a = hh.a,
    span = hh.span
    ;


var MAX_SIMULTANEOUS_UPLOADS = 8;

function UploadManager(baseEntries, libraryId, parentId, updateView)
{
    this.baseEntries = baseEntries;
    this.parentId = parentId;
    this.libraryId = libraryId;
    this.done = false;
    this.eventListeners = {
        assetprepped: [],
        assetqueued: [],
        assetrunning: [],
        assetdone: [],
        done: [],
    }
    this.updateView = updateView;
    this.queue = [];
    this.enqueuedItems = 0;
    this.initiatedItems = 0;
    this.completedItems = 0;
    this.totalItems = 0;
    this.running = 0;
    this.maxSimultaneousUploads = MAX_SIMULTANEOUS_UPLOADS;

    this.onBeforeUnload = function(e) {
        var message = 'There is an upload in progress, are you sure you want to leave before it is done?  Doing so may result in only a portion of your items being successfully uploaded.';
        e.returnValue = message;
        return message;
    }.bind(this);
}

UploadManager.prototype.run = function()
{
    var self = this;

    window.addEventListener('beforeunload', self.onBeforeUnload);

    var entries = self.baseEntries;
    var finished = 0;
    var topLevelItems = [];

    entries.forEach(function(item, i) {
        self.buildUploadTree(item, i, function(topLevelItem){
            finished++;
            topLevelItems.push(topLevelItem);

            if (finished === entries.length)
            {
                topLevelItems.forEach(function(item) {
                    item.parentId = self.parentId;
                    self.enqueueItem(item);
                });

                self.runQueue();
            }
        }, self.parentId);
    });
}

UploadManager.prototype.buildUploadTree = function buildUploadTree(entry, index, done, parentId)
{
    if (entry.isFile && UploadManager.IGNORED_FILE_NAMES[entry.name])
    {
        return done(null);
    }

    var self = this;
    self.totalItems++;
    var id = randomId();

    if (entry.isDirectory)
    {
        var directoryReader = entry.createReader();

        var childItems = [];

        function readItems() {
            directoryReader.readEntries(function(items) {
                console.log('READ ENTRy ITEMS: ', items);
                var finished = 0;

                if (items.length === 0)
                {
                    var item = {
                        entry: entry,
                        children: childItems,
                        childrenIds: childItems.map(function(item){return item.id}),
                        id: id,
                        index: index,
                        parentId: parentId || null,
                    }

                    console.log('children: ', childItems.length);

                    self.emit('assetprepped', {item: item});
                    done(item);
                }
                else
                {
                    items.forEach(function(item, i) {
                        self.buildUploadTree(item, i, function(childItem){
                            finished++;

                            if (childItem) {
                                childItems.push(childItem);
                            }

                            if (finished === items.length)
                            {
                                readItems();
                            }
                        });
                    });
                }


            });
        }
        readItems();


    }
    else
    {
        var item = {
            entry: entry,
            children: [],
            childrenIds: [],
            id: id,
            index: index,
            parentId: parentId || null,
        }

        self.emit('assetprepped', {item: item});
        done(item);
    }
}

UploadManager.prototype.enqueueItem = function(item)
{
    var self = this;
    self.queue.push(item);

    self.enqueuedItems++;

    self.emit('assetqueued', {item: item});
    self.updateView();
}

UploadManager.prototype.runQueue = function()
{
    var self = this;

    for (var i = 0; i < Math.min(self.maxSimultaneousUploads, self.queue.length); i++) {
        self.uploadItem(self.queue[i], null);
        self.running++;
        self.queue[i].uploading = true;
    }

    self.updateView();
}

UploadManager.prototype.cycleQueue = function(completedItem)
{
    var self = this;

    self.completedItems++;
    self.running--;

    self.emit('assetdone', {item: completedItem});

    self.queue = self.queue.filter(function(item){
        return item.id !== completedItem.id;
    });

    for (var i = 0; i < self.queue.length; i++) {
        if (!self.queue[i].uploading) {
            self.uploadItem(self.queue[i]);
            self.running++;
            if (self.running >= self.maxSimultaneousUploads) {
                break;
            }
        }
    }

    if (self.queue.length === 0) {
        window.removeEventListener('beforeunload', self.onBeforeUnload);

        self.done = true;
        self.emit('done', {});
    }

    self.updateView();
}

UploadManager.prototype.uploadItem = function(itemInfo) {
    var self = this;
    var entry = itemInfo.entry;
    self.initiatedItems++;

    itemInfo.uploading = true;

    self.emit('assetrunning', {item: itemInfo});

    if (entry.isDirectory) {
        self.uploadDirectory(itemInfo);
    } else {
        self.uploadFile(itemInfo);
    }
}

UploadManager.prototype.uploadDirectory = function uploadDirectory(itemInfo)
{
    var self = this;

    var parentId = itemInfo.parentId;

    var data = new FormData();
    data.append('parentId', parentId);
    data.append('name', itemInfo.entry.name);
    data.append('libraryId', self.libraryId);
    var link = '/assets/create';

    $.ajax({
        url: link,
        dataType: 'json',
        type: 'POST',
        data: data,
        cache: false,
        contentType: false,
        processData: false,
        success: function(result) {
            var itemId = result.data.result._id;
            itemInfo.realData = result.data.result;

            itemInfo.children.forEach(function(child) {
                child.parentId = itemId;
                self.enqueueItem(child);
            });

            self.cycleQueue(itemInfo);
        },
        error: function(result) {
            console.error('error: ', result);

            itemInfo.errored = true;

            self.cycleQueue(itemInfo);
        }
    });
}

UploadManager.prototype.uploadFile = function uploadFile(itemInfo)
{
    var self = this;

    var parentId = itemInfo.parentId;

    itemInfo.entry.file(function(fileObj)
    {
        var link = '/assets/create';
        var data = new FormData();
        data.append('parentId', parentId);
        data.append('name', itemInfo.entry.name);
        data.append('locationPath', fileObj);
        data.append('libraryId', self.libraryId);

        $.ajax({
            url: link,
            dataType: 'json',
            type: 'POST',
            data: data,
            cache: false,
            contentType: false,
            processData: false,
            success: function(result) {
                var itemId = result.data.result._id;
                itemInfo.realData = result.data.result;
                self.cycleQueue(itemInfo);
            },
            error: function(result) {
                console.error('error: ', result);
                itemInfo.errored = true;

                self.cycleQueue(itemInfo);
            }
        });
    });
}

UploadManager.prototype.renderStatus = function()
{
    var enqueuedPercent = 0;
    var initiatedPercent = 0;
    var completedPercent = 0;
    var self = this;
    if (self.totalItems > 0) {
        enqueuedPercent = (self.enqueuedItems / self.totalItems) * 100;
        initiatedPercent = (self.initiatedItems / self.totalItems) * 100;
        completedPercent = (self.completedItems / self.totalItems) * 100;
    }

    return div('.well', {
        style: {padding: '0', opacity: '0', maxHeight: '0', boxSizing: 'border-box', overflow: 'hidden', transition: 'opacity 400ms, max-height 400ms, padding 400ms', delayed: {maxHeight: '100px', 'padding': '15px', opacity: '1'}, remove: {maxHeight: '0', padding: '0', opacity: '0'}}
    }, [
        div('.statusBar', [
            div('.statusBarMeter.enqueuedStatusBarMeter', {style: {width: enqueuedPercent +'%'}}),
            div('.statusBarMeter.initiatedStatusBarMeter', {style: {width: initiatedPercent +'%'}}),
            div('.statusBarMeter.completedStatusBarMeter', {style: {width: completedPercent +'%'}}),
        ]),
        div('.statusTextSection', [
            span(['Ready: ', self.enqueuedItems, ' / ', self.totalItems]),
            span(['Started: ', self.initiatedItems, ' / ', self.totalItems]),
            span(['Complete: ', self.completedItems, ' / ', self.totalItems]),
        ]),
    ]);
}

UploadManager.prototype.emit = function(key, data)
{
    this.eventListeners[key].forEach(function(listener) {
        listener(data);
    });
}

UploadManager.prototype.on = function(key, data)
{
    this.eventListeners[key].push(data);
}

UploadManager.IGNORED_FILE_NAMES = {
    '.DS_Store': true
}


module.exports = UploadManager;
