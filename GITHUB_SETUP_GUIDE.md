# GitHub Setup Guide - Step by Step

## Step 1: Initialize Git Repository

Run these commands in your terminal (already done for you):

```bash
git init
git add .
git commit -m "Initial commit: Digital Wine List with fixed data"
```

## Step 2: Create a GitHub Repository

1. Go to https://github.com and sign in (or create an account)
2. Click the **"+"** icon in the top right corner
3. Select **"New repository"**
4. Fill in:
   - **Repository name**: `wine-collection` (or any name you like)
   - **Description**: "Digital Wine List for Gran Caffè L'Aquila"
   - **Visibility**: Choose Public or Private
   - **DO NOT** check "Initialize with README" (we already have files)
5. Click **"Create repository"**

## Step 3: Connect Your Local Repository to GitHub

After creating the repository, GitHub will show you commands. Use these:

```bash
# Replace YOUR_USERNAME with your GitHub username
# Replace REPO_NAME with the repository name you chose

git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git
git branch -M main
git push -u origin main
```

## Step 4: Enable GitHub Pages

1. Go to your repository on GitHub
2. Click on **"Settings"** (top menu)
3. Scroll down to **"Pages"** (left sidebar)
4. Under **"Source"**, select:
   - **Branch**: `main`
   - **Folder**: `/ (root)`
5. Click **"Save"**
6. Wait 1-2 minutes, then your site will be live at:
   - `https://YOUR_USERNAME.github.io/REPO_NAME/`

## Step 5: Test Your Site

1. Open your browser
2. Go to: `https://YOUR_USERNAME.github.io/REPO_NAME/`
3. You should see:
   - ✅ The map of Italy
   - ✅ Wine regions
   - ✅ Wine cards when you click a region

## Troubleshooting

### If the map doesn't show:
- Wait 2-3 minutes after enabling GitHub Pages
- Clear your browser cache (Ctrl+Shift+R or Cmd+Shift+R)
- Check the browser console for errors (F12)

### If wines don't load:
- Make sure `data/wines.json` was pushed to GitHub
- Check that the file path in the code is correct: `./data/wines.json`

### If you need to update files:
```bash
git add .
git commit -m "Update description"
git push
```

## Quick Reference Commands

```bash
# Check status
git status

# Add all changes
git add .

# Commit changes
git commit -m "Your message here"

# Push to GitHub
git push

# Pull latest changes
git pull
```

