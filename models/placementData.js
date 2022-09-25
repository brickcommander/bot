const mongoose = require('mongoose')
const Schema = mongoose.Schema

const placement = new Schema ({
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
    branch: {
        type: String,
        required: true
    },
    placed: {
        type: Object,
        required: true
    },
    // companyName: {
    //     type: Number,
    //     required: true
    // },
    // CTC: {
    //     type: Number,
    //     required: true
    // },
    // "6M": {
    //     type: Boolean,
    //     required: true
    // },
    // "6M+FTE": {
    //     type: Boolean,
    //     required: true
    // },
    // "FTE": {
    //     type: Number,
    //     required: true
    // },
})

const placementData = mongoose.model('placementData', placement)
module.exports = placementData