// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {IPool} from "@aave/core-v3/contracts/interfaces/IPool.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @title MarginWallet
/// @notice A contract that functions as a margin account.
/// Funds deposited into this wallet are used as collateral in the AAVE protocol.
/// Trading on Lighter leverages the credit provided by the AAVE protocol.
/// If a swap is initiated with insufficient deposited tokens, a loan will be taken to cover the remaining costs.
/// This implementation does not use Flash Loans, thereby avoiding extra costs.
/// Due to the nature of margin accounts, liquidation is a possibility.
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

    /// @dev Deposits tokens into the AAVE protocol. The wallet must be approved beforehand by the owner.
    /// This is necessary as the tokens act as collateral for outgoing loans.
    /// Merely sending the tokens to the wallet without depositing them will not contribute to the account's collateral.
    /// Approval is required so that the depositing of tokens will necessitate only one transaction.
    /// @param tokenAddress Address of the token to be deposited.
    /// @param amount The amount of tokens to be deposited.
    function deposit(address tokenAddress, uint256 amount) external onlyOwner {
        IERC20 token = IERC20(tokenAddress);
        token.transferFrom(msg.sender, address(this), amount);
        if (token.allowance(address(this), address(pool)) < amount) {
            token.approve(address(pool), 1 << 255);
        }
        pool.deposit(tokenAddress, amount, address(this), 0);
    }

    /// @dev Withdraws tokens from the AAVE protocol and sends them back to the owner.
    /// This operation may fail if it reduces the wallet's health factor below the threshold.
    /// Withdrawing an excessive amount of tokens can lower the health factor, potentially triggering a liquidation.
    /// @param tokenAddress Address of the token to be withdrawn.
    /// @param amount The amount of tokens to be withdrawn.
    function withdraw(address tokenAddress, uint256 amount) external onlyOwner {
        pool.withdraw(tokenAddress, amount, owner);
    }

    /// @dev Sends tokens from the wallet back to the owner.
    /// @notice Tokens should not be sent directly to the wallet; instead, use the deposit method.
    /// This feature exists to prevent the loss of funds.
    /// @notice Can only be called by the owner.
    /// @param tokenAddress Address of the token to be rescued.
    /// @param amount The amount of tokens to be rescued.
    function rescue(address tokenAddress, uint256 amount) external onlyOwner {
        IERC20 token = IERC20(tokenAddress);
        require(token.transfer(owner, amount), "Token transfer failed");
    }
}
