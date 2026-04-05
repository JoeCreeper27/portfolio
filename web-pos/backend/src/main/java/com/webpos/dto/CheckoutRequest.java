package com.webpos.dto;

import com.webpos.enums.PaymentMethod;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CheckoutRequest {

    @NotNull(message = "Payment method must not be null")
    private PaymentMethod paymentMethod;

    @NotNull(message = "Amount must not be null")
    @PositiveOrZero(message = "Amount must be zero or positive")
    private BigDecimal amount;

    @PositiveOrZero(message = "Received amount must be zero or positive")
    private BigDecimal receivedAmount;

    @PositiveOrZero(message = "Discount amount must be zero or positive")
    private BigDecimal discountAmount;

    private String note;
}
