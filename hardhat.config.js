require("@nomicfoundation/hardhat-toolbox")
require("@nomiclabs/hardhat-waffle")
require("@nomiclabs/hardhat-etherscan")
require("hardhat-deploy")
require("solidity-coverage")
require("hardhat-gas-reporter")
require("hardhat-contract-sizer")
require("dotenv").config()

const RINKEBY_RPC_URL = process.env.RINKEBY_RPC_URL
const AVAXFUJI_RPC_URL = process.env.AVAX_FUJI_RPC_URL
const GEORLI_RPC_URL = process.env.GEORLI_RPC_URL
const AVAX_PRIVATE_KEY = process.env.AVAX_PRIVATE_KEY
const PRIVATE_KEY = process.env.PRIVATE_KEY
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY
const COINMARKCAP_API_KEY = process.env.COINMARKETCAP_API_KEY
const MAINNET_RPC_URL = process.env.ETH_MAINNET_RPC_URL

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    defaultNetwork: "hardhat",
    networks: {
        hardhat: {
            chainId: 31337,
            blockConfirmations: 1,
            forking: {
                url: MAINNET_RPC_URL,
            },
        },
        localhost: {
            chainId: 31337,
        },
        AVAX_testnet: {
            url: AVAXFUJI_RPC_URL,
            chainId: 43113,
            accounts: [AVAX_PRIVATE_KEY],
            blockConfirmations: 6,
        },
        rinkeby: {
            url: RINKEBY_RPC_URL,
            accounts: [PRIVATE_KEY],
            chainId: 4,
            //if we want to wait for certain amount of blocks add
            blockConfirmations: 6,
        },
        goerli: {
            url: GEORLI_RPC_URL,
            chainId: 5,
            accounts: [AVAX_PRIVATE_KEY],
            blockConfirmations: 6,
        },
    },
    solidity: {
        compilers: [
            {
                version: "0.8.9",
            },
            {
                version: "0.6.12",
            },
            {
                version: "0.6.6",
            },
            {
                version: "0.4.19",
            },
        ],
    },
    etherscan: {
        apiKey: ETHERSCAN_API_KEY,
    },
    namedAccounts: {
        deployer: {
            default: 0,
            1: 0,
        },
        player: {
            default: 1,
        },
    },
    //harhat gas reporter
    //to just have it print in console just add enabled
    //if youd like to output it to a file add outputFile
    // if you want it to be in usd we need to get a coinmarketcap api key
    gasReporter: {
        enabled: true,
        outputFile: "gas-report.txt",
        noColors: true,
        currency: "USD",
        coinmarketcap: COINMARKCAP_API_KEY,
        //change block chain to see gas prices
        token: "ETH",
    },

    //how to time out promises
    mocha: {
        timeout: 300000, //200 seconds max
    },
}
