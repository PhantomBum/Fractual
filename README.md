# Fractual

Fractual is a readable, responsive ImGui-inspired placeholder menu. It fills its native desktop window and has no product purpose or application features.

## Install on Windows

Download and run `Fractual-Setup-x.y.z.exe` from the latest GitHub release. This initial installer is the last update that needs to be downloaded manually.

After installation, Fractual checks GitHub Releases automatically, downloads updates in the background, shows progress under **Settings → Auto update**, and offers **Restart** when the next version is ready. Downloaded updates also install when the app exits.

The menu uses crisp Geist Variable typography, a connected animated network background, responsive panel reflow, interface scaling from 90–120%, and an animated collapsible sidebar. UI Swap reproduces the Stellar opening interaction with a tactile cover-flow, enlarged center selection, dimmed adjacent previews, animated titles, mouse-wheel and touch scrolling, keyboard controls, and an apply action for the Classic, Stellar, Horizon, and Dock layouts.

Version 2.7 rebuilds **New** around the loading screen's near-black, off-white visual language. It raises the text-size floor, removes text-blurring glass effects, adds spring-tweened layout changes, replaces Horizon with a responsive command bar, and makes Dock part of the layout so it stays centered at every window size. **Legacy** remains available under **Settings → Interface mode**.

Version 2.7.1 moves New mode into a final, isolated stylesheet so older revision rules cannot override it. Primary labels now have a 14 px minimum, secondary copy has a 12 px minimum, navigation has a 13 px minimum, and the floors remain readable even when interface scale is reduced.

**Settings → Discord presence** is connected to Discord RPC. Add a Discord Application ID as `discordClientId` in `package.json` for packaged builds, or set `FRACTUAL_DISCORD_CLIENT_ID` while developing. Without an ID, the setting explains what is missing instead of pretending a connection succeeded.
