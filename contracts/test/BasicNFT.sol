// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract BasicNFT is ERC721 {
    string public constant TOKEN_URI =
        "ipfs://QmdhWyNDvcBkJ7bR1iDsCv9kQ8TCW7Brf3dgzmBmNiQS21?filename=ZombieHorde.json";

    uint256 private s_tokenCounter;

    constructor() ERC721("Zombie Horde", "ZH") {
        s_tokenCounter = 0;
    }

    function mintNFT() public returns (uint256) {
        _safeMint(msg.sender, s_tokenCounter);
        s_tokenCounter += 1;
        return s_tokenCounter;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        return TOKEN_URI;
    }

    function getTokenCounter() public view returns (uint256) {
        return s_tokenCounter;
    }
}
