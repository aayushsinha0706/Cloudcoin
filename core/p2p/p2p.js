const socketIO = require('socket.io')
const { Server } = require('socket.io')
const {
    getBlockChain,
    getLatestBlock,
    isValidBlockStructure,
    replaceChain,
    addBlockToChain
} = require('../blockchain/blockchain')

// Store active socket.io connections
const sockets = []

// Message types for synchronization
const MessageType = {
    QUERY_LATEST: 0,
    QUERY_ALL: 1,
    RESPONSE_BLOCKCHAIN: 2
}

// Helper Functions
// ---------------

// Parse JSON data safely
const JSONToObject = (data) => {
    try {
        return JSON.parse(data)
    } catch (error) {
        console.error('Error parsing JSON:', error)
        return null
    }
}

// Message Creation Functions
// -------------------------

// Create message structure
const createMessage = (type, data) => {
    return {
        type,
        data
    }
}

// Ask for the latest block
const queryChainLengthMsg = () => ({
    'type': MessageType.QUERY_LATEST,
    'data': null
})

// Request the full blockchain
const queryAllMsg = () => ({
    'type': MessageType.QUERY_ALL,
    'data': null
})

// Send the entire blockchain
const responseChainMsg = () => ({
    'type': MessageType.RESPONSE_BLOCKCHAIN,
    'data': JSON.stringify(getBlockChain())
})

// Send only the latest block
const responseLatestMsg = () => ({
    'type': MessageType.RESPONSE_BLOCKCHAIN,
    'data': JSON.stringify([getLatestBlock()])
})

// Communication Functions
// ----------------------

// Send a message to a specific socket
const write = (socket, message) => {
    socket.emit('message', message)
}

// Send a message to all connected peers
const broadcast = (message) => {
    sockets.forEach((socket) => write(socket, message))
}

// Broadcast latest block to all peers
const broadcastLatest = () => {
    broadcast(responseLatestMsg())
}

// Blockchain Handling
// ------------------

// Process and validate received blockchain data
const handleBlockchainResponse = (receivedBlocks) => {
    if (receivedBlocks.length === 0) {
        return
    }
    
    const latestBlockReceived = receivedBlocks[receivedBlocks.length - 1]
    if (!isValidBlockStructure(latestBlockReceived)) {
        console.log('Received block has invalid structure')
        return
    }

    const latestBlockHeld = getLatestBlock()
    if (latestBlockReceived.index > latestBlockHeld.index) {
        console.log(`Blockchain possibly behind. Received block index: ${latestBlockReceived.index} held block index: ${latestBlockHeld.index}`)
            
        if (latestBlockHeld.hash === latestBlockReceived.previousHash) {
            console.log('Appending received block to our chain')
            addBlockToChain(latestBlockReceived) // Append block if valid
            broadcast(responseLatestMsg()) // Propagate update
        } else if (receivedBlocks.length === 1) {
            console.log('Cannot append block, requesting full blockchain')
            broadcast(queryAllMsg()) // Request full chain if out of sync
        } else {
            console.log('Received blockchain is longer than current blockchain')
            replaceChain(receivedBlocks) // Replace chain if longer and valid
        }
    } else {
        console.log('Received blockchain is not longer than current blockchain. No action needed.')
    }
}

// Connection Handling
// ------------------

// Initialize message handling for a socket
const initMessageHandler = (socket) => {
    // Used socket.io's event listener for 'message' events
    socket.on('message', (data) => {
        const message = JSONToObject(data)
        if (message === null) {
            console.log('could not parse received JSON message: ' + data)
            return
        }
        console.log('Received message: ' + JSON.stringify(message))

        switch (message.type) {
            case MessageType.QUERY_LATEST:
                // Respond with latest block
                socket.emit('message', responseLatestMsg())
                break
            case MessageType.QUERY_ALL:
                // Respond with full blockchain
                socket.emit('message', responseChainMsg())
                break
            case MessageType.RESPONSE_BLOCKCHAIN:
                // Process received blockchain data
                const receivedBlocks = JSONToObject(message.data)
                if (receivedBlocks === null) {
                    console.log('invalid blocks received')
                    break
                }
                handleBlockchainResponse(receivedBlocks) // Validate and process received blocks
                break
        }
    })
}

// Handle socket errors and disconnections
const initErrorHandler = (socket) => {
    const closeConnection = (mySocket) => {
        console.log('connection failed to peer: ' + mySocket.id)
        const index = sockets.indexOf(mySocket)
        if (index !== -1) {
            sockets.splice(index, 1) // Remove dead connection
        }
    }
    
    socket.on('disconnect', () => {
        console.log('Peer disconnected: ' + socket.id)
        closeConnection(socket)
    })
    
    socket.on('error', (error) => {
        console.log('Socket error: ', error)
        closeConnection(socket)
    })
}

// Set up a new connection
const initConnection = (socket) => {
    sockets.push(socket) // Add socket to active connections
    initMessageHandler(socket) // Set up message handling
    initErrorHandler(socket) // Set up error handling
    socket.emit('message', queryChainLengthMsg()) // Ask peer for latest block
    console.log('New peer connected')
}

// Server and Client Setup
// ----------------------

// Initialize P2P server
const initP2PServer = (p2pPort) => {
    const server = require('http').createServer()
    const io = new Server(server)
    
    io.on('connection', socket => {
        initConnection(socket)
    })
    
    server.listen(p2pPort, () => {
        console.log('listening socket.io p2p port on: ' + p2pPort)
    })
    
    return io
}

// Connect to a new peer
const connectToPeers = (newPeer) => {
    try {
        const io = require('socket.io-client')
        const socket = io(newPeer, {
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            timeout: 10000
        })
        
        socket.on('connect', () => {
            console.log('Connected to peer: ' + newPeer)
            initConnection(socket)
        })
        
        socket.on('connect_error', error => {
            console.log('Connection failed to peer: ' + newPeer, error.message)
        })
    } catch (error) {
        console.log('Error connecting to peer: ' + newPeer, error.message)
    }
}

// Get all active sockets
const getSockets = () => {
    return sockets
}

// Export public functions
module.exports = {
    connectToPeers,
    broadcastLatest, 
    initP2PServer,
    getSockets
}