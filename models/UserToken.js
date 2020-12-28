const mongoose = require('mongoose');

const userTokenSchema = new mongoose.Schema({
    playerName: {
        type: String
    },
    opponentName: {
        type: String
    },
    playerSuit: {
        type: String
    },
    roomID: {
        type: String
    },
    roomName: {
        type: String
    },
})

module.exports = mongoose.model('userTokens', userTokenSchema)