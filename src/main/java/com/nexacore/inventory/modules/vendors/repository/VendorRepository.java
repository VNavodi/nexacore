package com.nexacore.inventory.modules.vendors.repository;

import com.nexacore.inventory.modules.vendors.model.Vendor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface VendorRepository extends JpaRepository<Vendor, Long> {

    @Query("SELECT DISTINCT v FROM Vendor v LEFT JOIN FETCH v.suppliedProducts")
    List<Vendor> findAllWithSuppliedProducts();

    @Query("SELECT v FROM Vendor v LEFT JOIN FETCH v.suppliedProducts WHERE v.id = :id")
    Optional<Vendor> findByIdWithSuppliedProducts(Long id);
}
