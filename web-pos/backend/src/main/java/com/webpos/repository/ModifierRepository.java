package com.webpos.repository;

import com.webpos.entity.Modifier;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ModifierRepository extends JpaRepository<Modifier, UUID> {
    List<Modifier> findByMenuItemIdOrderBySortOrderAsc(UUID menuItemId);
}
