package com.webpos.repository;

import com.webpos.entity.Order;
import com.webpos.enums.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OrderRepository extends JpaRepository<Order, UUID> {

    List<Order> findByStoreIdAndStatus(UUID storeId, OrderStatus status);

    Optional<Order> findByTableIdAndStatus(UUID tableId, OrderStatus status);
}
