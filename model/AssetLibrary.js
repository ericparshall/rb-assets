const Debug = require_robinbase('/helpers/Debug.js').prefix("model:AssetLibrary");
const Schema = require_robinbase('/helpers/Schema.js');

/**
 * Model AssetLibrary
 */
const AssetLibrary = function AssetLibrary(data)
{
    const self = this;

    AssetLibrary.schema.initializeInstance(self, data);

    if (self._id)
    {
        self.manageLink = `/${AssetLibrary.view.route}/directory/${self._id}`;
    }
}

AssetLibrary.collection = 'assetLibraries';
AssetLibrary.saveTrash = true;
AssetLibrary.storageName = 'default';


//////////////////////////////////////////////////////
///                   SCHEMA                       ///
//////////////////////////////////////////////////////

AssetLibrary.schema = new Schema('_id', {
    _id: Schema.id,
    name: Schema.string.minLength(1),
    ownerId: Schema.id.nullable().default(null),
    groupId: Schema.id.nullable().default(null),
    publicRead: Schema.boolean.default(false),
    publicWrite: Schema.boolean.default(false),
    groupRead: Schema.boolean.default(true),
    groupWrite: Schema.boolean.default(true),
    ownerRead: Schema.boolean.default(true),
    ownerWrite: Schema.boolean.default(true),
    categoryIdentifier: Schema.string,
    createdTime: Schema.datetime,
    modifiedTime: Schema.datetime,
});


//////////////////////////////////////////////////////
///                  INDEXES                       ///
//////////////////////////////////////////////////////

AssetLibrary.indexes = [
    {
        fields: {'$**': 'text'},
        options: {
            name:'assetLibrariesSearchIndex',
            weights: {
                // adjust weights here
            }
        }
    },
    {
        fields: {ownerId: 1},
        options: {name: 'assetLibrariesOwnerIndex', background: true},
    },
    {
        fields: {groupId: 1},
        options: {name: 'assetLibrariesGroupIndex', background: true},
    },
    {
        fields: {categoryIdentifier: 1},
        options: {name: 'assetLibrariesCategoryIdentifierIndex', background: true},
    }
]


//////////////////////////////////////////////////////
///                   JOINS                        ///
//////////////////////////////////////////////////////

AssetLibrary.joins = {
    // add join definitions here
}


//////////////////////////////////////////////////////
///                    VIEW                        ///
//////////////////////////////////////////////////////

AssetLibrary.view =
{
    name: 'Asset Libraries',
    route: 'asset-libraries',
    icon: '\uf02d',
    search: true,
    _attributes: function(instance, context, authorization) {
        return {
            // add view attributes here
            name: {type: 'text', label: 'Library Name'},
            manageLink: {type: 'link', label: 'Manage Assets'},
            categoryIdentifier: {type: 'text', label: 'Library Category Identifier'},
        }
    }
}




//////////////////////////////////////////////////////
///                   HOOKS                        ///
//////////////////////////////////////////////////////

const defaultHook = function(callback)
{
    console.log('ARGUMENTS: ', arguments);
    const self = this;
    callback(null, self);
}

AssetLibrary.prototype.beforeCreate = defaultHook;
AssetLibrary.prototype.afterCreate = defaultHook;
AssetLibrary.prototype.beforeUpdate = defaultHook;
AssetLibrary.prototype.afterUpdate = defaultHook;
AssetLibrary.prototype.beforeDelete = defaultHook;
AssetLibrary.prototype.afterDelete = defaultHook;


module.exports = AssetLibrary;
