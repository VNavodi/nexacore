package com.nexacore.inventory.modules.vendors.service;

import com.nexacore.inventory.modules.vendors.dto.VendorRequest;
import com.nexacore.inventory.modules.vendors.dto.VendorResponse;
import com.nexacore.inventory.modules.vendors.dto.VendorSuppliedProductRequest;
import com.nexacore.inventory.modules.vendors.dto.VendorSuppliedProductResponse;
import com.nexacore.inventory.modules.vendors.model.Vendor;
import com.nexacore.inventory.modules.vendors.model.VendorSuppliedProduct;
import com.nexacore.inventory.modules.vendors.repository.VendorRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;

@Service
public class VendorService {

    private final VendorRepository vendorRepository;

    public VendorService(VendorRepository vendorRepository) {
        this.vendorRepository = vendorRepository;
    }

    @Transactional(readOnly = true)
    public List<VendorResponse> getAllVendors() {
        return vendorRepository.findAllWithSuppliedProducts().stream()
            .sorted(Comparator.comparing(Vendor::getCompanyName, String.CASE_INSENSITIVE_ORDER))
            .map(this::toResponse)
            .toList();
    }

    @Transactional(readOnly = true)
    public VendorResponse getVendorById(Long id) {
        Vendor vendor = vendorRepository.findByIdWithSuppliedProducts(id)
            .orElseThrow(() -> new RuntimeException("Vendor not found with id: " + id));
        return toResponse(vendor);
    }

    @Transactional
    public VendorResponse createVendor(VendorRequest request) {
        Vendor vendor = Vendor.builder()
            .companyName(request.companyName().trim())
            .phone(trimToNull(request.phone()))
            .email(trimToNull(request.email()))
            .accountName(trimToNull(request.accountName()))
            .bankName(trimToNull(request.bankName()))
            .branchName(trimToNull(request.branchName()))
            .accountNumber(trimToNull(request.accountNumber()))
            .build();

        applySuppliedProducts(vendor, request.suppliedProducts());

        Vendor saved = vendorRepository.save(vendor);
        return toResponse(saved);
    }

    @Transactional
    public VendorResponse updateVendor(Long id, VendorRequest request) {
        Vendor vendor = vendorRepository.findByIdWithSuppliedProducts(id)
            .orElseThrow(() -> new RuntimeException("Vendor not found with id: " + id));

        vendor.setCompanyName(request.companyName().trim());
        vendor.setPhone(trimToNull(request.phone()));
        vendor.setEmail(trimToNull(request.email()));
        vendor.setAccountName(trimToNull(request.accountName()));
        vendor.setBankName(trimToNull(request.bankName()));
        vendor.setBranchName(trimToNull(request.branchName()));
        vendor.setAccountNumber(trimToNull(request.accountNumber()));

        vendor.getSuppliedProducts().clear();
        applySuppliedProducts(vendor, request.suppliedProducts());

        return toResponse(vendorRepository.save(vendor));
    }

    @Transactional
    public void deleteVendor(Long id) {
        if (!vendorRepository.existsById(id)) {
            throw new RuntimeException("Vendor not found with id: " + id);
        }
        vendorRepository.deleteById(id);
    }

    private void applySuppliedProducts(Vendor vendor, List<VendorSuppliedProductRequest> lines) {
        for (VendorSuppliedProductRequest line : lines) {
            VendorSuppliedProduct row = VendorSuppliedProduct.builder()
                .productName(line.productName().trim())
                .category(line.category().trim())
                .vendor(vendor)
                .build();
            vendor.getSuppliedProducts().add(row);
        }
    }

    private VendorResponse toResponse(Vendor vendor) {
        List<VendorSuppliedProductResponse> products = vendor.getSuppliedProducts().stream()
            .map(p -> new VendorSuppliedProductResponse(p.getId(), p.getProductName(), p.getCategory()))
            .toList();

        return new VendorResponse(
            vendor.getId(),
            vendor.getCompanyName(),
            vendor.getPhone(),
            vendor.getEmail(),
            vendor.getAccountName(),
            vendor.getBankName(),
            vendor.getBranchName(),
            vendor.getAccountNumber(),
            products,
            vendor.getCreatedAt(),
            vendor.getUpdatedAt()
        );
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String t = value.trim();
        return t.isEmpty() ? null : t;
    }
}
