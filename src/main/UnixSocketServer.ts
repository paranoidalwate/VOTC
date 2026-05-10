import * as net from 'net';
import { BrowserWindow } from 'electron';
import * as path from 'path';
import * as os from 'os';

/**
 * Unix Socket Server for receiving hotkey signals on Linux/Wayland
 * This bypasses Wayland's restriction on global keyboard shortcuts
 */
export class UnixSocketServer {
  private server: net.Server | null = null;
  private socketPath: string;
  private chatWindow: BrowserWindow | null = null;
  
  constructor() {
    // Create socket path in user's temp directory
    this.socketPath = path.join(os.tmpdir(), 'votc-hotkeys.sock');
  }
  
  start(chatWindow: BrowserWindow): void {
    this.chatWindow = chatWindow;
    
    // Remove existing socket file
    try {
      require('fs').unlinkSync(this.socketPath);
    } catch (e) {
      // Ignore if doesn't exist
    }
    
    this.server = net.createServer((socket) => {
      socket.on('data', (data) => {
        const command = data.toString().trim();
        console.log('UnixSocket: Received command:', command);
        
        if (!this.chatWindow || this.chatWindow.isDestroyed()) {
          console.log('UnixSocket: Window not available');
          return;
        }
        
        if (command === 'TOGGLE_SETTINGS' || command === 'TOGGLE_CHAT') {
            if (this.chatWindow.isVisible()) {
              if (process.platform === 'linux') {
                  this.chatWindow.setFocusable(false);
              }
              this.chatWindow.hide();
              console.log('UnixSocket: Hiding window');
            } else {

              if (process.platform === 'linux') {
                  this.chatWindow.setFocusable(true);
              }
              this.chatWindow.show();
              this.chatWindow.focus();
              
              this.chatWindow.setAlwaysOnTop(true, 'screen-saver');
              
              console.log('UnixSocket: Showing window');
            }
        }
      });
    });
    
    this.server.listen(this.socketPath, () => {
      console.log('UnixSocket: Server listening on', this.socketPath);
    });
    
    this.server.on('error', (err) => {
      console.error('UnixSocket: Server error:', err);
    });
  }
  
  stop(): void {
    if (this.server) {
      this.server.close();
      this.server = null;
      console.log('UnixSocket: Server stopped');
      
      try {
        require('fs').unlinkSync(this.socketPath);
      } catch (e) {
        // Ignore
      }
    }
  }
  
  getSocketPath(): string {
    return this.socketPath;
  }
}
