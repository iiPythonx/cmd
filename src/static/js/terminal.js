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
            const start = Date.now();
            let i = 0;
            const next = () => {
                if (i >= text.length) return resolve(element);
                const j = Math.floor(this.baud * (Date.now() - start) / 1000 / 10);  // hai what is the 10 in this context
                                                                                     // also in my testing with this new system, 25 works better
                element.textContent += text.slice(i, j);
                i = j;

                this.scroll();
    
                setTimeout(next);
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

    async read(prompt, type) {
        const div = document.createElement("div");
        div.classList.add("feed");
        this.element.appendChild(div);

        // Push prompt into div
        this.write(prompt, { parent: div });

        // Setup input
        const input = document.createElement("input");
        input.type = type || "text";
        div.appendChild(input);

        input.focus();
        return await new Promise((resolve) => {
            input.addEventListener("keydown", (e) => {
                if (e.key !== "Enter") return;

                const value = e.target.value;
                this.write(`${prompt}${type === "password" ? "*".repeat(value.length) : value}`, { skip: true });

                div.remove();
                return resolve(value);
            });
        });
    }

    async launch_command(string) {
        const [ command, ...args ] = string.split(" ");
        if (!(command in this.commands)) return this.write("command not found");

        await this.commands[command](this, args);
    }

    async register_commands() {
        for (const module of ["general", "games", "random", "fun", "user"]) {
            const commands = await import(`/js/groups/${module}.js`);
            this.commands = { ...this.commands, ...commands };
        }
    }
};
