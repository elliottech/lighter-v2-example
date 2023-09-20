// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import {IPool} from "@aave/core-v3/contracts/interfaces/IPool.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title MarginWallet
 * @notice A contract that acts as a smart wallet.
 * Funds deposited into it will de used as collateral in the AAVE protocol.
 */
contract MarginWallet {
    /// @notice address of the owner of MarginWallet
    address public immutable owner;

    /// @notice AAVE v3 pool instance
    IPool public immutable pool;

    /// @dev Modifier that restricts function execution to the contract owner.
    /// The caller must be the owner of the smart wallet.
    modifier onlyOwner() {
        require(msg.sender == owner, "caller must be owner");
        _;
    }

    constructor(IPool _pool) {
        owner = msg.sender;
        pool = _pool;
    }

    function deposit(address tokenAddress, uint256 amount) external onlyOwner {
        IERC20 token = IERC20(tokenAddress);
        token.transferFrom(msg.sender, address(this), amount);
        if (token.allowance(address(this), address(pool)) < amount) {
            token.approve(address(pool), 1 << 255);
        }
        pool.deposit(tokenAddress, amount, address(this), 0);
    }

    function withdraw(address tokenAddress, uint256 amount) external onlyOwner {
        pool.withdraw(tokenAddress, amount, owner);
    }
}
