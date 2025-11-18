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
    if (!window._project_data) {
        await terminal.write("Fetching index...");

        const raw_data = await (await fetch("https://index.iipython.dev/data.jsonc")).text();
        window._project_data = JSON.parse(raw_data.replace(/\s{4}\/\/ \d{4}/g, ""));
    }

    let page = 0, dead = false;
    while (true) {
        await terminal.clear();
        for (let i = 0; i < 10; i++) {
            const index = i + (10 * page);

            const project = window._project_data[index];
            if (project == null) {
                await terminal.write("** No More Entries **");
                dead = true;
                break;
            }

            await terminal.write(`  ${project.id} ...... ${project.name}`);
        }

        await terminal.blank();
        await terminal.write("Type 'next' to go to the next page, 'back' to reverse.");
        await terminal.write("Enter a project name or ID to view more details about it.");
        await terminal.write("Leave at any time by typing 'quit' or 'exit'.");

        const command = await terminal.read(">> ");
        if (command == "quit" || command == "exit") break;

        // Next and back
        if (command == "next" && !dead) {
            page++;
            continue;
        }
        if (command == "back" && page) {
            page--;
            dead = false;
            continue;
        };

        // Perform a project search
        for (const project of window._project_data) {
            if (project.id == command || project.name.toLowerCase() == command.toLowerCase()) {
                await terminal.clear();
                await terminal.write(`  ** ${project.name} (${project.id}) **`);
                if (project.aka) await terminal.write(`  Also known as: ${project.aka}`);
                
                await terminal.blank();
                for (const line of project.description.match(/.{1,100}/g)) await terminal.write("  " + line.trim());

                if (project.code) {
                    await terminal.blank();
                    await terminal.write("  " + project.code);
                }

                await terminal.blank();
                await terminal.read("[ENTER to continue]");
            }
        }
    }
}

export {
    joke,
    projects,
    threeathreethree as ":3",
    threeathreethree as "3a33"
}
