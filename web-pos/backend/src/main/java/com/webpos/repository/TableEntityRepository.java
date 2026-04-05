package com.webpos.repository;

import com.webpos.entity.TableEntity;
import com.webpos.enums.TableStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TableEntityRepository extends JpaRepository<TableEntity, UUID> {

    List<TableEntity> findByStoreId(UUID storeId);

    List<TableEntity> findByStoreIdAndAreaId(UUID storeId, UUID areaId);

    List<TableEntity> findByStoreIdAndStatus(UUID storeId, TableStatus status);
}
