import express from 'express'
import mongoose from 'mongoose'
import Messages from './dbMessages.js'
import Cors from 'cors'
import Pusher from 'pusher'

//app config
const app = express()
const port = process.env.PORT || 9003
const connection_url = 'mongodb+srv://emilygro:passwordle@cluster0.6x8eok8.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'
const pusher = new Pusher({
    appId: "1793895",
    key: "5926d1f37b3d436f5032",
    secret: "d284ea0df0ca718b7821",
    cluster: "us3",
    useTLS: true
});

// middleware
app.use(express.json())
app.use(Cors())

// db config
mongoose.connect(connection_url)

//api endpoints
const db = mongoose.connection
db.once("open", () => {
    console.log("DB Connected")
    const msgCollection = db.collection("messagingmessages")
    const changeStream = msgCollection.watch()
    changeStream.on('change', change => {
        console.log(change)
        if(change.operationType === "insert") {
            const messageDetails = change.fullDocument
            pusher.trigger("messages", "inserted", {
                name: messageDetails.name,
                message: messageDetails.message,
                timestamp: messageDetails.timestamp,
                received: messageDetails.received
            })
        } else {
            console.log('Error triggering Pusher')
        }
    })
})

app.get("/", (req, res) => res.status(200).send("Hello TheWebDev"))

app.post('/messages/new', async (req, res) => {
    try {
        const dbMessage = req.body;
        const data = await Messages.create(dbMessage);
        res.status(201).send(data);
    } catch (err) {
        res.status(500).send(err);
    }
});

app.get('/messages/sync', async (req, res) => {
    try {
        const data = await Messages.find();
        res.status(200).send(data);
    } catch (err) {
        res.status(500).send(err);
    }
});


//listener
app.listen(port, () => console.log(`Listening on localhost: ${port}`))
