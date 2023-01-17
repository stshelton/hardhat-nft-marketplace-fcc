# HardHat NFT Market Place

1) Create a decentralized NFT marketpace
    - `listItem`: List NFTs on the marketplace
    - `buyItem`: Buy the NFTs
    - `cancelItem`: Cancel a listing
    - `updateListing`: Update Price
    - `withdrawProceeds`: Withdraw payment for m bought nfts

## How should we list nfts on the marketplace


There are two ways we can go about lisitng the nft

 1. Send the NFT to the contract. Transfer -> Contract "hold" the NFT.abi
- problem with this is its expensive gas wise 
- and techniqually the marketplace owns the nft not the user

2. Owners can still hold there NFT, and five the market place approval to seel the nft for them
- in this case people will stil hold there nft

to allow users to still hold there nft the smart contract can call `getApproved` from `IERC721` interface

We are gonna go with approach 2


 We need to make sure that we dont add the same listing to our mapping to do this we will create a modifier that checks to see if listing has been added

 ```
    modifier notListed(
        address nftAddress,
        uint256 tokenId,
        address owner
    ) {
        Listing memory listing = s_listings[nftAddress][tokenId];
        if (listing.price > 0) {
            revert NftMarketPlace__AlreadyListed(nftAddress, tokenId);
        }
        _;
    }
 ```

 we also need to make sure that the person listing item is the owner of the item


```
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
```




## Emiting events

 
 An event is an inheritable member of the contract, which stores the arguments passed in the transaction logs when emitted. Generally, events are used to inform the calling application about the current state of the contract, with the help of the logging facility of EVM. Events notify the applications about the change made to the contracts and applications which can be used to execute the dependent logic.

 `indexped` - The indexed parameters for logged events will allow you to search for these events using the indexed parameters as filters.


## Pull over push

https://fravoll.github.io/solidity-patterns/pull_over_push.html

### `Intenet`
Shift the risk associated with transferring either to the user

### `Motivation`
Sending ether to an address can fail.
- receiever could be a contract which has a fallback function implemented that simply throws an exception once called
- Simply running out of gas

This could happen in cases where alot fo external calls have to be made within one single function call.

### `Applicability`
Use the pull over push pattern when
 - you want to handle multiple either transfers with one function call
 - you want to avoid taking the risk assocated with ether transfers
 - there is an incentive for you users to handle ether withdrawal on their own

 ### `Particapants`
 1) the entity responsible for the initation of the transfer (e.g. the owner of a contract or the contract itself)
 2) the smart contract has responsiblity of keeping track of all balances
 3) the participant is the receiver , who will not simply receive his funds via a transaction but has to actively request a withdrawal, in order to isolate the process from other payout and contract logic.

 ### `Implementation`

 A core component of this implementation is a mapping, which keeps track of the outstanding balances of the users. Instead of performing an actual ether transfer from the contract to a recipient, a function is called, which adds an entry to the mapping, stating that the user is eligible to withdraw the specified amount.

 ### `Downsides`
 - using pull instead of push payments requires the users to send one additional transaction, namely the one requesting the withdrawa
 - his does not only lead to higher gas requirements and therefore higher transaction costs, but also harms the user experience as a whole.

 ## Reenterance Attacks
 example: https://solidity-by-example.org/hacks/re-entrancy/


As you noticed we been coding most of these contracts with all the state chages first before actaully sending or transfering the tokens/nft or ect.


In this contract there is a huge vulnerablity with chaning the balance after msg.sender.call
```
contract EtherStore {
    mapping(address => uint) public balances;

    function deposit() public payable {
        balances[msg.sender] += msg.value;
    }

    function withdraw() public {
        uint bal = balances[msg.sender];
        require(bal > 0);

        (bool sent, ) = msg.sender.call{value: bal}("");
        require(sent, "Failed to send Ether");

        balances[msg.sender] = 0;
        //two big attacks
        //reentry attack or oracle attack
    }

    // Helper function to check the balance of this contract
    function getBalance() public view returns (uint) {
        return address(this).balance;
    }
}
```

With the attack contract the works like so
1) u deploy contract with address to vulnerable contract
2) u send money to atttack function which then deposits money into vulnerable contract and immediately withdraws funds
3) now attack contract just withdrawed funds and we have a fallback method implmented to then check the vulnerable contract to see if balance exists within contract if so call withdraw again
4) the original contract has yet updated balance before withdraw was called again by fallback of attack contract. So original contract thinks it can still withdraw more eth, this happens until contract has a value of 0
```
contract Attack {
    EtherStore public etherStore;

    constructor(address _etherStoreAddress) {
        etherStore = EtherStore(_etherStoreAddress);
    }

    // Fallback is called when EtherStore sends Ether to this contract.
    fallback() external payable {
        //if theres money left in the contract 
        if (address(etherStore).balance >= 1 ether) {
            etherStore.withdraw();
        }
    }

    function attack() external payable {
        require(msg.value >= 1 ether);
        etherStore.deposit{value: 1 ether}();
        etherStore.withdraw();
    }

    // Helper function to check the balance of this contract
    function getBalance() public view returns (uint) {
        return address(this).balance;
    }
}
```

## So how do we fix this?

### **There are 2 Ways**

1) easy way 
    - move the balances[msg.sender] = 0 to before the call
```
    function withdraw() public {
        uint bal = balances[msg.sender];
        require(bal > 0);

        //MOVED IT HERE NOW REQUIRED WONT LET U THRU CZ BALANCE IS ZERO
        balances[msg.sender] = 0;

        (bool sent, ) = msg.sender.call{value: bal}("");
        require(sent, "Failed to send Ether");
    }

```

2) mutex
    - use a locked boolen to lock function which wont unlock till its complete
```
    bool locked;
    function withdraw() public {
        required(!locked, "revert");
        locked = true;
        uint bal = balances[msg.sender];
        require(bal > 0);

        (bool sent, ) = msg.sender.call{value: bal}("");
        require(sent, "Failed to send Ether");

        balances[msg.sender] = 0;
        locked = false
    }

```

**NOTE** openzeppelin has a reenter gaurd that can be used within our code that is basically the mutex way

can be found here: [reentrancyGuard](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/security/ReentrancyGuard.sol)