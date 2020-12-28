const express = require('express');
const mongoose = require('mongoose');
const chalk = require('chalk');
const cors = require('cors');
const bodyParser= require('body-parser')

const app = express();
const PORT = process.env.PORT || 5000

const Room = require('./models/Room')
const UserToken = require('./models/UserToken')


app.use(cors({ origin: true }));
app.use(bodyParser.urlencoded({ extended: true }))

async function start() {
    try {
        await mongoose.connect(
            'mongodb+srv://admin:tttmp-2020@cluster0.bxg3i.mongodb.net/tttmp?retryWrites=true&w=majority', 
            {
                useNewUrlParser: true,
                useFindAndModify: false,
                useUnifiedTopology: true
            }, 
            (err) => {
                if (!err) {
                    console.log('Successfully Established Connection with MongoDB')
                }
                else {
                    console.log('Failed to Establish Connection with MongoDB with Error: '+ err)
                }
            })
        
        app.listen(PORT, () => {
            chalk.bold.inverse.blue('Server has been started...')
        })

    } catch(e) {
        console.log(e)
    }
}

start()

app.get('', (req, res) => {
    return res.status(200)
    .send(`<div class="main" 
                style="
                  background-image: url(https://i.pinimg.com/originals/46/9e/e2/469ee2b818c5a9e57ac1f730970b4372.png);
                  width: 100%;
                  height: 100%;
                  background-repeat: no-repeat;
                  background-position: center;
                  background-size: 25%;"
            > </div>`);
});

app.put('/api/saveGame', async (req, res) => {

    const gameSave = req.body.gameSave
    const roomID = req.body.roomID
    const winnerSuit = req.body.winnerSuit
    const status = req.body.status

    if (!roomID) {
      return res.status(500).send({
        error: "Fields roomID is required."
      });
    }

    try { 
        await Room.updateOne(
            { _id: roomID },    
            { $set: {
                ...(gameSave ? {gameSave} : {}),
                ...(winnerSuit ? {winnerSuit} : {}),
                ...(status ? {status} : {}),
              } 
            },    
        ) 
        return res.status(200).send({message: 'Success'});
      } catch(error) {
        return res.status(500).send({
          error: "Something goes wrong. Please try again later."
        });
      }

})

app.post('/api/createUserToken', async (req, res) => {

    const roomName = req.body.roomName
    const playerName = req.body.playerName

    if (!roomName || !playerName) {
      return res.status(500).send({
        error: "Fields roomName and playerName are required."
      });
    }

    try {

        //First need to check the room 
        const userTokens = await UserToken.find({ roomName: roomName })
        let newItem = null

        //If all is OK then create new user in the room
        if (userTokens.length === 0) {
          //Create room and user        
          const room = new Room({
              roomName,
              gameSave: JSON.stringify(new Array(16).fill([0]).map((v,i,a)=>a)),
              status: "available"
          })

          let roomID
          await room.save()
            .then(data => {
                roomID = data._id
            })

          newItem = {
             roomName,
             roomID,
             playerName,
             playerSuit: "X",
             opponentName: "",
           }
        } else if (userTokens.length === 1) { 

            await UserToken.updateOne(
                { roomID: userTokens[0].roomID },    
                { $set: { opponentName: playerName } },    
            ) 

            await Room.updateOne(
                { _id: userTokens[0].roomID },    
                { $set: { status: "full" } },    
            ) 

            newItem = {
                roomName,
                roomID: userTokens[0]._id,
                playerName,
                playerSuit: "0",
                opponentName: userTokens[0].playerName,
              }

        } else {
            return res.status(500).send({
                error: "The room is full."
              });
        }

        if (newItem) {
            const userToken = new UserToken(newItem)
            await userToken.save()
            return res.status(200).send({ link: `https://golveronika.github.io/tttmp.github.io/?userToken=${userToken._id}` }); 
        }

    } catch (err) {
        console.error(err)
        return res.status(500).send({
          error: "Something goes wrong. Please try again later."
        });
    } 

})

app.get('/api/getRoomsByStatus/:status*?', async (req, res) => {
    try {
        const rooms = await Room.find( (req.params.status) ? { status: req.params.status } : {})
        return res.status(200).json(rooms)
    } catch(err) {
        res.status(500).json({error: err})
    }
})

app.get('/api/getRoomates/:roomName*?', async (req, res) => {
    
    if (!req.params.roomName) {
        return res.status(500).send({
          error: "RoomName was not specified."
        });
    }

    try {
        const userTokens = await UserToken.find({ roomName: req.params.roomName })
        return res.status(200).json(userTokens)
    } catch(err) {
        res.status(500).json({error: err})
    }
})

app.get('/api/getGame/:userToken*?', async (req, res) => {
    
    if (!req.params.userToken) {
        return res.status(500).send({
          error: "userToken was not specified."
        });
    }

    try {
        const userToken = await UserToken.findOne({ _id: req.params.userToken })
        const room = await Room.findOne({ _id: userToken.roomID })
        // return res.status(200).json({ ...userToken, ...room })
        return res.status(200).send({...JSON.parse(JSON.stringify(room)), ...JSON.parse(JSON.stringify(userToken))})
    } catch(err) {
        res.status(500).json({error: err})
    }
})