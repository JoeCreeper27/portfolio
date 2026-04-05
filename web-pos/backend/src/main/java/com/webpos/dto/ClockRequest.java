package com.webpos.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClockRequest {

    @NotNull(message = "Staff ID must not be null")
    private UUID staffId;

    @NotBlank(message = "PIN must not be blank")
    private String pin;

    @NotNull(message = "Clock type must not be null")
    private ClockType type;

    public enum ClockType {
        IN, OUT
    }
}
