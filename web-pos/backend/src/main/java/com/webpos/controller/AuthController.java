package com.webpos.controller;

import com.webpos.config.JwtUtil;
import com.webpos.dto.LoginRequest;
import com.webpos.dto.LoginResponse;
import com.webpos.entity.UserProfile;
import com.webpos.exception.UnauthorizedException;
import com.webpos.repository.UserProfileRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserProfileRepository userProfileRepository;
    private final JwtUtil jwtUtil;

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest req) {
        UserProfile user = userProfileRepository.findByEmail(req.getEmail())
                .orElseThrow(() -> new UnauthorizedException("Invalid email or password"));

        if (!user.isActive()) {
            throw new UnauthorizedException("Account is disabled");
        }

        // PIN-based auth for staff, email/password for managers+
        boolean valid = (req.getPassword() != null && req.getPassword().equals(user.getPin()))
                || (req.getPassword() != null && req.getPassword().equals(user.getPasswordHash()));

        if (!valid) {
            throw new UnauthorizedException("Invalid email or password");
        }

        String token = jwtUtil.generateToken(user.getId().toString(), user.getEmail(), user.getRole().name(), user.getStoreId().toString());

        return ResponseEntity.ok(LoginResponse.builder()
                .token(token)
                .userId(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .role(user.getRole().name())
                .storeId(user.getStoreId())
                .build());
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout() {
        // Stateless JWT — client discards the token
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me")
    public ResponseEntity<UserProfile> me(@AuthenticationPrincipal UserDetails userDetails) {
        UserProfile user = userProfileRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new UnauthorizedException("User not found"));
        return ResponseEntity.ok(user);
    }
}
