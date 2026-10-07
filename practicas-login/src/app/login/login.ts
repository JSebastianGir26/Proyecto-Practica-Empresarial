import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { loginMock } from '../services/auth';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  email: string = '';
  password: string = '';
  errorMessage: string = '';
  loading: boolean = false;

  constructor(private router: Router) {}

  onSubmit() {
    this.errorMessage = '';
    this.loading = true;

    loginMock(this.email, this.password)
      .then((response) => {
        this.loading = false;
        console.log('Login exitoso:', response);

        localStorage.setItem('accessToken', response.access);
        localStorage.setItem('refreshToken', response.refresh);
        localStorage.setItem('role', response.role);

        if (response.role === 'company') {
          this.router.navigate(['/empresa']);
        } else {
          this.router.navigate(['/estudiante']);
        }
      })
      .catch((error) => {
        this.loading = false;
        this.errorMessage = error;
        console.error('Error de login:', error);
      });
  }
}