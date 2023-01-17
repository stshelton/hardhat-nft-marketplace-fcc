//SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

error NftMarketPlace__PriceMustBeAboutZero();
error NftMarketPlace__NotApprovedForMarketplace();
error NftMarketPlace__AlreadyListed(address nftMarketPlace, uint256 tokenId);
error NftMarketPlace__NotOwner();
error NftMarketPlace__NotListed(address nftAddress, uint256 tokenId);
error NftMarketPlace__PriceNotMet(address nftAddress, uint256 tokenId, uint256 price);
error NftMarketPlace__NoProceeds();
error NftMarketPlace__TransferFailed();

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract NftMarketPlace is ReentrancyGuard {
    struct Listing {
        uint256 price;
        address seller;
    }

    //event
    event ItemListed(
        address indexed seller,
        address indexed nftAddress,
        uint256 indexed tokenId,
        uint256 price
    );

    event ItemBought(
        address indexed buyer,
        address indexed nftAddress,
        uint256 indexed tokenId,
        uint256 price
    );

    event itemCanceled(address indexed seller, address indexed nftAddress, uint256 indexed tokenId);

    //NFT Contractaddress -> NFT TokenID -> Listing
    mapping(address => mapping(uint256 => Listing)) private s_listings;
    //Seller address -> Amount Earned
    mapping(address => uint256) private s_proceeds;
    /////////////////////
    // Modifiers ////

    //checks to see if nft has already been listed
    modifier notListed(
        address nftAddress,
        uint256 tokenId,
        address owner //challenge: have this contract accpet payment in a subset of tokens as well // Hint: Use Chainlink price feeds to convert the price of the tokens between each other
    ) {
        Listing memory listing = s_listings[nftAddress][tokenId];
        if (listing.price > 0) {
            revert NftMarketPlace__AlreadyListed(nftAddress, tokenId);
        }
        _;
    }

    modifier isListed(address nftAddress, uint256 tokenId) {
        Listing memory listing = s_listings[nftAddress][tokenId];
        if (listing.price <= 0) {
            revert NftMarketPlace__NotListed(nftAddress, tokenId);
        }
        _;
    }

    //checks to see if only the owner of that token id can list it
    modifier isOwner(
        address nftAddress,
        uint256 tokenId,
        address spender
    ) {
        IERC721 nft = IERC721(nftAddress);
        address owner = nft.ownerOf(tokenId);
        if (spender != owner) {
            revert NftMarketPlace__NotOwner();
        }
        _;
    }

    //Main Functions
    //making it external cz we only want external sources calling this function
    /*
    @notice Method for listing your nft on marketplace
    @param nftAddress: Address for the NFT
    @param tokenId: The Token Id of the nft
    @param price: sale price of the listed nft
    @dev Technically, we could have the contract be the escrow for the nfts
    but the way people can still hold their nfts when listed.
    */
    function listItem(
        address nftAddress,
        uint256 tokenId,
        uint256 price
    ) external notListed(nftAddress, tokenId, msg.sender) isOwner(nftAddress, tokenId, msg.sender) {
        if (price <= 0) {
            revert NftMarketPlace__PriceMustBeAboutZero();
        }
        //we can go about this two ways
        // 1. Send the NFT to the contract. Transfer -> Contract "hold" the NFT.abi
        // - problem with this is its expensive gas wise
        // - and techniqually the marketplace owns the nft not the user

        // 2. Owners can still hold there NFT, and five the market place approval to seel the nft for them

        // lets see if contract was approved to move nft
        IERC721 nft = IERC721(nftAddress);
        if (nft.getApproved(tokenId) != address(this)) {
            revert NftMarketPlace__NotApprovedForMarketplace();
        }

        //we have to list all the nfts should i put it in an array? or mapping?
        //mapping would be better cz it connects the nft with the owner
        s_listings[nftAddress][tokenId] = Listing(price, msg.sender);
        emit ItemListed(msg.sender, nftAddress, tokenId, price);
    }

    function buyItem(
        address nftAddress,
        uint256 tokenId
    ) external payable isListed(nftAddress, tokenId) nonReentrant {
        Listing memory listedItem = s_listings[nftAddress][tokenId];
        //checking to see if price was meet for nft trying to buy
        if (msg.value < listedItem.price) {
            revert NftMarketPlace__PriceNotMet(nftAddress, tokenId, listedItem.price);
        }

        //lets keep track of the amount of earnings people have made
        s_proceeds[listedItem.seller] = s_proceeds[listedItem.seller] + msg.value;
        //now lets delete the listening
        delete (s_listings[nftAddress][tokenId]);
        //sneding the money to the user ❌
        // have them withdraw the money ✅
        IERC721(nftAddress).safeTransferFrom(listedItem.seller, msg.sender, tokenId);
        //check to make ssure the nft was transfered
        emit ItemBought(msg.sender, nftAddress, tokenId, listedItem.price);
    }

    function cancelListing(
        address nftAddress,
        uint256 tokenId
    ) external isOwner(nftAddress, tokenId, msg.sender) isListed(nftAddress, tokenId) {
        delete (s_listings[nftAddress][tokenId]);
        emit itemCanceled(msg.sender, nftAddress, tokenId);
    }

    function updateListing(
        address nftAddress,
        uint256 tokenId,
        uint256 newPrice
    ) external isListed(nftAddress, tokenId) isOwner(nftAddress, tokenId, msg.sender) {
        s_listings[nftAddress][tokenId].price = newPrice;
        emit ItemListed(msg.sender, nftAddress, tokenId, newPrice);
    }

    function withdrawProceeds() external {
        uint256 proceeds = s_proceeds[msg.sender];
        if (proceeds <= 0) {
            revert NftMarketPlace__NoProceeds();
        }

        s_proceeds[msg.sender] = 0;
        (bool success, ) = payable(msg.sender).call{value: proceeds}("");
        if (!success) {
            revert NftMarketPlace__TransferFailed();
        }
    }

    ///Getter functions

    function getListing(
        address nftAddress,
        uint256 tokenId
    ) external view returns (Listing memory) {
        return s_listings[nftAddress][tokenId];
    }

    function getProceeds(address seller) external view returns (uint256) {
        return s_proceeds[seller];
    }
}
