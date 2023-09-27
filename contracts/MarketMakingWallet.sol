// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IOrderBook} from "@elliottech/lighter-v2-core/contracts/interfaces/IOrderBook.sol";
import {IFactory} from "@elliottech/lighter-v2-core/contracts/interfaces/IFactory.sol";
import {ILighterV2TransferCallback, IERC20Minimal} from "@elliottech/lighter-v2-core/contracts/interfaces/ILighterV2TransferCallback.sol";
import {ViewWallet} from "./ViewWallet.sol";

/// @title MarketMakingWallet
/// @notice A wallet that interacts with the Lighter protocol by placing optimized limit orders.
/// An optimized limit order, known as a PerformanceLimitOrder, differs from a standard LimitOrder in that it first
/// deposits the tokens into the order book. This eliminates the need for the order book to execute transfers each time
/// an order is created or canceled, thereby reducing gas costs.
///
/// The MarketMakingWallet serves as a starting point for users who wish to place resting orders on Lighter (i.e., to market make).
contract MarketMakingWallet is ILighterV2TransferCallback, ViewWallet  {
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

    /// @dev Creates performance limit orders in the order book.
    /// @notice Can only be called by owner.
    /// @param orderBook The address of the order book
    /// @param amount0 The amount of token0 for the order
    /// @param price The prices denominated in token1
    /// @param isAsk Whether order is an ask order
    /// @param hintId Where to insert each order in the given order book.
    /// Should to be calculated off-chain using the suggestHintId function from the IOrderBook.
    /// Providing a good hintId will reduce gas cost.
    /// Passing 0 will always work, but might result in a higher gas cost.
    /// @return orderId The id of the created order
    function createLimitOrder(
        IOrderBook orderBook,
        uint256 amount0,
        uint256 price,
        bool isAsk,
        uint32 hintId
    ) public onlyOwner returns (uint32 orderId) {
        uint256 sizeTick = orderBook.sizeTick();
        uint256 priceTick = orderBook.priceTick();
        bytes memory callbackData = abi.encodePacked(orderBook.orderBookId());

        return
            orderBook.createOrder(
                uint64(amount0 / sizeTick),
                uint64(price / priceTick),
                isAsk,
                address(this),
                hintId,
                IOrderBook.OrderType.PerformanceLimitOrder,
                callbackData
            );
    }

    /// @dev Cancels performance limit orders in the order book.
    /// @notice Can only be called by owner.
    /// @param orderBook The address of the order book
    /// @param orderId The id of the order
    /// @return isCanceled Whether the order was canceled.
    function cancelLimitOrder(IOrderBook orderBook, uint32 orderId) external onlyOwner returns (bool isCanceled) {
        return orderBook.cancelLimitOrder(orderId, address(this));
    }

    /// @dev Cancels performance limit orders in the order book.
    /// @notice Can only be called by owner.
    /// @param orderBook The address of the order book
    function cancelAllLimitOrders(IOrderBook orderBook) public {
        Order[] memory orders = getLimitOrdersByOwner(orderBook, address(this));
        for (uint256 index = 0; index < orders.length; index += 1) {
            orderBook.cancelLimitOrder(orders[index].id, address(this));
        }
    }

    /// @notice Deposits token amount into the orderBook.
    /// Tokens must be sent to the wallet in advance for the deposit to work.
    /// Another withdrawal will be needed to return the tokens to the owner.
    /// Can only be called by the owner.
    /// @param orderBook The address of the order book
    /// @param tokenAddress The address of the token which is being deposited
    /// @param amount The amount of token that will be deposited
    function depositInOrderBook(IOrderBook orderBook, address tokenAddress, uint256 amount) external onlyOwner {
        bytes memory callbackData = abi.encodePacked(orderBook.orderBookId());

        if (address(orderBook.token0()) == tokenAddress) {
            return orderBook.depositToken(amount, true, callbackData);
        } else if (address(orderBook.token1()) == tokenAddress) {
            return orderBook.depositToken(amount, false, callbackData);
        } else {
            revert("order book does not contain token");
        }
    }

    /// @notice Claims token amount from the orderBook and deposits it back into the wallet.
    /// Another withdrawal will be needed to retrieve the tokens back to the owner.
    /// Can only be called by the owner.
    /// @param orderBook The address of the order book
    /// @param tokenAddress The address of the token which is being claimed
    /// @param amount The amount of token that will be claimed back into the wallet
    function claimFromOrderBook(IOrderBook orderBook, address tokenAddress, uint256 amount) external onlyOwner {
        if (address(orderBook.token0()) == tokenAddress) {
            return orderBook.claimToken(amount, true);
        } else if (address(orderBook.token1()) == tokenAddress) {
            return orderBook.claimToken(amount, false);
        } else {
            revert("order book does not contain token");
        }
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
