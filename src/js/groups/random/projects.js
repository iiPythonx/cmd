import { split } from "/src/js/lib/split";

export const projects = {
    name: "projects",
    group: "random",
    description: "dump the project archive",
    command: async (terminal) => {
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
            await terminal.write("\nLeave at any time by typing 'q', 'quit' or 'exit'.");

            const command = await terminal.read(">> ");
            if (command == "q" || command == "quit" || command == "exit") break;

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
}
