package com.nexacore.inventory.modules.purchases.dto;

import java.time.LocalDate;
import java.util.List;

public record PurchaseOrderCreateRequest(
    String supplier,
    LocalDate orderDate,
    LocalDate expectedDeliveryDate,
    String deliveryAddress,
    String paymentTerms,
    String internalNotes,
    String supplierInstructions,
    String termsAndConditions,
    String status,
    List<PurchaseOrderLineRequest> items
) {
}
