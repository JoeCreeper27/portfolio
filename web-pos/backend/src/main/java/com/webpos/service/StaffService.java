package com.webpos.service;

import com.webpos.dto.StaffRequest;
import com.webpos.entity.UserProfile;
import com.webpos.exception.ResourceNotFoundException;
import com.webpos.repository.UserProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class StaffService {

    private final UserProfileRepository userProfileRepository;

    public List<UserProfile> getStaff(UUID storeId) {
        return userProfileRepository.findByStoreIdAndIsActiveTrue(storeId);
    }

    @Transactional
    public UserProfile createStaff(UUID storeId, StaffRequest req) {
        UserProfile profile = new UserProfile();
        profile.setStoreId(storeId);
        profile.setName(req.getName());
        profile.setEmployeeId(req.getEmployeeId());
        profile.setRole(req.getRole());
        profile.setPhone(req.getPhone());
        profile.setEmail(req.getEmail());
        profile.setPin(req.getPin());
        profile.setHourlyRate(req.getHourlyRate());
        profile.setMonthlySalary(req.getMonthlySalary());
        profile.setHireDate(req.getHireDate());
        profile.setActive(true);
        return userProfileRepository.save(profile);
    }

    @Transactional
    public UserProfile updateStaff(UUID id, StaffRequest req) {
        UserProfile profile = userProfileRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Staff not found: " + id));
        profile.setName(req.getName());
        profile.setEmployeeId(req.getEmployeeId());
        profile.setRole(req.getRole());
        profile.setPhone(req.getPhone());
        profile.setEmail(req.getEmail());
        if (req.getPin() != null && !req.getPin().isBlank()) {
            profile.setPin(req.getPin());
        }
        profile.setHourlyRate(req.getHourlyRate());
        profile.setMonthlySalary(req.getMonthlySalary());
        profile.setHireDate(req.getHireDate());
        return userProfileRepository.save(profile);
    }

    @Transactional
    public void disableStaff(UUID id) {
        UserProfile profile = userProfileRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Staff not found: " + id));
        profile.setActive(false);
        userProfileRepository.save(profile);
    }
}
