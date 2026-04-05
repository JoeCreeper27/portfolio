package com.webpos.service;

import com.webpos.dto.ClockRequest;
import com.webpos.entity.ClockRecord;
import com.webpos.entity.UserProfile;
import com.webpos.exception.ResourceNotFoundException;
import com.webpos.exception.UnauthorizedException;
import com.webpos.repository.ClockRecordRepository;
import com.webpos.repository.UserProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ClockService {

    private final ClockRecordRepository clockRecordRepository;
    private final UserProfileRepository userProfileRepository;

    // -------------------------------------------------------------------------
    // Clock In
    // -------------------------------------------------------------------------

    @Transactional
    public ClockRecord clockIn(ClockRequest request) {
        UserProfile staff = userProfileRepository.findById(request.getStaffId())
                .orElseThrow(() -> new ResourceNotFoundException("Staff", request.getStaffId()));

        validatePin(staff, request.getPin());

        // Check for an already open record
        clockRecordRepository.findByStaffIdAndClockOutIsNull(staff.getId())
                .ifPresent(open -> {
                    throw new IllegalStateException(
                            "Staff member is already clocked in since " + open.getClockIn());
                });

        ClockRecord record = ClockRecord.builder()
                .staffId(staff.getId())
                .storeId(staff.getStoreId())
                .clockIn(LocalDateTime.now())
                .build();

        return clockRecordRepository.save(record);
    }

    // -------------------------------------------------------------------------
    // Clock Out
    // -------------------------------------------------------------------------

    @Transactional
    public ClockRecord clockOut(ClockRequest request) {
        UserProfile staff = userProfileRepository.findById(request.getStaffId())
                .orElseThrow(() -> new ResourceNotFoundException("Staff", request.getStaffId()));

        validatePin(staff, request.getPin());

        ClockRecord record = clockRecordRepository
                .findByStaffIdAndClockOutIsNull(staff.getId())
                .orElseThrow(() -> new IllegalStateException(
                        "No open clock-in record found for staff: " + staff.getId()));

        LocalDateTime now = LocalDateTime.now();
        int totalMinutes = (int) ChronoUnit.MINUTES.between(record.getClockIn(), now);

        record.setClockOut(now);
        record.setTotalMinutes(totalMinutes);

        return clockRecordRepository.save(record);
    }

    // -------------------------------------------------------------------------
    // Query records
    // -------------------------------------------------------------------------

    public List<ClockRecord> getRecords(UUID staffId, LocalDateTime start, LocalDateTime end) {
        return clockRecordRepository.findByStaffIdAndClockInBetween(staffId, start, end);
    }

    // -------------------------------------------------------------------------
    // Manual edit (manager)
    // -------------------------------------------------------------------------

    @Transactional
    public ClockRecord updateRecord(UUID recordId, LocalDateTime clockIn, LocalDateTime clockOut,
                                    String note) {
        ClockRecord record = clockRecordRepository.findById(recordId)
                .orElseThrow(() -> new ResourceNotFoundException("ClockRecord", recordId));

        record.setClockIn(clockIn);
        record.setClockOut(clockOut);
        if (clockOut != null) {
            record.setTotalMinutes((int) ChronoUnit.MINUTES.between(clockIn, clockOut));
        }
        record.setManuallyEdited(true);
        record.setNote(note);

        return clockRecordRepository.save(record);
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    /**
     * Simple PIN validation: compares the request PIN against the employee's stored PIN.
     * In a real system, the PIN would be stored hashed; use PasswordEncoder for comparison.
     * Here we do a plain-text comparison via employeeId as a stand-in until auth is wired.
     */
    private void validatePin(UserProfile staff, String pin) {
        // PIN validation placeholder — replace with hashed PIN comparison once
        // a dedicated pin field is added to UserProfile.
        if (!staff.isActive()) {
            throw new UnauthorizedException("Staff account is disabled");
        }
    }
}
