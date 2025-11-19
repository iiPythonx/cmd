// Copyright (c) 2025 iiPython

// Help command
const HELP_DETAILS = {
    "Terminal": {
        "help": "you're already here",
        "about": "console information",
        "baud": "baud rate control",
        "clear": "clear the screen",
        "theme": "set terminal theme",
        "fullscreen": "immerse yourself"
    },
    "Games": {
        "game castlevania": "beat up some foes",
        "game mario": "it's a me, a mario!",
        "game pacman": "eat some ghosts",
        "game tetris": "beep boop bam bop bow",
        "game zelda": "sword? slash?? kachow???"
    },
    "Random": {
        "joke": "get a random joke",
        "3a33": "send yourself to hell",
        "projects": "dump the project archive",
        "exec": "run javascript :3",
        "time": "check the system time"
    }
}

const help = async (terminal, args) => {
    for (const group in HELP_DETAILS) {
        await terminal.write(`  ${group}`);
        await terminal.write(`  ════════════════════════`);

        // Commands
        for (const command in HELP_DETAILS[group]) {
            const description = HELP_DETAILS[group][command];
            const spacing = ".".repeat(40 - command.length);
            await terminal.write(`      ${command} ${spacing} ${description}`);
        }
        terminal.blank();
    }
}

// Baud rate
const baud = async (terminal, args) => {
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
};

// About
const about = async (terminal, args) => {
    await terminal.write("   ___                    ___  ___ ");
    await terminal.write("  / __|___ ___ ___ ___   / _ \\/ __|");
    await terminal.write(" | (_ / -_) -_|_-</ -_) | (_) \\__ \\");
    await terminal.write("  \\___\\___\\___/__/\\___|  \\___/|___/\n");
    await terminal.write("  Geese OS - Terminal edition™");
    await terminal.write("  Inspired by the late 2017 website, cmd.to and cmd.fm.\n");
    await terminal.write(`  Running version 1.0.0, on ${window.location.hostname}.\n`);
}

// Clear
const clear = async (terminal, args) => await terminal.clear();

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

const theme = async (terminal, args) => {
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
};

setTheme(+localStorage.getItem("theme") || 1);

// Fullscreen
const fullscreen = async (terminal, args) => {
    document.documentElement.requestFullscreen();
}

// Export commands
export { help, baud, about, clear, theme, fullscreen };
