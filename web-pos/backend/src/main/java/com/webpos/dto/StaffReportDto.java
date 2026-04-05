package com.webpos.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
public class StaffReportDto {
    private UUID staffId;
    private String staffName;
    private long totalOrders;
    private BigDecimal totalRevenue;
    private double totalHours;
    private BigDecimal estimatedSalary;
}
