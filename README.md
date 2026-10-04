# Stellaris Tech Tree

An interactive, browsable tech tree for [Stellaris](https://store.steampowered.com/app/281990/Stellaris/).

**Live site: https://hydelix.github.io/stellaris-tech-tree/**

**Current version: Stellaris 4.5.1 "Cygnus"**

This is a maintained fork of [BloodStainedCrow/stellaris-tech-tree](https://github.com/BloodStainedCrow/stellaris-tech-tree). Older versions of the tree are kept, so you can still look at how research looked in earlier patches (back to 2.2.0).

## Features

- **Full tree for every research area**: Physics, Society and Engineering, plus an Events tab for techs that can't be rolled normally (event and special-source techs).
- **Tech details on click**: description, what the tech unlocks, requirements, prerequisites, and the weight modifiers that make it more or less likely to be offered.
- **Search**: type to highlight matching techs across names, descriptions, requirements and effects. Press Enter for the next match and Shift+Enter for the previous one.
- **Research tracking**: mark techs as researched, and save and load named research lists (stored in your browser).
- **Version archive**: switch between patches from the version list. The site opens on the latest one.

## Using the site

Open the live site and it loads the latest version. Use the **Back** button in the top bar to return to the version list.

## Running it locally

The site is plain static HTML, CSS and JavaScript, but it loads its data files through the browser, so opening `index.html` directly from disk will not work. Serve the folder instead:

```
git clone https://github.com/Hydelix/stellaris-tech-tree.git
cd stellaris-tech-tree
python -m http.server 8000
```

Then open http://localhost:8000/ in your browser. Any other static file server works too.

## Repository layout

| Path | What it is |
| --- | --- |
| `index.html` | Landing page and loader. The version list lives in the `window.routes` array. |
| `cygnus-4.5.1/` (and the other `<name>-<version>/` folders) | One folder per game version, each holding `physics.json`, `society.json`, `engineering.json` and `anomalies.json`. |
| `assets/img/` | Tech icons, named after the tech key (for example `tech_lasers_1.png`). |
| `assets/icons/` | Small inline icons used in tooltips (resources, ethics, and so on). |
| `assets/js/`, `assets/css/`, `assets/html/` | The site's scripts, styling and page markup. |
| `convert_dds_to_png.py` | Helper that converts the game's `.dds` icons to `.png`. |
| `jobs/` | An older, unfinished jobs list (WIP, for 2.2.7). |

## About the data

The tree data is generated from the game's own files, not written by hand. A few things to be aware of in the 4.5.1 data:

- Some techs in 4.5 use "any one of these" prerequisite groups (for example Growth Chamber and Mass Accelerator). The site's tracker only supports "all of these", so for those techs only the first listed alternative is shown as the prerequisite.
- Weight modifier and requirement text is generated automatically from the game files. Some of the newest, most complex conditions are described in general terms, such as "meeting special conditions".

## Credits

- Original site by [bipedalshark](https://gitlab.com/bipedalshark/stellaris-tech-tree).
- Upstream maintenance by [BloodStainedCrow](https://github.com/BloodStainedCrow/stellaris-tech-tree), with contributions from SlenderPlays, Tsudico, Turanar and ark-1.
- Stellaris and all game content, names and icons belong to Paradox Interactive. This project is a fan-made tool and is not affiliated with or endorsed by Paradox.

## License

Released under the [MIT License](LICENCE). Game content remains the property of its owners.
