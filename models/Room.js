const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
    roomName: {
        type: String
    },
    gameSave: {
        type: String
    },
    status: {
        type: String
    },
    winnerSuit: {
        type: String
    },
})

module.exports = mongoose.model('rooms', roomSchema)