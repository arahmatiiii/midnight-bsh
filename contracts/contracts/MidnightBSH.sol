// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title MidnightBSH
/// @notice Optional fully on-chain mirror of the app's post/vote/certificate
/// model. The running Midnight BSH web app does NOT depend on this contract
/// being deployed — Postgres is its source of truth. This exists for anyone
/// who wants a trustless, on-chain variant of the same idea.
///
/// Simplification vs. the app: the night window here is defined in UTC
/// hours (no IANA timezone/DST support is possible on-chain), configurable
/// by the deployer.
contract MidnightBSH {
    enum Vote {
        None,
        Like,
        Dislike
    }

    struct Certificate {
        string name;
        string icon;
    }

    struct Post {
        address author;
        string content;
        uint32 requiredCertificateId; // valid only if hasGate
        bool hasGate;
        uint64 likeCount;
        uint64 dislikeCount;
        uint64 timestamp;
    }

    address public immutable owner;
    uint8 public nightStartHour; // 0-23, UTC
    uint8 public nightEndHour; // 0-23, UTC, may wrap past midnight

    Certificate[] public certificates;
    Post[] public posts;

    // certificateId => holder => claimed
    mapping(uint256 => mapping(address => bool)) public holdsCertificate;
    // postId => voter => vote
    mapping(uint256 => mapping(address => Vote)) public votes;

    event CertificateClaimed(address indexed holder, uint256 indexed certificateId);
    event PostCreated(uint256 indexed postId, address indexed author, uint32 requiredCertificateId, bool hasGate);
    event Voted(uint256 indexed postId, address indexed voter, Vote vote);
    event WindowUpdated(uint8 startHour, uint8 endHour);

    error NotOwner();
    error OutsideNightWindow();
    error UnknownCertificate();
    error UnknownPost();
    error MissingRequiredCertificate();
    error InvalidHour();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier duringNightWindow() {
        if (!isOpen()) revert OutsideNightWindow();
        _;
    }

    constructor(
        string[] memory certificateNames,
        string[] memory certificateIcons,
        uint8 startHour,
        uint8 endHour
    ) {
        require(certificateNames.length == certificateIcons.length, "length mismatch");
        if (startHour > 23 || endHour > 23) revert InvalidHour();

        owner = msg.sender;
        nightStartHour = startHour;
        nightEndHour = endHour;

        for (uint256 i = 0; i < certificateNames.length; i++) {
            certificates.push(Certificate(certificateNames[i], certificateIcons[i]));
        }
    }

    /// @notice Whether the night window is open right now, in UTC.
    function isOpen() public view returns (bool) {
        uint256 hourOfDay = (block.timestamp / 1 hours) % 24;
        if (nightStartHour == nightEndHour) return true; // 24/7 if equal
        if (nightStartHour < nightEndHour) {
            return hourOfDay >= nightStartHour && hourOfDay < nightEndHour;
        }
        // wraps past midnight, e.g. 21 -> 9
        return hourOfDay >= nightStartHour || hourOfDay < nightEndHour;
    }

    function setWindow(uint8 startHour, uint8 endHour) external onlyOwner {
        if (startHour > 23 || endHour > 23) revert InvalidHour();
        nightStartHour = startHour;
        nightEndHour = endHour;
        emit WindowUpdated(startHour, endHour);
    }

    function certificateCount() external view returns (uint256) {
        return certificates.length;
    }

    function postCount() external view returns (uint256) {
        return posts.length;
    }

    /// @notice Self-declared, unrestricted certificate claim — same trust
    /// model as the off-chain app: certificates are for fun, not verified.
    function claimCertificate(uint256 certificateId) external {
        if (certificateId >= certificates.length) revert UnknownCertificate();
        holdsCertificate[certificateId][msg.sender] = true;
        emit CertificateClaimed(msg.sender, certificateId);
    }

    function createPost(
        string calldata content,
        bool hasGate,
        uint32 requiredCertificateId
    ) external duringNightWindow returns (uint256 postId) {
        if (hasGate && requiredCertificateId >= certificates.length) {
            revert UnknownCertificate();
        }

        posts.push(
            Post({
                author: msg.sender,
                content: content,
                requiredCertificateId: requiredCertificateId,
                hasGate: hasGate,
                likeCount: 0,
                dislikeCount: 0,
                timestamp: uint64(block.timestamp)
            })
        );
        postId = posts.length - 1;
        emit PostCreated(postId, msg.sender, requiredCertificateId, hasGate);
    }

    /// @notice Casts, switches, or retracts (voting the same way twice) a
    /// vote on a post. Matches the off-chain app's toggle behavior exactly.
    function vote(uint256 postId, bool isLike) external duringNightWindow {
        if (postId >= posts.length) revert UnknownPost();
        Post storage post = posts[postId];

        if (post.hasGate && !holdsCertificate[post.requiredCertificateId][msg.sender]) {
            revert MissingRequiredCertificate();
        }

        Vote desired = isLike ? Vote.Like : Vote.Dislike;
        Vote current = votes[postId][msg.sender];

        if (current == desired) {
            // retract
            votes[postId][msg.sender] = Vote.None;
            if (desired == Vote.Like) post.likeCount -= 1;
            else post.dislikeCount -= 1;
            emit Voted(postId, msg.sender, Vote.None);
            return;
        }

        if (current == Vote.Like) post.likeCount -= 1;
        if (current == Vote.Dislike) post.dislikeCount -= 1;

        if (desired == Vote.Like) post.likeCount += 1;
        else post.dislikeCount += 1;

        votes[postId][msg.sender] = desired;
        emit Voted(postId, msg.sender, desired);
    }

    function getPost(uint256 postId) external view returns (Post memory) {
        if (postId >= posts.length) revert UnknownPost();
        return posts[postId];
    }

    /// @notice Paginated read to avoid unbounded loops for indexers/UIs.
    function getPostsRange(uint256 start, uint256 count) external view returns (Post[] memory result) {
        uint256 total = posts.length;
        if (start >= total) return new Post[](0);
        uint256 end = start + count;
        if (end > total) end = total;
        result = new Post[](end - start);
        for (uint256 i = start; i < end; i++) {
            result[i - start] = posts[i];
        }
    }
}
