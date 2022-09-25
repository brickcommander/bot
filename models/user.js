const { Int32 } = require('mongodb')
const mongoose = require('mongoose')
const Schema = mongoose.Schema

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
    "Web Search and Mining": {
        type: Number,
        required: true
    },
    "TCP/IP": {
        type: Number,
        required: true
    },
    // "Cloud Computing": {
    //     type: Number,
    //     required: true
    // },
    "Ethical Hacking": {
        type: Number,
        required: true
    },
    "Mobile Computing": {
        type: Number,
        required: true
    },
    "Network Security": {
        type: Number,
        required: true
    },
    "Distributed Computing": {
        type: Number,
        required: true
    },
})

const User = mongoose.model('User', userSchema)
module.exports = User