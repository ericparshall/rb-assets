(function()
{
    var WidgetRegistry = require('../helpers/processor/WidgetRegistry.js');
    var WidgetHelper = require('../helpers/processor/WidgetHelper.js');
    var Utils = require('../helpers/processor/Utils.js');

    var DisplayAsset = function DisplayAsset(args, processData)
    {
        var self = WidgetHelper.init(this, 'DisplayAsset');

        self.name = args.name || 'Display Asset Sub Template';

        self._id = args._id || Math.random().toString(36).slice(2);
        WidgetHelper.addWidgetMethods(self);
    }

    WidgetRegistry.register(DisplayAsset, function(args, processData, parentScope)
    {
        var obj = new DisplayAsset(args, processData);

        //just return the value for this attribute...

        parentScope.callback(null, '');
    });

    //no need to export as we this is being pushed to the widget registry.


}).call(this);