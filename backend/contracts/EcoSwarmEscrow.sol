// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title EcoSwarmEscrow
 * @notice Milestone-based escrow for community climate project payouts on Hedera.
 *         Sponsors deposit HBAR, verifiers approve milestones, operators receive payouts.
 */
contract EcoSwarmEscrow {
    // ──────────────────────────── Types ────────────────────────────

    enum MilestoneStatus { Pending, Approved, Released, Disputed }
    enum ProjectStatus   { Active, Completed, Cancelled }

    struct Milestone {
        string  description;
        uint256 amount;          // HBAR (tinybar)
        uint256 deadlineAt;
        MilestoneStatus status;
    }

    struct Project {
        bytes32       projectId;
        address       sponsor;
        address       verifier;
        address       operator;
        uint256       totalAmount;
        uint256       depositedAmount;
        uint256       releasedAmount;
        ProjectStatus status;
        uint256       milestoneCount;
        mapping(uint256 => Milestone) milestones;
    }

    // ──────────────────────────── State ────────────────────────────

    address public owner;
    uint256 public projectCount;

    mapping(bytes32 => Project)  private projects;
    mapping(bytes32 => bool)     public  projectExists;

    // ──────────────────────────── Events ───────────────────────────

    event ProjectCreated(
        bytes32 indexed projectId,
        address indexed sponsor,
        address verifier,
        address operator,
        uint256 totalAmount,
        uint256 milestoneCount
    );

    event FundsDeposited(
        bytes32 indexed projectId,
        address indexed sponsor,
        uint256 amount,
        uint256 totalDeposited
    );

    event MilestoneApproved(
        bytes32 indexed projectId,
        uint256 indexed milestoneIndex,
        address indexed verifier
    );

    event FundsReleased(
        bytes32 indexed projectId,
        uint256 indexed milestoneIndex,
        address indexed operator,
        uint256 amount
    );

    event FundsRefunded(
        bytes32 indexed projectId,
        address indexed sponsor,
        uint256 amount
    );

    event ProjectCompleted(bytes32 indexed projectId);
    event ProjectCancelled(bytes32 indexed projectId);

    // ──────────────────────────── Modifiers ────────────────────────

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier onlySponsor(bytes32 _projectId) {
        require(msg.sender == projects[_projectId].sponsor, "Only sponsor");
        _;
    }

    modifier onlyVerifier(bytes32 _projectId) {
        require(msg.sender == projects[_projectId].verifier, "Only verifier");
        _;
    }

    modifier projectActive(bytes32 _projectId) {
        require(projectExists[_projectId], "Project does not exist");
        require(projects[_projectId].status == ProjectStatus.Active, "Project not active");
        _;
    }

    // ──────────────────────────── Constructor ──────────────────────

    constructor() {
        owner = msg.sender;
    }

    // ──────────────────────────── Core Functions ───────────────────

    /**
     * @notice Create a new sustainability project with milestone-based payouts.
     * @param _projectId       Unique identifier for the project
     * @param _verifier        Address of the assigned verifier
     * @param _operator        Address of the local operator (payout recipient)
     * @param _descriptions    Array of milestone descriptions
     * @param _amounts         Array of milestone amounts in tinybar
     */
    function createProject(
        bytes32   _projectId,
        address   _verifier,
        address   _operator,
        string[]  calldata _descriptions,
        uint256[] calldata _amounts,
        uint256[] calldata _deadlines
    ) external {
        require(!projectExists[_projectId], "Project already exists");
        require(_verifier  != address(0), "Invalid verifier");
        require(_operator  != address(0), "Invalid operator");
        require(_descriptions.length == _amounts.length, "Mismatched arrays");
        require(_descriptions.length == _deadlines.length, "Mismatched deadlines");
        require(_descriptions.length > 0 && _descriptions.length <= 10, "1-10 milestones");

        Project storage p = projects[_projectId];
        p.projectId   = _projectId;
        p.sponsor     = msg.sender;
        p.verifier    = _verifier;
        p.operator    = _operator;
        p.status      = ProjectStatus.Active;
        p.milestoneCount = _descriptions.length;

        uint256 total = 0;
        for (uint256 i = 0; i < _descriptions.length; i++) {
            require(_amounts[i] > 0, "Amount must be > 0");
            require(_deadlines[i] > block.timestamp, "Deadline must be in future");
            p.milestones[i] = Milestone({
                description: _descriptions[i],
                amount:      _amounts[i],
                deadlineAt:  _deadlines[i],
                status:      MilestoneStatus.Pending
            });
            total += _amounts[i];
        }
        p.totalAmount = total;

        projectExists[_projectId] = true;
        projectCount++;

        emit ProjectCreated(_projectId, msg.sender, _verifier, _operator, total, _descriptions.length);
    }

    /**
     * @notice Sponsor deposits HBAR into the project escrow.
     */
    function depositFunds(bytes32 _projectId)
        external
        payable
        onlySponsor(_projectId)
        projectActive(_projectId)
    {
        require(msg.value > 0, "Must deposit > 0");
        Project storage p = projects[_projectId];
        p.depositedAmount += msg.value;

        emit FundsDeposited(_projectId, msg.sender, msg.value, p.depositedAmount);
    }

    /**
     * @notice Verifier approves a pending milestone after proof review.
     */
    function approveMilestone(bytes32 _projectId, uint256 _milestoneIndex)
        external
        onlyVerifier(_projectId)
        projectActive(_projectId)
    {
        Project storage p = projects[_projectId];
        require(_milestoneIndex < p.milestoneCount, "Invalid milestone");
        Milestone storage m = p.milestones[_milestoneIndex];
        require(m.status == MilestoneStatus.Pending, "Not pending");
        require(block.timestamp <= m.deadlineAt, "Milestone deadline passed");

        m.status = MilestoneStatus.Approved;

        emit MilestoneApproved(_projectId, _milestoneIndex, msg.sender);
    }

    /**
     * @notice Release funds for an approved milestone to the operator.
     *         Can be called by sponsor or verifier.
     */
    function releaseMilestone(bytes32 _projectId, uint256 _milestoneIndex)
        external
        projectActive(_projectId)
    {
        Project storage p = projects[_projectId];
        require(
            msg.sender == p.sponsor || msg.sender == p.verifier,
            "Only sponsor or verifier"
        );
        require(_milestoneIndex < p.milestoneCount, "Invalid milestone");

        Milestone storage m = p.milestones[_milestoneIndex];
        require(m.status == MilestoneStatus.Approved, "Not approved");
        require(p.depositedAmount >= m.amount, "Insufficient escrow balance");

        m.status = MilestoneStatus.Released;
        p.releasedAmount += m.amount;
        p.depositedAmount -= m.amount;

        // Transfer HBAR to operator
        (bool success, ) = payable(p.operator).call{value: m.amount}("");
        require(success, "Transfer failed");

        emit FundsReleased(_projectId, _milestoneIndex, p.operator, m.amount);

        // Check if all milestones are released
        bool allReleased = true;
        for (uint256 i = 0; i < p.milestoneCount; i++) {
            if (p.milestones[i].status != MilestoneStatus.Released) {
                allReleased = false;
                break;
            }
        }
        if (allReleased) {
            p.status = ProjectStatus.Completed;
            emit ProjectCompleted(_projectId);
        }
    }

    /**
     * @notice Sponsor can reclaim unspent funds and cancel the project.
     */
    function refund(bytes32 _projectId)
        external
        onlySponsor(_projectId)
        projectActive(_projectId)
    {
        Project storage p = projects[_projectId];
        uint256 refundable = p.depositedAmount;
        require(refundable > 0, "Nothing to refund");

        p.depositedAmount = 0;
        p.status = ProjectStatus.Cancelled;

        (bool success, ) = payable(p.sponsor).call{value: refundable}("");
        require(success, "Refund transfer failed");

        emit FundsRefunded(_projectId, p.sponsor, refundable);
        emit ProjectCancelled(_projectId);
    }

    /**
     * @notice Sponsor can reclaim remaining escrow once a milestone deadline has passed unreleased.
     */
    function refundAfterDeadline(bytes32 _projectId, uint256 _milestoneIndex)
        external
        onlySponsor(_projectId)
        projectActive(_projectId)
    {
        Project storage p = projects[_projectId];
        require(_milestoneIndex < p.milestoneCount, "Invalid milestone");

        Milestone storage m = p.milestones[_milestoneIndex];
        require(m.status != MilestoneStatus.Released, "Milestone already released");
        require(block.timestamp > m.deadlineAt, "Deadline not reached");

        uint256 refundable = p.depositedAmount;
        require(refundable > 0, "Nothing to refund");

        p.depositedAmount = 0;
        p.status = ProjectStatus.Cancelled;

        (bool success, ) = payable(p.sponsor).call{value: refundable}("");
        require(success, "Refund transfer failed");

        emit FundsRefunded(_projectId, p.sponsor, refundable);
        emit ProjectCancelled(_projectId);
    }

    // ──────────────────────────── View Functions ──────────────────

    function getProjectInfo(bytes32 _projectId)
        external
        view
        returns (
            address sponsor,
            address verifier,
            address operator,
            uint256 totalAmount,
            uint256 depositedAmount,
            uint256 releasedAmount,
            ProjectStatus status,
            uint256 milestoneCount
        )
    {
        require(projectExists[_projectId], "Project does not exist");
        Project storage p = projects[_projectId];
        return (
            p.sponsor,
            p.verifier,
            p.operator,
            p.totalAmount,
            p.depositedAmount,
            p.releasedAmount,
            p.status,
            p.milestoneCount
        );
    }

    function getMilestone(bytes32 _projectId, uint256 _index)
        external
        view
        returns (string memory description, uint256 amount, uint256 deadlineAt, MilestoneStatus status)
    {
        require(projectExists[_projectId], "Project does not exist");
        Project storage p = projects[_projectId];
        require(_index < p.milestoneCount, "Invalid milestone index");
        Milestone storage m = p.milestones[_index];
        return (m.description, m.amount, m.deadlineAt, m.status);
    }

    function canRefundAfterDeadline(bytes32 _projectId, uint256 _index)
        external
        view
        returns (bool)
    {
        require(projectExists[_projectId], "Project does not exist");
        Project storage p = projects[_projectId];
        require(_index < p.milestoneCount, "Invalid milestone index");
        Milestone storage m = p.milestones[_index];

        return (
            p.status == ProjectStatus.Active &&
            m.status != MilestoneStatus.Released &&
            block.timestamp > m.deadlineAt &&
            p.depositedAmount > 0
        );
    }

    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
