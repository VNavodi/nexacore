package com.nexacore.inventory.modules.vendors.dto;

public record VendorSuppliedProductResponse(
    Long id,
    String productName,
    String category
) {
}
