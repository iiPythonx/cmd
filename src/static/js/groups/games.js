// Copyright (c) 2025 iiPython

const GAME_LIST = {
    "castlevania": "beat up some foes",
    "mario": "it's a me, a mario!",
    "pacman": "eat some ghosts",
    "tetris": "beep boop bam bop bow",
    "zelda": "sword? slash?? kachow???"
};

export const game = {
    name: "game",
    category: "games",
    visible: false,
    subcommands: GAME_LIST,
    command: async (terminal, args) => {
        if (!args.length) return await terminal.write("game: no rom provided to launch");

        const romName = args[0];
        if (!(romName in GAME_LIST)) return await terminal.write("game: specified rom does not exist");

        // Lazy load in our components
        const { default: init, WasmNes, Button } = await import("/assets/nes/nes_rust_wasm.js");
        
        // Button mapping
        const BUTTON_MAPPING = {
            " ": Button.Start,
            "ArrowLeft": Button.Joypad1Left,
            "ArrowUp": Button.Joypad1Up,
            "ArrowRight": Button.Joypad1Right,
            "ArrowDown": Button.Joypad1Down,
            "r": Button.Reset,
            "s": Button.Select,
            "z": Button.Joypad1A,
            "x": Button.Joypad1B
        }
        
        // Initialize NES emulator
        await new Promise((resolve) => {
            init().then(async (wasm) => {
                const nes = WasmNes.new();

                // Load ROM
                nes.set_rom(new Uint8Array(await (await fetch(`/assets/roms/${romName}.nes`)).arrayBuffer()));

                // Set up audo system
                const bufferLength = 4096;
                const context = new (AudioContext || webkitAudioContext)({ sampleRate: 44100 });
                const scriptProcessor = context.createScriptProcessor(bufferLength, 0, 1);
                scriptProcessor.onaudioprocess = e => {
                    const data = e.outputBuffer.getChannelData(0);
                    nes.update_sample_buffer(data);
                };
                scriptProcessor.connect(context.destination);

                // Set up screen resources
                const canvas = document.createElement("canvas");
                canvas.width = 256;
                canvas.height = 240;

                const ctx = canvas.getContext("2d");
                const imageData = ctx.createImageData(256, 240);
                const pixels = new Uint8Array(imageData.data.buffer);

                terminal.element.appendChild(canvas);

                // Controls
                await terminal.write("                Arrow Keys");
                await terminal.write("        Z - Button A | R - Reset");
                await terminal.write("        X - Button B | S - Select");
                await terminal.write("               Space - Start");
                await terminal.write("                   Q - Exit");
                await terminal.blank();

                // Handle game input
                let frame;
                window.onkeydown = (e) => {
                    e.preventDefault();
                    if (e.key === "q") {
                        cancelAnimationFrame(frame);

                        // Free up audio stack
                        scriptProcessor.disconnect();
                        scriptProcessor.onaudioprocess = null;
                        context.close();

                        // Clean out WASM
                        nes.free();
                        
                        // Clean out keybinds
                        window.onkeydown = null;
                        window.onkeyup = null;
                        
                        canvas.remove();
                        resolve();
                    }

                    const value = BUTTON_MAPPING[e.key];
                    if (!value) return;

                    nes.press_button(value);
                };
                window.onkeyup = (e) => {
                    const value = BUTTON_MAPPING[e.key];
                    if (!value) return;

                    nes.release_button(value);
                    e.preventDefault();
                };

                // animation frame loop
                const stepFrame = () => {
                    frame = requestAnimationFrame(stepFrame);
                    nes.step_frame();
                    nes.update_pixels(pixels);
                    ctx.putImageData(imageData, 0, 0);
                };

                // launch emulator
                nes.bootup();
                stepFrame();
            });
        });
    }
};