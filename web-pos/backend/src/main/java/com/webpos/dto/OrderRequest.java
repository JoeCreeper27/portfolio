package com.webpos.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderRequest {

    @NotNull(message = "Table ID must not be null")
    private UUID tableId;

    @Min(value = 1, message = "Pax count must be at least 1")
    private int paxCount;

    @NotEmpty(message = "Order must contain at least one item")
    @Valid
    private List<OrderItemRequest> items;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OrderItemRequest {

        @NotNull(message = "Menu item ID must not be null")
        private UUID menuItemId;

        @Min(value = 1, message = "Quantity must be at least 1")
        private int quantity;

        private List<UUID> modifierOptionIds;

        private String note;
    }
}
