package com.springerp.service.impl;

import com.springerp.dto.InvoiceDTO;
import com.springerp.dto.InvoiceItemDTO;
import com.springerp.entity.Company;
import com.springerp.entity.Customer;
import com.springerp.entity.Invoice;
import com.springerp.entity.InvoiceItem;
import com.springerp.entity.InvoiceStatus;
import com.springerp.entity.Product;
import com.springerp.exception.ResourceNotFoundException;
import com.springerp.repository.CompanyRepository;
import com.springerp.repository.CustomerRepository;
import com.springerp.repository.InvoiceRepository;
import com.springerp.repository.ProductRepository;
import com.springerp.service.InvoiceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class InvoiceServiceImpl implements InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final CompanyRepository companyRepository;
    private final CustomerRepository customerRepository;
    private final ProductRepository productRepository;

    @Override
    @Transactional
    public InvoiceDTO createInvoice(Long companyId, InvoiceDTO invoiceDTO) {
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found with id: " + companyId));

        Invoice invoice = new Invoice();
        invoice.setInvoiceNumber(generateInvoiceNumber(companyId));
        applyInvoiceData(company, invoiceDTO, invoice);
        calculateTotals(invoice);
        return toDto(invoiceRepository.save(invoice));
    }

    @Override
    @Transactional
    public InvoiceDTO updateInvoice(Long companyId, Long id, InvoiceDTO invoiceDTO) {
        Invoice existing = invoiceRepository.findByCompanyIdAndId(companyId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found with id: " + id));
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found with id: " + companyId));
        applyInvoiceData(company, invoiceDTO, existing);
        calculateTotals(existing);
        return toDto(invoiceRepository.save(existing));
    }

    @Override
    @Transactional(readOnly = true)
    public InvoiceDTO getInvoiceById(Long companyId, Long id) {
        return toDto(invoiceRepository.findByCompanyIdAndId(companyId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found with id: " + id)));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<InvoiceDTO> getAllInvoices(Long companyId, Pageable pageable) {
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found with id: " + companyId));
        return invoiceRepository.findByCompany(company, pageable)
                .map(this::toDto);
    }

    @Override
    @Transactional
    public void deleteInvoice(Long companyId, Long id) {
        Invoice invoice = invoiceRepository.findByCompanyIdAndId(companyId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found with id: " + id));
        invoiceRepository.delete(invoice);
    }

    @Override
    @Transactional(readOnly = true)
    public List<InvoiceDTO> getInvoicesByStatus(Long companyId, InvoiceStatus status) {
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found with id: " + companyId));
        return invoiceRepository.findByCompanyAndStatus(company, status).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public InvoiceDTO updateInvoiceStatus(Long companyId, Long id, InvoiceStatus status) {
        Invoice invoice = invoiceRepository.findByCompanyIdAndId(companyId, id)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found with id: " + id));
        invoice.setStatus(status);
        return toDto(invoiceRepository.save(invoice));
    }

    @Override
    @Transactional(readOnly = true)
    public List<InvoiceDTO> getInvoicesByCustomer(Long companyId, Long customerId) {
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found with id: " + companyId));
        return invoiceRepository.findByCompanyAndCustomerId(company, customerId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<InvoiceDTO> getInvoicesByOrder(Long companyId, Long orderId) {
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found with id: " + companyId));
        return invoiceRepository.findByCompanyAndOrderId(company, orderId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Override
    public byte[] generateInvoicePdf(Long companyId, Long id) {
        throw new UnsupportedOperationException("PDF generation is not yet implemented");
    }

    private String generateInvoiceNumber(Long companyId) {
        return String.format("INV-%d-%d", companyId, System.currentTimeMillis());
    }

    private void applyInvoiceData(Company company, InvoiceDTO invoiceDTO, Invoice invoice) {
        if (invoiceDTO.getCustomerId() == null) {
            throw new IllegalArgumentException("Please select a customer");
        }
        if (invoiceDTO.getItems() == null || invoiceDTO.getItems().isEmpty()) {
            throw new IllegalArgumentException("Please add at least one invoice item");
        }

        Customer customer = customerRepository.findById(invoiceDTO.getCustomerId())
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found with id: " + invoiceDTO.getCustomerId()));

        if (customer.getCompany() == null || !company.getId().equals(customer.getCompany().getId())) {
            throw new IllegalArgumentException("Selected customer does not belong to the active company");
        }

        invoice.setCompany(company);
        invoice.setCustomer(customer);
        invoice.setInvoiceDate(defaultDate(invoiceDTO.getInvoiceDate()));
        invoice.setDueDate(invoiceDTO.getDueDate());
        invoice.setStatus(invoiceDTO.getStatus() != null ? invoiceDTO.getStatus() : InvoiceStatus.DRAFT);
        invoice.setBillingAddress(invoiceDTO.getBillingAddress());
        invoice.setShippingAddress(invoiceDTO.getShippingAddress());
        invoice.setPaymentTerms(invoiceDTO.getPaymentTerms());
        invoice.setNotes(invoiceDTO.getNotes());

        List<InvoiceItem> items = new ArrayList<>();
        for (InvoiceItemDTO itemDTO : invoiceDTO.getItems()) {
            if (itemDTO.getProductId() == null) {
                throw new IllegalArgumentException("Each invoice item must have a product");
            }
            if (itemDTO.getQuantity() == null || itemDTO.getQuantity() <= 0) {
                throw new IllegalArgumentException("Invoice item quantity must be greater than zero");
            }
            if (itemDTO.getUnitPrice() == null || itemDTO.getUnitPrice().compareTo(BigDecimal.ZERO) < 0) {
                throw new IllegalArgumentException("Invoice item unit price must be zero or greater");
            }

            Product product = productRepository.findById(itemDTO.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + itemDTO.getProductId()));

            BigDecimal totalPrice = itemDTO.getTotalPrice() != null
                    ? itemDTO.getTotalPrice()
                    : itemDTO.getUnitPrice().multiply(BigDecimal.valueOf(itemDTO.getQuantity()));

            InvoiceItem item = InvoiceItem.builder()
                    .invoice(invoice)
                    .product(product)
                    .description(itemDTO.getDescription() != null && !itemDTO.getDescription().isBlank()
                            ? itemDTO.getDescription()
                            : product.getName())
                    .quantity(itemDTO.getQuantity())
                    .unitPrice(itemDTO.getUnitPrice())
                    .taxRate(BigDecimal.ZERO)
                    .taxAmount(BigDecimal.ZERO)
                    .totalPrice(totalPrice)
                    .build();
            items.add(item);
        }

        invoice.getItems().clear();
        invoice.getItems().addAll(items);
    }

    private InvoiceDTO toDto(Invoice invoice) {
        List<InvoiceItemDTO> items = invoice.getItems() == null
                ? List.of()
                : invoice.getItems().stream()
                .map(item -> InvoiceItemDTO.builder()
                        .id(item.getId())
                        .productId(item.getProduct() != null ? item.getProduct().getId() : null)
                        .description(item.getDescription())
                        .quantity(item.getQuantity())
                        .unitPrice(item.getUnitPrice())
                        .totalPrice(item.getTotalPrice())
                        .build())
                .collect(Collectors.toList());

        return InvoiceDTO.builder()
                .id(invoice.getId())
                .companyId(invoice.getCompany() != null ? invoice.getCompany().getId() : null)
                .companyName(invoice.getCompany() != null ? invoice.getCompany().getCompanyName() : null)
                .invoiceNumber(invoice.getInvoiceNumber())
                .orderId(invoice.getOrder() != null ? invoice.getOrder().getId() : null)
                .customerId(invoice.getCustomer() != null ? invoice.getCustomer().getId() : null)
                .customerName(invoice.getCustomer() != null ? invoice.getCustomer().getName() : null)
                .invoiceDate(invoice.getInvoiceDate())
                .dueDate(invoice.getDueDate())
                .status(invoice.getStatus())
                .subtotal(invoice.getSubtotal())
                .taxAmount(invoice.getTaxAmount())
                .totalAmount(invoice.getTotalAmount())
                .billingAddress(invoice.getBillingAddress())
                .shippingAddress(invoice.getShippingAddress())
                .paymentTerms(invoice.getPaymentTerms())
                .notes(invoice.getNotes())
                .items(items)
                .createdByUsername(invoice.getCreatedBy())
                .updatedByUsername(invoice.getUpdatedBy())
                .createdAt(invoice.getCreatedAt())
                .updatedAt(invoice.getUpdatedAt())
                .build();
    }

    private LocalDateTime defaultDate(LocalDateTime dateTime) {
        return dateTime != null ? dateTime : LocalDateTime.now();
    }

    private void calculateTotals(Invoice invoice) {
        if (invoice.getItems() == null || invoice.getItems().isEmpty()) {
            invoice.setSubtotal(BigDecimal.ZERO);
            invoice.setTaxAmount(BigDecimal.ZERO);
            invoice.setTotalAmount(BigDecimal.ZERO);
            return;
        }
        BigDecimal subtotal = invoice.getItems().stream()
                .map(InvoiceItem::getTotalPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal taxAmount = subtotal.multiply(new BigDecimal("0.10"));
        invoice.setSubtotal(subtotal);
        invoice.setTaxAmount(taxAmount);
        invoice.setTotalAmount(subtotal.add(taxAmount));
    }
}

