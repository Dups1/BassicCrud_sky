import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ServicioService } from '../../services/servicio.service';
import { HotelService } from '../../services/hotel.service';
import { ClienteService } from '../../services/cliente.service';
import { Servicio } from '../../models/servicio.model';
import { Hotel } from '../../models/hotel.model';
import { Cliente } from '../../models/cliente.model';

@Component({
  selector: 'app-servicios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './servicios.component.html'
})
export class ServiciosComponent implements OnInit {
  private servicioService = inject(ServicioService);
  private hotelService = inject(HotelService);
  private clienteService = inject(ClienteService);
  
  servicios = signal<Servicio[]>([]);
  hoteles = signal<Hotel[]>([]);
  clientes = signal<Cliente[]>([]);
  servicioSeleccionado = signal<Servicio | null>(null);
  modoEdicion = signal(false);
  cargando = signal(true);
  error = signal<string | null>(null);
  
  nuevoServicio: Servicio = {
    id_hotel: 0,
    id_cliente: 0,
    fecha_entrada: '',
    fecha_salida: '',
    precio: 0
  };

  ngOnInit() {
    console.log('🔍 ServiciosComponent inicializado');
    this.cargarServicios();
    this.cargarHoteles();
    this.cargarClientes();
  }

  cargarServicios() {
    console.log('📡 Cargando servicios...');
    this.cargando.set(true);
    this.error.set(null);
    
    this.servicioService.getAll().subscribe({
      next: (data) => {
        console.log('✅ Servicios recibidos:', data);
        this.servicios.set(data);
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('❌ Error al cargar servicios:', err);
        this.error.set(`Error: ${err.status} - ${err.message}`);
        this.cargando.set(false);
      }
    });
  }

  cargarHoteles() {
    this.hotelService.getAll().subscribe({
      next: (data) => {
        this.hoteles.set(data);
        // Inicializar select si no hay hotel seleccionado
        if (this.nuevoServicio.id_hotel === 0 && data.length > 0) {
          this.nuevoServicio.id_hotel = data[0].id_hotel!;
        }
      },
      error: (err) => console.error('Error:', err)
    });
  }

  cargarClientes() {
    this.clienteService.getAll().subscribe({
      next: (data) => {
        this.clientes.set(data);
        // Inicializar select si no hay cliente seleccionado
        if (this.nuevoServicio.id_cliente === 0 && data.length > 0) {
          this.nuevoServicio.id_cliente = data[0].id_cliente!;
        }
      },
      error: (err) => console.error('Error:', err)
    });
  }

  guardar() {
    if (this.modoEdicion()) {
      this.servicioService.update(this.servicioSeleccionado()!.id_servicio!, this.nuevoServicio).subscribe({
        next: () => {
          this.cargarServicios();
          this.cancelar();
        },
        error: (err) => console.error('Error:', err)
      });
    } else {
      this.servicioService.create(this.nuevoServicio).subscribe({
        next: () => {
          this.cargarServicios();
          this.limpiarFormulario();
        },
        error: (err) => console.error('Error:', err)
      });
    }
  }

  editar(servicio: Servicio) {
    this.servicioSeleccionado.set(servicio);
    this.nuevoServicio = { ...servicio };
    this.modoEdicion.set(true);
  }

  eliminar(id: number) {
    if (confirm('¿Está seguro de eliminar este servicio?')) {
      this.servicioService.delete(id).subscribe({
        next: () => this.cargarServicios(),
        error: (err) => console.error('Error:', err)
      });
    }
  }

  cancelar() {
    this.limpiarFormulario();
    this.modoEdicion.set(false);
    this.servicioSeleccionado.set(null);
  }

  limpiarFormulario() {
    this.nuevoServicio = {
      id_hotel: 0,
      id_cliente: 0,
      fecha_entrada: '',
      fecha_salida: '',
      precio: 0
    };
  }
}
