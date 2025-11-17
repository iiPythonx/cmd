// Copyright (c) 2025 iiPython

// Help command
const HELP_DETAILS = {
    "Terminal": {
        "help": "you're already here",
        "about": "console information",
        "baud": "show list of baud rates",
        "baud {rate}": "set terminal baud rate"
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
        "radio volume {v}": "update radio volume",
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

export { help, about }
