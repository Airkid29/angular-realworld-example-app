import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { User } from '../../core/auth/user.model';
import { UserService } from '../../core/auth/services/user.service';
import { ListErrorsComponent } from '../../shared/components/list-errors.component';
import { Errors } from '../../core/models/errors.model';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

interface SettingsForm {
  image: FormControl<string>;
  username: FormControl<string>;
  bio: FormControl<string>;
  email: FormControl<string>;
  password: FormControl<string>;
}

@Component({
  selector: 'app-settings-page',
  templateUrl: './settings.component.html',
  imports: [ListErrorsComponent, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class SettingsComponent implements OnInit {
  user!: User;
  settingsForm = new FormGroup<SettingsForm>({
    image: new FormControl('', { nonNullable: true }),
    username: new FormControl('', { validators: [Validators.required], nonNullable: true }),
    bio: new FormControl('', { nonNullable: true }),
    email: new FormControl('', { validators: [Validators.required, Validators.email], nonNullable: true }),
    password: new FormControl('', { nonNullable: true }),
  });
  errors = signal<Errors | null>(null);
  isSubmitting = signal(false);
  destroyRef = inject(DestroyRef);
  avatarPreview = signal('');
  avatarError = signal('');

  constructor(
    private readonly router: Router,
    private readonly userService: UserService,
  ) {}

  ngOnInit(): void {
    const user = this.userService.getCurrentUserSync();
    if (user) {
      this.settingsForm.patchValue({
        ...user,
        image: user.image ?? '',
        bio: user.bio ?? '',
      });
      this.avatarPreview.set(user.image ?? '');
    }
  }

  onAvatarSelected(event: Event): void {
    const input = event.target;
    if (!(input instanceof HTMLInputElement)) {
      return;
    }

    const file = input.files?.[0];
    if (!file) {
      return;
    }

    this.avatarError.set('');

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      this.avatarError.set('Choisis une image au format JPG, PNG ou WebP.');
      input.value = '';
      return;
    }

    if (file.size > 300 * 1024) {
      this.avatarError.set('L’image doit faire 300 Ko maximum.');
      input.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        this.avatarError.set('Impossible de lire cette image.');
        input.value = '';
        return;
      }

      this.settingsForm.controls.image.setValue(reader.result);
      this.avatarPreview.set(reader.result);
    };
    reader.onerror = () => {
      this.avatarError.set('La lecture de l’image a échoué. Réessaie avec un autre fichier.');
      input.value = '';
    };
    reader.readAsDataURL(file);
  }

  removeAvatar(): void {
    this.settingsForm.controls.image.setValue('');
    this.avatarPreview.set('');
    this.avatarError.set('');
  }

  logout(): void {
    this.userService.logout();
  }

  submitForm() {
    if (this.settingsForm.invalid) {
      this.settingsForm.markAllAsTouched();
      return;
    }

    this.errors.set(null);
    this.isSubmitting.set(true);

    const payload = { ...this.settingsForm.value };
    if (!payload.password) {
      delete payload.password;
    }

    this.userService
      .update(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ user }) => void this.router.navigate(['/profile/', user.username]),
        error: err => {
          this.errors.set(err);
          this.isSubmitting.set(false);
        },
      });
  }
}
