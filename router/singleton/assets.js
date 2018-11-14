const express = require('express');
const path = require('path');

module.exports = function(out, processData)
{
    const router = express.Router();

    const staticDir = path.resolve(__dirname, '../../static/admin');

    router.use('/static/assets', express.static(staticDir));

    return router;
}
