package com.webpos.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
public class DailyReportDto {
    private LocalDate date;
    private BigDecimal totalRevenue;
    private long totalOrders;
    private BigDecimal avgOrderValue;
    private BigDecimal cashAmount;
    private BigDecimal creditCardAmount;
    private BigDecimal linePayAmount;
    private BigDecimal jkoPayAmount;
    private BigDecimal otherAmount;
    private BigDecimal totalDiscount;
    private long openTableCount;
}
