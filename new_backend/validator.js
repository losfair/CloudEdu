const util = require("util");

function validateDeviceId(d) {
    if(
        !d
     || !util.isString(d)
    ) {
        return false;
    }
    for(let i = 0; i < d.length; i++) {
        if(
            !(d[i] >= 'a' && d[i] <= 'z')
         && !(d[i] >= '0' && d[i] <= '9')) {
            return false;
        }
    }
    return true;
}

module.exports.validateDeviceId = validateDeviceId;
