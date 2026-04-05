package com.webpos.repository;

import com.webpos.entity.TableArea;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface TableAreaRepository extends JpaRepository<TableArea, UUID> {
    List<TableArea> findByStoreIdOrderBySortOrderAsc(UUID storeId);
}
