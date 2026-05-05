package com.nexacore.inventory.modules.auth.dto;

public record RegisterRequest(
	String username,
	String fullName,
	String companyName,
	String email,
	String phoneNumber,
	String password,
	String confirmPassword
) {
}
