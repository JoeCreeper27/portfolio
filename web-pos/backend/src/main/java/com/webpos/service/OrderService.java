package com.webpos.service;

import com.webpos.dto.CheckoutRequest;
import com.webpos.dto.OrderRequest;
import com.webpos.entity.*;
import com.webpos.enums.OrderStatus;
import com.webpos.enums.TableStatus;
import com.webpos.exception.ResourceNotFoundException;
import com.webpos.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class OrderService {

    private final OrderRepository orderRepository;
    private final MenuItemRepository menuItemRepository;
    private final TableEntityRepository tableRepository;
    private final OrderItemRepository orderItemRepository;
    private final PaymentRepository paymentRepository;

    // -------------------------------------------------------------------------
    // Create order and mark table as OCCUPIED
    // -------------------------------------------------------------------------

    @Transactional
    public Order createOrder(UUID storeId, UUID staffId, OrderRequest request) {
        TableEntity table = tableRepository.findById(request.getTableId())
                .orElseThrow(() -> new ResourceNotFoundException("Table", request.getTableId()));

        if (table.getStatus() == TableStatus.OCCUPIED) {
            throw new IllegalStateException("Table " + table.getTableNumber() + " is already occupied");
        }

        Order order = Order.builder()
                .storeId(storeId)
                .tableId(table.getId())
                .tableNumber(table.getTableNumber())
                .staffId(staffId)
                .paxCount(request.getPaxCount())
                .status(OrderStatus.OPEN)
                .build();

        order = orderRepository.save(order);

        // Persist order items and accumulate subtotal
        BigDecimal subtotal = addItemsToOrder(order, request.getItems());
        order.setSubtotal(subtotal);
        order.setTotal(subtotal);
        order = orderRepository.save(order);

        // Update table status
        table.setStatus(TableStatus.OCCUPIED);
        tableRepository.save(table);

        return order;
    }

    // -------------------------------------------------------------------------
    // Add items to an existing open order
    // -------------------------------------------------------------------------

    @Transactional
    public Order addItems(UUID orderId, List<OrderRequest.OrderItemRequest> itemRequests) {
        Order order = getOpenOrder(orderId);
        BigDecimal added = addItemsToOrder(order, itemRequests);
        order.setSubtotal(order.getSubtotal().add(added));
        order.setTotal(order.getSubtotal());
        return orderRepository.save(order);
    }

    // -------------------------------------------------------------------------
    // Checkout: calculate total, create payment record, update table status
    // -------------------------------------------------------------------------

    @Transactional
    public Order checkoutOrder(UUID orderId, UUID staffId, CheckoutRequest request) {
        Order order = getOpenOrder(orderId);

        BigDecimal discount = request.getDiscountAmount() != null
                ? request.getDiscountAmount() : BigDecimal.ZERO;
        BigDecimal total = order.getSubtotal().subtract(discount);
        if (total.compareTo(BigDecimal.ZERO) < 0) total = BigDecimal.ZERO;

        BigDecimal received = request.getReceivedAmount() != null
                ? request.getReceivedAmount() : request.getAmount();
        BigDecimal change = received.subtract(total);
        if (change.compareTo(BigDecimal.ZERO) < 0) change = BigDecimal.ZERO;

        order.setDiscountAmount(discount);
        order.setTotal(total);
        order.setStatus(OrderStatus.CLOSED);
        order.setClosedAt(LocalDateTime.now());
        order = orderRepository.save(order);

        Payment payment = Payment.builder()
                .orderId(order.getId())
                .staffId(staffId)
                .method(request.getPaymentMethod())
                .amount(total)
                .receivedAmount(received)
                .changeAmount(change)
                .note(request.getNote())
                .build();
        paymentRepository.save(payment);

        // Update table to CLEANING
        if (order.getTableId() != null) {
            tableRepository.findById(order.getTableId()).ifPresent(table -> {
                table.setStatus(TableStatus.CLEANING);
                tableRepository.save(table);
            });
        }

        return order;
    }

    // -------------------------------------------------------------------------
    // Kitchen view: open orders
    // -------------------------------------------------------------------------

    public List<Order> getKitchenOrders(UUID storeId) {
        return orderRepository.findByStoreIdAndStatus(storeId, OrderStatus.OPEN);
    }

    // -------------------------------------------------------------------------
    // Queries
    // -------------------------------------------------------------------------

    public List<Order> getActiveOrders(UUID storeId) {
        return orderRepository.findByStoreIdAndStatus(storeId, OrderStatus.OPEN);
    }

    public Order getOrder(UUID orderId) {
        return orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", orderId));
    }

    @Transactional
    public void removeItem(UUID orderId, UUID itemId) {
        Order order = getOpenOrder(orderId);
        OrderItem item = orderItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("OrderItem", itemId));
        order.setSubtotal(order.getSubtotal().subtract(item.getSubtotal()));
        order.setTotal(order.getSubtotal());
        orderRepository.save(order);
        orderItemRepository.deleteById(itemId);
    }

    @Transactional
    public OrderItem completeItem(UUID orderId, UUID itemId) {
        orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", orderId));
        OrderItem item = orderItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("OrderItem", itemId));
        item.setCompleted(true);
        return orderItemRepository.save(item);
    }

    @Transactional
    public Order completeOrder(UUID orderId) {
        Order order = getOpenOrder(orderId);
        order.setStatus(OrderStatus.CLOSED);
        order.setClosedAt(LocalDateTime.now());
        return orderRepository.save(order);
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    private Order getOpenOrder(UUID orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", orderId));
        if (order.getStatus() != OrderStatus.OPEN) {
            throw new IllegalStateException("Order " + orderId + " is not open");
        }
        return order;
    }

    private BigDecimal addItemsToOrder(Order order, List<OrderRequest.OrderItemRequest> itemRequests) {
        BigDecimal subtotal = BigDecimal.ZERO;
        for (OrderRequest.OrderItemRequest itemReq : itemRequests) {
            MenuItem menuItem = menuItemRepository.findById(itemReq.getMenuItemId())
                    .orElseThrow(() -> new ResourceNotFoundException("MenuItem", itemReq.getMenuItemId()));

            BigDecimal itemSubtotal = menuItem.getPrice()
                    .multiply(BigDecimal.valueOf(itemReq.getQuantity()));

            OrderItem orderItem = OrderItem.builder()
                    .orderId(order.getId())
                    .menuItemId(menuItem.getId())
                    .menuItemName(menuItem.getName())
                    .quantity(itemReq.getQuantity())
                    .unitPrice(menuItem.getPrice())
                    .subtotal(itemSubtotal)
                    .note(itemReq.getNote())
                    .build();

            orderItemRepository.save(orderItem);
            subtotal = subtotal.add(itemSubtotal);
        }
        return subtotal;
    }
}
