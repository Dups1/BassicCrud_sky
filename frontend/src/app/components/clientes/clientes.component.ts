import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClienteService } from '../../services/cliente.service';
import { Cliente } from '../../models/cliente.model';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './clientes.component.html'
})
export class ClientesComponent implements OnInit {
  private clienteService = inject(ClienteService);
  
  clientes = signal<Cliente[]>([]);
  clienteSeleccionado = signal<Cliente | null>(null);
  modoEdicion = signal(false);
  cargando = signal(true);
  error = signal<string | null>(null);
  
  nuevoCliente: Cliente = {
    nombre: '',
    edad: 0,
    sexo: 'M'
  };

  ngOnInit() {
    console.log('🔍 ClientesComponent inicializado');
    this.cargarClientes();
  }

  cargarClientes() {
    console.log('📡 Cargando clientes...');
    this.cargando.set(true);
    this.error.set(null);
    
    this.clienteService.getAll().subscribe({
      next: (data) => {
        console.log('✅ Clientes recibidos:', data);
        this.clientes.set(data);
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('❌ Error al cargar clientes:', err);
        this.error.set(`Error: ${err.status} - ${err.message}`);
        this.cargando.set(false);
      }
    });
  }

  guardar() {
    if (this.modoEdicion()) {
      this.clienteService.update(this.clienteSeleccionado()!.id_cliente!, this.nuevoCliente).subscribe({
        next: () => {
          this.cargarClientes();
          this.cancelar();
        },
        error: (err) => console.error('Error:', err)
      });
    } else {
      this.clienteService.create(this.nuevoCliente).subscribe({
        next: () => {
          this.cargarClientes();
          this.limpiarFormulario();
        },
        error: (err) => console.error('Error:', err)
      });
    }
  }

  editar(cliente: Cliente) {
    this.clienteSeleccionado.set(cliente);
    this.nuevoCliente = { ...cliente };
    this.modoEdicion.set(true);
  }

  eliminar(id: number) {
    if (confirm('¿Está seguro de eliminar este cliente?')) {
      this.clienteService.delete(id).subscribe({
        next: () => this.cargarClientes(),
        error: (err) => console.error('Error:', err)
      });
    }
  }

  cancelar() {
    this.limpiarFormulario();
    this.modoEdicion.set(false);
    this.clienteSeleccionado.set(null);
  }

  limpiarFormulario() {
    this.nuevoCliente = {
      nombre: '',
      edad: 0,
      sexo: 'M'
    };
  }
}
