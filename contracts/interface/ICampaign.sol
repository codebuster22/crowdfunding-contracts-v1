pragma solidity ^0.8.0;

interface ICampaign{
    function initialize(
        string memory _name,
        address _manager,
        uint24 _duration,
        uint256 _maximumTarget,
        uint256 _minimumTarget,
        bytes memory _hash
    ) external;
}