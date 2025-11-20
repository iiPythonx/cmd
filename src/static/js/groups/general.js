// Copyright (c) 2025 iiPython

export const help = {
    name: "help",
    category: "terminal",
    description: "you're already here",
    command: async (terminal) => {
        const logged = [];
        for (const command of terminal.commands) {

            // Handle grouping
            const group = `${command.category.slice(0, 1).toUpperCase()}${command.category.slice(1, command.category.length)}`;
            if (!logged.includes(group)) await terminal.write(`${logged.length ? "\n" : ""}  ${group}\n  ════════════════════════`);
            logged.push(group);

            // Command info
            const log = async (name, description) => {
                const spacing = ".".repeat(40 - name.length);
                await terminal.write(`      ${name} ${spacing} ${description}`);
            }

            if (command.visible !== false) await log(command.name, command.description);

            // Subcommands
            const subcommands = command.subcommands || {};
            for (const name in subcommands) await log(`${command.name} ${name}`, subcommands[name]);
        }
    }
}

export const baud = {
    name: "baud",
    category: "terminal",
    description: "baud rate control",
    command: async (terminal) => {
        await terminal.write("  <Slow>         <Medium>         <Fast>");
        await terminal.write("  300 1200 4800 9600 38400 115200 230400");
        await terminal.blank();
        await terminal.write(`  Current value: ${terminal.baud} baud`);
        
        // Fetch input
        const input = await terminal.read("  New value (unchanged): ");
        if (!input.length) return;
        
        const new_baud = +input;
        if (new_baud > 0 && new_baud <= 230400) {
            terminal.baud = new_baud;
            localStorage.setItem("baud", new_baud);
            return await terminal.write("  Baud rate updated.");
        }
        
        await terminal.write("  Invalid baud rate provided.");
    }
}

export const about = {
    name: "about",
    category: "terminal",
    description: "console information",
    command: async (terminal) => {
        await terminal.write("   ___                    ___  ___ ");
        await terminal.write("  / __|___ ___ ___ ___   / _ \\/ __|");
        await terminal.write(" | (_ / -_) -_|_-</ -_) | (_) \\__ \\");
        await terminal.write("  \\___\\___\\___/__/\\___|  \\___/|___/\n");
        await terminal.write("  Geese OS - Terminal edition™");
        await terminal.write("  Inspired by the late 2017 website, cmd.to and cmd.fm.\n");
        await terminal.write(`  Running version 1.2.0, on ${window.location.hostname}.\n`);
    }
}

export const clear = {
    name: "clear",
    category: "terminal",
    description: "console information",
    command: async (terminal) => await terminal.clear()
}

// Theming
const THEMES = [
    { fg: "#ffffff", bg: "#000000" },  // shadow
    { fg: "#fd77d7", bg: "#141221" },  // chaos theory
    { fg: "#43ffaf", bg: "#262a33" },  // superuser
    { fg: "#ffffff", bg: "#00c18c" },  // menthol
    { fg: "#fcfcf8", bg: "#f37f83" },  // strawberry
    { fg: "#553d94", bg: "#bfbec2" },  // snes
    { fg: "#fcfcf8", bg: "#ff9869" },  // creamsicle
    { fg: "#14120f", bg: "#ceb18d" },  // cafe
    { fg: "#23a9d5", bg: "#1b2028" },  // dev
]

const setTheme = (id) => {
    const theme = THEMES[id - 1];
    if (theme) {
        let style = document.getElementById("theme-style");
        if (!style) {
            style = document.createElement("style");
            style.id = "theme-style";
            document.querySelector("head").appendChild(style);
        }
        style.innerText = `
            * { color: ${theme.fg}; }
            body { background: ${theme.bg} !important; }
        `;
    }
}

export const theme = {
    name: "theme",
    category: "terminal",
    description: "set terminal theme",
    command: async (terminal) => {
        await terminal.blank();
        for (const index in THEMES) {
            const element = await terminal.write(`Theme ${+index + 1}`);
            element.style.background = THEMES[index].bg;
            element.style.color = THEMES[index].fg;
            element.classList.add("theme-preview");
        }

        // Ask for theme update
        await terminal.write(`\n  Current theme: ${+localStorage.getItem('theme') || 1}`);
        const input = await terminal.read("  New theme (unchanged): ");
        if (!input.length) return;

        const new_theme = +input;
        if (THEMES[new_theme - 1]) {
            localStorage.setItem("theme", new_theme);
            setTheme(new_theme);
            return await terminal.write("  Terminal theme updated.");
        }

        await terminal.write("  Invalid theme specified.");
    }
}

setTheme(+localStorage.getItem("theme") || 1);

export const fullscreen = {
    name: "fullscreen",
    category: "terminal",
    description: "immerse yourself",
    command: document.documentElement.requestFullscreen
}

export const changelog = {
    name: "changelog",
    category: "terminal",
    description: "view the cmd changelog",
    command: async (terminal) => {
        for (const release of await (await fetch("/assets/changelog.json")).json()) {
            await terminal.write(`  ${release.version}\n  ════════════════════════`);
            for (const change of release.changed) await terminal.write(`    * ${change}`);
            await terminal.blank();
        }
    }
}
