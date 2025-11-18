// Copyright (c) 2025 iiPython

// Joke
const joke = async (terminal, args) => {
    await terminal.write("This is a joke.");
}

// :3
const threeathreethree = async (terminal, args) => {
    await terminal.write(":3");
    setTimeout(() => { window.location.href = "https://3a33.dmmdgm.dev"; }, 500);
};

// Projects
const projects = async (terminal, args) => {
    await terminal.write("Informative.");
}

export {
    joke,
    projects,
    threeathreethree as ":3",
    threeathreethree as "3a33"
}
