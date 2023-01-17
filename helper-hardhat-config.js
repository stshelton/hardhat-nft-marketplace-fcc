const { ethers } = require("hardhat")

const networkConfig = {
    4: {
        name: "rinkeby",
        vrfCoordinatorV2: "0x6168499c0cFfCaCD319c818142124B7A15E857ab",
        entranceFee: ethers.utils.parseEther("0.01"),
        gasLane: "0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc",
        subscriptionId: "19682",
        callbackGasLimit: "500000", //500,000
        interval: "30", //30 seconds
    },
    31337: {
        name: "hardhat",
        entranceFee: ethers.utils.parseEther("0.01"),
        gasLane: "0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc", //this doesnt matter cz we are mocking it so u can do whatever here
        //dont need address cz we using a mock for local
        subscriptionId: "0",
        callbackGasLimit: "500000",
        interval: "30",
    },
    43113: {
        name: "AVAX_testnet",
        vrfCoordinatorV2: "0x2eD832Ba664535e5886b75D64C46EB9a228C2610",
        entranceFee: ethers.utils.parseEther("0.01"),
        gasLane: "0x354d2f95da55398f44b7cff77da56283d9c6c829a4bdf1bbcaf2ad6a4d081f61",
        subscriptionId: "371",
        callbackGasLimit: "500000",
        interval: "30",
    },
    5: {
        name: "goerli",
        linkToken: "0x326c977e6efc84e512bb9c30f76e30c160ed06fb",
        callbackGasLimit: "500000",
        fundAmount: "0",
    },
}

const developmentChains = ["hardhat", "localhost"]

const frontEndContractsFile = "../nexjs-nft-marketplace-moralis-fcc/constants/networkMapping.json"
const frontEndContractsFile2 =
    "../nextjs-nft-marketplace-thegraph-fcc/constants/networkMapping.json"
const frontEndAbiLocation = "../nexjs-nft-marketplace-moralis-fcc/constants/"
const frontEndAbiLocation2 = "../nextjs-nft-marketplace-thegraph-fcc/constants/"

//nexjs-nft-marketplace-moralis-fcc
module.exports = {
    networkConfig,
    developmentChains,
    frontEndAbiLocation,
    frontEndAbiLocation2,
    frontEndContractsFile,
    frontEndContractsFile2,
}
