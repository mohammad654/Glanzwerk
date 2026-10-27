import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { COMPANY } from '../../core/company';
import { LanguageToggleComponent } from '../language-toggle/language-toggle.component';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-top-bar',
  imports: [IconComponent, RouterLink, LanguageToggleComponent],
  templateUrl: './top-bar.component.html',
  styleUrl: './top-bar.component.scss',
})
export class TopBarComponent {
  readonly company = COMPANY;
}
