# DFIR Hugo Starter — *DFIR Journey*

Minimal Hugo site scaffold optimized for **GitHub Pages** and DFIR write-ups using **PaperMod**.

## Quick Start
```bash
git init dfir-journey && cd dfir-journey
# Copy these starter files into the repo (or unzip the provided package)
git submodule add https://github.com/adityatelange/hugo-PaperMod.git themes/PaperMod
git add . && git commit -m "feat(site): scaffold DFIR Hugo + GH Pages workflow"
git branch -M main
git remote add origin https://github.com/<YOUR_USERNAME>/<YOUR_REPO>.git
git push -u origin main
```
Local preview after installing Hugo (extended):
```bash
hugo server -D
```
Enable **Pages** for `gh-pages` branch in repo settings.
