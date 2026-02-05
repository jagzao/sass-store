"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useSuppliers } from "@/lib/hooks";
import {
  Supplier,
  CreateSupplierData,
  UpdateSupplierData,
} from "@/lib/hooks/useSuppliers";
import { Plus, Edit, Trash2, Mail, Phone, MapPin } from "lucide-react";
import { SupplierForm } from "./SupplierForm";

interface SuppliersListProps {
  onEdit?: (supplier: Supplier) => void;
  onCreate?: () => void;
}

export function SuppliersList({ onEdit, onCreate }: SuppliersListProps) {
  const { suppliers, loading, error, deleteSupplier } = useSuppliers();
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(
    null,
  );
  const [isFormOpen, setIsFormOpen] = useState(false);

  const handleEdit = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setIsFormOpen(true);
    onEdit?.(supplier);
  };

  const handleCreate = () => {
    setSelectedSupplier(null);
    setIsFormOpen(true);
    onCreate?.();
  };

  const handleDelete = async (id: string) => {
    if (confirm("¿Estás seguro de que deseas eliminar este proveedor?")) {
      try {
        await deleteSupplier(id);
      } catch (error) {
        console.error("Error al eliminar proveedor:", error);
      }
    }
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedSupplier(null);
  };

  if (loading && suppliers.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <p>Cargando proveedores...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <p className="text-red-500">Error: {error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Proveedores</h2>
          <p className="text-gray-600">
            Gestiona los proveedores de tu inventario
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Proveedor
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Proveedores</CardTitle>
          <CardDescription>
            Todos los proveedores registrados en el sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {suppliers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No hay proveedores registrados</p>
              <Button className="mt-4" onClick={handleCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Agregar Proveedor
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Persona de Contacto</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Dirección</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suppliers.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell className="font-medium">
                      {supplier.name}
                    </TableCell>
                    <TableCell>{supplier.contactPerson || "-"}</TableCell>
                    <TableCell>
                      {supplier.email ? (
                        <div className="flex items-center">
                          <Mail className="mr-2 h-4 w-4 text-blue-500" />
                          <a
                            href={`mailto:${supplier.email}`}
                            className="text-blue-600 hover:underline"
                          >
                            {supplier.email}
                          </a>
                        </div>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      {supplier.phone ? (
                        <div className="flex items-center">
                          <Phone className="mr-2 h-4 w-4 text-green-500" />
                          <a
                            href={`tel:${supplier.phone}`}
                            className="text-green-600 hover:underline"
                          >
                            {supplier.phone}
                          </a>
                        </div>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      {supplier.address ? (
                        <div className="flex items-center">
                          <MapPin className="mr-2 h-4 w-4 text-gray-500" />
                          <span>{supplier.address}</span>
                        </div>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={supplier.isActive ? "default" : "secondary"}
                      >
                        {supplier.isActive ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(supplier)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(supplier.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {isFormOpen && (
        <SupplierForm
          supplier={selectedSupplier}
          isOpen={isFormOpen}
          onClose={handleCloseForm}
        />
      )}
    </div>
  );
}
