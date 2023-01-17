const { assert, expect } = require("chai")
const { deployments, ethers, getNamedAccounts, network } = require("hardhat")
const { developmentChains } = require("../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("NftMarketPlace", async function () {
          let deployer
          let nftMarketPlace
          let playerConenctedMarketPlace
          let basicNFT
          let player

          const PRICE = ethers.utils.parseEther("0.1")
          const UPDATEDPRICE = ethers.utils.parseEther("0.2")
          const TOKEN_ID = 0

          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer
              //player = (await getNamedAccounts()).player

              const accounts = await ethers.getSigners()
              player = accounts[1]

              await deployments.fixture(["all"])
              nftMarketPlace = await ethers.getContract("NftMarketPlace", deployer)
              playerConenctedMarketPlace = nftMarketPlace.connect(player)
              basicNFT = await ethers.getContract("BasicNFT", player)

              await basicNFT.mintNFT()
          })
          describe("listing non approved nft", async function () {
              it("listItem But nft not approved", async function () {
                  await expect(
                      playerConenctedMarketPlace.listItem(basicNFT.address, TOKEN_ID, PRICE)
                  ).to.be.revertedWithCustomError(
                      nftMarketPlace,
                      "NftMarketPlace__NotApprovedForMarketplace"
                  )
              })
          })

          describe("listing and modifing approved nft", async function () {
              beforeEach(async function () {
                  await basicNFT.approve(nftMarketPlace.address, TOKEN_ID)
              })

              it("player submits nft and deployer buys nft", async function () {
                  await new Promise(async function (resolve, reject) {
                      nftMarketPlace.once("ItemBought", async (buyer, nftAddress) => {
                          console.log("item Bought")
                          try {
                              const newOwner = await basicNFT.ownerOf(TOKEN_ID)
                              const playerProceeds = await nftMarketPlace.getProceeds(
                                  player.address
                              )
                              assert(buyer == deployer)
                              assert(nftAddress == basicNFT.address)
                              assert(newOwner.toString() == deployer)
                              assert(playerProceeds.toString() == PRICE.toString())
                          } catch (e) {
                              reject(e)
                          }
                          resolve()
                      })

                      await playerConenctedMarketPlace.listItem(basicNFT.address, TOKEN_ID, PRICE)
                      await nftMarketPlace.buyItem(basicNFT.address, TOKEN_ID, { value: PRICE })
                      const newOwner = await basicNFT.ownerOf(TOKEN_ID)
                      const playerProceeds = await nftMarketPlace.getProceeds(player.address)
                      assert(newOwner.toString() == deployer)
                      assert(playerProceeds.toString() == PRICE.toString())
                  })
              })

              it("player submits and updates nft", async function () {
                  await playerConenctedMarketPlace.listItem(basicNFT.address, TOKEN_ID, PRICE)

                  await new Promise(async function (resolve, reject) {
                      nftMarketPlace.once(
                          "ItemListed",
                          async (owner, nftAddressm, tokenId, newPrice) => {
                              console.log("nft updated")
                              try {
                                  const listing = await playerConenctedMarketPlace.getListing(
                                      basicNFT.address,
                                      TOKEN_ID
                                  )
                                  assert(listing.price.toString() == UPDATEDPRICE.toString())
                                  assert(UPDATEDPRICE.toString() == newPrice.toString())
                              } catch (e) {
                                  reject(e)
                              }
                              resolve()
                          }
                      )
                      await playerConenctedMarketPlace.updateListing(
                          basicNFT.address,
                          TOKEN_ID,
                          UPDATEDPRICE
                      )
                      const listing = await playerConenctedMarketPlace.getListing(
                          basicNFT.address,
                          TOKEN_ID
                      )
                      assert(listing.price.toString() == UPDATEDPRICE.toString())
                  })
              })

              it("player submits nft then cancel Listing", async function () {
                  await new Promise(async function (resolve, reject) {
                      nftMarketPlace.once("itemCanceled", async (buyer, nftAddress) => {
                          console.log("item canceled")
                          try {
                              const listing = await nftMarketPlace.getListing(
                                  basicNFT.address,
                                  TOKEN_ID
                              )
                              assert(listing.price.toString() == "0")
                          } catch (e) {
                              reject(e)
                          }
                          resolve()
                      })

                      await playerConenctedMarketPlace.listItem(basicNFT.address, TOKEN_ID, PRICE)
                      await playerConenctedMarketPlace.cancelListing(basicNFT.address, TOKEN_ID)
                  })
              })

              it("reverts if anyone but the owner tries to cancel listing", async function () {
                  await playerConenctedMarketPlace.listItem(basicNFT.address, TOKEN_ID, PRICE)
                  await expect(
                      nftMarketPlace.cancelListing(basicNFT.address, TOKEN_ID)
                  ).to.be.revertedWithCustomError(nftMarketPlace, "NftMarketPlace__NotOwner")
              })

              it("tries to buy without meeting price of nft", async function () {
                  await playerConenctedMarketPlace.listItem(basicNFT.address, TOKEN_ID, PRICE)
                  await expect(
                      nftMarketPlace.buyItem(basicNFT.address, TOKEN_ID, {
                          value: ethers.utils.parseEther("0.01"),
                      })
                  ).to.be.revertedWithCustomError(nftMarketPlace, "NftMarketPlace__PriceNotMet")
              })

              it("list item with price at 0 or under", async function () {
                  await expect(
                      playerConenctedMarketPlace.listItem(
                          basicNFT.address,
                          TOKEN_ID,
                          ethers.utils.parseEther("0.0")
                      )
                  ).to.be.revertedWithCustomError(
                      nftMarketPlace,
                      "NftMarketPlace__PriceMustBeAboutZero"
                  )
              })

              it("try to buy item thats not listed", async function () {
                  await expect(
                      nftMarketPlace.buyItem(basicNFT.address, TOKEN_ID, { value: PRICE })
                  ).to.be.revertedWithCustomError(nftMarketPlace, "NftMarketPlace__NotListed")
              })

              it("try to listed a nft that is already listed", async function () {
                  await playerConenctedMarketPlace.listItem(basicNFT.address, TOKEN_ID, PRICE)
                  await expect(
                      playerConenctedMarketPlace.listItem(basicNFT.address, TOKEN_ID, PRICE)
                  ).to.be.revertedWithCustomError(nftMarketPlace, "NftMarketPlace__AlreadyListed")
              })
          })

          describe("checking isOwner modifer", async function () {
              beforeEach(async function () {
                  await basicNFT.approve(nftMarketPlace.address, TOKEN_ID)
              })
              it("lists nft user doesnt own nft", async function () {
                  await expect(
                      nftMarketPlace.listItem(basicNFT.address, TOKEN_ID, PRICE)
                  ).to.be.revertedWithCustomError(nftMarketPlace, "NftMarketPlace__NotOwner")
              })
              it("update item user doesnt own item", async function () {
                  await playerConenctedMarketPlace.listItem(basicNFT.address, TOKEN_ID, PRICE)
                  await expect(
                      nftMarketPlace.updateListing(basicNFT.address, TOKEN_ID, PRICE)
                  ).to.be.revertedWithCustomError(nftMarketPlace, "NftMarketPlace__NotOwner")
              })
              it("cancel listing that user doesnt own", async function () {
                  await playerConenctedMarketPlace.listItem(basicNFT.address, TOKEN_ID, PRICE)
                  await expect(
                      nftMarketPlace.cancelListing(basicNFT.address, TOKEN_ID)
                  ).to.be.revertedWithCustomError(nftMarketPlace, "NftMarketPlace__NotOwner")
              })
          })

          describe("withdrawProceeds", async function () {
              beforeEach(async function () {
                  await basicNFT.approve(nftMarketPlace.address, TOKEN_ID)
                  await playerConenctedMarketPlace.listItem(basicNFT.address, TOKEN_ID, PRICE)
                  await nftMarketPlace.buyItem(basicNFT.address, TOKEN_ID, { value: PRICE })
              })

              it("tying to withdraw proceeds user doesnt have", async function () {
                  await expect(nftMarketPlace.withdrawProceeds()).to.be.revertedWithCustomError(
                      nftMarketPlace,
                      "NftMarketPlace__NoProceeds"
                  )
              })

              it("correct user withdraws proceeds user made for selling nft", async function () {
                  const playersProceedsBeforeWithDraw =
                      await playerConenctedMarketPlace.getProceeds(player.address)
                  const playerBalanceBeforeWithDraw = await player.getBalance()
                  console.log(playerBalanceBeforeWithDraw)

                  //we need to get response so we can get gas fees
                  const txResponse = await playerConenctedMarketPlace.withdrawProceeds()
                  const transactionReceipt = await txResponse.wait(1)
                  const { gasUsed, effectiveGasPrice } = transactionReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)

                  const playerBalance = await player.getBalance()
                  console.log(playerBalance)
                  assert(
                      playerBalance.add(gasCost).toString() ==
                          playersProceedsBeforeWithDraw.add(playerBalanceBeforeWithDraw).toString()
                  )
              })
          })
      })
