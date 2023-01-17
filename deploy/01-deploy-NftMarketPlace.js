const { verify } = require("../utlis/verify")
const { network } = require("hardhat")
const { developmentChains } = require("../helper-hardhat-config")

module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()

    console.log("-------------------------------")

    const args = []
    const nftMarketPlace = await deploy("NftMarketPlace", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmation: network.config.blockConfirmations || 1,
    })

    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        log("Verifying ....")
        await verify(nftMarketPlace.address, args)
    }

    console.log(`deployed contract at address ${nftMarketPlace.address}`)

    console.log("----------")
}

module.exports.tags = ["all", "main"]
