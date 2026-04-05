package com.webpos.controller;

import com.webpos.dto.AreaRequest;
import com.webpos.dto.TableRequest;
import com.webpos.entity.TableArea;
import com.webpos.entity.TableEntity;
import com.webpos.enums.TableStatus;
import com.webpos.service.TableService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/tables")
@RequiredArgsConstructor
public class TableController {

    private final TableService tableService;

    // ── Areas ────────────────────────────────────────────────────────────────

    @GetMapping("/areas")
    public ResponseEntity<List<TableArea>> getAreas(@RequestAttribute("storeId") UUID storeId) {
        return ResponseEntity.ok(tableService.getAreas(storeId));
    }

    @PostMapping("/areas")
    public ResponseEntity<TableArea> createArea(
            @RequestAttribute("storeId") UUID storeId,
            @Valid @RequestBody AreaRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(tableService.createArea(storeId, req));
    }

    @PutMapping("/areas/{id}")
    public ResponseEntity<TableArea> updateArea(
            @PathVariable UUID id,
            @Valid @RequestBody AreaRequest req) {
        return ResponseEntity.ok(tableService.updateArea(id, req));
    }

    @DeleteMapping("/areas/{id}")
    public ResponseEntity<Void> deleteArea(@PathVariable UUID id) {
        tableService.deleteArea(id);
        return ResponseEntity.noContent().build();
    }

    // ── Tables ────────────────────────────────────────────────────────────────

    @GetMapping
    public ResponseEntity<List<TableEntity>> getTables(
            @RequestAttribute("storeId") UUID storeId,
            @RequestParam(required = false) UUID areaId) {
        return ResponseEntity.ok(tableService.getTables(storeId, areaId));
    }

    @PostMapping
    public ResponseEntity<TableEntity> createTable(
            @RequestAttribute("storeId") UUID storeId,
            @Valid @RequestBody TableRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(tableService.createTable(storeId, req));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TableEntity> updateTable(
            @PathVariable UUID id,
            @Valid @RequestBody TableRequest req) {
        return ResponseEntity.ok(tableService.updateTable(id, req));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTable(@PathVariable UUID id) {
        tableService.deleteTable(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<TableEntity> updateStatus(
            @PathVariable UUID id,
            @RequestBody Map<String, String> body) {
        TableStatus status = TableStatus.valueOf(body.get("status"));
        return ResponseEntity.ok(tableService.updateStatus(id, status));
    }
}
