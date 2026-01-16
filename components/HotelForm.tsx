"use client";

import { useState, useEffect } from "react";
import { Hotel, InsertHotel } from "@/shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface HotelFormProps {
  hotel?: Hotel | null;
  onSave: (data: InsertHotel) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function HotelForm({ hotel, onSave, onCancel, isLoading }: HotelFormProps) {
  const [formData, setFormData] = useState<InsertHotel>({
    name: "",
    latitude: 0,
    longitude: 0,
  });

  useEffect(() => {
    if (hotel) {
      setFormData({
        name: hotel.name,
        latitude: hotel.latitude,
        longitude: hotel.longitude,
      });
    }
  }, [hotel]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Nome</Label>
        <Input
          id="name"
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          className="mt-1"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="latitude">Latitude</Label>
          <Input
            id="latitude"
            type="number"
            step="any"
            value={formData.latitude}
            onChange={(e) =>
              setFormData({ ...formData, latitude: parseFloat(e.target.value) })
            }
            required
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="longitude">Longitude</Label>
          <Input
            id="longitude"
            type="number"
            step="any"
            value={formData.longitude}
            onChange={(e) =>
              setFormData({ ...formData, longitude: parseFloat(e.target.value) })
            }
            required
            className="mt-1"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Guardando..." : "Guardar"}
        </Button>
      </div>
    </form>
  );
}
