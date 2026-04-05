package com.webpos.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
public class ItemReportDto {
    private String menuItemName;
    private long totalQuantity;
    private BigDecimal totalRevenue;
}
