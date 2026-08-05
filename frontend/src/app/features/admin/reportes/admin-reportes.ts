import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { PagosService } from '../../../core/services/pagos.service';
import { Pago } from '../../../core/models/pago';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-admin-reportes',
  imports: [FormsModule, DatePipe],
  templateUrl: './admin-reportes.html',
})
export default class AdminReportesComponent {
  private pagosSvc = inject(PagosService);
  private http = inject(HttpClient);

  pagos = signal<Pago[]>([]);
  fechaInicio = signal('');
  fechaFin = signal('');
  total = signal(0);
  loading = signal(false);
  showReporte = signal(false);
  errorMsg = signal('');
  today = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];

  formatMonto(monto: number | string): string {
    return Number(monto).toFixed(2);
  }

  setRango(tipo: 'semana' | 'mes' | 'anio'): void {
    const fin = new Date();
    const inicio = new Date();
    if (tipo === 'semana') {
      inicio.setDate(fin.getDate() - 7);
    } else if (tipo === 'mes') {
      inicio.setMonth(fin.getMonth() - 1);
    } else if (tipo === 'anio') {
      inicio.setFullYear(fin.getFullYear() - 1);
    }
    this.fechaFin.set(fin.toISOString().split('T')[0]);
    this.fechaInicio.set(inicio.toISOString().split('T')[0]);
    this.generateReporte();
  }

  generateReporte(): void {
    this.errorMsg.set('');
    if (!this.fechaInicio() || !this.fechaFin()) return;
    if (this.fechaInicio() > this.fechaFin()) {
      this.errorMsg.set('La fecha de inicio no puede ser mayor que la fecha final');
      return;
    }
    this.loading.set(true);
    this.pagosSvc.getReporte(this.fechaInicio(), this.fechaFin()).subscribe({
      next: (data: any[]) => {
        this.pagos.set(data);
        this.total.set(data.reduce((acc: number, p: any) => acc + Number(p.Monto), 0));
        this.showReporte.set(true);
        this.loading.set(false);
      },
      error: () => {
        this.errorMsg.set('Error al cargar el reporte de pagos');
        this.loading.set(false);
      }
    });
  }
}
