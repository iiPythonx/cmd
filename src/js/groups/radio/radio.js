const radio = new class {
    constructor() {
        this.audio = new Audio();
        this.audio.volume = .5;
        
        this.info = null;
        this.paused = false;
    }

    init() {
        return new Promise((resolve) => {
            this.websocket = new WebSocket("wss://radio.iipython.dev/stream");
            this.websocket.addEventListener("open", resolve);
            this.websocket.addEventListener("message", (e) => {
                const { type, data } = JSON.parse(e.data);
                switch (type) {
                    case "update":
                        this.audio.src = `https://radio.iipython.dev/audio/${data.this_track.path}`;
                        this.audio.load();
                        this.websocket.send(JSON.stringify({ type: "position" }));

                        this.info = data;
                        break;
    
                    case "position":
                        this.audio.currentTime = data.elapsed / 1000;
                        if (!this.paused) this.audio.play();
                        break;
                }
            });
        });
    }

    seconds(s) {
        s = Math.round(s);
        const minutes = Math.floor(s / 60);
        return `${String(minutes).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
    }

    stop() {
        this.paused = true;
        this.audio.pause();
    }

    resume() {
        this.paused = false;
        this.websocket.send(JSON.stringify({ type: "position" }));
    }

    volume(v) {
        this.audio.volume = v / 100;
    }
};

export const play = {
    name: "radio",
    group: "radio",
    description: "view radio status",
    subcommands: {
        "play": "tune in to the radio",
        "stop": "stop the sick tunes :(",
        "volume {x}": "set radio volume",
        "mute": "set volume to 0"
    },
    command: async (terminal, args) => {
        if (!args.length) {
            if (!radio.info) return await terminal.write("  * Not tuned in!");

            const [ artist, track ] = radio.info.this_track.title.split(" - ");
            const album = radio.info.this_track.path.split("/")[0].split(" - ")[1];

            await terminal.write("  ** iiPython Radio **");
            await terminal.write(`  Track: ${track} | Artist: ${artist} | Album: ${album}`);
            await terminal.write(`  Elapsed: ${radio.seconds(radio.audio.currentTime)} / ${radio.seconds(radio.info.this_track.length / 1000)}`);
            
        }
        switch (args[0]) {
            case "play":
                if (radio.paused) return radio.resume();

                // Initialize
                await terminal.write("  * Tuning in...");
                await radio.init();
                break;

            case "stop":
                radio.stop();
                break;

            case "mute":
                radio.volume(0)
                break;

            case "volume":
                if (args.length < 2) return await terminal.write("  * Missing volume!");
                if (args[1] < 0 || args[1] > 100) return await terminal.write("  * Invalid volume level!");

                radio.volume(args[1]);
                break;
        }
    }
}
