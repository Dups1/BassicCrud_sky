import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HotelService } from '../../services/hotel.service';
import { Hotel } from '../../models/hotel.model';

@Component({
  selector: 'app-hoteles',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './hoteles.component.html'
})
export class HotelesComponent implements OnInit {
  private hotelService = inject(HotelService);
  
  hoteles = signal<Hotel[]>([]);
  hotelSeleccionado = signal<Hotel | null>(null);
  modoEdicion = signal(false);
  cargando = signal(true);
  error = signal<string | null>(null);
  
  nuevoHotel: Hotel = {
    nombre_hotel: '',
    direccion_hotel: '',
    ciudad: '',
    telefono: ''
  };

  ngOnInit() {
    console.log('🔍 HotelesComponent inicializado');
    this.cargarHoteles();
  }

  cargarHoteles() {
    console.log('📡 Cargando hoteles...');
    this.cargando.set(true);
    this.error.set(null);
    
    this.hotelService.getAll().subscribe({
      next: (data) => {
        console.log('✅ Datos recibidos:', data);
        this.hoteles.set(data);
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('❌ Error al cargar hoteles:', err);
        console.error('Status:', err.status);
        console.error('Message:', err.message);
        console.error('URL:', err.url);
        this.error.set(`Error: ${err.status} - ${err.message}`);
        this.cargando.set(false);
      }
    });
  }

  guardar() {
    if (this.modoEdicion()) {
      this.hotelService.update(this.hotelSeleccionado()!.id_hotel!, this.nuevoHotel).subscribe({
        next: () => {
          console.log('✅ Hotel actualizado');
          this.cargarHoteles();
          this.cancelar();
        },
        error: (err) => {
          console.error('❌ Error al actualizar:', err);
          alert('Error al actualizar hotel');
        }
      });
    } else {
      this.hotelService.create(this.nuevoHotel).subscribe({
        next: () => {
          console.log('✅ Hotel creado');
          this.cargarHoteles();
          this.limpiarFormulario();
        },
        error: (err) => {
          console.error('❌ Error al crear:', err);
          alert('Error al crear hotel');
        }
      });
    }
  }

  editar(hotel: Hotel) {
    this.hotelSeleccionado.set(hotel);
    this.nuevoHotel = { ...hotel };
    this.modoEdicion.set(true);
  }

  eliminar(id: number) {
    if (confirm('¿Está seguro de eliminar este hotel?')) {
      this.hotelService.delete(id).subscribe({
        next: () => {
          console.log('✅ Hotel eliminado');
          this.cargarHoteles();
        },
        error: (err) => {
          console.error('❌ Error al eliminar:', err);
          alert('Error al eliminar hotel');
        }
      });
    }
  }

  cancelar() {
    this.limpiarFormulario();
    this.modoEdicion.set(false);
    this.hotelSeleccionado.set(null);
  }

  limpiarFormulario() {
    this.nuevoHotel = {
      nombre_hotel: '',
      direccion_hotel: '',
      ciudad: '',
      telefono: ''
    };
  }
}
