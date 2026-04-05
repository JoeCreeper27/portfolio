package com.webpos.controller;

import com.webpos.dto.CheckoutRequest;
import com.webpos.dto.OrderRequest;
import com.webpos.entity.Order;
import com.webpos.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @PostMapping
    public ResponseEntity<Order> createOrder(
            @RequestAttribute("storeId") UUID storeId,
            @RequestAttribute("userId") UUID staffId,
            @Valid @RequestBody OrderRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(orderService.createOrder(storeId, staffId, req));
    }

    @GetMapping("/active")
    public ResponseEntity<List<Order>> getActiveOrders(@RequestAttribute("storeId") UUID storeId) {
        return ResponseEntity.ok(orderService.getActiveOrders(storeId));
    }

    @GetMapping("/kitchen")
    public ResponseEntity<List<Order>> getKitchenOrders(@RequestAttribute("storeId") UUID storeId) {
        return ResponseEntity.ok(orderService.getKitchenOrders(storeId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Order> getOrder(@PathVariable UUID id) {
        return ResponseEntity.ok(orderService.getOrder(id));
    }

    @PostMapping("/{id}/items")
    public ResponseEntity<Order> addItems(
            @PathVariable UUID id,
            @RequestBody OrderRequest.ItemsWrapper req) {
        return ResponseEntity.ok(orderService.addItems(id, req.getItems()));
    }

    @DeleteMapping("/{id}/items/{itemId}")
    public ResponseEntity<Void> removeItem(
            @PathVariable UUID id,
            @PathVariable UUID itemId) {
        orderService.removeItem(id, itemId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/checkout")
    public ResponseEntity<Order> checkout(
            @PathVariable UUID id,
            @RequestAttribute("userId") UUID staffId,
            @Valid @RequestBody CheckoutRequest req) {
        return ResponseEntity.ok(orderService.checkoutOrder(id, staffId, req));
    }

    @PatchMapping("/{id}/items/{itemId}/complete")
    public ResponseEntity<Void> markItemComplete(
            @PathVariable UUID id,
            @PathVariable UUID itemId) {
        orderService.markItemComplete(id, itemId);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/complete")
    public ResponseEntity<Void> markOrderComplete(@PathVariable UUID id) {
        orderService.markOrderComplete(id);
        return ResponseEntity.noContent().build();
    }
}
