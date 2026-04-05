package com.webpos.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "modifiers")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Modifier {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "menu_item_id", nullable = false)
    private UUID menuItemId;

    @Column(nullable = false)
    private String name;

    @Column(name = "is_required", nullable = false)
    @Builder.Default
    private boolean isRequired = false;

    @Column(name = "is_multiple", nullable = false)
    @Builder.Default
    private boolean isMultiple = false;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
