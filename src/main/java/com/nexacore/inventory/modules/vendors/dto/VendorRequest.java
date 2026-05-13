package com.nexacore.inventory.modules.vendors.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record VendorRequest(
    @NotBlank String companyName,
    String phone,
    String email,
    String accountName,
    String bankName,
    String branchName,
    String accountNumber,
    @NotEmpty @Valid List<VendorSuppliedProductRequest> suppliedProducts
) {
}
