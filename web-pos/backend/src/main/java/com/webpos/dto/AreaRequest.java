package com.webpos.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AreaRequest {
    @NotBlank
    private String name;
    private Integer sortOrder = 0;
}
