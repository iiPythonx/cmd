const THEMES = [
    { fg: "#ffffff", bg: "#000000" },  // shadow
    { fg: "#fd77d7", bg: "#141221" },  // chaos theory
    { fg: "#43ffaf", bg: "#262a33" },  // superuser
    { fg: "#ffffff", bg: "#00c18c" },  // menthol
    { fg: "#fcfcf8", bg: "#f37f83" },  // strawberry
    { fg: "#553d94", bg: "#bfbec2" },  // snes
    { fg: "#fcfcf8", bg: "#ff9869" },  // creamsicle
    { fg: "#14120f", bg: "#ceb18d" },  // cafe
    { fg: "#23a9d5", bg: "#1b2028" },  // dev
]

const setTheme = (id) => {
    const theme = THEMES[id - 1];
    if (theme) {
        let style = document.getElementById("theme-style");
        if (!style) {
            style = document.createElement("style");
            style.id = "theme-style";
            document.querySelector("head").appendChild(style);
        }
        style.innerText = `
            * { color: ${theme.fg}; }
            body { background: ${theme.bg} !important; }
        `;
    }
}

export const theme = {
    name: "theme",
    category: "terminal",
    description: "set terminal theme",
    command: async (terminal) => {
        await terminal.blank();
        for (const index in THEMES) {
            const element = await terminal.write(`Theme ${+index + 1}`);
            element.style.background = THEMES[index].bg;
            element.style.color = THEMES[index].fg;
            element.classList.add("theme-preview");
        }

        // Ask for theme update
        await terminal.write(`\n  Current theme: ${+localStorage.getItem('theme') || 1}`);
        const input = await terminal.read("  New theme (unchanged): ");
        if (!input.length) return;

        const new_theme = +input;
        if (THEMES[new_theme - 1]) {
            localStorage.setItem("theme", new_theme);
            setTheme(new_theme);
            return await terminal.write("  Terminal theme updated.");
        }

        await terminal.write("  Invalid theme specified.");
    }
}

setTheme(+localStorage.getItem("theme") || 1);
