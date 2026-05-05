package com.nexacore.inventory.modules.auth.dto;

public record UserProfileResponse(
    String username,
    String fullName,
    String email,
    String phoneNumber,
    String companyName
) {
}
