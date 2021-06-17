pragma solidity ^0.8.0;

import '../utils/CloneFactory.sol';
import '../interface/ICampaign.sol';

contract DAO is CloneFactory {

    mapping(address => uint8) public isOwner;
    mapping(address => mapping(uint256 => uint8)) public haveVotedForAProposal;
    uint32 public totalOwners;
    address public mastercopy;

    struct Proposal{
        string proposalName;
        bytes hash;
        address manager;
        uint256 maximumTarget;
        uint256 minimumTarget;
        uint24 duration;
        uint8 isDeployed;
    }
    Proposal[] public proposals;
    mapping(address => uint256) public campaignManagers;
    mapping(uint256 => uint32) public campaignVotes;

    event NewOwnerAdded(address inviter, address newOwner);
    event NewProposalCreated(address manager, uint256 proposalId);
    event VoteCasted(address voter, uint256 proposalId, uint256 totalVotes);
    event CampaignDeployed(address campaign, uint256 proposalId, address manager);
    event MasterCopyUpdated(address sender, address newMasterCopy);

    constructor () {
        isOwner[msg.sender] = 1;
        totalOwners++;
        emit NewOwnerAdded(address(0), msg.sender);
    }

    modifier onlyOwner() {
        require( isOwner[msg.sender] == 1 , "DAO: onlyOnwer function");
        _;
    }

    modifier isInitialized() {
        require(mastercopy != address(0), "DAO: mastercopy not initialized");
        _;
    }

    function setMasterCopy(address _mastercopy) public onlyOwner {
        require(_mastercopy != address(0), "DAO: Mastercopy cannot be zero address");
        mastercopy = _mastercopy;
        emit MasterCopyUpdated(msg.sender, mastercopy);
    }

    function addNewOwner(address _newOwner) public onlyOwner {
        require(isOwner[_newOwner] == 0, "DAO: already an owner");
        isOwner[_newOwner] = 1;
        totalOwners++;
        emit NewOwnerAdded(msg.sender, _newOwner);
    }

    function addProposal(
        string memory _proposalName, 
        bytes memory _hash,
        uint256 _maximumTarget,
        uint256 _minimumTarget,
        uint24 _duration
        ) public isInitialized {
        campaignManagers[msg.sender] = proposals.length;
        proposals.push(Proposal(
            _proposalName, 
            _hash, 
            msg.sender, 
            _maximumTarget, 
            _minimumTarget, 
            _duration, 
            0));
        emit NewProposalCreated(msg.sender, (proposals.length-1));
    }

    function checkIsClone(address _target, address _query) public view returns(bool result){
        return isClone(_target, _query);
    }

    function vote(uint256 _proposalId) public onlyOwner{
        require(
            (proposals.length) > _proposalId,
            "DAO: proposal does not exists"
        );
        require(
            proposals[_proposalId].isDeployed == 0, 
            "DAO: Proposal already executed"
            );
        require( 
            haveVotedForAProposal[msg.sender][_proposalId] == 0, 
            "DAO: already casted vote for this proposal"
            );
        haveVotedForAProposal[msg.sender][_proposalId] = 1;
        campaignVotes[_proposalId]++;
        emit VoteCasted(msg.sender, _proposalId, campaignVotes[_proposalId]);
        if( campaignVotes[_proposalId] > (totalOwners/2) ){
            proposals[_proposalId].isDeployed = 1;
            address campaign = createClone(mastercopy);
            ICampaign(campaign).initialize(
                proposals[_proposalId].proposalName,
                proposals[_proposalId].manager,
                proposals[_proposalId].duration,
                proposals[_proposalId].maximumTarget,
                proposals[_proposalId].minimumTarget,
                proposals[_proposalId].hash
            );
            emit CampaignDeployed(address(campaign), _proposalId, proposals[_proposalId].manager);
        }
    }

    function getProposals() public view returns(Proposal[] memory){
        return proposals;
    }

}