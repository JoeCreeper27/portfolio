package com.webpos.controller;

import com.webpos.dto.DailyReportDto;
import com.webpos.dto.ItemReportDto;
import com.webpos.dto.StaffReportDto;
import com.webpos.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/daily")
    public ResponseEntity<DailyReportDto> getDailyReport(
            @RequestAttribute("storeId") UUID storeId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        LocalDate reportDate = date != null ? date : LocalDate.now();
        return ResponseEntity.ok(reportService.getDailyReport(storeId, reportDate));
    }

    @GetMapping("/items")
    public ResponseEntity<List<ItemReportDto>> getItemReport(
            @RequestAttribute("storeId") UUID storeId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        LocalDate from = startDate != null ? startDate : LocalDate.now().withDayOfMonth(1);
        LocalDate to = endDate != null ? endDate : LocalDate.now();
        return ResponseEntity.ok(reportService.getItemReport(storeId, from, to));
    }

    @GetMapping("/staff")
    public ResponseEntity<StaffReportDto> getStaffReport(
            @RequestAttribute("storeId") UUID storeId,
            @RequestParam UUID staffId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        LocalDate from = startDate != null ? startDate : LocalDate.now().withDayOfMonth(1);
        LocalDate to = endDate != null ? endDate : LocalDate.now();
        return ResponseEntity.ok(reportService.getStaffReport(storeId, staffId, from, to));
    }
}
