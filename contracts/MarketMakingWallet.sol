// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IOrderBook} from "@elliottech/lighter-v2-core/contracts/interfaces/IOrderBook.sol";
import {IFactory} from "@elliottech/lighter-v2-core/contracts/interfaces/IFactory.sol";
import {ILighterV2TransferCallback, IERC20Minimal} from "@elliottech/lighter-v2-core/contracts/interfaces/ILighterV2TransferCallback.sol";

/// @title MarketMakingWallet
/// @notice A wallet which interacts with the Lighter protocol by placing optimizer limit orders.
/// An optimized limit order, called PerformanceLimitOrder, differs from normal a LimitOrder because it first deposits
/// the tokens into the order book. This allows the order book to not make transfers each time an order is created
/// or canceled, thus reducing the gas cost.
///
/// The MarketMakingWallet is a starting point for users which want to place resting orders on Lighter (to market make)
contract MarketMakingWallet is ILighterV2TransferCallback {
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

    /// @dev Creates multiple performance limit orders in the order book. Only the contract owner can call this function.
    ///  The function processes each order provided in the arrays and creates corresponding performance limit orders in the order book.
    ///
    ///  @param orderBookId The id of the order book which will be used.
    ///  @param size The number of orders to create.
    ///  @param amount0 An array of amounts denominated in token0 to be used for each order.
    ///  @param price An array of prices denominated in token1 for each order.
    ///  @param isAsk An array indicating whether each order is an "ask" order (true) or a "bid" order (false).
    ///  @param hintId An array of hint IDs to guide order placement in the order book.
    ///  @return orderId An array containing the order IDs of the created orders.
    function createLimitOrder(
        uint8 orderBookId,
        uint8 size,
        uint256[] memory amount0,
        uint256[] memory price,
        bool[] memory isAsk,
        uint32[] memory hintId
    ) public onlyOwner returns (uint32[] memory orderId) {
        IOrderBook orderBook = IOrderBook(factory.getOrderBookFromId(orderBookId));
        uint256 sizeTick = orderBook.sizeTick();
        uint256 priceTick = orderBook.priceTick();
        orderId = new uint32[](size);
        bytes memory callbackData = abi.encodePacked(orderBookId);
        for (uint8 i; i < size; ) {
            orderId[i] = orderBook.createOrder(
                uint64(amount0[i] / sizeTick),
                uint64(price[i] / priceTick),
                isAsk[i],
                address(this),
                hintId[i],
                IOrderBook.OrderType.PerformanceLimitOrder,
                callbackData
            );
            unchecked {
                ++i;
            }
        }
    }

    /// @dev Cancels multiple limit orders in the order book. Only the contract owner can call this function.
    /// The function processes each order ID provided in the array and attempts to cancel the corresponding limit orders.
    ///
    /// @param orderBookId The id of the order book which will be used.
    /// @param size The number of orders to cancel.
    /// @param orderId An array containing the order IDs to be canceled.
    /// @return isCanceled An array indicating whether each order was successfully canceled.
    function cancelLimitOrder(
        uint8 orderBookId,
        uint8 size,
        uint32[] memory orderId
    ) external onlyOwner returns (bool[] memory isCanceled) {
        IOrderBook orderBook = IOrderBook(factory.getOrderBookFromId(orderBookId));
        isCanceled = new bool[](size);
        for (uint256 i; i < size; ) {
            isCanceled[i] = orderBook.cancelLimitOrder(orderId[i], address(this));
            unchecked {
                ++i;
            }
        }
    }

    /// @notice deposit token amount to the orderBook
    /// The tokens need to be send in advance to the wallet, in order for the deposit to work
    /// Another withdraw will be needed to retrieve the tokens back to the owner
    /// @param orderBookId The orderBookId where the funds will be deposited into
    /// @param tokenAddress The address of the token which is being deposited
    /// @param amount The amount of token that will be deposited
    function depositInOrderBook(uint8 orderBookId, address tokenAddress, uint256 amount) external onlyOwner {
        IOrderBook orderBook = IOrderBook(factory.getOrderBookFromId(orderBookId));
        bytes memory callbackData = abi.encodePacked(orderBookId);

        if (address(orderBook.token0()) == tokenAddress) {
            return orderBook.depositToken(amount, true, callbackData);
        } else if (address(orderBook.token1()) == tokenAddress) {
            return orderBook.depositToken(amount, false, callbackData);
        } else {
            revert("order book does not contain token");
        }
    }

    /// @notice claim token amount from the orderBook and deposits it back into the wallet
    /// Another withdraw will be needed to retrieve the tokens back to the owner
    /// @param orderBookId The orderBookId where the funds will be claimed to
    /// @param tokenAddress The address of the token which is being claimed
    /// @param amount The amount of token that will be claimed back into the wallet
    function claimFromOrderBook(uint8 orderBookId, address tokenAddress, uint256 amount) external onlyOwner {
        IOrderBook orderBook = IOrderBook(factory.getOrderBookFromId(orderBookId));

        if (address(orderBook.token0()) == tokenAddress) {
            return orderBook.claimToken(amount, true);
        } else if (address(orderBook.token1()) == tokenAddress) {
            return orderBook.claimToken(amount, false);
        } else {
            revert("order book does not contain token");
        }
    }

    function withdraw(address tokenAddress, uint256 amount) external onlyOwner {
        IERC20 token = IERC20(tokenAddress);
        require(token.transfer(owner, amount), "Token transfer failed");
    }
}
