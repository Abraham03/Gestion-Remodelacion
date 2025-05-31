import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Material } from '../../models/material.model';
import { MaterialesService } from '../../services/material.service';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatOption } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker'; // Importar MatDatepickerModule
import { MatNativeDateModule } from '@angular/material/core'; // Importar MatNativeDateModule

@Component({
  selector: 'app-materiales-form',
    standalone: true,
    imports: [
      CommonModule,
      ReactiveFormsModule,
      MatFormFieldModule,
      MatInputModule,
      MatCheckboxModule,
      MatButtonModule,
      MatOption,
      MatDatepickerModule,
      MatNativeDateModule
    ],
  templateUrl: './material-form.component.html',
  styleUrls: ['./material-form.component.scss'],
})
export class MaterialesFormComponent {
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private materialesService: MaterialesService,
    public dialogRef: MatDialogRef<MaterialesFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: Material
  ) {
    this.form = this.fb.group({
      nombre: [data?.nombre || '', Validators.required],
      descripcion: [data?.descripcion || '', Validators.required],
      cantidad: [data?.cantidad || '', [Validators.required, Validators.min(0)]],
      unidadMedida: [data?.unidadMedida || '', Validators.required],
      fechaAdquisicion: [data?.fechaAdquisicion || '', Validators.required],
    });
  }

  onSubmit(): void {
    if (this.form.valid) {
      const material: Material = {
        id: this.data?.id || null,
        ...this.form.value,
      };

      if (material.id) {
        this.materialesService.updateMaterial(material).subscribe(() => {
          this.dialogRef.close(true);
        });
      } else {
        this.materialesService.addMaterial(material).subscribe(() => {
          this.dialogRef.close(true);
        });
      }
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}