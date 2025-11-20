export const joke = {
    name: "joke",
    category: "fun",
    description: "generate a random joke",
    command: async (terminal) => {
        const result = await (await fetch("https://v2.jokeapi.dev/joke/Any")).json();
        if (result.type === "single") return await terminal.write(result.joke);

        await terminal.write(result.setup);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await terminal.write(result.delivery);
    }
}
