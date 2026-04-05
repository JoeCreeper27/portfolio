package com.webpos.controller;

import com.webpos.dto.ClockRequest;
import com.webpos.entity.ClockRecord;
import com.webpos.service.ClockService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/clock")
@RequiredArgsConstructor
public class ClockController {

    private final ClockService clockService;

    @PostMapping("/in")
    public ResponseEntity<ClockRecord> clockIn(
            @RequestAttribute("storeId") UUID storeId,
            @Valid @RequestBody ClockRequest req) {
        return ResponseEntity.ok(clockService.clockIn(storeId, req.getEmployeeId(), req.getPin()));
    }

    @PostMapping("/out")
    public ResponseEntity<ClockRecord> clockOut(
            @RequestAttribute("storeId") UUID storeId,
            @Valid @RequestBody ClockRequest req) {
        return ResponseEntity.ok(clockService.clockOut(storeId, req.getEmployeeId(), req.getPin()));
    }

    @GetMapping("/records")
    public ResponseEntity<List<ClockRecord>> getRecords(
            @RequestAttribute("storeId") UUID storeId,
            @RequestParam(required = false) UUID staffId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        LocalDate from = startDate != null ? startDate : LocalDate.now().withDayOfMonth(1);
        LocalDate to = endDate != null ? endDate : LocalDate.now();
        return ResponseEntity.ok(clockService.getRecords(storeId, staffId, from, to));
    }

    @PutMapping("/records/{id}")
    public ResponseEntity<ClockRecord> updateRecord(
            @PathVariable UUID id,
            @RequestBody Map<String, String> body) {
        LocalDateTime clockIn = LocalDateTime.parse(body.get("clockIn"));
        LocalDateTime clockOut = body.containsKey("clockOut") ? LocalDateTime.parse(body.get("clockOut")) : null;
        String note = body.get("note");
        return ResponseEntity.ok(clockService.updateRecord(id, clockIn, clockOut, note));
    }
}
