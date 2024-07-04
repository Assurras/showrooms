// Find your Public Token in the 3dverse Console (https://console.3dverse.com):
// - Go to the API Access page.
// - Copy the Public Token and paste it below.

export const publicToken = "public_ag24iyqHeg_UhaAZ";

// Replace asset UUIDs:
// - Go to the Asset Browser page.
// - Double click on the Public folder to open it.
// - Select a scene and copy the Asset UUID to replace it below.

// 3rd person controller scene
//export const characterControllerSceneUUID = "e7acb65a-3268-4ff3-96b9-a388a575d2a3";
// 1st person controller scene
export const characterControllerSceneUUID = "d9656a45-c5b4-4bda-8876-2bd5aa8eaf16";

export const spawnPosition = [0,0,0];
export const scenes = {
    "cassandra-s": {
        scene: "39524211-6f4b-4e77-9411-5c801b0675b4",
        // You can specify a distinct character controller scene UUIS if the
        // want to use a character controlelr distinct from the default one
        // declared above.
        // character: "",
        // You can specify a distinct public token if the scene belongs to
        // a project distinct from the project of the default public token
        // declared above.
        // publicToken: "",
    },
    "cassandra-s-no-walls": {
        scene: "d8115b29-de91-4937-80b0-6d5adfa40faa",
        character: "e7acb65a-3268-4ff3-96b9-a388a575d2a3"
    },
}
