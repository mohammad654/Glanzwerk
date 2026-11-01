import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { LINKS } from '../../../core/routes';
import { IconComponent } from '../../../shared/components/icon/icon.component';

/**
 * The home page's invitation to book.
 *
 * A call to action rather than a form, on purpose. Offering a real time needs the
 * availability endpoint, which needs a sign-in, so a form on a public page could
 * only ever show guessed days and hours — and a visitor who picked a closed Sunday
 * or an hour already taken would not find out until after signing in. The booking
 * page asks the same endpoint the server validates against, so it cannot offer a
 * slot that is then refused; this section's job is to get people there.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-appointment',
  imports: [IconComponent, RouterLink],
  templateUrl: './appointment.component.html',
  styleUrl: './appointment.component.scss',
})
export class AppointmentComponent {
  /** Static-page links, so no template spells a URL out. */
  readonly links = LINKS;

  readonly points = [
    $localize`:@@appointment.point.free:The visit costs nothing. We look at the job and agree a fixed price before anyone starts work.`,
    $localize`:@@appointment.point.slots:You choose from the times we are genuinely free, so nothing has to be rearranged afterwards.`,
    $localize`:@@appointment.point.track:Every appointment sits in your account, where you can follow it or call it off.`,
  ];
}
