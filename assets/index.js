// Copyright (c) 2025 iiPython

new class {
    constructor() {
        this.element = document.querySelector("main");

        this.feed   = document.getElementById("input");
        this.prompt = this.feed.querySelector("pre");
        this.input  = this.feed.querySelector("input");

        // Handle command ejection
        this.input.addEventListener("keydown", async (e) => {
            if (this.feed.style.display === "none") return;
            if (e.key === "Enter" && this.input.value) {
                const value = this.input.value;
                await this.write(`${this.prompt.innerText}${value}`, true);
                this.input.value = "";

                // Hide feed
                this.feed.style.display = "none";
                await this.launch_command(value);
                this.feed.style.display = "flex";

                // Refocus on input box
                e.target.focus();
            }
        });
        this.input.addEventListener("focusout", (e) => e.target.focus());

        // Load existing commands
        this.register_commands();
    }

    write(text, skip) {
        const element = document.createElement("pre");
        this.element.appendChild(element);

        if (skip) {
            element.innerText = text;
            return;
        }

        return new Promise((resolve) => {
            let i = 0;
            const next = () => {
                if (i >= text.length) return resolve();
                element.textContent += text[i];
                i++;
    
                setTimeout(next, ((1 / 9600) * 1000) * 10);
            }
    
            next();
        });
    }

    blank() {
        this.element.appendChild(document.createElement("br"));
    }

    /*
        Given an unparsed command string, parse it and
        run the relevant command.
    */
    async launch_command(string) {
        const [ command, ...args ] = string.split(" ");
        if (!(command in this.commands)) return this.write("not found");

        await this.commands[command](this, args);
    }

    /*
        Load each command group from the groups/ directory
        and merge the objects together into a central command
        mapping.
    */
    async register_commands() {
        for (const module of ["terminal"]) {
            const commands = await import(`./groups/${module}.js`);
            this.commands = { ...this.commands, ...commands };
        }
    }
};
