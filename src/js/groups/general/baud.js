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
