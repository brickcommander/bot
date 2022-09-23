const { Int32 } = require('mongodb');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema ({
    id: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: false
    },
    sch: {
        type: String,
        required: true
    },
    sec: {
        type: String,
        required: true
    },
    // attendance_0: {
    //     type: Int32,
    //     required: true
    // }
    // attendance_1: {
    //     type: Int32,
    //     required: true
    // }
});

const User = mongoose.model('User', userSchema);
module.exports = User;