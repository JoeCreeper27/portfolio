package com.webpos.repository;

import com.webpos.entity.ModifierOption;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ModifierOptionRepository extends JpaRepository<ModifierOption, UUID> {
    List<ModifierOption> findByModifierIdOrderBySortOrderAsc(UUID modifierId);
    void deleteByModifierId(UUID modifierId);
}
