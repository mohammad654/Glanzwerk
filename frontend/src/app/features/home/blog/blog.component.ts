import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { BLOG_POSTS, blogPath } from '../../../core/blog-catalog';

@Component({
  selector: 'app-blog',
  imports: [RouterLink],
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

  path(slug: string): string {
    return '/' + blogPath(slug);
  }
}
