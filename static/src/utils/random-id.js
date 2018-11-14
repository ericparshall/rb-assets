function randomId(len)
{

    len = len || 16;

    var allowed = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

    var result = '';

    for (var i = 0; i < len; i++) {
        result += allowed[Math.floor(Math.random() * allowed.length)];
    }

    return result;
}

module.exports = randomId;