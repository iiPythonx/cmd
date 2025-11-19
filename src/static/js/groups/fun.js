// Copyright (c) 2025 iiPython

// Joke
const joke = async (terminal, args) => {
    const result = await (await fetch("https://v2.jokeapi.dev/joke/Any")).json();
    if (result.type === "single") return await terminal.write(result.joke);

    await terminal.write(result.setup);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await terminal.write(result.delivery);
}

// Eightball
const EIGHTBALL_MESSAGES = [
    "It is certain.",
    "It is decidedly so.",
    "Without a doubt.",
    "Yes, definitely.",
    "You may rely on it.",
    "As I see it, yes.",
    "Most likely.",
    "Outlook is good.",
    "Yes.",
    "Signs point to yes.",
    "Reply hazy, try again.",
    "Ask again later.",
    "Better not tell you now.",
    "Cannot predict now.",
    "Concentrate and ask again.",
    "Don't count on it.",
    "My reply is no.",
    "My sources say no.",
    "Outlook not so good.",
    "Very doubtful."
];

const eightball = async (terminal, args) => {
    if (!args.length) return await terminal.write("  Come back with a question.");

    const message = args.join(" ");
    await terminal.write(`  ${message}?`);

    await new Promise((resolve) => setTimeout(resolve, 1000));
    await terminal.write(`  ${EIGHTBALL_MESSAGES[Math.floor(Math.random() * EIGHTBALL_MESSAGES.length)]}`);
};

export {
    joke,
    eightball as "8ball"
}
