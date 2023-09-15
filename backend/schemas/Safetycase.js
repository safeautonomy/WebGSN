const mongoose = require('mongoose');

const safetyCaseBoxSchema = new mongoose.Schema({
    "topic": {
        type: String
    },
    "nodeDataArray": [{
        "key": {
            type: Number
        },
        "type": {
            type: String
        },
        "description": {
            type: String
        },
        "comments": {
            type: String
        },
        "parent": {
            type: Number
        },
        "fullfill": {
            type: Boolean,
            default:false
        },
        "linkDirection": {
            type: String,
            // default:"bottom"
        },
        "pic": {
            type: String
        }
    }]
});

module.exports = mongoose.model("SafetyCase", safetyCaseBoxSchema);
