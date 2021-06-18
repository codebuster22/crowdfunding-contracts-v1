pragma solidity ^0.8.0;

import 'openzeppelin-solidity/contracts/token/ERC20/IERC20.sol';

contract Campaign{

    // fixed by manager - constants
    address public manager;
    uint256 public maximumTarget;
    uint256 public minimumTarget;
    uint256 public price;
    uint40  public duration;
    string  public name;
    bytes   public hash;
    address public token;

    // Logic state variables
    uint8   public isActive;
    uint8   public isClosed;
    uint8   public isMinimumReached;
    uint8   public isMaximumReached;
    uint8   public isFunded;
    uint256 public startTime;
    uint256 public totalCollected;
    uint256 public totalWithdrawn;

    mapping( address => uint256 ) public contributors;
    mapping( address => uint8 )   public haveClaimed;

    event CampaingStarted(uint256 startTime);
    event NewContribution(address contributor, uint256 contribution);
    event RetrievedContribution(address contributor, uint256 contribution);
    event CampaignFinalaised( uint256 totalContribution ,uint256 timestamp);
    event MaximumReached( uint256 totalContribution ,uint256 timestamp);
    event CampaignClosed( uint256 timestamp );
    event ContributionWithdrawen( address manager, uint256 amount );
    event TokenUpdated( address newToken );
    event TokensClaimed( address claimedBy, uint256 claimAmount );

    modifier onlyManager() {
        require(manager == msg.sender, "Campaign: onlyManager function");
        _;
    }

    modifier initializer() {
        require(
            token == address(0) || manager == address(0),
            "Campaign: contract already initialized"
        );
        _;
    }

    function initialize(
        string memory _name,
        address _manager,
        uint24 _duration,
        uint256 _maximumTarget,
        uint256 _minimumTarget,
        bytes memory _hash
    ) public initializer {
        name = _name;
        manager = _manager;
        maximumTarget = _maximumTarget;
        minimumTarget = _minimumTarget;
        duration = _duration * (1 days);
        hash = _hash;
    }

    function setToken(address _token, uint256 _price) public initializer {
        require( _token != address(0), "Campaign: token cannot be null" );
        token = _token;
        price = _price;
        emit TokenUpdated( _token );
    }

    function contribute() public payable {
        require(
            isActive == 1,
            "Campaign: not yet started"
        );
        if(
            isFunded == 0 &&
            IERC20(token).balanceOf(address(this)) >=  maximumTarget/price
            ){
            isFunded = 1;
        }
        require(
            isFunded == 1,
            "Campaign: not yet funded"
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

    function claimTokens() public {
        require(
            isMinimumReached == 1 || block.timestamp > startTime + duration,
            "Campaign: The campaign have not been finalised"
            );
        haveClaimed[msg.sender] = 1;
        IERC20(token).transfer( msg.sender, contributors[msg.sender]*price ); 
        emit TokensClaimed(msg.sender, contributors[msg.sender]*price );
    }

    function startCampaign() public onlyManager {
        require(isActive == 0, "Campaign: alrerady active");
        require(token != address(0), "Campaign: distribution token not set");
        isActive = 1;
        startTime = block.timestamp;
        emit CampaingStarted(block.timestamp);
    }

    function closeCampaign() public onlyManager {
        require(
            isMinimumReached == 0 && block.timestamp < startTime + duration,
            "Campaign: The campaign have been finalised"
        );
        isClosed = 1;
        emit CampaignClosed(block.timestamp);
    }

    function withdraw(uint256 _amount) public onlyManager {
        require(
            isMinimumReached == 1 && block.timestamp >= startTime + duration,
            "Campaign: The campaign have not been finalised"
        );
        require(
            totalCollected >= totalWithdrawn+_amount,
            "Campaign: Cannot withdraw more than collected"
        );
        totalWithdrawn += _amount;
        payable(manager).transfer(_amount);
        emit ContributionWithdrawen(manager, _amount);
    }

}