import words from "./words.json";
import { split } from "/src/js/lib/split";

const LINE_LENGTH = 80;

export const goostype = {
    name: "goostype",
    group: "fun",
    description: "type fast for money",
    command: async (terminal) => {
        const max_word_size = Math.max(...words.map(w => w.length));

        // Generate starting string
        for (let i = 0; i < 4; i++) {
            let length = 0, target = "";
            while (length < LINE_LENGTH) {

                let wordlist = words;
                if (length + max_word_size >= LINE_LENGTH) {
                    wordlist = words.filter(w => w.length === LINE_LENGTH - length)
                }
                
                const word = wordlist[Math.floor(Math.random() * wordlist.length)];
                target += word + " ";
                length += word.length + 1;
            }

            await terminal.write("  " + target.trim());
        }

        // Attach events
        document.addEventListener("keydown", (e) => {

        });
    }
}
