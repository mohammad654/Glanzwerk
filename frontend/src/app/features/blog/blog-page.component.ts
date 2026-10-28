import { Component } from '@angular/core';

import { BlogComponent } from '../home/blog/blog.component';
import { PageBannerComponent } from '../../shared/components/page-banner/page-banner.component';

@Component({
  selector: 'app-blog-page',
  imports: [PageBannerComponent, BlogComponent],
  template: `
    <app-page-banner [title]="pageTitle" />
    <app-blog [hideTitle]="true" />
  `,
})
export class BlogPageComponent {
  readonly pageTitle = $localize`:@@page.blog.h1:Advice & Guides`;
}
