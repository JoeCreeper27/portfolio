package com.webpos.dto;

import com.webpos.enums.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class StaffRequest {
    @NotBlank
    private String name;

    @NotBlank
    private String employeeId;

    @NotNull
    private UserRole role;

    private String phone;

    @Email
    private String email;

    private String pin;

    private BigDecimal hourlyRate;
    private BigDecimal monthlySalary;
    private LocalDate hireDate;
}
