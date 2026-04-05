package com.webpos.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "modifier_options")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ModifierOption {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "modifier_id", nullable = false)
    private UUID modifierId;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal price = BigDecimal.ZERO;

    @Column(name = "sort_order")
    private int sortOrder;
}
