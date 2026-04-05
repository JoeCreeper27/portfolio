package com.webpos.controller;

import com.webpos.dto.StaffRequest;
import com.webpos.entity.UserProfile;
import com.webpos.service.StaffService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/staff")
@RequiredArgsConstructor
public class StaffController {

    private final StaffService staffService;

    @GetMapping
    public ResponseEntity<List<UserProfile>> getStaff(@RequestAttribute("storeId") UUID storeId) {
        return ResponseEntity.ok(staffService.getStaff(storeId));
    }

    @PostMapping
    public ResponseEntity<UserProfile> createStaff(
            @RequestAttribute("storeId") UUID storeId,
            @Valid @RequestBody StaffRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(staffService.createStaff(storeId, req));
    }

    @PutMapping("/{id}")
    public ResponseEntity<UserProfile> updateStaff(
            @PathVariable UUID id,
            @Valid @RequestBody StaffRequest req) {
        return ResponseEntity.ok(staffService.updateStaff(id, req));
    }

    @PatchMapping("/{id}/disable")
    public ResponseEntity<Void> disableStaff(@PathVariable UUID id) {
        staffService.disableStaff(id);
        return ResponseEntity.noContent().build();
    }
}
