package com.nexacore.inventory.modules.inventory.service;

import com.nexacore.inventory.modules.inventory.model.Product;
import com.nexacore.inventory.modules.inventory.repository.ProductRepository;
import com.nexacore.inventory.modules.inventory.dto.StockAdjustmentRequest;
import com.nexacore.inventory.modules.inventory.model.StockAdjustment;
import com.nexacore.inventory.modules.inventory.repository.StockAdjustmentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class StockService {

    private final ProductRepository productRepository;
    private final StockAdjustmentRepository stockAdjustmentRepository;

    public StockService(ProductRepository productRepository, StockAdjustmentRepository stockAdjustmentRepository) {
        this.productRepository = productRepository;
        this.stockAdjustmentRepository = stockAdjustmentRepository;
    }

    @Transactional
    public Product applyStockAdjustment(StockAdjustmentRequest request) {
        if (request.quantity() == null || request.quantity() == 0) {
            throw new IllegalArgumentException("Quantity must not be zero");
        }

        Product product = productRepository.findBySku(request.sku())
            .orElseThrow(() -> new RuntimeException("Product not found with sku: " + request.sku()));

        int currentStock = product.getStockOnHand() == null ? 0 : product.getStockOnHand();
        int delta = calculateDelta(request.operation(), request.quantity());
        int afterStock = currentStock + delta;

        if (afterStock < 0) {
            throw new IllegalArgumentException("Stock cannot go below zero");
        }

        product.setStockOnHand(afterStock);
        Product savedProduct = productRepository.save(product);

        if (request.reason() != null) {
            StockAdjustment adjustment = StockAdjustment.builder()
                .sku(request.sku())
                .adjustCount(delta)
                .reason(request.reason())
                .notes(request.notes())
                .build();
            stockAdjustmentRepository.save(adjustment);
        }

        return savedProduct;
    }

    private int calculateDelta(String operation, Integer quantity) {
        String normalized = operation == null ? "" : operation.trim().toLowerCase();
        return switch (normalized) {
            case "increase", "purchase", "return" -> quantity;
            case "decrease", "sale" -> -quantity;
            case "adjust", "adjustment" -> quantity;
            default -> throw new IllegalArgumentException("Operation must be increase, decrease, or adjustment");
        };
    }
}
