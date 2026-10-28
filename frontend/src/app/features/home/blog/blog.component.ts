import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { BLOG_POSTS, blogLink } from '../../../core/blog-catalog';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { CATALOGUE_IMAGE } from '../../../core/media';

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
  /** Reserves the photo\'s space before it loads. */
  readonly imageSize = CATALOGUE_IMAGE;

  /** The blog page has its own banner, so it does not need the section title. */
  readonly hideTitle = input(false);

  readonly posts = BLOG_POSTS;

  /** Catalog routes come from the catalog, so no page spells one out. */
  readonly path = blogLink;
}
