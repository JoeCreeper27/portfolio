package com.webpos.dto;

import com.webpos.enums.MenuItemStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MenuItemRequest {

    @NotBlank(message = "Menu item name must not be blank")
    private String name;

    private UUID categoryId;

    @NotNull(message = "Price must not be null")
    @PositiveOrZero(message = "Price must be zero or positive")
    private BigDecimal price;

    @PositiveOrZero(message = "Cost must be zero or positive")
    private BigDecimal cost;

    private String imageUrl;

    private String description;

    private MenuItemStatus status;

    private int sortOrder;
}
