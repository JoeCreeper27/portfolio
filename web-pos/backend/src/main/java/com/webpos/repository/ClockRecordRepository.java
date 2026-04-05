package com.webpos.repository;

import com.webpos.entity.ClockRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ClockRecordRepository extends JpaRepository<ClockRecord, UUID> {

    /** Find an open (not yet clocked-out) record for the given staff member. */
    Optional<ClockRecord> findByStaffIdAndClockOutIsNull(UUID staffId);

    /** Find all records for a staff member within a clock-in time range. */
    List<ClockRecord> findByStaffIdAndClockInBetween(UUID staffId,
                                                      LocalDateTime start,
                                                      LocalDateTime end);
}
