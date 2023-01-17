const { run } = require("hardhat")

//only verify when working with live network, hard hat defaults to local network
const verify = async function verify(contractAddress, args) {
    console.log("Verifying contract ...")
    //one common issue with verifing contract is etherscan could have already verified it before which will cause an error and whole script to end
    //best way to fix that is by adding try catch so we can check if message is about being verified
    //if so then we can continue script if not then stop script show error
    try {
        await run("verify:verify", {
            address: contractAddress,
            constructorArguments: args,
        })
    } catch (e) {
        if (e.message.toLowerCase().includes("already verified")) {
            console.log("Already Verified!")
        } else {
            console.log(e)
        }
    }
    //run (first parameter is the subtask of our verify task, second parameter is the object with actual parameters)
}

module.exports = {
    verify,
}
