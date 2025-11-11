import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import { User } from './user.model';
import { UserService } from './user.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss'
})
export class UsersComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly userService = inject(UserService);

  readonly users = signal<User[]>([]);
  readonly isLoading = signal(false);
  readonly isSubmitting = signal(false);
  readonly isAuthenticating = signal(false);
  readonly error = signal<string | null>(null);
  readonly success = signal<string | null>(null);
  readonly loginError = signal<string | null>(null);
  readonly authenticatedUser = signal<User | null>(null);

  readonly hasUsers = computed(
    () => !this.isLoading() && this.users().length > 0
  );

  readonly form = this.fb.nonNullable.group({
    nom: ['', [Validators.required, Validators.minLength(2)]],
    prenom: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    login: ['', [Validators.required, Validators.minLength(3)]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  readonly loginForm = this.fb.nonNullable.group({
    login: ['', [Validators.required, Validators.minLength(3)]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading.set(true);
    this.error.set(null);
    this.userService.list().subscribe({
      next: (users) => {
        this.users.set(users);
        this.isLoading.set(false);
      },
      error: (err) => {
        const message =
          err?.error?.message ??
          "Impossible de récupérer la liste d'utilisateurs.";
        this.error.set(message);
        this.isLoading.set(false);
      }
    });
  }

  submit(): void {
    if (this.form.invalid || this.isSubmitting()) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.error.set(null);
    this.success.set(null);

    this.userService.create(this.form.getRawValue()).subscribe({
      next: (user) => {
        this.users.update((items) => [user, ...items]);
        this.form.reset({
          nom: '',
          prenom: '',
          email: '',
          login: '',
          password: ''
        });
        this.isSubmitting.set(false);
        this.success.set('Utilisateur ajouté avec succès.');
      },
      error: (err) => {
        this.isSubmitting.set(false);
        const message =
          err?.error?.message ??
          "Impossible d'enregistrer l'utilisateur. Réessayez.";
        this.error.set(message);
      }
    });
  }

  delete(user: User): void {
    if (!user.id) {
      return;
    }
    const confirmed = window.confirm(
      `Supprimer l'utilisateur ${user.prenom} ${user.nom} ?`
    );
    if (!confirmed) {
      return;
    }

    this.userService.delete(user.id).subscribe({
      next: () => {
        this.users.update((items) => items.filter((item) => item.id !== user.id));
      },
      error: (err) => {
        const message =
          err?.error?.message ??
          "La suppression a échoué, veuillez réessayer plus tard.";
        this.error.set(message);
      }
    });
  }

  testLogin(): void {
    if (this.loginForm.invalid || this.isAuthenticating()) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isAuthenticating.set(true);
    this.loginError.set(null);
    this.authenticatedUser.set(null);

    const { login, password } = this.loginForm.getRawValue();
    this.userService.login(login, password).subscribe({
      next: (user) => {
        this.authenticatedUser.set(user);
        this.isAuthenticating.set(false);
      },
      error: (err) => {
        const message =
          err?.error?.message ?? 'Authentification impossible.';
        this.loginError.set(message);
        this.isAuthenticating.set(false);
      }
    });
  }
}
