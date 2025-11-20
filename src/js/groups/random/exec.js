export const exec = {
    name: "exec",
    group: "random",
    description: "run javascript :3",
    command: async (terminal, args) => {
        let result;
        try {
            result = eval(args.join(" "));
            if (result === undefined) return await terminal.write("undefined");
        } catch (e) { result = e; }
        await terminal.write(result.toString());
    }
}
