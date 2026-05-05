package com.nexacore.inventory.modules.auth.service;

import com.nexacore.inventory.modules.auth.dto.LoginRequest;
import com.nexacore.inventory.modules.auth.dto.LoginResponse;
import com.nexacore.inventory.modules.auth.dto.RegisterRequest;
import com.nexacore.inventory.modules.auth.model.AppUser;
import com.nexacore.inventory.modules.auth.repository.AppUserRepository;
import com.nexacore.inventory.modules.auth.security.JwtUtil;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final AppUserRepository appUserRepository;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;

    public AuthService(AppUserRepository appUserRepository, JwtUtil jwtUtil, PasswordEncoder passwordEncoder) {
        this.appUserRepository = appUserRepository;
        this.jwtUtil = jwtUtil;
        this.passwordEncoder = passwordEncoder;
    }

    public LoginResponse register(RegisterRequest request) {
        String username = request.username() == null ? "" : request.username().trim();
        String fullName = request.fullName() == null ? "" : request.fullName().trim();
        String companyName = request.companyName() == null ? "" : request.companyName().trim();
        String email = request.email() == null ? "" : request.email().trim();
        String phoneNumber = request.phoneNumber() == null ? "" : request.phoneNumber().trim();
        String password = request.password() == null ? "" : request.password().trim();
        String confirmPassword = request.confirmPassword() == null ? "" : request.confirmPassword().trim();

        if (username.isEmpty()) {
            throw new IllegalArgumentException("Username is required");
        }
        if (email.isEmpty()) {
            throw new IllegalArgumentException("Email is required");
        }
        if (companyName.isEmpty()) {
            throw new IllegalArgumentException("Company name is required");
        }
        if (password.isEmpty()) {
            throw new IllegalArgumentException("Password is required");
        }
        if (phoneNumber.isEmpty()) {
            throw new IllegalArgumentException("Phone number is required");
        }
        if (confirmPassword.isEmpty()) {
            throw new IllegalArgumentException("Confirm password is required");
        }
        if (!password.equals(confirmPassword)) {
            throw new IllegalArgumentException("Password and confirm password do not match");
        }

        if (appUserRepository.existsByUsernameIgnoreCase(username)) {
            throw new IllegalArgumentException("Username already exists");
        }
        if (appUserRepository.existsByEmailIgnoreCase(email)) {
            throw new IllegalArgumentException("Email already exists");
        }

        AppUser user = AppUser.builder()
            .username(username)
            .fullName(fullName)
            .companyName(companyName)
            .email(email)
            .phoneNumber(phoneNumber)
            .passwordHash(passwordEncoder.encode(password))
            .build();

        appUserRepository.save(user);
        return new LoginResponse(jwtUtil.generateToken(user.getUsername()));
    }

    public LoginResponse login(LoginRequest request) {
        String username = request.username() == null ? "" : request.username().trim();
        String password = request.password() == null ? "" : request.password().trim();

        AppUser user = appUserRepository.findByUsernameIgnoreCase(username)
            .or(() -> appUserRepository.findByEmailIgnoreCase(username))
            .orElseThrow(() -> new IllegalArgumentException("Invalid credentials"));

        if (passwordEncoder.matches(password, user.getPasswordHash())) {
            return new LoginResponse(jwtUtil.generateToken(user.getUsername()));
        }

        throw new IllegalArgumentException("Invalid credentials");
    }
}
