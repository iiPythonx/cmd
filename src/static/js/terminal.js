// Copyright (c) 2025 iiPython

new class {
    constructor() {
        this.element = document.querySelector("main");

        this.feed   = document.querySelector(".feed");
        this.prompt = this.feed.querySelector("pre");
        this.input  = this.feed.querySelector("input");

        // Fun configuration
        this.baud = +localStorage.getItem("baud") || 9600;
        if (this.baud < 0 || this.baud > 230400) {
            this.baud = 9600;
            localStorage.setItem("baud", 9600);
        }

        // Handle command ejection
        this.input.addEventListener("keydown", async (e) => {
            if (this.feed.style.display === "none") return;
            if (e.key === "Enter" && this.input.value) {
                const value = this.input.value;
                await this.write(`${this.prompt.innerText}${value}`, { skip: true });
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

    scroll() {
        window.scrollTo(0, document.body.scrollHeight);
    }

    write(text, data = {}) {
        const element = document.createElement("pre");
        (data.parent || this.element).appendChild(element);

        text += "\n";  // Force a newline

        if (data.skip) {
            element.innerText = text;
            this.scroll()
            return element;
        }

        return new Promise((resolve) => {
            let i = 0;
            const next = () => {
                if (i >= text.length) return resolve(element);
                element.textContent += text[i];
                i++;

                this.scroll();
    
                setTimeout(next, ((1 / this.baud) * 1000) * 10);
            }
    
            next();
        });
    }

    async clear() {
        this.element.innerHTML = "";
    }

    async blank() {
        this.element.appendChild(document.createElement("br"));
    }

    /*
        Read an input stream from the end user, given
        a prompt to pass to write.
    */
    async read(prompt) {
        const div = document.createElement("div");
        div.classList.add("feed");
        this.element.appendChild(div);

        // Push prompt into div
        this.write(prompt, { parent: div });

        // Setup input
        const input = document.createElement("input");
        div.appendChild(input);

        input.focus();
        return await new Promise((resolve) => {
            input.addEventListener("keydown", (e) => {
                if (e.key !== "Enter") return;

                const value = e.target.value;
                this.write(`${prompt}${value}`, { skip: true });

                div.remove();
                return resolve(value);
            });
        });
    }

    /*
        Given an unparsed command string, parse it and
        run the relevant command.
    */
    async launch_command(string) {
        const [ command, ...args ] = string.split(" ");
        if (!(command in this.commands)) return this.write("command not found");

        await this.commands[command](this, args);
    }

    /*
        Load each command group from the groups/ directory
        and merge the objects together into a central command
        mapping.
    */
    async register_commands() {
        for (const module of ["general", "games", "random", "fun"]) {
            const commands = await import(`/js/groups/${module}.js`);
            this.commands = { ...this.commands, ...commands };
        }
    }
};
