//------------------------------------------------------------------------------
import {
  publicToken,
  scenes,
  characterControllerSceneUUID,
  spawnPosition
} from "../config.js";

import { lockPointer } from "./utils.js";

import {
  initDeviceDetection,
  initControlKeySettings,
  adjustDeviceSensitivity,
  openSettingsModal,
  closeSettingsModal
} from "./settings.js";

//------------------------------------------------------------------------------
window.addEventListener("load", initApp);

//------------------------------------------------------------------------------
async function initApp() {
  const canvas = document.getElementById("display-canvas");

  const sceneParam = new URLSearchParams(window.location.search).get("scene");
  let sceneUUID = scenes[sceneParam];
  sceneUUID = sceneUUID || scenes[Object.keys(scenes)[0]];

  const sessionParameters = {
      userToken: publicToken,
      sceneUUID,
      canvas: canvas,
      createDefaultCamera: false,
      // startSimulation: "on-assets-loaded",
  };
  await SDK3DVerse.joinOrStartSession(sessionParameters);
  SDK3DVerse.engineAPI.startSimulation();
  // To spawn a character controller we need to instantiate the
  // "characterControllerSceneUUID" subscene into our main scene.
  const characterController = await initCharacterController(
      characterControllerSceneUUID
  );

  initDeviceDetection(characterController);
  adjustDeviceSensitivity(characterController);

  initPointerLockEvents();
  initSettingsModalEvents(characterController);
  initControlKeySettings();
  handleClientDisconnection();
}

//------------------------------------------------------------------------------
async function initCharacterController(charCtlSceneUUID) {
  // To spawn an entity we need to create an EntityTempllate and specify the
  // components we want to attach to it. In this case we only want a scene_ref
  // that points to the character controller scene.
  const playerTemplate = new SDK3DVerse.EntityTemplate();
  playerTemplate.attachComponent("scene_ref", { value: charCtlSceneUUID });
  playerTemplate.attachComponent("local_transform", { position: spawnPosition });
  // Passing null as parent entity will instantiate our new entity at the root
  // of the main scene.
  const parentEntity = null;
  // Setting this option to true will ensure that our entity will be destroyed
  // when the client is disconnected from the session, making sure we don't
  // leave our 'dead' player body behind.
  const deleteOnClientDisconnection = true;
  // We don't want the player to be saved forever in the scene, so we
  // instantiate a transient entity.
  // Note that an entity template can be instantiated multiple times.
  // Each instantiation results in a new entity.
  const playerSceneEntity = await playerTemplate.instantiateTransientEntity(
    "Player",
    parentEntity,
    deleteOnClientDisconnection
  );

  // The character controller scene is setup as having two entities at its
  // root: the character controller and the character camera.
  const children = await playerSceneEntity.getChildren();
  // Look for them by checking their components
  const characterController = children.find((child) =>
    child.isAttached("script_map")
  );
  const controllerChildren = await characterController.getChildren();

  // Case of the 1st person conroller template app
  const characterCamera = controllerChildren.find(c => c.isAttached("camera"));  
  let isThirdPersonController = !characterCamera;
  if (isThirdPersonController) {
      // Case of the 3rd person conroller template app
      characterCamera = controllerChildren.find(c => c.isAttached("camera"));
  }

  // We need to assign the current client to the character controller
  // script which is attached to the character controller entity.
  // This allows the script to know which client inputs it should read.
  SDK3DVerse.engineAPI.assignClientToScripts(characterController);

  // Finally set the character camera as the main camera.
  await SDK3DVerse.engineAPI.cameraAPI.setMainCamera(characterCamera);

  return characterController;
}

//------------------------------------------------------------------------------
function handleClientDisconnection() {
  // Users are considered inactive after 5 minutes of inactivity and are
  // kicked after 30 seconds of inactivity. Setting an inactivity callback
  // with a 30 seconds cooldown allows us to open a popup when the user gets
  // disconnected.
  SDK3DVerse.setInactivityCallback(showInactivityPopup);

  // The following does the same but in case the disconnection is
  // requested by the server.
  SDK3DVerse.notifier.on("onConnectionClosed", showDisconnectedPopup);
}

//------------------------------------------------------------------------------
function showInactivityPopup() {
  document.getElementById("resume").addEventListener('click', closeInactivityPopup);
  document.getElementById("inactivity-modal").parentNode.classList.add('active');
}

//------------------------------------------------------------------------------
function closeInactivityPopup() {
  document.getElementById("resume").removeEventListener('click', closeInactivityPopup);
  document.getElementById("inactivity-modal").parentNode.classList.remove('active');
}

//------------------------------------------------------------------------------
function showDisconnectedPopup() {
  document.getElementById("reload-session").addEventListener('click', () => window.location.reload());
  document.getElementById("disconnected-modal").parentNode.classList.add('active');
}

//------------------------------------------------------------------------------
function initPointerLockEvents() {
  const canvas = document.getElementById("display-canvas");
  canvas.addEventListener('mousedown', lockPointer);

  // Web browsers have a safety mechanism preventing the pointerlock to be
  // instantly requested after being naturally exited, if the user tries to
  // relock the pointer too quickly, we wait a second before requesting
  // pointer lock again.
  document.addEventListener('pointerlockerror', async () => {
      if (document.pointerLockElement === null) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          await lockPointer();
      }
  });
}

//------------------------------------------------------------------------------
function initSettingsModalEvents(characterController) {
  const closeSettingsButton = document.getElementById("close-settings");
  closeSettingsButton.addEventListener('click', () => {
      closeSettingsModal(characterController);
      SDK3DVerse.enableInputs();
  });

  // If the user leaves the pointerlock, we open the settings popup and
  // disable their influence over the character controller.
  document.addEventListener('keydown', (event) => {
      if(event.code === 'Escape') {
          const settingsContainer = document.getElementById("settings-modal").parentNode;
          if(settingsContainer.classList.contains('active')) {
              closeSettingsModal(characterController);
              SDK3DVerse.enableInputs();
          } else {
              SDK3DVerse.disableInputs();
              openSettingsModal();
          }
      }
  });
}
