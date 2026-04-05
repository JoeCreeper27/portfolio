package com.webpos.service;

import com.webpos.dto.AreaRequest;
import com.webpos.dto.TableRequest;
import com.webpos.entity.TableArea;
import com.webpos.entity.TableEntity;
import com.webpos.enums.TableStatus;
import com.webpos.exception.ResourceNotFoundException;
import com.webpos.repository.TableAreaRepository;
import com.webpos.repository.TableEntityRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TableService {

    private final TableAreaRepository tableAreaRepository;
    private final TableEntityRepository tableEntityRepository;

    // ── Areas ───────────────────────────────────────────────────────────────

    public List<TableArea> getAreas(UUID storeId) {
        return tableAreaRepository.findByStoreIdOrderBySortOrderAsc(storeId);
    }

    @Transactional
    public TableArea createArea(UUID storeId, AreaRequest req) {
        TableArea area = new TableArea();
        area.setStoreId(storeId);
        area.setName(req.getName());
        area.setSortOrder(req.getSortOrder() != null ? req.getSortOrder() : 0);
        return tableAreaRepository.save(area);
    }

    @Transactional
    public TableArea updateArea(UUID id, AreaRequest req) {
        TableArea area = tableAreaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Area not found: " + id));
        area.setName(req.getName());
        if (req.getSortOrder() != null) area.setSortOrder(req.getSortOrder());
        return tableAreaRepository.save(area);
    }

    @Transactional
    public void deleteArea(UUID id) {
        if (!tableAreaRepository.existsById(id)) {
            throw new ResourceNotFoundException("Area not found: " + id);
        }
        tableAreaRepository.deleteById(id);
    }

    // ── Tables ──────────────────────────────────────────────────────────────

    public List<TableEntity> getTables(UUID storeId, UUID areaId) {
        if (areaId != null) {
            return tableEntityRepository.findByAreaIdOrderByTableNumberAsc(areaId);
        }
        return tableEntityRepository.findByStoreIdOrderByTableNumberAsc(storeId);
    }

    @Transactional
    public TableEntity createTable(UUID storeId, TableRequest req) {
        TableEntity table = new TableEntity();
        table.setStoreId(storeId);
        table.setAreaId(req.getAreaId());
        table.setTableNumber(req.getTableNumber());
        table.setCapacity(req.getCapacity());
        table.setStatus(req.getStatus() != null ? req.getStatus() : TableStatus.EMPTY);
        if (req.getSortOrder() != null) table.setSortOrder(req.getSortOrder());
        return tableEntityRepository.save(table);
    }

    @Transactional
    public TableEntity updateTable(UUID id, TableRequest req) {
        TableEntity table = tableEntityRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Table not found: " + id));
        table.setAreaId(req.getAreaId());
        table.setTableNumber(req.getTableNumber());
        table.setCapacity(req.getCapacity());
        if (req.getStatus() != null) table.setStatus(req.getStatus());
        if (req.getSortOrder() != null) table.setSortOrder(req.getSortOrder());
        return tableEntityRepository.save(table);
    }

    @Transactional
    public void deleteTable(UUID id) {
        if (!tableEntityRepository.existsById(id)) {
            throw new ResourceNotFoundException("Table not found: " + id);
        }
        tableEntityRepository.deleteById(id);
    }

    @Transactional
    public TableEntity updateStatus(UUID id, TableStatus status) {
        TableEntity table = tableEntityRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Table not found: " + id));
        table.setStatus(status);
        return tableEntityRepository.save(table);
    }
}
