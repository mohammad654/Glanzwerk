import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { COMPANY } from '../../core/company';
import { LanguageToggleComponent } from '../language-toggle/language-toggle.component';

@Component({
  selector: 'app-top-bar',
  imports: [RouterLink, LanguageToggleComponent],
  templateUrl: './top-bar.component.html',
  styleUrl: './top-bar.component.scss',
})
export class TopBarComponent {
  readonly company = COMPANY;
}
