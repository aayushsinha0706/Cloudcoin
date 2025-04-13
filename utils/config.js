require('dotenv').config()

const GENESIS_BLOCK_HASH = process.env.GENESIS_BLOCK_HASH
const GENESIS_BLOCK_TIMESTAMP = process.env.GENESIS_BLOCK_TIMESTAMP
const GENESIS_BLOCK_DATA = process.env.GENESIS_BLOCK_DATA

const HTTP_PORT = process.env.HTTP_PORT
const P2P_PORT = process.env.P2P_PORT

module.exports = {
    GENESIS_BLOCK_DATA,
    GENESIS_BLOCK_HASH,
    GENESIS_BLOCK_TIMESTAMP,
    HTTP_PORT,
    P2P_PORT
}