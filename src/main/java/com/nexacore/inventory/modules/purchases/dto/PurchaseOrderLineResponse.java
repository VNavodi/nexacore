package com.nexacore.inventory.modules.purchases.dto;

import java.time.LocalDate;

public record PurchaseOrderLineResponse(
    Long id,
    String itemName,
    Integer orderedQty,
    Double unitCost,
    LocalDate expectedDate,
    Integer receivedQty,
    Double lineTotal
) {
}
