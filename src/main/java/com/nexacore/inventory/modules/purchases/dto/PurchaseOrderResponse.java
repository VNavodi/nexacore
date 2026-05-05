package com.nexacore.inventory.modules.purchases.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record PurchaseOrderResponse(
    Long id,
    String poNumber,
    String supplier,
    LocalDate orderDate,
    LocalDate expectedDeliveryDate,
    String deliveryAddress,
    String paymentTerms,
    String internalNotes,
    String supplierInstructions,
    String termsAndConditions,
    String status,
    Integer totalItems,
    Double subtotal,
    Double tax,
    Double grandTotal,
    LocalDateTime createdAt,
    LocalDateTime updatedAt,
    List<PurchaseOrderLineResponse> items
) {
}
