import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { BLOG_POSTS, blogLink, findPost } from '../../core/blog-catalog';
import { PageBannerComponent } from '../../shared/components/page-banner/page-banner.component';

@Component({
  selector: 'app-blog-detail',
  imports: [PageBannerComponent, RouterLink],
  templateUrl: './blog-detail.component.html',
  styleUrl: './blog-detail.component.scss',
})
export class BlogDetailComponent {
  /** Bound from the :slug route parameter. */
  readonly slug = input.required<string>();

  readonly post = computed(() => findPost(this.slug()));

  readonly others = computed(() => BLOG_POSTS.filter((post) => post.slug !== this.slug()));

  readonly trail = [{ label: 'Blog', path: 'blog' }];

  /** Catalog routes come from the catalog, so no page spells one out. */
  readonly path = blogLink;
}
