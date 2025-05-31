import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';

type ToastType = 'success' | 'error' | 'info' | 'warning';

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  constructor(private toastr: ToastrService) {}

  // Configurazione di default per i toast
  private readonly defaultOptions = {
    timeOut: 5000,
    positionClass: 'toast-top-right',
    progressBar: true,
    closeButton: true,
    tapToDismiss: true,
    enableHtml: false,
    toastClass: 'custom-toast',
    titleClass: 'toast-title',
    messageClass: 'toast-message',
    iconClasses: {
      error: 'toast-error',
      info: 'toast-info',
      success: 'toast-success',
      warning: 'toast-warning'
    }
  };

  /**
   * Mostra un toast di successo
   */
  success(message: string, title: string = 'Successo'): void {
    this.showToast('success', title, message);
  }

  /**
   * Mostra un toast di errore
   */
  error(message: string, title: string = 'Errore'): void {
    this.showToast('error', title, message);
  }

  /**
   * Mostra un toast informativo
   */
  info(message: string, title: string = 'Info'): void {
    this.showToast('info', title, message);
  }

  /**
   * Mostra un toast di avviso
   */
  warning(message: string, title: string = 'Attenzione'): void {
    this.showToast('warning', title, message);
  }

  /**
   * Metodo generico per mostrare un toast
   */
  private showToast(
    type: ToastType,
    title: string,
    message: string,
    options: any = {}
  ): void {
    const toastOptions = { ...this.defaultOptions, ...options };

    switch (type) {
      case 'success':
        this.toastr.success(message, title, toastOptions);
        break;
      case 'error':
        this.toastr.error(message, title, toastOptions);
        break;
      case 'info':
        this.toastr.info(message, title, toastOptions);
        break;
      case 'warning':
        this.toastr.warning(message, title, toastOptions);
        break;
      default:
        this.toastr.show(message, title, toastOptions);
    }
  }
}
