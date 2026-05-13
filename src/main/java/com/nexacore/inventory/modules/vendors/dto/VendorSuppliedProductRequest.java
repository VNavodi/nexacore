package com.nexacore.inventory.modules.vendors.dto;

import jakarta.validation.constraints.NotBlank;

public record VendorSuppliedProductRequest(
    @NotBlank String productName,
    @NotBlank String category
) {
}
