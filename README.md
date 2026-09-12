# Lukin Slava — портфолио

Полная статическая копия портфолио, ранее опубликованного на Framer (`slavalukin.framer.website`).
Сайт не зависит от Framer: все страницы, скрипты, анимации, картинки, видео, шрифты и иконки лежат в репозитории.

## Структура

```
docs/                 готовый сайт (его публикует GitHub Pages)
  index.html          главная
  lead-case.html      /lead-case
  process.html        /process
  mind-case.html      /mind-case
  autodraw.html       /autodraw
  404.html
  assets/js/          рантайм Framer (React + Motion) и код страниц — отвечает за анимации и интерактив
  assets/images/      картинки (+ уменьшенные версии *.sd512 / *.sd1024 / … для адаптивной загрузки)
  assets/files/       видео и шрифты
  assets/fonts/       Google Fonts
  assets/icon-libs/   иконки (Iconoir, Hero)
tools/
  mirror.mjs          скачивает опубликованный сайт с Framer в raw/
  build.mjs           собирает docs/ из raw/
  serve.mjs           локальный сервер, повторяющий поведение GitHub Pages
  content.mjs         правки текстов и CSS поверх копии Framer
  structure.mjs       правки структуры главной: удалённые/переделанные карточки, раздел «AI & side projects»
  covers.mjs          генерирует типографические обложки карточек в tools/images/ (нужен Google Chrome)
  images/             обложки карточек и их уменьшенные версии
  404.html            шаблон страницы 404
```

## Локальный просмотр

Нужен только Node.js 18+.

```bash
node tools/serve.mjs
```

Откройте http://localhost:4000

## Публикация на GitHub Pages

1. Создайте репозиторий. Лучше всего назвать его `<ваш-логин>.github.io` — тогда сайт будет доступен
   по адресу `https://<ваш-логин>.github.io/`. Сайт рассчитан на размещение **в корне домена**
   (пути к ресурсам абсолютные, `/assets/...`), поэтому для репозитория с другим названием
   (`https://<логин>.github.io/<репо>/`) нужен собственный домен.
2. Отправьте код:
   ```bash
   git remote add origin https://github.com/<ваш-логин>/<ваш-логин>.github.io.git
   git push -u origin main
   ```
3. В репозитории: **Settings → Pages → Build and deployment → Deploy from a branch**,
   ветка `main`, папка `/docs`.

### Свой домен

```bash
SITE_URL=https://example.com CNAME=example.com node tools/build.mjs
```

Затем закоммитьте `docs/` и укажите домен в **Settings → Pages → Custom domain**.
`SITE_URL` проставляет canonical/og:url и создаёт `sitemap.xml` и `robots.txt`.

## Как обновлять сайт

**Если продолжаете редактировать в Framer** — пересоберите копию с опубликованного сайта:

```bash
node tools/mirror.mjs
SITE_URL=https://lukinslava.github.io node tools/build.mjs
```

Скрипт сборки падает с понятной ошибкой, если Framer поменял рантайм так, что точечные правки больше не применяются.

**Если редактируете вручную** — текст каждой страницы есть в двух местах: в серверном HTML (`docs/*.html`)
и в JS-модуле страницы (`docs/assets/js/*.mjs`), из которого React восстанавливает страницу.
Менять нужно в обоих местах, иначе после загрузки JS текст откатится. Для заметных изменений
удобнее перенести сайт на собственный код (например, Astro/Next.js), используя эту копию как референс.

## Что изменено относительно Framer

- все ресурсы с `framerusercontent.com`, `fonts.gstatic.com` и `framer.com/m/…` скачаны локально;
- рантайм адаптирован под локальные пути (адаптивные картинки, определение шрифтов, предзагрузка изображений, иконки);
- удалены бейдж «Made in Framer», аналитика Framer (`events.framer.com`) и панель редактора Framer;
- добавлены своя страница 404 и `.nojekyll`.
