import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { BLOG_POSTS, blogLink } from '../../core/blog-catalog';
import { pathIn } from '../../core/i18n/localized-path';
import { LINKS, STATIC_ROUTES } from '../../core/routes';
import { PageBannerComponent } from '../../shared/components/page-banner/page-banner.component';
import { CATALOGUE_IMAGE } from '../../core/media';

@Component({
  selector: 'app-blog-detail',
  imports: [PageBannerComponent, RouterLink],
  templateUrl: './blog-detail.component.html',
  styleUrl: './blog-detail.component.scss',
})
export class BlogDetailComponent {
  readonly notFoundTitle = $localize`:@@notFound.post:Article not found`;

  /** Reserves the photo\'s space before it loads. */
  readonly imageSize = CATALOGUE_IMAGE;

  /** Static-page links, so no template spells a URL out. */
  readonly links = LINKS;

  /** Bound from the route's `data.key`. Keys are locale-independent; URLs are not. */
  readonly key = input.required<string>();

  readonly post = computed(() => BLOG_POSTS.find((post) => post.key === this.key()));

  readonly others = computed(() => BLOG_POSTS.filter((post) => post.key !== this.key()));

  readonly trail = [{ label: $localize`:@@nav.blog:Advice`, path: pathIn(STATIC_ROUTES.blog) }];

  /** Catalogue routes come from the catalogue, so no page spells one out. */
  readonly path = blogLink;
}
