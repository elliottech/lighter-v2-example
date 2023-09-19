// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.0;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IOrderBook} from "@elliottech/lighter-v2-core/contracts/interfaces/IOrderBook.sol";
import {IFactory} from "@elliottech/lighter-v2-core/contracts/interfaces/IFactory.sol";
import {ILighterV2TransferCallback, IERC20Minimal} from "@elliottech/lighter-v2-core/contracts/interfaces/ILighterV2TransferCallback.sol";

/**
 * @title SwapWallet
 * @notice A wallet which interacts with the Lighter protocol in order to swap tokens.
 */
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

    ///  @dev Callback function called by the `orderBook` contract after a successful transfer.
    ///  This function is used to handle the transfer of `debitTokenAmount` of the `debitToken`.
    ///  It ensures that only the `orderBook` contract can call this function.
    /// The transferred tokens are then sent back to the sender.
    /// @param debitTokenAmount The amount of debit tokens to be transferred.
    /// @param debitToken The ERC20 token used for the transfer.
    /// @param data Additional data that can be provided to the function.
    function lighterV2TransferCallback(
        uint256 debitTokenAmount,
        IERC20Minimal debitToken,
        bytes memory data
    ) external override {
        uint8 orderBookId;
        // unpack data
        assembly {
            orderBookId := mload(add(data, 1))
        }

        address orderBookAddress = factory.getOrderBookFromId(orderBookId);

        require(msg.sender == address(orderBookAddress));

        if (!debitToken.transfer(msg.sender, debitTokenAmount)) {
            revert();
        }
    }

    /// @notice Performs swap in the given order book
    /// @param orderBookId The unique identifier of the order book
    /// @param isAsk Whether the order is an ask order
    /// @param exactInput exactInput to pay for the swap (can be token0 or token1 based on isAsk)
    /// @param minOutput Minimum output amount expected to recieve from swap (can be token0 or token1 based on isAsk)
    /// @param recipient The address of the recipient of the output
    /// @return swappedInput The amount of input taker paid for the swap
    /// @return swappedOutput The amount of output taker received from the swap
    function swapExactInput(
        uint8 orderBookId,
        bool isAsk,
        uint256 exactInput,
        uint256 minOutput,
        address recipient
    ) external payable returns (uint256, uint256) {
        IOrderBook orderBook = IOrderBook(factory.getOrderBookFromId(orderBookId));
        bytes memory callbackData = abi.encodePacked(orderBookId);

        return orderBook.swapExactSingle(isAsk, true, exactInput, minOutput, recipient, callbackData);
    }

    /// @notice Performs swap in the given order book
    /// @param isAsk Whether the order is an ask order
    /// @param exactOutput exactOutput to receive from the swap (can be token0 or token1 based on isAsk)
    /// @param maxInput Maximum input that the taker is willing to pay for the swap (can be token0 or token1 based on isAsk)
    /// @param recipient The address of the recipient of the output
    /// @return swappedInput The amount of input taker paid for the swap
    /// @return swappedOutput The amount of output taker received from the swap
    function swapExactOutput(
        uint8 orderBookId,
        bool isAsk,
        uint256 exactOutput,
        uint256 maxInput,
        address recipient
    ) external payable returns (uint256, uint256) {
        IOrderBook orderBook = IOrderBook(factory.getOrderBookFromId(orderBookId));
        bytes memory callbackData = abi.encodePacked(orderBookId);

        return orderBook.swapExactSingle(isAsk, false, exactOutput, maxInput, recipient, callbackData);
    }
}
