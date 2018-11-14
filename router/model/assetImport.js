const express = require('express');
const Lets = require_robinbase('base:Lets');
const Debug = require_robinbase('Debug').prefix('router:assetImport');

module.exports = function(Model, route, out, buildProcess)
{
    const AssetLibrary = require_robinbase('assets:model:AssetLibrary');

    if (Model !== AssetLibrary)
    {
        return null;
    }

    const router = express.Router();

    router.get(`/${route}/directory/:id`, (req, res) => {
        const authorization = res.locals.authorization;

        if (authorization && authorization.isAccessDenied('view'))
        {
            return res.showError('Access Denied', 403);
        }

        const _id = Model.schema.prepareId(req.params.id);

        const processData = buildProcess(req, res);
        processData.dataSource = {};
        processData.assetLibraryId = req.params.id;
        console.log('ID!!!!', _id);
        const template = 'templates.admin.assets.library';

        out(res, template, processData);
    });

    return router;
}

module.exports.allowedActions = function(context, authorization, Model, modelRoute)
{
    const AssetLibrary = require_robinbase('assets:model:AssetLibrary');

    if (Model !== AssetLibrary)
    {
        return [];
    }

    return [];
}
