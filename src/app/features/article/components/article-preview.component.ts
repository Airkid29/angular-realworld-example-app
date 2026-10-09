import { ChangeDetectionStrategy, Component, Input, signal } from '@angular/core';
import { Article } from '../models/article.model';
import { ArticleMetaComponent } from './article-meta.component';
import { RouterLink } from '@angular/router';

import { FavoriteButtonComponent } from './favorite-button.component';

@Component({
  selector: 'app-article-preview',
  template: `
    <div class="article-preview">
      <app-article-meta [article]="article()">
        <app-favorite-button [article]="article()" (toggle)="toggleFavorite($event)" class="pull-xs-right">
          {{ article().favoritesCount }}
        </app-favorite-button>
      </app-article-meta>

      <a [routerLink]="['/article', article().slug]" class="preview-link">
        <h1>{{ article().title }}</h1>
        <p>{{ article().description }}</p>
        <span class="reading-time">{{ readingTime()} min read . Open article</span>
        <ul class="tag-list">
          @for (tag of article().tagList; track tag) {
            <li class="tag-default tag-pill tag-outline">
              {{ tag }}
            </li>
          }
        </ul>
      </a>
    </div>
  `,
  imports: [ArticleMetaComponent, FavoriteButtonComponent, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .article-preview {
      background: #fff;
      border: 1px solid #e8eee9;
      border-radius: 8px;
      margin: 0 0 1rem;
      padding: 1.25rem;
      transition:
        transform 160ms ease,
        box-shadow 160ms ease,
        border-color 160ms ease;
    }

    .article-preview:hover {
      border-color: var(--brand);
      box-shadow: 0 8px 22px rgba(0, 0, 0, 0.06);
      transform: translateY(-2px);
    }

    .preview-link {
      display: block;
    }

    .preview-link h1 {
      color: var(--text);
    }

    .preview-link:focus-visible {
      outline: 2px solid var(--brand);
      outline-offset: 4px;
    }

    .preview-link p {
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
      overflow: hidden;
    }

    .reading-time {
      color: var(--brand);
      font-weight: 500;
    }

    .article-preview .preview-link ul {
      float: none;
      max-width: 100%;
      margin-top: 0.8rem;
    }
  `,
})
export class ArticlePreviewComponent {
  article = signal<Article>(null!);

  @Input({ required: true })
  set articleInput(value: Article) {
    this.article.set(value);
  }

  toggleFavorite(favorited: boolean): void {
    this.article.update(article => ({
      ...article,
      favorited,
      favoritesCount: favorited ? article.favoritesCount + 1 : article.favoritesCount - 1,
    }));
  }

  readingTime(): number {
    const wordCount = this.article().body?.trim().split(/\s+/).filter(Boolean).length ?? 0;
    return Math.max(1, Math.ceil(wordCount / 200));
  }
}
