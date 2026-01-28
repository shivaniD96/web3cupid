// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "@fhenixprotocol/cofhe-contracts/FHE.sol";
import {Permissioned, Permission} from "@fhenixprotocol/cofhe-contracts/access/Permissioned.sol";

contract ConfidentialDating is Permissioned {
    struct UserProfile {
        string name;
        euint8 gender; // Encrypted: 1 = Male, 2 = Female, 3 = Non-binary
        euint8 lookingFor; // Encrypted: 1 = Male, 2 = Female, 3 = Everyone
        bool exists;
    }

    mapping(address => UserProfile) public profiles;
    address[] public userAddresses;

    event UserRegistered(address indexed user, string name);

    // Register a new user with encrypted preferences
    function register(string memory _name, InEuint8 calldata _gender, InEuint8 calldata _lookingFor, Permission calldata perm) public {
        euint8 gender = FHE.asEuint8(_gender);
        euint8 lookingFor = FHE.asEuint8(_lookingFor);

        if (!profiles[msg.sender].exists) {
            userAddresses.push(msg.sender);
        }

        profiles[msg.sender] = UserProfile({
            name: _name,
            gender: gender,
            lookingFor: lookingFor,
            exists: true
        });

        // Allow the user to read their own data
        FHE.allow(gender, msg.sender); 
        FHE.allow(lookingFor, msg.sender);
        
        // Validation (optional, checks if provided permission is valid for the user)
        // onlySender(perm); 

        emit UserRegistered(msg.sender, _name);
    }

    // Check if the caller matches with the target user
    // Match logic: (My lookingFor == Their Gender) AND (Their lookingFor == My Gender)
    // Returns an encrypted boolean
    function checkMatch(address targetUser) public view returns (ebool) {
        require(profiles[msg.sender].exists, "Caller not registered");
        require(profiles[targetUser].exists, "Target not registered");

        UserProfile memory me = profiles[msg.sender];
        UserProfile memory them = profiles[targetUser];

        // My preference matches their gender?
        ebool match1 = FHE.eq(me.lookingFor, them.gender);
        // OR if I'm looking for "3" (Everyone) -> assume match (Simplified logic for demo)
        // For strictness: FHE.eq(me.lookingFor, them.gender)
        
        // Their preference matches my gender?
        ebool match2 = FHE.eq(them.lookingFor, me.gender);

        // Both must be true
        return FHE.and(match1, match2);
    }

    function getUserCount() public view returns (uint256) {
        return userAddresses.length;
    }

    function getUserAtIndex(uint256 index) public view returns (address, string memory) {
        require(index < userAddresses.length, "Index out of bounds");
        address addr = userAddresses[index];
        return (addr, profiles[addr].name);
    }
}
