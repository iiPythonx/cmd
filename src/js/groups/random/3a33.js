export const threeathreethree = {
    name: "3a33",
    category: "random",
    description: "send yourself to hell",
    command:  async (terminal) => {
        await terminal.write(":3");
        setTimeout(() => { window.location.href = "https://3a33.dmmdgm.dev"; }, 500);
    }
}
