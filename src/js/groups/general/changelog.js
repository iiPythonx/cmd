import log from "/src/assets/changelog.json";

export const changelog = {
    name: "changelog",
    category: "terminal",
    description: "view the cmd changelog",
    command: async (terminal) => {
        for (const release of log) {
            await terminal.write(`  ${release.version}\n  ════════════════════════`);
            for (const change of release.changed) await terminal.write(`    * ${change}`);
            await terminal.blank();
        }
    }
}
