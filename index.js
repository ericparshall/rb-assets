module.exports = {
    path: __dirname,
    name: "Assets",
    namespace: "assets",
    env: {
        RB_ASSET_LIBRARY_OWNER_MODEL: "users",
        RB_ASSETS_OWNER_MODEL: "users",
        RB_ASSETS_OWNER_LABEL: "View Owner",
        RB_ASSETS_METADATA: {},
    },
    compileEnv: function(config)
    {
        // cooerce to an array
        if (typeof config.RB_ASSETS_OWNER_MODEL === "string")
        {
            config.RB_ASSETS_OWNER_MODEL = config.RB_ASSETS_OWNER_MODEL.split(',');
        }
    }
}
