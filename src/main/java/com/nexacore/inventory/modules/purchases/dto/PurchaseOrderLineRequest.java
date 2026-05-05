package com.nexacore.inventory.modules.purchases.dto;

import java.time.LocalDate;

public record PurchaseOrderLineRequest(
    String itemName,
    Integer orderedQty,
    Double unitCost,
    LocalDate expectedDate
) {
}
