# magic-of-stella
![GitHub package.json version](https://img.shields.io/github/package-json/v/guansss/magic-of-stella?style=flat-square)
[![Codacy Badge](https://img.shields.io/codacy/grade/00c87d52cf0c47a3a0500feddb63a259?style=flat-square&logo=codacy)](https://www.codacy.com/manual/guansss/magic-of-stella?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=guansss/magic-of-stella&amp;utm_campaign=Badge_Grade)
[![Steam Subscriptions](https://img.shields.io/steam/subscriptions/1973329389?style=flat-square&logo=steam&color=blue)](https://steamcommunity.com/sharedfiles/filedetails/?id=1973329389)
![Made with](https://img.shields.io/badge/made%20with-%E2%99%A5-ff69b4?style=flat-square)

Wallpaper from the ending theme of anime *Magic of Stella (ステラのまほう)* .

## Setup

It's recommended to use *Yarn* as package manager, *npm* is fine though.

``` sh
yarn install
```

## Serving

### Sering for browsers

Create a folder named `wallpaper` at project root, then run following command.

``` sh
yarn setup
```

### Serving for Wallpaper Engine

By redirecting the running wallpaper to the server, we are able to use the `liveReload` feature of Webpack dev server, which is extremely useful for development.

To achieve that, a script was made to generate a bridge HTML file, there are a few steps to prepare before using this script:

1. Create a folder in `myproject` directory of Wallpaper Engine, for example:
    ```
    C:\Program Files (x86)\Steam\steamapps\common\wallpaper_engine\projects\myprojects\magic-of-stella
    ```

2. Go back to this project, create `.env.local` file at project root, add `WALLPAPER_PATH` variable which describes the destination of output files.

    ``` sh
    WALLPAPER_PATH=C:\Program Files (x86)\Steam\steamapps\common\wallpaper_engine\projects\myprojects\magic-of-stella
    ```

    For more information about the format of this file, see [dotenv](https://github.com/motdotla/dotenv).

3. Run following command. You may be asked for confirmations to overwrite existing files.

    ``` sh
    yarn setup
    ```

4. Check the Wallpaper Engine browser, a new wallpaper should appear with `[DEV]` prefix.

This preparation should be done only once, but any time you think the generated files are supposed be updated, you need to run `yarn setup` again.

Now, just like serving for browsers, run `yarn start`, and then select the wallpaper, everything will work as it should be in browsers.

## Building

``` sh
yarn build
```

If you are updating an existing Workshop project instead of creating a new one, you need to specify a `WORKSHOP_ID` in `.env.local` before building the project.

``` sh
WORKSHOP_ID=123456
```

When publishing to Workshop, don't forget to copy files in `/wallpaper` and paste them into your project.
