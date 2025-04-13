const { app, p2pServer } = require('./app')
const config = require('./utils/config')

app.listen(config.HTTP_PORT, () => {
    console.log(`Listening http on port: ${config.HTTP_PORT} `)
})

p2pServer()