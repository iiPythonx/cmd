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
