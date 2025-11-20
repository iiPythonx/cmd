export const prompt = {
    name: "prompt",
    group: "terminal",
    description: "change the terminal prompt",
    command: async (terminal, args) =>  {
        if (!args.length) return await terminal.write("  prompt: missing new prompt")
        terminal.prompt.innerText = args.join(" ");
    }
}