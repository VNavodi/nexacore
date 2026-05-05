package com.nexacore.inventory.modules.purchases.infrastructure;

import com.nexacore.inventory.modules.purchases.domain.PurchaseOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PurchaseOrderRepository extends JpaRepository<PurchaseOrder, Long> {
}
