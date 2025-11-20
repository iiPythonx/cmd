export const coinflip = {
    name: "coinflip",
    group: "random",
    description: "flip a coin, heads or tails",
    command: async(terminal) => {
        return await new Promise(async (resolve) => {
            await terminal.write("Flipping...");
            setTimeout(async () => {
                await terminal.write(Math.round(Math.random()) ? "Heads." : "Tails.");
                resolve();
            }, 1000);
        });
    }
}
