package com.springerp.config;

import com.springerp.entity.User;
import com.springerp.entity.Company;
import com.springerp.entity.Category;
import com.springerp.entity.Department;
import com.springerp.repository.CompanyRepository;
import com.springerp.repository.CategoryRepository;
import com.springerp.repository.DepartmentRepository;
import com.springerp.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;

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
    private final BCryptPasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        seedAdminUser();
        seedDefaultCompany();
        seedDefaultCategory();
        seedDefaultDepartment();
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
}

