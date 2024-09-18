const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { exec } = require('child_process');
const fs = require('fs');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    frame: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false
    },
  });

  mainWindow.loadFile('index.html');
}

app.whenReady().then(() => {
  createWindow();

  ipcMain.handle('clone-repo', async () => {
    const downloadsPath = path.join(app.getPath('downloads'), 'AppliomacOS');
    const repoURL = 'https://github.com/Anthonyxd22/AppliomacOS.git';

    return new Promise((resolve, reject) => {
      fs.access(downloadsPath, fs.constants.F_OK, (err) => {
        if (!err) {
          fs.rm(downloadsPath, { recursive: true, force: true }, (rmErr) => {
            if (rmErr) {
              return reject(`Error eliminando la carpeta existente.`);
            }
            cloneRepository();
          });
        } else {
          cloneRepository();
        }
      });

      function cloneRepository() {
        const cloneCommand = `git clone ${repoURL} "${downloadsPath}"`;
        const cloneProcess = exec(cloneCommand);

        cloneProcess.stdout.on('data', (data) => {
          if (mainWindow) {
            mainWindow.webContents.send('log-update', data.toString());
          }
        });

        cloneProcess.stderr.on('data', (data) => {
          if (mainWindow) {
            mainWindow.webContents.send('log-update', data.toString());
          }
        });

        cloneProcess.on('close', (code) => {
          if (code !== 0) {
            return reject(`Error instalando Applio.`);
          }
          handleInstallScript(resolve, reject, downloadsPath);
        });
      }
    });
  });

  ipcMain.handle('start-app', async () => {
    const downloadsPath = path.join(app.getPath('downloads'), 'AppliomacOS');
    const startScriptPath = path.join(downloadsPath, 'run-applio.sh');

    return new Promise((resolve, reject) => {
      fs.access(startScriptPath, fs.constants.F_OK, (err) => {
        if (err) {
          return reject('Script run-applio.sh no encontrado.');
        }

        const chmodCommand = `chmod +x "${startScriptPath}"`;
        const chmodProcess = exec(chmodCommand);

        chmodProcess.on('close', (code) => {
          if (code !== 0) {
            return reject(`Error asignando permisos al script.`);
          }

          const scriptCommand = `/bin/bash "${startScriptPath}"`;
          const scriptProcess = exec(scriptCommand, { cwd: downloadsPath });

          scriptProcess.stdout.on('data', (data) => {
            if (mainWindow) {
              mainWindow.webContents.send('log-update', data.toString());
            }
          });

          scriptProcess.stderr.on('data', (data) => {
            if (mainWindow) {
              mainWindow.webContents.send('log-update', data.toString());
            }
          });

          scriptProcess.on('close', (code) => {
            if (code !== 0) {
              return reject(`Error ejecutando run-applio.sh.`);
            }
            resolve('Applio iniciado con éxito.');
          });
        });
      });
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', () => {
    if (mainWindow === null) {
      createWindow();
    }
  });
});

function handleInstallScript(resolve, reject, downloadsPath) {
  const installScriptPath = path.join(downloadsPath, 'run-install.sh');

  fs.access(installScriptPath, fs.constants.F_OK, (err) => {
    if (err) {
      return reject('Script run-install.sh no encontrado.');
    }

    const chmodCommand = `chmod +x "${installScriptPath}"`;
    const chmodProcess = exec(chmodCommand);

    chmodProcess.on('close', (code) => {
      if (code !== 0) {
        return reject(`Error asignando permisos al script.`);
      }

      const scriptCommand = `/bin/bash "${installScriptPath}"`;
      const scriptProcess = exec(scriptCommand, { cwd: downloadsPath });

      scriptProcess.stdout.on('data', (data) => {
        if (mainWindow) {
          mainWindow.webContents.send('log-update', data.toString());
        }
      });

      scriptProcess.stderr.on('data', (data) => {
        if (mainWindow) {
          mainWindow.webContents.send('log-update', data.toString());
        }
      });

      scriptProcess.on('close', (code) => {
        if (code !== 0) {
          return reject(`Error ejecutando run-install.sh.`);
        }
        resolve('Repositorio clonado con éxito.');
      });
    });
  });
}
