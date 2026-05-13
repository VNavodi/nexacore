package com.nexacore.inventory.modules.vendors.dto;

import java.time.LocalDateTime;
import java.util.List;

public record VendorResponse(
    Long id,
    String companyName,
    String phone,
    String email,
    String accountName,
    String bankName,
    String branchName,
    String accountNumber,
    List<VendorSuppliedProductResponse> suppliedProducts,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {
}
