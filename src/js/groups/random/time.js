export const time = {
    name: "time",
    category: "random",
    description: "check the system time",
    command: async (terminal) =>  await terminal.write((new Date()).toString())
}
