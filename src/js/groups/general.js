// Copyright (c) 2025 iiPython

// Help command
const HELP_DETAILS = {
    "Terminal": {
        "help": "you're already here",
        "about": "console information",
        "baud": "baud rate control",
        "clear": "clear the screen",
    },
    "Games": {
        "games": "general settings",
        "games pacman": "eat some ghosts",
        "games mario": "it's a me, a mario!",
        "games tetris": "beep boop bam bop bow"
    },
    "Random": {
        "joke": "get a random joke",
        "3a33": "send yourself to hell",
        "projects": "dump the project archive",
    },
    "Radio": {
        "radio": "current radio info",
        "radio play": "tune in",
        "radio skip": "vote skip current song",
        "radio volume": "update radio volume",
        "radio stop": "stop radio :("
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
    await terminal.write("  \\___\\___\\___/__/\\___|  \\___/|___/");
    await terminal.blank();
    await terminal.write("  Geese OS - Terminal edition™");
    await terminal.write("  Inspired by the late 2017 website, cmd.to and cmd.fm.");
    await terminal.blank();
}

// Clear
const clear = async (terminal, args) => await terminal.clear();

export { help, baud, about, clear }
