const mongoose = require('mongoose')
const Schema = mongoose.Schema

const notesSchema = new Schema ({
    SubjectName: {
        type: String,
        required: true
    },
    TopicName: {
        type: String,
        required: false
    },
    FileID: {
        type: Array,
        required: false
    }
})

const notes2 = mongoose.model('Note', notesSchema)
module.exports = notes2