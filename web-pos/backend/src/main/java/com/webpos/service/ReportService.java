package com.webpos.service;

import com.webpos.dto.DailyReportDto;
import com.webpos.dto.ItemReportDto;
import com.webpos.dto.StaffReportDto;
import com.webpos.entity.Order;
import com.webpos.entity.OrderItem;
import com.webpos.entity.Payment;
import com.webpos.entity.UserProfile;
import com.webpos.enums.OrderStatus;
import com.webpos.enums.PaymentMethod;
import com.webpos.enums.TableStatus;
import com.webpos.repository.ClockRecordRepository;
import com.webpos.repository.OrderItemRepository;
import com.webpos.repository.OrderRepository;
import com.webpos.repository.PaymentRepository;
import com.webpos.repository.TableEntityRepository;
import com.webpos.repository.UserProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final PaymentRepository paymentRepository;
    private final UserProfileRepository userProfileRepository;
    private final TableEntityRepository tableEntityRepository;
    private final ClockRecordRepository clockRecordRepository;

    public DailyReportDto getDailyReport(UUID storeId, LocalDate date) {
        LocalDateTime start = date.atStartOfDay();
        LocalDateTime end = date.atTime(LocalTime.MAX);

        List<Order> orders = orderRepository.findByStoreIdAndCreatedAtBetween(storeId, start, end)
                .stream()
                .filter(o -> o.getStatus() == OrderStatus.CLOSED)
                .collect(Collectors.toList());

        BigDecimal totalRevenue = orders.stream()
                .map(o -> o.getTotalAmount() != null ? o.getTotalAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalDiscount = orders.stream()
                .map(o -> o.getDiscountAmount() != null ? o.getDiscountAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long orderCount = orders.size();
        BigDecimal avgOrderValue = orderCount > 0
                ? totalRevenue.divide(BigDecimal.valueOf(orderCount), 0, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        // Aggregate payments by method
        List<UUID> orderIds = orders.stream().map(Order::getId).collect(Collectors.toList());
        Map<PaymentMethod, BigDecimal> paymentTotals = new HashMap<>();
        for (UUID orderId : orderIds) {
            paymentRepository.findByOrderId(orderId).forEach(p -> {
                paymentTotals.merge(p.getMethod(), p.getAmount(), BigDecimal::add);
            });
        }

        long openTableCount = tableEntityRepository
                .findByStoreIdAndStatusOrderByTableNumberAsc(storeId, TableStatus.OCCUPIED).size();

        return DailyReportDto.builder()
                .date(date)
                .totalRevenue(totalRevenue)
                .totalOrders(orderCount)
                .avgOrderValue(avgOrderValue)
                .cashAmount(paymentTotals.getOrDefault(PaymentMethod.CASH, BigDecimal.ZERO))
                .creditCardAmount(paymentTotals.getOrDefault(PaymentMethod.CREDIT_CARD, BigDecimal.ZERO))
                .linePayAmount(paymentTotals.getOrDefault(PaymentMethod.LINE_PAY, BigDecimal.ZERO))
                .jkoPayAmount(paymentTotals.getOrDefault(PaymentMethod.JKOPAY, BigDecimal.ZERO))
                .otherAmount(paymentTotals.getOrDefault(PaymentMethod.OTHER, BigDecimal.ZERO))
                .totalDiscount(totalDiscount)
                .openTableCount(openTableCount)
                .build();
    }

    public List<ItemReportDto> getItemReport(UUID storeId, LocalDate startDate, LocalDate endDate) {
        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end = endDate.atTime(LocalTime.MAX);

        List<Order> orders = orderRepository.findByStoreIdAndCreatedAtBetween(storeId, start, end)
                .stream()
                .filter(o -> o.getStatus() == OrderStatus.CLOSED)
                .collect(Collectors.toList());

        Map<String, long[]> aggregated = new HashMap<>(); // name → [qty, revenue*100]
        for (Order order : orders) {
            List<OrderItem> items = orderItemRepository.findByOrderId(order.getId());
            for (OrderItem item : items) {
                String name = item.getMenuItemName();
                long qty = item.getQuantity();
                long revenue = item.getSubtotal() != null
                        ? item.getSubtotal().multiply(BigDecimal.valueOf(100)).longValue()
                        : 0;
                aggregated.merge(name, new long[]{qty, revenue}, (a, b) -> new long[]{a[0] + b[0], a[1] + b[1]});
            }
        }

        return aggregated.entrySet().stream()
                .map(e -> new ItemReportDto(
                        e.getKey(),
                        e.getValue()[0],
                        BigDecimal.valueOf(e.getValue()[1]).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP)))
                .sorted((a, b) -> Long.compare(b.getTotalQuantity(), a.getTotalQuantity()))
                .collect(Collectors.toList());
    }

    public StaffReportDto getStaffReport(UUID storeId, UUID staffId, LocalDate startDate, LocalDate endDate) {
        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end = endDate.atTime(LocalTime.MAX);

        UserProfile staff = userProfileRepository.findById(staffId)
                .orElseThrow(() -> new com.webpos.exception.ResourceNotFoundException("Staff not found: " + staffId));

        List<Order> orders = orderRepository.findByStoreIdAndCreatedAtBetween(storeId, start, end)
                .stream()
                .filter(o -> o.getStatus() == OrderStatus.CLOSED && staffId.equals(o.getStaffId()))
                .collect(Collectors.toList());

        BigDecimal totalRevenue = orders.stream()
                .map(o -> o.getTotalAmount() != null ? o.getTotalAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Calculate hours from clock records
        double totalMinutes = clockRecordRepository
                .findByStaffIdAndClockInBetween(staffId, start, end)
                .stream()
                .mapToLong(r -> r.getTotalMinutes() != null ? r.getTotalMinutes() : 0L)
                .sum();
        double totalHours = totalMinutes / 60.0;

        BigDecimal estimatedSalary = BigDecimal.ZERO;
        if (staff.getHourlyRate() != null) {
            estimatedSalary = staff.getHourlyRate()
                    .multiply(BigDecimal.valueOf(totalHours))
                    .setScale(0, RoundingMode.HALF_UP);
        }

        return StaffReportDto.builder()
                .staffId(staffId)
                .staffName(staff.getName())
                .totalOrders(orders.size())
                .totalRevenue(totalRevenue)
                .totalHours(totalHours)
                .estimatedSalary(estimatedSalary)
                .build();
    }
}
