# Gran Caffè L'Aquila - Digital Wine List

A professional digital wine list website for Gran Caffè L'Aquila, featuring a luxury design and dynamic wine data integration. **Fully optimized for GitHub Pages deployment.**

## Features

- **Responsive Design**: Mobile-first approach with luxury aesthetic
- **Dynamic Wine Data**: Real-time loading from JSON data source
- **Interactive Leaflet Map**: Functional map with HTTPS tiles showing Italian wine regions
- **Search & Filtering**: Advanced search and filter functionality
- **Wine Categories**: Red, White, Rosé, Orange, Sparkling, and Non-Alcoholic wines
- **Regional Navigation**: Browse wines by Italian regions
- **Wine Details**: Comprehensive wine information with tasting notes
- **Professional UI**: Luxury design with smooth animations
- **SPA-like Routing**: Client-side routing with 404.html fallback for GitHub Pages

## Technology Stack

- **Bootstrap 5.3**: Modern responsive framework (HTTPS CDN)
- **Leaflet 1.9.4**: Interactive maps with HTTPS tiles
- **HTML5**: Semantic markup
- **CSS3**: Modern styling with CSS Grid and Flexbox
- **JavaScript (ES6+)**: Dynamic functionality and data handling
- **Font Awesome 6.4**: Icons (HTTPS CDN)
- **Google Fonts**: Cinzel and Cormorant typography (HTTPS)

## File Structure

```
project/
├── index.html              # Homepage with interactive map
├── regions.html            # Wine regions page
├── wines.html              # Wine listing page
├── wine-details.html       # Individual wine details
├── 404.html                # SPA routing fallback for GitHub Pages
├── .nojekyll               # Disables Jekyll processing on GitHub Pages
├── css/
│   └── style.css          # Main stylesheet
├── js/
│   └── main.js            # JavaScript functionality
├── data/
│   └── wines.json         # Wine data (JSON format)
├── image/
│   ├── gcaLogo.png        # Logo
│   ├── glassRed.png       # Red wine icon
│   ├── glassWhite.png     # White wine icon
│   ├── glRose.png         # Rosé wine icon
│   ├── glArancione.png    # Orange wine icon
│   ├── glSparkling.png    # Sparkling wine icon
│   └── gl00.png           # Non-alcoholic wine icon
└── server.py              # Local development server (optional)
```

## GitHub Pages Configuration

This project is **fully configured** for GitHub Pages deployment:

### ✅ Requirements Met

- ✅ **Bootstrap 5.3**: Using HTTPS CDN
- ✅ **Leaflet Map**: Configured with HTTPS tiles (`https://{s}.tile.openstreetmap.org`)
- ✅ **Relative Paths**: All assets use relative paths (`./` or `../`)
- ✅ **HTTPS CDNs**: All external resources use HTTPS
- ✅ **`.nojekyll` file**: Disables Jekyll processing
- ✅ **`404.html`**: Handles SPA-like routing for GitHub Pages

### Deployment Steps

1. **Create a GitHub Repository**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Digital Wine List"
   git branch -M main
   git remote add origin https://github.com/yourusername/your-repo-name.git
   git push -u origin main
   ```

2. **Enable GitHub Pages**
   - Go to your repository on GitHub
   - Navigate to **Settings** → **Pages**
   - Under **Source**, select **Deploy from a branch**
   - Choose **main** branch and **/ (root)** folder
   - Click **Save**

3. **Access Your Site**
   - Your site will be available at: `https://yourusername.github.io/your-repo-name/`
   - GitHub Pages may take a few minutes to build and deploy

### Local Development

To test locally before deploying:

**Option 1: Python HTTP Server**
```bash
python3 server.py
# Then open http://localhost:3000
```

**Option 2: Simple HTTP Server**
```bash
python3 -m http.server 8000
# Then open http://localhost:8000
```

**Option 3: Node.js HTTP Server**
```bash
npx http-server -p 8000
# Then open http://localhost:8000
```

### Important Notes

- **All paths are relative**: The project uses `./` for all local assets, ensuring it works both locally and on GitHub Pages
- **HTTPS only**: All CDN resources and map tiles use HTTPS for security
- **SPA routing**: The `404.html` file handles client-side routing, redirecting to `index.html` with the original path preserved
- **No build step required**: This is a pure static site - just push to GitHub!

## Color Palette

- Primary Gold: #D4AF37
- Dark Gold: #B8860B
- Background: #0A0A0A
- Charcoal: #1A1A1A
- Ivory: #F5F5F0
- Burgundy: #8B0000

## Typography

- Headings: Cinzel (serif)
- Body: Cormorant (serif)
- Fallback: System fonts

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance Features

- Optimized image loading
- Efficient data handling
- Minimal DOM manipulation
- Progressive enhancement
- Mobile-first responsive design
- Lazy loading for map tiles

## Troubleshooting

### Map not loading on GitHub Pages
- Ensure Leaflet is using HTTPS tiles (already configured)
- Check browser console for CORS errors
- Verify `.nojekyll` file exists in root directory

### 404 errors on direct page access
- The `404.html` file should handle routing automatically
- If issues persist, check that `404.html` is in the root directory

### Assets not loading
- Verify all paths use relative notation (`./` or `../`)
- Check that file names match exactly (case-sensitive on some systems)

## License

© 2023 Gran Caffè L'Aquila. All rights reserved.
