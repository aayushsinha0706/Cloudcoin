const { app, initP2PServer } = require('./app')
const config = require('./utils/config')

app.listen(config.HTTP_PORT, () => {
    console.log(`Listening http on port: ${config.HTTP_PORT} `)
})

initP2PServer(config.P2P_PORT)