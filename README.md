# DFIR Journey

Hugo site for Luis Camacho Jr.'s DFIR lab notebook and ForenSynth AI project.

The custom responsive layout uses local CSS and system fonts, with no client-side
JavaScript, external analytics, remote fonts, or evidence-upload forms. Existing
articles and historical report URLs remain available.

## Preview

Install Hugo extended 0.123.7 and run:

    hugo server

The site base URL is https://lucamachojr.github.io/dfir-journey/.
Main-branch updates trigger the existing deployment workflow to gh-pages.

## Editing

- Home layout: layouts/index.html
- Shared layout: layouts/_default/baseof.html
- Styles: static/css/journey.css
- Posts: content/posts/
- Static synthetic v2.4 report: static/forensynth/v2.4-demo/index.html

Content is authored repository material. Review screenshots and exports for sensitive
data before publishing. Synthetic examples must remain clearly labeled.
