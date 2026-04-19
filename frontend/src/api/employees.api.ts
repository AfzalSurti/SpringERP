import apiClient from './client';
import type { Employee, CreateEmployeeRequest, PageResponse } from '../types';

function mapEmployee(employee: any): Employee {
  return {
    id: employee.id,
    employeeId: employee.employeeId,
    firstName: employee.firstName,
    lastName: employee.lastName,
    email: employee.email,
    phone: employee.phone,
    designation: employee.designation,
    department: employee.department?.departmentName,
    departmentId: employee.department?.id,
    employmentType: employee.employmentType,
    employmentStatus: employee.employmentStatus,
    dateOfJoining: employee.dateOfJoining,
    baseSalary: employee.baseSalary,
    officeLocation: employee.officeLocation,
  };
}

function toEmployeePayload(data: Partial<CreateEmployeeRequest>) {
  return {
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    phone: data.phone,
    designation: data.designation,
    employmentType: data.employmentType,
    employmentStatus: data.employmentStatus,
    dateOfJoining: data.dateOfJoining,
    baseSalary: data.baseSalary,
    officeLocation: data.officeLocation,
    department: { id: data.departmentId ?? 1 },
  };
}

export const employeesApi = {
  getAll: () =>
    apiClient
      .get<PageResponse<any>>('/employees', { params: { size: 200 } })
      .then((r) => r.data.content.map(mapEmployee)),

  getById: (id: number) =>
    apiClient.get<any>(`/employees/${id}`).then((r) => mapEmployee(r.data)),

  create: (data: CreateEmployeeRequest) =>
    apiClient.post<any>('/employees', toEmployeePayload(data)).then((r) => mapEmployee(r.data)),

  update: (id: number, data: Partial<CreateEmployeeRequest>) =>
    apiClient.put<any>(`/employees/${id}`, toEmployeePayload(data)).then((r) => mapEmployee(r.data)),

  delete: (id: number) =>
    apiClient.delete(`/employees/${id}`).then((r) => r.data),
};

