import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { BLOG_POSTS, blogLink } from '../../../core/blog-catalog';
import { IconComponent } from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-blog',
  imports: [IconComponent, RouterLink],
  templateUrl: './blog.component.html',
  styleUrl: './blog.component.scss',
  host: {
    '[class.blog--headless]': 'hideTitle()',
  },
})
export class BlogComponent {
  /** The blog page has its own banner, so it does not need the section title. */
  readonly hideTitle = input(false);

  readonly posts = BLOG_POSTS;

  /** Catalog routes come from the catalog, so no page spells one out. */
  readonly path = blogLink;
}
