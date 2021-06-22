pragma solidity ^0.8.0;

import "openzeppelin-solidity/contracts/token/ERC721/ERC721.sol";

contract NobelCertificate is ERC721{
    uint256 public tokenIds;

    address public controller;

    mapping( uint256 => uint256 ) public contributions;

    constructor (
        string memory _name,
        string memory _symbol
    ) ERC721(_name, _symbol) {
        controller = msg.sender;
    }

    modifier onlyController() {
        require(msg.sender == controller, "NobelCertificate: onlyController function");
        _;
    }

    function generateCertificate(address _to, uint256 _contributions) public onlyController {
        tokenIds++;
        contributions[tokenIds] = _contributions;
        _mint(_to, tokenIds);
    }
}