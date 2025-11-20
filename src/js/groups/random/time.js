export const time = {
    name: "time",
    group: "random",
    description: "check the system time",
    command: async (terminal) =>  await terminal.write((new Date()).toString())
}
