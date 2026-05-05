package com.nexacore.inventory.modules.purchases.application;

import com.nexacore.inventory.modules.purchases.domain.PurchaseOrder;
import com.nexacore.inventory.modules.purchases.domain.PurchaseOrderLine;
import com.nexacore.inventory.modules.purchases.domain.PurchaseOrderStatus;
import com.nexacore.inventory.modules.purchases.dto.PurchaseOrderCreateRequest;
import com.nexacore.inventory.modules.purchases.dto.PurchaseOrderLineRequest;
import com.nexacore.inventory.modules.purchases.dto.PurchaseOrderLineResponse;
import com.nexacore.inventory.modules.purchases.dto.PurchaseOrderResponse;
import com.nexacore.inventory.modules.purchases.infrastructure.PurchaseOrderRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;

@Service
public class PurchaseOrderService {

    private final PurchaseOrderRepository purchaseOrderRepository;

    public PurchaseOrderService(PurchaseOrderRepository purchaseOrderRepository) {
        this.purchaseOrderRepository = purchaseOrderRepository;
    }

    @Transactional(readOnly = true)
    public List<PurchaseOrderResponse> getAllPurchaseOrders() {
        return purchaseOrderRepository.findAll().stream()
            .sorted(Comparator.comparing(PurchaseOrder::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
            .map(this::toResponse)
            .toList();
    }

    @Transactional
    public PurchaseOrderResponse createPurchaseOrder(PurchaseOrderCreateRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Request body is required");
        }

        String supplier = safeTrim(request.supplier());
        if (supplier.isEmpty()) {
            throw new IllegalArgumentException("Supplier is required");
        }

        List<PurchaseOrderLineRequest> requestItems = request.items() == null ? List.of() : request.items();
        if (requestItems.isEmpty()) {
            throw new IllegalArgumentException("At least one item is required");
        }

        PurchaseOrderStatus status = parseStatus(request.status());
        LocalDate orderDate = request.orderDate() == null ? LocalDate.now() : request.orderDate();

        PurchaseOrder purchaseOrder = PurchaseOrder.builder()
            .supplier(supplier)
            .orderDate(orderDate)
            .expectedDeliveryDate(request.expectedDeliveryDate())
            .deliveryAddress(safeTrim(request.deliveryAddress()))
            .paymentTerms(safeTrim(request.paymentTerms()))
            .internalNotes(safeTrim(request.internalNotes()))
            .supplierInstructions(safeTrim(request.supplierInstructions()))
            .termsAndConditions(safeTrim(request.termsAndConditions()))
            .status(status)
            .subtotal(0.0)
            .tax(0.0)
            .grandTotal(0.0)
            .items(new ArrayList<>())
            .build();

        for (PurchaseOrderLineRequest lineRequest : requestItems) {
            String itemName = safeTrim(lineRequest.itemName());
            Integer orderedQty = lineRequest.orderedQty() == null ? 0 : lineRequest.orderedQty();
            Double unitCost = lineRequest.unitCost() == null ? 0.0 : lineRequest.unitCost();

            if (itemName.isEmpty()) {
                throw new IllegalArgumentException("Item name is required for all lines");
            }
            if (orderedQty <= 0) {
                throw new IllegalArgumentException("Ordered quantity must be greater than 0");
            }
            if (unitCost < 0) {
                throw new IllegalArgumentException("Unit cost cannot be negative");
            }

            PurchaseOrderLine line = PurchaseOrderLine.builder()
                .purchaseOrder(purchaseOrder)
                .itemName(itemName)
                .orderedQty(orderedQty)
                .unitCost(unitCost)
                .expectedDate(lineRequest.expectedDate())
                .receivedQty(0)
                .build();

            purchaseOrder.getItems().add(line);
        }

        double subtotal = purchaseOrder.getItems().stream()
            .mapToDouble(item -> item.getOrderedQty() * item.getUnitCost())
            .sum();
        double tax = subtotal * 0.1;
        purchaseOrder.setSubtotal(subtotal);
        purchaseOrder.setTax(tax);
        purchaseOrder.setGrandTotal(subtotal + tax);

        PurchaseOrder saved = purchaseOrderRepository.save(purchaseOrder);

        if (saved.getPoNumber() == null || saved.getPoNumber().isBlank()) {
            saved.setPoNumber("PO-" + String.format("%05d", saved.getId()));
            saved = purchaseOrderRepository.save(saved);
        }

        return toResponse(saved);
    }

    @Transactional
    public PurchaseOrderResponse updatePurchaseOrder(Long id, PurchaseOrderCreateRequest request) {
        PurchaseOrder existing = purchaseOrderRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Purchase order not found: " + id));

        String supplier = safeTrim(request.supplier());
        if (supplier.isEmpty()) {
            throw new IllegalArgumentException("Supplier is required");
        }

        List<PurchaseOrderLineRequest> requestItems = request.items() == null ? List.of() : request.items();
        if (requestItems.isEmpty()) {
            throw new IllegalArgumentException("At least one item is required");
        }

        PurchaseOrderStatus status = parseStatus(request.status());
        LocalDate orderDate = request.orderDate() == null ? LocalDate.now() : request.orderDate();

        existing.setSupplier(supplier);
        existing.setOrderDate(orderDate);
        existing.setExpectedDeliveryDate(request.expectedDeliveryDate());
        existing.setDeliveryAddress(safeTrim(request.deliveryAddress()));
        existing.setPaymentTerms(safeTrim(request.paymentTerms()));
        existing.setInternalNotes(safeTrim(request.internalNotes()));
        existing.setSupplierInstructions(safeTrim(request.supplierInstructions()));
        existing.setTermsAndConditions(safeTrim(request.termsAndConditions()));
        existing.setStatus(status);

        // Replace lines
        existing.getItems().clear();
        for (PurchaseOrderLineRequest lineRequest : requestItems) {
            String itemName = safeTrim(lineRequest.itemName());
            Integer orderedQty = lineRequest.orderedQty() == null ? 0 : lineRequest.orderedQty();
            Double unitCost = lineRequest.unitCost() == null ? 0.0 : lineRequest.unitCost();

            if (itemName.isEmpty()) {
                throw new IllegalArgumentException("Item name is required for all lines");
            }
            if (orderedQty <= 0) {
                throw new IllegalArgumentException("Ordered quantity must be greater than 0");
            }
            if (unitCost < 0) {
                throw new IllegalArgumentException("Unit cost cannot be negative");
            }

            PurchaseOrderLine line = PurchaseOrderLine.builder()
                .purchaseOrder(existing)
                .itemName(itemName)
                .orderedQty(orderedQty)
                .unitCost(unitCost)
                .expectedDate(lineRequest.expectedDate())
                .receivedQty(lineRequest.receivedQty() == null ? 0 : lineRequest.receivedQty())
                .build();

            existing.getItems().add(line);
        }

        double subtotal = existing.getItems().stream()
            .mapToDouble(item -> item.getOrderedQty() * item.getUnitCost())
            .sum();
        double tax = subtotal * 0.1;
        existing.setSubtotal(subtotal);
        existing.setTax(tax);
        existing.setGrandTotal(subtotal + tax);

        PurchaseOrder saved = purchaseOrderRepository.save(existing);
        return toResponse(saved);
    }

    @Transactional
    public void deletePurchaseOrder(Long id) {
        if (!purchaseOrderRepository.existsById(id)) {
            throw new IllegalArgumentException("Purchase order not found: " + id);
        }
        purchaseOrderRepository.deleteById(id);
    }

    private PurchaseOrderStatus parseStatus(String rawStatus) {
        if (rawStatus == null || rawStatus.isBlank()) {
            return PurchaseOrderStatus.ORDERED;
        }
        String normalized = rawStatus.trim().toUpperCase(Locale.ROOT);
        return switch (normalized) {
            case "DRAFT" -> PurchaseOrderStatus.DRAFT;
            case "ORDERED" -> PurchaseOrderStatus.ORDERED;
            case "PARTIAL" -> PurchaseOrderStatus.PARTIAL;
            case "COMPLETED" -> PurchaseOrderStatus.COMPLETED;
            default -> throw new IllegalArgumentException("Invalid status: " + rawStatus);
        };
    }

    private PurchaseOrderResponse toResponse(PurchaseOrder purchaseOrder) {
        List<PurchaseOrderLineResponse> itemResponses = purchaseOrder.getItems().stream()
            .map(line -> new PurchaseOrderLineResponse(
                line.getId(),
                line.getItemName(),
                line.getOrderedQty(),
                line.getUnitCost(),
                line.getExpectedDate(),
                line.getReceivedQty(),
                line.getOrderedQty() * line.getUnitCost()
            ))
            .toList();

        int totalItems = itemResponses.stream()
            .mapToInt(PurchaseOrderLineResponse::orderedQty)
            .sum();

        return new PurchaseOrderResponse(
            purchaseOrder.getId(),
            purchaseOrder.getPoNumber(),
            purchaseOrder.getSupplier(),
            purchaseOrder.getOrderDate(),
            purchaseOrder.getExpectedDeliveryDate(),
            purchaseOrder.getDeliveryAddress(),
            purchaseOrder.getPaymentTerms(),
            purchaseOrder.getInternalNotes(),
            purchaseOrder.getSupplierInstructions(),
            purchaseOrder.getTermsAndConditions(),
            purchaseOrder.getStatus().name().toLowerCase(Locale.ROOT),
            totalItems,
            purchaseOrder.getSubtotal(),
            purchaseOrder.getTax(),
            purchaseOrder.getGrandTotal(),
            purchaseOrder.getCreatedAt(),
            purchaseOrder.getUpdatedAt(),
            itemResponses
        );
    }

    private String safeTrim(String value) {
        return value == null ? "" : value.trim();
    }
}
