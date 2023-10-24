// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {IPool, DataTypes} from "@aave/core-v3/contracts/interfaces/IPool.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IOrderBook} from "@elliottech/lighter-v2-core/contracts/interfaces/IOrderBook.sol";
import {IFactory} from "@elliottech/lighter-v2-core/contracts/interfaces/IFactory.sol";
import {ILighterV2TransferCallback, IERC20Minimal} from "@elliottech/lighter-v2-core/contracts/interfaces/ILighterV2TransferCallback.sol";

/// @title MarginWallet
/// @notice A contract that functions as a margin account.
/// Funds deposited into this wallet are used as collateral in the AAVE protocol.
/// Trading on Lighter leverages the credit provided by the AAVE protocol.
/// If a swap is initiated with insufficient deposited tokens, a loan will be taken to cover the remaining costs.
/// This implementation does not use Flash Loans, thereby avoiding extra costs.
/// Due to the nature of margin accounts, liquidation is a possibility.
contract MarginWallet is ILighterV2TransferCallback {
    /// @notice address of the owner of wallet
    address public immutable owner;

    /// @notice factory instance used to query orderBooks by ID
    IFactory public immutable factory;

    /// @notice aave pool instance used for deposits & borrowing
    IPool public immutable aavePool;

    /// @dev Modifier that restricts function execution to the contract owner.
    /// The caller must be the owner of the wallet.
    modifier onlyOwner() {
        require(msg.sender == owner, "caller must be owner");
        _;
    }

    /// @dev Constructor initializes the wallet with a factory contract.
    /// The owner of the wallet is set to the sender of the deployment transaction.
    /// @param _factory The address of the factory contract.
    constructor(IFactory _factory, IPool _aavePool) {
        owner = msg.sender;
        factory = _factory;
        aavePool = _aavePool;
    }

    function _handleReceivedTokens(address tokenAddress) internal {
        IERC20 token = IERC20(tokenAddress);
        uint256 balance = token.balanceOf(address(this));
        if (token.allowance(address(this), address(aavePool)) < balance) {
            token.approve(address(aavePool), 1 << 255);
        }

        DataTypes.ReserveData memory reserveData = aavePool.getReserveData(tokenAddress);

        IERC20 vToken = IERC20(reserveData.variableDebtTokenAddress);
        uint256 debt = vToken.balanceOf(address(this));

        // try to repay outgoing loans
        if (balance > 0 && debt > 0) {
            uint256 paid = balance;
            if (paid > debt) {
                paid = debt;
            }

            aavePool.repay(tokenAddress, paid, 2, address(this));

            debt -= paid;
            balance -= paid;
        }

        // if there is any balance left, deposit
        if (balance > 0) {
            aavePool.deposit(tokenAddress, balance, address(this), 0);
        }
    }

    /// @dev Callback function called by the `orderBook` contract after a successful transfer.
    /// This function handles the transfer of `debitTokenAmount` of the `debitToken`.
    /// It ensures that only the `orderBook` contract can call this function.
    /// The tokens are transferred to the sender.
    /// @param debitTokenAmount The amount of debit tokens to be transferred.
    /// @param debitToken The ERC20 token used for the transfer.
    /// @param data Additional data that can be provided to the function.
    function lighterV2TransferCallback(
        uint256 debitTokenAmount,
        IERC20Minimal debitToken,
        bytes memory data
    ) external override {
        uint8 orderBookId;
        // unpack order book ID
        assembly {
            orderBookId := mload(add(data, 1))
        }

        // make sure caller is Lighter orderbook
        address orderBookAddress = factory.getOrderBookFromId(orderBookId);
        require(msg.sender == address(orderBookAddress));

        // figure out which token we've received based on the token that we need to send
        IOrderBook orderBook = IOrderBook(orderBookAddress);
        if (address(debitToken) == address(orderBook.token0())) {
            _handleReceivedTokens(address(orderBook.token1()));
        } else {
            _handleReceivedTokens(address(orderBook.token0()));
        }

        uint256 remaining = debitTokenAmount;

        // try to withdraw any deposits, if any, as it doesn't make sense to take debt while having deposits
        DataTypes.ReserveData memory reserveData = aavePool.getReserveData(address(debitToken));
        IERC20 aToken = IERC20(reserveData.aTokenAddress);
        uint256 deposited = aToken.balanceOf(address(this));
        if (deposited > 0) {
            if (deposited > remaining) {
                deposited = remaining;
            }

            aavePool.withdraw(address(debitToken), deposited, address(this));
            remaining -= deposited;
        }

        // borrow tokens; no need to check current balance as all of our tokens are deposited into AAVE
        if (remaining > 0) {
            aavePool.borrow(address(debitToken), remaining, 2, 0, address(this));
        }

        if (!debitToken.transfer(msg.sender, debitTokenAmount)) {
            revert();
        }
    }

    /// @notice Performs swap in the given order book.
    /// Can only be called by the owner.
    /// @param orderBook The address of the order book
    /// @param isAsk Whether the order is an ask order
    /// @param exactInput exactInput to pay for the swap (can be token0 or token1 based on isAsk)
    /// @param minOutput Minimum output amount expected to recieve from swap (can be token0 or token1 based on isAsk)
    /// @return swappedInput The amount of input taker paid for the swap
    /// @return swappedOutput The amount of output taker received from the swap
    function swapExactInput(
        IOrderBook orderBook,
        bool isAsk,
        uint256 exactInput,
        uint256 minOutput
    ) external payable onlyOwner returns (uint256, uint256) {
        bytes memory callbackData = abi.encodePacked(orderBook.orderBookId());

        return orderBook.swapExactSingle(isAsk, true, exactInput, minOutput, address(this), callbackData);
    }

    /// @notice Performs swap in the given order book.
    /// Can only be called by the owner.
    /// @param orderBook The address of the order book
    /// @param isAsk Whether the order is an ask order
    /// @param exactOutput exactOutput to receive from the swap (can be token0 or token1 based on isAsk)
    /// @param maxInput Maximum input that the taker is willing to pay for the swap (can be token0 or token1 based on isAsk)
    /// @return swappedInput The amount of input taker paid for the swap
    /// @return swappedOutput The amount of output taker received from the swap
    function swapExactOutput(
        IOrderBook orderBook,
        bool isAsk,
        uint256 exactOutput,
        uint256 maxInput
    ) external payable onlyOwner returns (uint256, uint256) {
        bytes memory callbackData = abi.encodePacked(orderBook.orderBookId());

        return orderBook.swapExactSingle(isAsk, false, exactOutput, maxInput, address(this), callbackData);
    }

    /// @dev Deposits tokens into the AAVE protocol. The wallet must be approved beforehand by the owner.
    /// This is necessary as the tokens act as collateral for outgoing loans.
    /// Merely sending the tokens to the wallet without depositing them will not contribute to the account's collateral.
    /// Approval is required so that the depositing of tokens will necessitate only one transaction.
    /// @param tokenAddress Address of the token to be deposited.
    /// @param amount The amount of tokens to be deposited.
    function deposit(address tokenAddress, uint256 amount) external onlyOwner {
        // transfer tokens from owner to this contract
        IERC20 token = IERC20(tokenAddress);
        require(token.transferFrom(owner, address(this), amount), "Token transfer failed");

        _handleReceivedTokens(tokenAddress);
    }

    /// @dev Withdraws tokens from the AAVE protocol and sends them back to the owner.
    /// This operation may fail if it reduces the wallet's health factor below the threshold.
    /// Withdrawing an excessive amount of tokens can lower the health factor, potentially triggering a liquidation.
    /// @param tokenAddress Address of the token to be withdrawn.
    /// @param amount The amount of tokens to be withdrawn.
    function withdraw(address tokenAddress, uint256 amount) external onlyOwner {
        aavePool.withdraw(tokenAddress, amount, owner);
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
