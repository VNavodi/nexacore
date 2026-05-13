package com.nexacore.inventory.modules.vendors.controller;

import com.nexacore.inventory.modules.vendors.dto.VendorRequest;
import com.nexacore.inventory.modules.vendors.dto.VendorResponse;
import com.nexacore.inventory.modules.vendors.service.VendorService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/vendors")
public class VendorController {

    private final VendorService vendorService;

    public VendorController(VendorService vendorService) {
        this.vendorService = vendorService;
    }

    @GetMapping
    public ResponseEntity<List<VendorResponse>> listVendors() {
        return ResponseEntity.ok(vendorService.getAllVendors());
    }

    @GetMapping("/{id}")
    public ResponseEntity<VendorResponse> getVendor(@PathVariable Long id) {
        return ResponseEntity.ok(vendorService.getVendorById(id));
    }

    @PostMapping
    public ResponseEntity<VendorResponse> createVendor(@RequestBody @Valid VendorRequest request) {
        return ResponseEntity.status(201).body(vendorService.createVendor(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<VendorResponse> updateVendor(
        @PathVariable Long id,
        @RequestBody @Valid VendorRequest request
    ) {
        return ResponseEntity.ok(vendorService.updateVendor(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteVendor(@PathVariable Long id) {
        vendorService.deleteVendor(id);
        return ResponseEntity.noContent().build();
    }
}
