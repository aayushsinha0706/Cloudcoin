const nodeRouter = require('express').Router()

const { Block, generateNextBlock, getBlockChain } = require('../core/blockchain/blockchain')
const { connectToPeers, getSockets, initP2PServer } = require('../core/p2p/p2p')

nodeRouter.get('/blocks', (request, response) => {
    response.send(getBlockChain())
})

nodeRouter.post('/mineBlock', (request, response) => {
    const newBlock = generateNextBlock(request.body.data)
    response.send(newBlock)
})

nodeRouter.get('/peers', (request, response) => {
    response.send(getSockets().map((s) => s._socket.remoteAddress + ':' + s._socket.remotePort))
})

nodeRouter.post('/addPeer', (request, response) => {
    connectToPeers(request.body.peer)
    response.send()
})

module.exports = nodeRouter