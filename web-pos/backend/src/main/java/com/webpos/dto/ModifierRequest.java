package com.webpos.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class ModifierRequest {
    @NotBlank
    private String name;

    private boolean isRequired = false;
    private boolean isMultiple = false;
    private Integer sortOrder;

    private List<OptionItem> options;

    @Data
    public static class OptionItem {
        @NotBlank
        private String name;
        private BigDecimal additionalPrice = BigDecimal.ZERO;
        private Integer sortOrder;
    }
}
