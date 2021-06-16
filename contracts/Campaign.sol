pragma solidity ^0.8.0;

contract Campaign{

    // fixed by manager - constants
    address public immutable manager;
    uint256 public immutable maximumTarget;
    uint256 public immutable minimumTarget;
    uint24  public immutable duration;
    string  public name;
    bytes   public hash;

    // Logic state variables
    uint8   public isActive;
    uint8   public isClosed;
    uint8   public isMinimumReached;
    uint8   public isMaximumReached;
    uint256 public startTime;
    uint256 public totalCollected;
    uint256 public totalWithdrawn;

    mapping( address => uint256 ) public contributors;

    event CampaingStarted(uint256 startTime);
    event NewContribution(address contributor, uint256 contribution);
    event RetrievedContribution(address contributor, uint256 contribution);
    event CampaignFinalaised( uint256 totalContribution ,uint256 timestamp);
    event MaximumReached( uint256 totalContribution ,uint256 timestamp);
    event CampaignClosed( uint256 timestamp );
    event ContributionWithdrawen( address manager, uint256 amount );

    modifier onlyManager() {
        require(manager == msg.sender, "Campaign: onlyManager function");
        _;
    }

    constructor (
        string memory _name,
        address _manager,
        uint24 _duration,
        uint256 _maximumTarget,
        uint256 _minimumTarget,
        bytes memory _hash
    ) {
        name = _name;
        manager = _manager;
        maximumTarget = _maximumTarget;
        minimumTarget = _minimumTarget;
        duration = _duration;
        hash = _hash;
    }

    function contribute() public payable {
        require(
            isActive == 1,
            "Campaign: not yet started"
        );
        require( 
            totalCollected + msg.value <= maximumTarget, 
            "Campaign: contribution exceeds maximum target" 
            );
        totalCollected += msg.value;
        contributors[msg.sender] += msg.value;
        emit NewContribution(msg.sender, msg.value);
        if(totalCollected >= minimumTarget){
            isMinimumReached = 1;
            emit CampaignFinalaised(totalCollected, block.timestamp);
        }
        if(totalCollected == maximumTarget){
            isMaximumReached = 1;
            emit MaximumReached(totalCollected, block.timestamp);
            // end campaign and transfer funds to manager
        }
    }

    function retrieveContribution() public {
        require(
            isMinimumReached == 0 || block.timestamp < startTime + duration,
            "Campaign: The campaign have been finalised"
        );
        uint256 contribution = contributors[msg.sender];
        contributors[msg.sender] = 0;
        totalCollected -= contribution;
        payable(msg.sender).transfer(contribution);
        emit RetrievedContribution(msg.sender, contribution);
    }

    function startCampaign() public onlyManager {
        require(isActive == 0, "Campaign: alrerady active");
        isActive = 1;
        startTime = block.timestamp;
        emit CampaingStarted(block.timestamp);
    }

    function closeCampaign() public onlyManager {
        require(
            isMinimumReached == 0 || block.timestamp < startTime + duration,
            "Campaign: The campaign have been finalised"
        );
        isClosed = 1;
        emit CampaignClosed(block.timestamp);
    }

    function withdraw(uint256 _amount) public onlyManager {
        require(
            isMinimumReached == 1 || block.timestamp >= startTime + duration,
            "Campaign: The campaign have not been finalised"
        );
        require(
            totalCollected >= totalWithdrawn+_amount,
            "Capmaign: Cannot withdraw more than collected"
        );
        totalWithdrawn += _amount;
        payable(manager).transfer(_amount);
        emit ContributionWithdrawen(manager, _amount);
    }

}