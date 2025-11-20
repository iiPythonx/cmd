import words from "./words.json";

const LINE_LENGTH = 80;

export const goostype = {
    name: "goostype",
    group: "fun",
    description: "type fast for money",
    command: async (terminal) => {
        await terminal.write("\n  Goostype! Begin typing at any point after wordgen.\n");
        const max_word_size = Math.max(...words.map(w => w.length));

        // Generate starting string
        const characters = [], elements = [];
        for (let i = 0; i < 2; i++) {
            let length = 0, newchars = [];
            while (length < LINE_LENGTH) {
                let wordlist = words;
                if (length + max_word_size >= LINE_LENGTH) {
                    wordlist = words.filter(w => w.length === LINE_LENGTH - length)
                }
                
                const word = wordlist[Math.floor(Math.random() * wordlist.length)];
                for (const c of (word + " ")) newchars.push(c);
                length += word.length + 1;
            }

            (await terminal.write("  ")).style.display = "inline-block";

            for (const character of newchars) {
                const element = await terminal.write(character);
                element.style.color = "#666";
                element.style.display = "inline-block";
                elements.push(element);
            }

            characters.push(...newchars);
            await terminal.blank();
        }

        characters.pop();
        elements.pop();

        // Attach events
        await new Promise((resolve) => {
            const stats = { index: 0, start: null, hit: 0, missed: 0 };
            const keypress = async (e) => {
                if (!stats.start) stats.start = performance.now();
                if (("a" <= e.key && e.key <= "z")|| e.key === " ") {
                    e.preventDefault();
    
                    // Logging
                    const correct = e.key === characters[stats.index];
                    stats[correct ? "hit" : "missed"] += 1;
    
                    elements[stats.index].style.color = correct ? "#fff" : "#f00";
    
                    // Test completion
                    if (stats.index === characters.length - 1) {
                        document.removeEventListener("keydown", keypress);

                        const elapsed = (performance.now() - stats.start) / 1000;
                        const raw_wpm = (12 * characters.length) / elapsed;
                        const accuracy = stats.hit / characters.length;
                        const real_wpm = raw_wpm * accuracy;

                        const round = (v) => Math.round(v * 100) / 100;

                        await terminal.write("\n  Test complete!");
                        await terminal.write(`  Elapsed: ${round(elapsed)}s | ${round(real_wpm)}wpm (${round(raw_wpm)} raw) | Acc: ${round(accuracy * 100)}%\n`);

                        return resolve();
                    }
                    stats.index += 1;
                }
            }
            document.addEventListener("keydown", keypress);
        });
    }
}
