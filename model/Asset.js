const mime = require('mime');
const Debug = require_robinbase('Debug').prefix("model:Asset");
const Schema = require_robinbase('Schema');

/**
 * Model Asset
 */
const Asset = function Asset(data)
{
    const self = this;
    const config = require_robinbase('config');

    Asset.schema.initializeInstance(self, data);

    if (self._id && self.ownerModelKey && self.ownerId && config.adminModels[self.ownerModelKey])
    {
        self.ownerLink = `/${config.adminModels[self.ownerModelKey].view.route}/view/${self.ownerId}`
    }
    if (self._id && self.assetType === "Directory")
    {
        self.childAssetsLink = `/assets/list/0?parentId[eq]=${self._id}`;
    }
    else if (self._id)
    {
        self.downloadLink = self.locationHost + self.locationPath;
    }
}

Asset.collection = 'assets';
Asset.saveTrash = true;
Asset.storageName = 'default';


//////////////////////////////////////////////////////
///                   SCHEMA                       ///
//////////////////////////////////////////////////////

const ASSET_TYPES = [
    ["Directory", "Directory"],
    ["Image", "Image"],
    ["Video", "Video"],
    ["Audio", "Audio"],
    ["Document", "Document"],
];

const MIME_TYPES = Object.keys(require('mime/types.json')).map(type => [type, type]);

Asset.schema = new Schema('_id', {
    _id: Schema.id,
    name: Schema.string.minLength(1),
    libraryId: Schema.id,
    parentId: Schema.id.nullable().default(null),
    assetType: Schema.options(ASSET_TYPES),
    locationPath: Schema.string,
    locationHost: Schema.string,
    mime: Schema.options([["",""]].concat(MIME_TYPES)),  // todo: validate mime string
    originalName: Schema.string,
    libraryPath: Schema.string,
    createdTime: Schema.datetime,
    modifiedTime: Schema.datetime,
});


//////////////////////////////////////////////////////
///                  INDEXES                       ///
//////////////////////////////////////////////////////

Asset.indexes = [
    {
        fields: {'$**': 'text'},
        options: {
            name:'assetsSearchIndex',
            weights: {
                name: 10,
                location: 5,
                mime: 1
            },
            background: true
        }
    },
    {
        fields: {ownerId: 1, ownerModelKey: 1},
        options: {name: 'assetsOwnerIndex', background: true}
    }
];


//////////////////////////////////////////////////////
///                   JOINS                        ///
//////////////////////////////////////////////////////

Asset.joins = {
    parent: {
        collection: "assets",
        localKey:"parentId",
        foreignKey:"_id",
        projection: {'_id':1, name:1}
    },
    library: {
        collection: "assetLibraries",
        localKey: 'libraryId',
        foreignKey: '_id',
        projection: {'_id':1, name: 1},
    }
}


//////////////////////////////////////////////////////
///                    VIEW                        ///
//////////////////////////////////////////////////////

function getAssetIcon(instance)
{
    switch(instance.assetType)
    {
        case 'Directory':
            return 'fa fa-folder';
        case 'Image':
            return 'fa fa-file-image-o';
        case 'Video':
            return 'fa fa-file-video-o';
        case 'Audio':
            return 'fa fa-file-audio-o';
        default:
            var mimePrefix = instance.mime.split('/')[0];
            switch(mimePrefix)
            {
                case 'text':
                    return 'fa fa-file-text-o';
                default:
                    return 'fa fa-file-o';
            }
    }
}

function getAssetOpenIcon(instance)
{
    switch(instance.assetType)
    {
        case 'Directory':
            return 'fa fa-folder-open';
        default:
            return null;
    }
}

function canHaveSubItems(instance)
{
    return instance.assetType === 'Directory';
}

Asset.view =
{
    name: 'Assets',
    route: 'assets',
    icon: '\uf15b',
    search: true,
    hideCreateMenu: true,
    defaultSort: ['name', 'asc'],
    _attributes: function(instance, context, authorization) {
        const app = require_robinbase('app');
        const config = require_robinbase('config');
        const allModels = config.allModels;
        const ownerModelKeyOptions = config.RB_ASSETS_OWNER_MODEL.map((modelKey) => {
            if (!allModels[modelKey] || !allModels[modelKey].view || !allModels[modelKey].view.name)
            {
                return null;
            }

            return [modelKey, allModels[modelKey].view.name];
        }).filter(v => !!v);

        let ownerIdRoute = null;
        let parentQueryLink = `/${Asset.view.route}/select?vk=_id&dk=name&assetType[eq]=Directory`;
        if (instance && instance._id)
        {
            parentQueryLink += `&_id[ne]=${instance._id}`
        }
        if (instance && instance.ownerModelKey)
        {
            ownerIdRoute = `/${allModels[instance.ownerModelKey].view.route}/select?vk=_id`;
        }
        else if (config.RB_ASSETS_OWNER_MODEL.length === 1)
        {
            ownerIdRoute = `/${allModels[config.RB_ASSETS_OWNER_MODEL[0]].view.route}/select?vk=_id`
            // is this bad?
            if (instance)
            {
                instance.ownerModelKey = config.RB_ASSETS_OWNER_MODEL[0];
            }
        }

        return {
            name: {type: 'text', label: 'File Name'},
            parentId: {type: 'relationship', label: 'Parent Directory', values: [['','']], omitContexts:['table'], queryLink: parentQueryLink},
            parent: {
                type:'inline',
                join:'parent',
                label:'Parent Directory',
                value:`<a href="/${Asset.view.route}/view/%s" class="formA">%s</a>`,
                valueMap:['0._id', '0.name'],
                omitContexts:['create'],
                defaultValue: ''
            },
            assetType: {type: 'text', values: ASSET_TYPES, label: 'Asset Type', immutable: true, omitContexts: ['create'], immutable: true},
            ownerLink: {type: 'link', label: config.RB_ASSETS_OWNER_LABEL, omitContexts: ['create']},
            childAssetsLink: {type: 'link', label: "View Child Assets", omitContexts: ['create']},
            downloadLink: {type: 'link', label: "Download", omitContexts: ['create']},
            ownerModelKey: {type: 'hidden', label: 'Owner Model Type', immutable: true, omitContexts: ['table']},
            ownerId: {type: 'relationship', label: config.RB_ASSETS_OWNER_LABEL, queryLink: ownerIdRoute, omitContexts: ['table']},
            locationPath: {type: 'file:image', label: 'File', immutable: true, baseUrl: instance ? instance.locationHost : config.uploaders.default.getBaseUrl()},
            mime: {type: 'text', values: [["",""]].concat(MIME_TYPES), label: 'Mime Type', omitContexts: ['create'], immutable: true},
            library: {
                type:'inline',
                join:'library',
                label:'Library',
                value:`<a href="/${app.modelRoute('locations')}/view/%s" class="formA">%s</a>`,
                valueMap:['0._id', '0.name'],
                omitContexts:['create'],
                defaultValue: ''
            },
            libraryPath: {
                label: 'Library Path',
                type: 'text',
                immutable: true,
                omitContexts: ['create'],
            },
        }
    },
    formLayouts: {
        create: [
            ["-Information"],
            ["name", "parentId"],
            ["ownerModelKey", "ownerId"],
            ["-File"],
            ["locationPath"]
        ],
        edit: [
            ["-Information"],
            ["name", "parent"],
            ["assetType", "mime"],
            ["-File"],
            ["locationPath"],
            ["-Links"],
            ["ownerLink", "childAssetsLink", "downloadLink", null],
            ["-Library Info"],
            ["library", "libraryPath"],
        ]
    }
}

Asset.uploads = [
    {
        name: 'locationPath',
        maxCount: 1,
        hostProperty: 'locationHost',
        mimeProperty: 'mime',
        originalNameProperty: 'originalName',
        metadata: require_robinbase('config').RB_ASSETS_METADATA,
    }
]

Debug.log('ASSET UPLOADS METADATA:', Asset.uploads[0].metadata);


//////////////////////////////////////////////////////
///                   HOOKS                        ///
//////////////////////////////////////////////////////

Asset.prototype.beforeSave = function(callback)
{
    const self = this;

    if (!self.name && self.originalName)
    {
        self.name = self.originalName;
    }

    if (self.mime)
    {
        const type = self.mime.split('/')[0];
        switch(type)
        {
            case 'image':
                self.assetType = 'Image';
                break;
            case 'audio':
                self.assetType = 'Audio';
                break;
            case 'video':
                self.assetType = 'Video';
                break;
            default:
                self.assetType = 'Document';
                break;
        }
    }
    else
    {
        // is this right??
        self.assetType = 'Directory';
    }

    self.resolveLibraryPath((err, path) => {
        if (err) {
            callback(err);
        } else {
            self.libraryPath = path;
            callback(null);
        }
    })
}

Asset.prototype.afterUpdate = function(callback)
{
    const self = this;

    const changedValues = self.getChangedValues();

    if ((changedValues.name || changedValues.libraryPath) && self.assetType === 'Directory') {
        // update children paths
        self.updateChildrenLibraryPaths(callback)
    } else {
        callback(null);
    }
}

Asset.prototype.afterDelete = function(callback)
{
    const self = this;

    // RECURSIVELY DELETE ALL CHLD ASSETS

    Asset.crud.deleteMany({parentId: self._id}, callback);
}

Asset.prototype.updateChildrenLibraryPaths = function(callback)
{
    const self = this;

    Asset.crud.get({parentId: self._id}, (err, childAssets) => {
        if (err) {
            return callback(err);
        }

        childAssets.forEach((child) => {
            child.updateParentLibraryPath(self.libraryPath, () => {});
        });

        callback(null);
    });
}

Asset.prototype.updateParentLibraryPath = function(parentPath, callback)
{
    const self = this;

    self.libraryPath = `${parentPath}/${self.name}`;

    // recursive update handled in after update hook
    Asset.crud.update({_id: self._id}, self, callback);
}

Asset.prototype.resolveLibraryPath = function(callback)
{
    const self = this;

    const changedValues = self.getChangedValues();

    if (self.libraryPath && !changedValues.parentId && !changedValues.name) {
        return callback(null, self.libraryPath);
    }

    if (self.parentId == null) {
        return callback(null, self.name);
    }

    Asset.crud.getOne(self.parentId, (err, parent) => {
        if (err) {
            return callback(err);
        } else if (!parent) {
            Debug.warn('Asset with id ', self.parentId, ' does not exist')
            return callback(new Error('Could not load parent asset'));
        }

        parent.resolveLibraryPath((err, parentPath) => {
            if (err) {
                return callback(err);
            }

            callback(null, `${parentPath}/${self.name}`);
        });
    });
}

module.exports = Asset;
