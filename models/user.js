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
    }
});

const User = mongoose.model('User', userSchema);
module.exports = User;