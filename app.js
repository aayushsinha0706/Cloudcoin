const express = require('express')
const app = express()

const { initP2PServer } = require('./core/p2p/p2p')
const nodeRouter = require('./controllers/nodeRouter')

app.use(express.json())
app.use('/',nodeRouter)

module.exports = {
    app,
    initP2PServer
}