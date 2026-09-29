import { Routes } from '@angular/router';
import { Estudiante } from './estudiante/estudiante';
import { Empresa } from './empresa/empresa';
import { Login } from './login/login';

export const routes: Routes = [
  { path: '', component: Login },
  { path: 'estudiante', component: Estudiante },
  { path: 'empresa', component: Empresa },
];