// Copyright (c) 2025 iiPython

// Joke
const joke = async (terminal, args) => {
    const result = await (await fetch("https://v2.jokeapi.dev/joke/Any")).json();
    if (result.type === "single") return await terminal.write(result.joke);

    await terminal.write(result.setup);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await terminal.write(result.delivery);
}

// :3
const threeathreethree = async (terminal, args) => {
    await terminal.write(":3");
    setTimeout(() => { window.location.href = "https://3a33.dmmdgm.dev"; }, 500);
};

// Exec
const exec = async (terminal, args) => {
    let result;
    try {
        result = eval(args.join(" "));
        if (result === undefined) return await terminal.write("undefined");
    } catch (e) { result = e; }
    await terminal.write(result.toString());
};

// Projects
const split = (s) => {
    const result = [];
    let regex = new RegExp("(.{1,80})(\\s|$)", "g");
    let match;

    while ((match = regex.exec(s)) !== null) result.push(match[1].trim());
    return result;
}

const projects = async (terminal, args) => {
    if (!window._project_data) {
        await terminal.write("Fetching index...");

        const raw_data = await (await fetch("https://index.iipython.dev/data.jsonc")).text();
        window._project_data = JSON.parse(raw_data.replace(/\s{4}\/\/ \d{4}/g, ""));
    }

    let page = 0, dead = false;
    while (true) {
        await terminal.clear();
        await terminal.write(`** Project Listing (Page ${page + 1} / ${Math.ceil(window._project_data.length / 10)}) **`)

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

        await terminal.write("\nType 'next' to go to the next page, 'back' to reverse.\nEnter a project name or ID to view more details about it.");
        await terminal.write("\nLeave at any time by typing 'quit' or 'exit'.");

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
                await terminal.write(`** ${project.name} (${project.id}) **`);
                if (project.aka) await terminal.write(`  Also known as: ${project.aka}`);
                if (project.end) await terminal.write(`  Lasted from 20${project.id.toString().slice(0, 2)} to 20${project.end}`);
                
                await terminal.blank();
                for (const line of split(project.description.replace(/<a [^>]*>(.*?)<\/a>/g, "$1"))) await terminal.write("  " + line.trim());

                if (project.code || project.site) await terminal.blank();
                if (project.code) await terminal.write("  Code: " + project.code);
                if (project.site) await terminal.write("  Site: " + project.site);

                await terminal.read("\n[ENTER to continue]");
            }
        }
    }
}

export {
    joke,
    projects,
    exec,
    threeathreethree as ":3",
    threeathreethree as "3a33",
}
