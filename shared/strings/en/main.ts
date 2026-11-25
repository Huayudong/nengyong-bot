import { plural } from '../../language'
import type { Strings } from '../../strings'

export const main: Strings['main'] = {
  menu: {
    settings: 'Settings…',
    openLibrary: 'Open Library',
    openDataDir: 'Open Data Folder',
    openApp: 'Open Nengyong Bot',
    quit: 'Quit Nengyong Bot',
  },
  cannotOpenData: 'Nengyong Bot cannot open its data',
  homeInUse: {
    title: 'Two copies of Nengyong Bot cannot share one home',
    detail: (home) =>
      `Another copy is using ${home}. The one that opens second would take the first one's running tasks for interrupted ones, and their results would never come back. Quit the copy that is open; when developing, point NENGYONGBOT_HOME at another home.`,
  },
  data: {
    missing: (moved, file) =>
      `Cannot find the data folder ${moved}. If it is on an external drive, connect it and open the app again; if you no longer need it, delete ${file} to start over in the default location.`,
    notAbsolute: (file) =>
      `${file} should hold the full path of the data folder: correct it, or delete it to start over in the default location`,
    folderName: 'Nengyong Bot Data',
    moveInside: 'Cannot move it inside the current data folder',
    folderExists: (target) => `A folder with that name already exists: ${target}`,
    moveFailed: (reason) => `Moving failed; the data is unchanged: ${reason}`,
    backupName: (stamp) => `Nengyong Bot Backup ${stamp}`,
    backupExists: (target) => `A backup with that name already exists: ${target}`,
    importInUse: 'Cannot import the data folder in use right now',
    noData: (file) => `This folder has no Nengyong Bot data (${file})`,
    importFailed: (reason) => `Importing failed; the data is unchanged: ${reason}`,
    copyFailed: (reason) => `Copying the data failed: ${reason}`,
  },
  dataDialogs: {
    cancel: 'Cancel',
    cannotOpen: (error) => `Cannot open the data folder: ${error}`,
    movePick: 'Choose a new place for the data folder',
    movePickButton: 'Move here',
    moveDetail: (target, dataDir) =>
      `The data is copied to ${target}, and ${dataDir} is deleted once the copy checks out. With a lot of data this takes a while.`,
    moveConfirm: 'Move the data to the new place and restart?',
    moveButton: 'Move and restart',
    moveFailed: 'Could not move the data; the app will open again',
    exportPick: 'Choose where to keep the backup',
    exportPickButton: 'Export here',
    importPick: 'Choose the backup folder to import',
    importPickButton: 'Import',
    importDetail: (dataDir) =>
      `Importing replaces all current data. The current data is kept next to ${dataDir}, renamed with before-import.`,
    importConfirm: 'Replace the current data with this backup and restart?',
    importButton: 'Import and restart',
    importFailed: 'Could not import the data; the app will open again',
  },
  lan: {
    ownAddressOnly: "Only this computer's local network address is accepted",
    sameOriginOnly: 'Requests from other web pages are not accepted',
    badDeviceName: 'The device name is not valid',
    notPaired: 'This device is not connected to the computer yet',
    desktopOnly: 'This can only be done on the computer',
    noSuchPath: 'No such address',
    portInUse: (port) => `Port ${port} is in use by another program`,
    cannotStart: (reason) => `Cannot turn on LAN access: ${reason}`,
    tooLarge: 'Too much to send at once',
  },
  pairing: {
    expired: 'This connection request has expired',
    wrongCode: 'Wrong pairing code; enter it again as the phone shows it',
  },
  library: {
    cannotOpen: (name, reason) => `Cannot open ${name}: ${reason}`,
    desktopOnly: 'This file opens only on the computer',
    missing: 'The library has no such file',
  },
  send: {
    attachmentTooLarge: 'The attachment is too large',
    tooLong: (max) => `The message is too long: at most ${max} characters`,
    tooManyAttachments: (max) => `At most ${plural(max, 'attachment')} at a time`,
    empty: 'The message is empty',
  },
  accounts: {
    noKeychain: 'The system keychain is unavailable, so the key cannot be saved safely',
    searchNeedsDeepSeek: "Web search needs an account on DeepSeek's own address",
    invalidInput: 'The input is not valid',
    serviceMismatch: 'The account does not match the provider',
    needKey: 'Enter the API key',
    needName: 'Give this API a name',
    noChatModels: 'Connected, but it lists no chat models. A service on this computer needs a model downloaded first',
    disconnected: 'This account has been disconnected',
  },
  emptyReply: 'This reply has no text; open it to see',
  update: {
    cannotCheck: "Couldn't reach GitHub Releases. Try again later",
    cannotInstallHere: "This copy can't update itself. Download the new version from GitHub Releases",
    cannotDownload: "The new version didn't finish downloading. Try again later",
    cannotInstall: "The new version couldn't be installed. Download it from GitHub Releases",
    moveToApplications:
      "Move Nengyong Bot to the Applications folder first: an app opened from its disk image or Downloads can't update itself",
  },
}
