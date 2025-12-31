# Kuromaea Studio — Static Site

This is a static HTML/CSS/JS site (no build step).

## Run locally
- Using VS Code: install **Live Server** and open `index.html`
- Or serve with Python:

```bash
python -m http.server 3000
```

Then open `http://127.0.0.1:3000/`.

## Deploy to GitHub Pages
### Option A (recommended): User site
1. Create a repo named: **USERNAME.github.io**
2. Put the site files at the repo root (the same level as `index.html`)
3. GitHub → **Settings → Pages** → deploy from `main` branch

Site URL: `https://USERNAME.github.io/`

### Option B: Project site
If you deploy from a project repo (URL like `https://USERNAME.github.io/repo-name/`),
this site is still compatible because internal links/assets use **relative paths**.

## Post-deploy checklist
- Update `robots.txt` + `sitemap.xml` with your real URL (replace `YOUR-USERNAME`).
- Verify navigation between pages + dark mode + transitions.


**Affichage en darkmode directement la 1er fois désactiver cela que sa s'affiche clair et si on souhaite mettre en darkmode** = ✅
**régler le header car sur version mobile il remonter et par hors ecran evite rcela avec l'animation gsap** = ✅
**Remettre le logo en blanc sur la page index.html**
**Ajouter de l'espace entre les social-row et le main sur les pages**
**responsive encore plus les social-row pour qu'elle s'affiche en plus petit**
**Faire que le scroll arrow apparaisse une fois pour indiquer que l'on peut scroll mais ne réapparait pas quand on scroll vers le haut**
**remettre les informations de la card dans la page about à gauche au lieu de centré**
**connect with me l'agrandire un peu plus et réduire le bouton**