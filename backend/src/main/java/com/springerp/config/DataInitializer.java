package com.springerp.config;

import com.springerp.entity.Category;
import com.springerp.entity.Company;
import com.springerp.entity.Customer;
import com.springerp.entity.Department;
import com.springerp.entity.InventoryItem;
import com.springerp.entity.Invoice;
import com.springerp.entity.InvoiceItem;
import com.springerp.entity.InvoiceStatus;
import com.springerp.entity.Product;
import com.springerp.entity.Supplier;
import com.springerp.entity.User;
import com.springerp.entity.Warehouse;
import com.springerp.repository.CompanyRepository;
import com.springerp.repository.CategoryRepository;
import com.springerp.repository.CustomerRepository;
import com.springerp.repository.DepartmentRepository;
import com.springerp.repository.InventoryItemRepository;
import com.springerp.repository.InvoiceRepository;
import com.springerp.repository.ProductRepository;
import com.springerp.repository.SupplierRepository;
import com.springerp.repository.UserRepository;
import com.springerp.repository.WarehouseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Seeds the database with default admin users on application startup.
 * Safe to run multiple times — checks for existence before inserting.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements ApplicationRunner {

    private final UserRepository userRepository;
    private final CompanyRepository companyRepository;
    private final CategoryRepository categoryRepository;
    private final DepartmentRepository departmentRepository;
    private final CustomerRepository customerRepository;
    private final SupplierRepository supplierRepository;
    private final ProductRepository productRepository;
    private final WarehouseRepository warehouseRepository;
    private final InventoryItemRepository inventoryItemRepository;
    private final InvoiceRepository invoiceRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        seedAdminUser();
        seedDefaultCompany();
        seedDefaultCategory();
        seedDefaultDepartment();
        seedSampleOperationalData();
    }

    private void seedAdminUser() {
        String adminEmail = "admin@springerp.com";
        if (userRepository.existsByEmail(adminEmail)) {
            log.info("Admin user already exists, skipping seed.");
            return;
        }

        User admin = new User();
        admin.setFirstName("Admin");
        admin.setLastName("User");
        admin.setEmail(adminEmail);
        admin.setPassword(passwordEncoder.encode("Admin@123"));
        admin.setRole("ADMIN");
        admin.setDateOfBirth(LocalDate.of(1990, 1, 1));
        admin.setPhoneNumber("0123456789");
        admin.setAddress("123 Main Street, Springfield");

        userRepository.save(admin);
        log.info("✅ Default admin user created: {} / Admin@123", adminEmail);
    }

    private void seedDefaultCompany() {
        if (companyRepository.existsById(1L)) {
            return;
        }

        Company company = new Company();
        company.setName("SpringERP");
        company.setCompanyName("SpringERP Default Company");
        company.setCompanyCode("SPRINGERP");
        company.setRegistrationNumber("SPRINGERP-001");
        company.setTaxId("SPRINGERP-TAX");
        company.setVatNumber("SPRINGERP-VAT");
        company.setAddress("123 Main Street");
        company.setCity("Springfield");
        company.setState("Default");
        company.setPostalCode("000000");
        company.setCountry("India");
        company.setPhone("0123456789");
        company.setEmail("admin@springerp.com");
        company.setWebsite("http://localhost:3000");
        company.setCurrency("USD");
        company.setStatus("ACTIVE");
        company.setSubscriptionTier("STANDARD");
        companyRepository.save(company);
        log.info("Seeded default company with id {}", company.getId());
    }

    private void seedDefaultCategory() {
        if (categoryRepository.existsById(1L)) {
            return;
        }

        Category category = new Category();
        category.setName("General");
        categoryRepository.save(category);
        log.info("Seeded default category with id {}", category.getId());
    }

    private void seedDefaultDepartment() {
        if (departmentRepository.existsById(1L)) {
            return;
        }

        Department department = new Department();
        department.setDepartmentCode("GENERAL");
        department.setDepartmentName("General");
        department.setDescription("Default department");
        department.setBudget(BigDecimal.ZERO);
        department.setIsActive(true);
        departmentRepository.save(department);
        log.info("Seeded default department with id {}", department.getId());
    }

    private void seedSampleOperationalData() {
        Company company = companyRepository.findById(1L)
                .orElseThrow(() -> new IllegalStateException("Default company was not created"));
        Category category = categoryRepository.findById(1L)
                .orElseThrow(() -> new IllegalStateException("Default category was not created"));

        List<Customer> customers = seedCustomers(company);
        List<Supplier> suppliers = seedSuppliers();
        List<Product> products = seedProducts(category);
        List<Warehouse> warehouses = seedWarehouses();
        seedInventory(products, warehouses);
        seedInvoices(company, customers, products);

        log.info("Sample data ready: {} customers, {} suppliers, {} products, {} warehouses",
                customers.size(), suppliers.size(), products.size(), warehouses.size());
    }

    private List<Customer> seedCustomers(Company company) {
        return List.of(
                saveCustomerIfMissing(company, "Aarav Textiles", "aarav@demo.local", "9000000001", "Surat"),
                saveCustomerIfMissing(company, "BluePeak Retail", "bluepeak@demo.local", "9000000002", "Mumbai"),
                saveCustomerIfMissing(company, "Cedar Foods", "cedar@demo.local", "9000000003", "Delhi"),
                saveCustomerIfMissing(company, "Delta Traders", "delta@demo.local", "9000000004", "Ahmedabad"),
                saveCustomerIfMissing(company, "Evergreen Stores", "evergreen@demo.local", "9000000005", "Pune")
        );
    }

    private Customer saveCustomerIfMissing(Company company, String name, String email, String phone, String city) {
        return customerRepository.findByEmail(email).orElseGet(() -> {
            Customer customer = Customer.builder()
                    .name(name)
                    .email(email)
                    .phone(phone)
                    .address(city + " Business Park")
                    .company(company)
                    .build();
            return customerRepository.save(customer);
        });
    }

    private List<Supplier> seedSuppliers() {
        return List.of(
                saveSupplierIfMissing("Northwind Supplies", "northwind@demo.local", "9100000001", "Northwind Pvt Ltd"),
                saveSupplierIfMissing("Prime Industrial", "prime@demo.local", "9100000002", "Prime Industrial Ltd"),
                saveSupplierIfMissing("Urban Source", "urban@demo.local", "9100000003", "Urban Source LLP"),
                saveSupplierIfMissing("Vertex Components", "vertex@demo.local", "9100000004", "Vertex Components"),
                saveSupplierIfMissing("Zenith Wholesale", "zenith@demo.local", "9100000005", "Zenith Wholesale")
        );
    }

    private Supplier saveSupplierIfMissing(String name, String email, String phone, String companyName) {
        return supplierRepository.findByEmail(email).orElseGet(() -> {
            Supplier supplier = Supplier.builder()
                    .name(name)
                    .email(email)
                    .phone(phone)
                    .address("Industrial Area")
                    .companyName(companyName)
                    .build();
            return supplierRepository.save(supplier);
        });
    }

    private List<Product> seedProducts(Category category) {
        return List.of(
                saveProductIfMissing("Cotton Fabric Roll", "High quality cotton fabric roll", 1250.0, 80, category),
                saveProductIfMissing("Office Chair", "Ergonomic office chair", 5400.0, 25, category),
                saveProductIfMissing("Thermal Printer", "Compact thermal printer", 7600.0, 18, category),
                saveProductIfMissing("Packaging Box", "Heavy duty packaging box", 110.0, 500, category),
                saveProductIfMissing("Barcode Scanner", "USB barcode scanner", 2800.0, 30, category)
        );
    }

    private Product saveProductIfMissing(String name, String description, Double price, Integer stock, Category category) {
        return productRepository.findAll().stream()
                .filter(product -> name.equalsIgnoreCase(product.getName()))
                .findFirst()
                .orElseGet(() -> {
                    Product product = new Product();
                    product.setName(name);
                    product.setDescription(description);
                    product.setPrice(price);
                    product.setStock(stock);
                    product.setCategory(category);
                    return productRepository.save(product);
                });
    }

    private List<Warehouse> seedWarehouses() {
        return List.of(
                saveWarehouseIfMissing("MAIN-WH", "Main Warehouse", "Surat"),
                saveWarehouseIfMissing("WEST-WH", "West Zone Warehouse", "Mumbai")
        );
    }

    private Warehouse saveWarehouseIfMissing(String code, String name, String city) {
        return warehouseRepository.findByWarehouseCode(code).orElseGet(() -> {
            Warehouse warehouse = Warehouse.builder()
                    .warehouseCode(code)
                    .warehouseName(name)
                    .address(city + " Logistics Hub")
                    .city(city)
                    .country("India")
                    .warehouseType(Warehouse.WarehouseType.PRIMARY)
                    .totalCapacity(1000)
                    .isActive(true)
                    .build();
            return warehouseRepository.save(warehouse);
        });
    }

    private void seedInventory(List<Product> products, List<Warehouse> warehouses) {
        for (int index = 0; index < Math.min(products.size(), 5); index++) {
            Product product = products.get(index);
            Warehouse warehouse = warehouses.get(index % warehouses.size());
            String sku = "INV-SKU-" + (index + 1);
            if (inventoryItemRepository.findBySku(sku).isPresent()) {
                continue;
            }

            InventoryItem item = InventoryItem.builder()
                    .sku(sku)
                    .product(product)
                    .warehouseId(warehouse.getId())
                    .quantityOnHand(Math.max(product.getStock(), 10))
                    .quantityReserved(index)
                    .quantityAvailable(Math.max(product.getStock(), 10) - index)
                    .reorderLevel(10)
                    .reorderQuantity(25)
                    .unitCost(BigDecimal.valueOf(product.getPrice() * 0.7))
                    .location("Rack-" + (index + 1))
                    .isActive(true)
                    .build();
            inventoryItemRepository.save(item);
        }
    }

    private void seedInvoices(Company company, List<Customer> customers, List<Product> products) {
        if (!invoiceRepository.findByCompany(company, org.springframework.data.domain.Pageable.ofSize(1)).isEmpty()) {
            return;
        }

        createInvoice(company, customers.get(0), List.of(products.get(0), products.get(3)), InvoiceStatus.SENT, "INV-DEMO-001");
        createInvoice(company, customers.get(1), List.of(products.get(1)), InvoiceStatus.DRAFT, "INV-DEMO-002");
        createInvoice(company, customers.get(2), List.of(products.get(2), products.get(4)), InvoiceStatus.PAID, "INV-DEMO-003");
    }

    private void createInvoice(Company company, Customer customer, List<Product> products, InvoiceStatus status, String invoiceNumber) {
        if (invoiceRepository.findByCompanyAndInvoiceNumber(company, invoiceNumber).isPresent()) {
            return;
        }

        Invoice invoice = new Invoice();
        invoice.setCompany(company);
        invoice.setCustomer(customer);
        invoice.setInvoiceNumber(invoiceNumber);
        invoice.setInvoiceDate(LocalDateTime.now().minusDays(3));
        invoice.setDueDate(LocalDateTime.now().plusDays(15));
        invoice.setStatus(status);
        invoice.setBillingAddress(customer.getAddress());
        invoice.setShippingAddress(customer.getAddress());
        invoice.setPaymentTerms("Net 15");
        invoice.setNotes("Sample invoice created automatically");

        BigDecimal subtotal = BigDecimal.ZERO;
        for (int index = 0; index < products.size(); index++) {
            Product product = products.get(index);
            int quantity = index + 1;
            BigDecimal unitPrice = BigDecimal.valueOf(product.getPrice());
            BigDecimal total = unitPrice.multiply(BigDecimal.valueOf(quantity));
            subtotal = subtotal.add(total);

            invoice.getItems().add(InvoiceItem.builder()
                    .invoice(invoice)
                    .product(product)
                    .description(product.getName())
                    .quantity(quantity)
                    .unitPrice(unitPrice)
                    .taxRate(BigDecimal.ZERO)
                    .taxAmount(BigDecimal.ZERO)
                    .totalPrice(total)
                    .build());
        }

        BigDecimal tax = subtotal.multiply(new BigDecimal("0.10"));
        invoice.setSubtotal(subtotal);
        invoice.setTaxAmount(tax);
        invoice.setTotalAmount(subtotal.add(tax));
        invoiceRepository.save(invoice);
    }
}

