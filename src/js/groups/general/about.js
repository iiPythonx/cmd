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
