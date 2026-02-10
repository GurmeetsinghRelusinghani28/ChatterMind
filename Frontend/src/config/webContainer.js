// import { WebContainer } from '@webcontainer/api';

// let webContainerInstance = null;


// export const getWebContainer = async () => {
//     if (webContainerInstance === null) {
//         webContainerInstance = await WebContainer.boot();
//     }
//     return webContainerInstance;
// }


// import { WebContainer } from "@webcontainer/api";

// let bootPromise = null;
// let containerInstance = null;

// export function getWebContainer() {
//   if (!bootPromise) {
//     bootPromise = WebContainer.boot().then((container) => {
//       containerInstance = container;
//       return container;
//     });
//   }

//   return bootPromise;
// }


import { WebContainer } from "@webcontainer/api";

let webContainerPromise;

export async function getWebContainer() {
  if (!webContainerPromise) {
    webContainerPromise = WebContainer.boot();
  }
  return webContainerPromise;
}
