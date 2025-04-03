const crypto = require('crypto')
require('dotenv').config()

class Block {
    constructor(index, hash, previousHash, timestamp, data){
        this.index = index
        this.hash = hash
        this.previousHash = previousHash
        this.timestamp = timestamp
        this.data = data
    }
}

const genesisBlock = new Block(
    0, process.env.GENESIS_BLOCK_HASH, '', Number(process.env.GENESIS_BLOCK_TIMESTAMP), process.env.GENESIS_BLOCK_DATA
)

let blockChain = [genesisBlock]

const getBlockChain = () => {
    return blockChain
}

const getLatestBlock = () => {
    return blockChain[blockChain.length - 1]
}

const calculateHashForBlock = (block) => {
    return calculateHash(block.index, block.previousHash, block.timestamp, block.data)
}


const calculateHash = (index, previousHash, timeStamp, data) => {
    const hash = crypto.createHash('sha256')
    hash.update(index.toString() + previousHash + timeStamp.toString() + data)
    return hash.digest('hex')
}


const generateNextBlock = (blockData) => {
    const previousBlock = getLatestBlock()
    const nextIndex = previousBlock.index + 1
    const nextTimeStamp = new Date().getTime() / 1000
    const nextHash = calculateHash(nextIndex, previousBlock.hash, nextTimeStamp, blockData)
    const newBlock = new Block(nextIndex, nextHash, previousBlock.hash, nextTimeStamp, blockData)
    return newBlock
}

const isValidNewBlock = (newBlock, previousBlock) => {
    if (previousBlock.index + 1 !== newBlock.index) {
        console.log('invalid index')
        return false
    } else if (previousBlock.hash !== newBlock.previousHash) {
        console.log('invalid previous hash')
        return false
    } else if ( calculateHashForBlock(newBlock) !== newBlock.hash) {
        console.log( typeof (newBlock.hash) + ' ' + typeof calculateHashForBlock(newBlock))
        console.log('invalid hash: ' +  calculateHashForBlock(newBlock) + ' ' + newBlock.hash)
        return false
    }
    return true
    
}

const isValidBlockStructure = (block) => {
    return typeof block.index === 'number'
    && typeof block.hash ==='string'
    && typeof block.previousHash ==='string' 
    && typeof block.timestamp === 'number'
    && typeof block.data ==='string'
}

const isValidChain = (blockchainToValidate) => {
    const isValidGenesis = (block) => {
        return block.index === 0 &&
        block.hash === process.env.GENESIS_BLOCK_HASH &&
        block.previousHash === ''
    }

    if ( !isValidGenesis(blockchainToValidate[0]) ) {
        return false
    }

    for (let i = 1; i < blockchainToValidate.length; i++ ){
        if( !isValidNewBlock(blockchainToValidate[i],blockchainToValidate[i-1])){
            return false
        }
    }
    return true
}

const replaceChain = (newBlocks) => {
    if (isValidChain(newBlocks) && newBlocks.length > getBlockChain().length) {
        console.log('Received blockchain is valid. Replacing current blockchain with received blockchain')
        blockChain = newBlocks
        broadcastLatest()
    } else {
        console.log('Received blockchain invalid')
    }
}

module.exports = {
    Block,
    getBlockChain,
    getLatestBlock,
    generateNextBlock,
    isValidNewBlock,
    isValidBlockStructure,
    isValidChain,
    replaceChain
}