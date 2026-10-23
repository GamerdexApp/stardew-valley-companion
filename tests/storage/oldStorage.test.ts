import {
  addPlaythrough,
  deletePlaythrough,
  loadAppData,
  setActivePlaythrough,
  storageService,
  updatePlaythrough,
} from "../reference/storage";
import { describeStorageContract } from "./contract";

const applyAndSave = (change: Parameters<typeof storageService.save>[0]) =>
  storageService.save(change);

describeStorageContract("old storage code", () => ({
  load: loadAppData,
  add: (input) => applyAndSave(addPlaythrough(loadAppData(), input)),
  update: (id, updates) =>
    applyAndSave(updatePlaythrough(loadAppData(), id, updates)),
  remove: (id) => applyAndSave(deletePlaythrough(loadAppData(), id)),
  setActive: (id) => applyAndSave(setActivePlaythrough(loadAppData(), id)),
  exportJson: () => storageService.exportData(),
  importText: (text) => storageService.importData(text),
  clear: () => storageService.clear(),
}));
