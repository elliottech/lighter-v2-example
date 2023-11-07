// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IOrderBook} from "@elliottech/lighter-v2-core/contracts/interfaces/IOrderBook.sol";
import {IFactory} from "@elliottech/lighter-v2-core/contracts/interfaces/IFactory.sol";
import {ILighterV2TransferCallback, IERC20Minimal} from "@elliottech/lighter-v2-core/contracts/interfaces/ILighterV2TransferCallback.sol";

/// @title SwapWallet
/// @notice A wallet that interacts with the Lighter protocol by performing AMM-style token swaps.
/// Supported functions include swapExactInput and swapExactOutput.
///
/// The SwapWallet serves as a starting point for users who wish to execute simple trades on the Lighter exchange.
contract SwapWallet is ILighterV2TransferCallback {
    /// @notice address of the owner of wallet
    address public immutable owner;

    /// @notice factory instance used to query orderBooks by ID
    IFactory public immutable factory;

    /// @dev Modifier that restricts function execution to the contract owner.
    /// The caller must be the owner of the wallet.
    modifier onlyOwner() {
        require(msg.sender == owner, "caller must be owner");
        _;
    }

    /// @dev Constructor initializes the wallet with a factory contract.
    /// The owner of the wallet is set to the sender of the deployment transaction.
    /// @param _factory The address of the factory contract.
    constructor(IFactory _factory) {
        owner = msg.sender;
        factory = _factory;
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

        address orderBookAddress = factory.getOrderBookFromId(orderBookId);

        require(msg.sender == address(orderBookAddress));

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
    /// @param recipient The address of the recipient of the output
    /// @return swappedInput The amount of input taker paid for the swap
    /// @return swappedOutput The amount of output taker received from the swap
    function swapExactInput(
        IOrderBook orderBook,
        bool isAsk,
        uint256 exactInput,
        uint256 minOutput,
        address recipient
    ) external payable onlyOwner returns (uint256, uint256) {
        bytes memory callbackData = abi.encodePacked(orderBook.orderBookId());

        return orderBook.swapExactSingle(isAsk, true, exactInput, minOutput, recipient, callbackData);
    }

    /// @notice Performs swap in the given order book.
    /// Can only be called by the owner.
    /// @param orderBook The address of the order book
    /// @param isAsk Whether the order is an ask order
    /// @param exactOutput exactOutput to receive from the swap (can be token0 or token1 based on isAsk)
    /// @param maxInput Maximum input that the taker is willing to pay for the swap (can be token0 or token1 based on isAsk)
    /// @param recipient The address of the recipient of the output
    /// @return swappedInput The amount of input taker paid for the swap
    /// @return swappedOutput The amount of output taker received from the swap
    function swapExactOutput(
        IOrderBook orderBook,
        bool isAsk,
        uint256 exactOutput,
        uint256 maxInput,
        address recipient
    ) external payable onlyOwner returns (uint256, uint256) {
        bytes memory callbackData = abi.encodePacked(orderBook.orderBookId());

        return orderBook.swapExactSingle(isAsk, false, exactOutput, maxInput, recipient, callbackData);
    }

    /// @dev Send tokens from the wallet back to the owner.
    /// Tokens need to be sent to the wallet beforehand because the lighterV2TransferCallback
    /// pays the tokens by sending them from this wallet.
    /// Alternatively, it's possible to use transferFrom instead, from an address that has approved this wallet.
    /// In that case, this function becomes obsolete, but deprecating it might lead to a loss of funds.
    /// @notice can only be called by owner
    /// @param tokenAddress Address of the token which is being withdrawn
    /// @param amount The amount of tokens which are being withdrawn
    function withdraw(address tokenAddress, uint256 amount) external onlyOwner {
        IERC20 token = IERC20(tokenAddress);
        require(token.transfer(owner, amount), "Token transfer failed");
    }
}
