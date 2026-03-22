import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TransferenciaService } from '../../services/transferencia.service';
import { Transferencia } from '../../models/transferencia.model';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container mx-auto px-4 py-8">
      <div class="mb-8">
        <h1 class="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p class="text-gray-600">Seguimiento de ingresos y transferencias</p>
      </div>

      <!-- Tarjeta de ingresos totales -->
      <div class="bg-gradient-to-r from-green-500 to-green-600 rounded-lg shadow-lg p-6 mb-8 text-white">
        <h2 class="text-xl font-bold mb-2">Ingresos Totales</h2>
        <p class="text-4xl font-bold">\${{ montoTotal() }}</p>
        <p class="text-sm mt-2">{{ transferencias().length }} promociones activas</p>
      </div>

      <!-- Historial de transferencias -->
      <div class="bg-white rounded-lg shadow-lg overflow-hidden">
        <div class="px-6 py-4 bg-gray-50 border-b">
          <h2 class="text-xl font-bold">Historial de Transferencias</h2>
        </div>

        @if (transferencias().length > 0) {
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gray-100 border-b">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-gray-700">Fecha</th>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-gray-700">Negocio</th>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-gray-700">Lugar</th>
                  <th class="px-6 py-3 text-left text-xs font-semibold text-gray-700">Dias</th>
                  <th class="px-6 py-3 text-right text-xs font-semibold text-gray-700">Monto</th>
                </tr>
              </thead>
              <tbody class="divide-y">
                @for (trans of transferencias(); track trans.id_transferencia) {
                  <tr class="hover:bg-gray-50 transition">
                    <td class="px-6 py-3 text-sm text-gray-700">{{ trans.fecha_transaccion | date: 'dd/MM/yyyy' }}</td>
                    <td class="px-6 py-3 text-sm font-medium text-gray-800">{{ trans.nombre_usuario }}</td>
                    <td class="px-6 py-3 text-sm text-gray-700">{{ trans.nombre_lugar }}</td>
                    <td class="px-6 py-3 text-sm text-gray-700">{{ trans.dias }} dias</td>
                    <td class="px-6 py-3 text-sm font-bold text-green-600 text-right">\${{ trans.monto }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        } @else {
          <div class="px-6 py-8 text-center">
            <p class="text-gray-400 text-sm">Sin transferencias aun</p>
          </div>
        }
      </div>
    </div>
  `,
  styles: []
})
export class AdminDashboardComponent implements OnInit {
  private transferenciaService = inject(TransferenciaService);

  transferencias = signal<Transferencia[]>([]);
  
  montoTotal = computed(() => {
    const total = this.transferencias().reduce((sum, t) => sum + (Number(t.monto) || 0), 0);
    return total.toFixed(2);
  });

  ngOnInit() {
    this.cargarTransferencias();
  }

  cargarTransferencias() {
    this.transferenciaService.getAllAdmin().subscribe({
      next: (data) => this.transferencias.set(data),
      error: () => alert('Error al cargar transferencias')
    });
  }
}
