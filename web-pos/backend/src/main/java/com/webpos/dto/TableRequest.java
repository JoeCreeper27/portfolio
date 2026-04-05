package com.webpos.dto;

import com.webpos.enums.TableStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class TableRequest {
    @NotNull
    private UUID areaId;

    @NotBlank
    private String tableNumber;

    private int capacity = 4;
    private TableStatus status = TableStatus.EMPTY;
    private Integer sortOrder;
}
